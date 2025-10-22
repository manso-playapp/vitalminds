import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FiMoreVertical, FiFileText } from "react-icons/fi";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createEpisode,
  CreateEpisodePayload,
  deleteEpisode,
  getEpisodes,
  Episode,
  updateEpisode,
  UpdateEpisodePayload,
} from "../../api/episodes";
import { EpisodeDetailDrawer } from "./components/EpisodeDetailDrawer";
import { getInstitutions, Institution } from "../../api/institutions";
import { getPatients, PatientsResponse } from "../../api/patients";
import { getProfessionals, Professional } from "../../api/professionals";
import { usePageHeader } from "../../shared/page-header";

const stateLabels: Record<string, string> = {
  CREADO: "Creado",
  EVAL_PSICO_EN_PROCESO: "Evaluación Psicológica",
  DERIVADO_A_MEDICO: "Derivado a Médico",
  PEDIDO_LAB_EMITIDO: "Pedido Lab Emitido",
  RESULTADOS_DISPONIBLES: "Resultados Disponibles",
  INFORME_LISTO: "Informe listo",
  CERRADO: "Cerrado",
};

const urgencyBadge: Record<Episode["urgencia"], string> = {
  verde: "bg-emerald-500",
  amarillo: "bg-amber-500",
  rojo: "bg-red-500",
};

const SLA_THRESHOLDS_HOURS = {
  CONSULTA_MEDICA: 48,
  EXTRACCIONISTA: 72,
  LABORATORIO: 72,
  INFORME: 24,
} as const;

const stateToSLAStage: Record<string, keyof typeof SLA_THRESHOLDS_HOURS> = {
  CREADO: "CONSULTA_MEDICA",
  EVAL_PSICO_EN_PROCESO: "CONSULTA_MEDICA",
  DERIVADO_A_MEDICO: "CONSULTA_MEDICA",
  PEDIDO_LAB_EMITIDO: "EXTRACCIONISTA",
  RESULTADOS_DISPONIBLES: "LABORATORIO",
  INFORME_LISTO: "INFORME",
  CERRADO: "INFORME",
};

export const EpisodesPage = () => {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"codigo" | "paciente" | "profesional" | "institucion" | "estado" | "sla">("codigo");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [openActionEpisodeId, setOpenActionEpisodeId] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [derivingEpisode, setDerivingEpisode] = useState<Episode | null>(null);
  const [deletingEpisode, setDeletingEpisode] = useState<Episode | null>(null);
  const [closingEpisode, setClosingEpisode] = useState<Episode | null>(null);
  const [reopeningEpisode, setReopeningEpisode] = useState<Episode | null>(null);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["episodes"],
    queryFn: () => getEpisodes(),
  });
  const { data: institutionsData } = useQuery({
    queryKey: ["institutions"],
    queryFn: () => getInstitutions(),
  });
  const { data: patientsData } = useQuery({
    queryKey: ["patients"],
    queryFn: () => getPatients(),
  });
  const { data: professionalsData } = useQuery({
    queryKey: ["professionals"],
    queryFn: () => getProfessionals(),
  });
  const { setConfig } = usePageHeader();

  const createEpisodeMutation = useMutation({
    mutationFn: createEpisode,
    onSuccess: () => {
      setShowCreateModal(false);
      refetch();
    },
  });

  const computeUrgency = useCallback((episode: Episode): Episode["urgencia"] => {
    if (episode.estado === "CERRADO") {
      return "verde";
    }
    const stage = stateToSLAStage[episode.estado] ?? "CONSULTA_MEDICA";
    const allowedHours = SLA_THRESHOLDS_HOURS[stage];
    const createdAt = new Date(episode.fechaAlta).getTime();
    const elapsedHours = (Date.now() - createdAt) / (1000 * 60 * 60);
    if (elapsedHours <= allowedHours) {
      return "verde";
    }
    if (elapsedHours <= allowedHours * 1.5) {
      return "amarillo";
    }
    return "rojo";
  }, []);

  interface DisplayEpisode extends Episode {
    computedUrgency: Episode["urgencia"];
    currentProfessional: string;
  }

  const episodes: DisplayEpisode[] = useMemo(() => {
    const all = data ?? [];
    const lowered = search.trim().toLowerCase();
    const filtered = search
      ? all.filter(
          (episode) =>
            episode.codigo.toLowerCase().includes(lowered) ||
            episode.titulo.toLowerCase().includes(lowered) ||
            episode.paciente.toLowerCase().includes(lowered) ||
            episode.profesional.toLowerCase().includes(lowered),
      )
      : all;

    return filtered.map((episode) => ({
      ...episode,
      computedUrgency: computeUrgency(episode),
      currentProfessional: episode.profesional || "Sin asignar",
    }));
  }, [data, search, computeUrgency]);

  const sortedEpisodes: DisplayEpisode[] = useMemo(() => {
    const entries = [...episodes];
    entries.sort((a, b) => {
      const directionFactor = sortDirection === "asc" ? 1 : -1;
      switch (sortField) {
        case "codigo":
          return a.codigo.localeCompare(b.codigo) * directionFactor;
        case "paciente":
          return a.paciente.localeCompare(b.paciente) * directionFactor;
        case "profesional":
          return a.currentProfessional.localeCompare(b.currentProfessional) * directionFactor;
        case "institucion":
          return a.institucion.localeCompare(b.institucion) * directionFactor;
        case "estado":
          return (stateLabels[a.estado] ?? a.estado).localeCompare(stateLabels[b.estado] ?? b.estado) * directionFactor;
        case "sla": {
          const urgencyOrder: Record<Episode["urgencia"], number> = { verde: 0, amarillo: 1, rojo: 2 };
          return (urgencyOrder[a.computedUrgency] - urgencyOrder[b.computedUrgency]) * directionFactor;
        }
        default:
          return 0;
      }
    });
    return entries;
  }, [episodes, sortField, sortDirection]);

  const episodeStats = useMemo(() => {
    const list = data ?? [];
    const total = list.length;
    const closed = list.filter((episode) => episode.estado === "CERRADO").length;
    const active = total - closed;
    const urgent = list.reduce(
      (count, episode) => (computeUrgency(episode) === "rojo" ? count + 1 : count),
      0,
    );
    return { total, closed, active, urgent };
  }, [computeUrgency, data]);

  useEffect(() => {
    const hasRemoteEpisodes = Array.isArray(data) && data.length > 0;
    const loading = isLoading && !hasRemoteEpisodes;
    setConfig({
      title: "Episodios",
      subtitle: "Visualizá el estado del circuito con código, paciente, profesional e institución.",
      highlights: [
        {
          label: "Totales",
          value: loading ? "Cargando..." : String(episodeStats.total),
          helper: loading ? undefined : `${episodeStats.closed} cerrados`,
        },
        {
          label: "En curso",
          value: loading ? "Cargando..." : String(episodeStats.active),
          helper: loading ? undefined : isError ? "Datos de referencia" : "Incluye estados abiertos",
        },
        {
          label: "Alertas SLA",
          value: loading ? "Cargando..." : String(episodeStats.urgent),
          helper:
            loading || episodeStats.urgent === 0
              ? loading
                ? undefined
                : "Sin urgencias activas"
              : "Urgencias en rojo por SLA",
        },
      ],
    });
  }, [data, episodeStats.active, episodeStats.closed, episodeStats.total, episodeStats.urgent, isError, isLoading, setConfig]);

  const handleSort = (field: typeof sortField) => {
    setSortField((currentField) => {
      if (currentField === field) {
        setSortDirection((currentDirection) => (currentDirection === "asc" ? "desc" : "asc"));
        return currentField;
      }
      setSortDirection("asc");
      return field;
    });
  };

  const institutions = institutionsData ?? [];
  const patients = (patientsData?.items ?? []) as PatientsResponse["items"];
  const professionals = professionalsData ?? [];

  const updateEpisodeMutation = useMutation({
    mutationFn: updateEpisode,
    onSuccess: () => {
      setEditingEpisode(null);
      setDerivingEpisode(null);
      setClosingEpisode(null);
      setReopeningEpisode(null);
      refetch();
    },
  });

  const deleteEpisodeMutation = useMutation({
    mutationFn: deleteEpisode,
    onSuccess: () => {
      setDeletingEpisode(null);
      refetch();
    },
  });

  useEffect(() => {
    if (!openActionEpisodeId) {
      actionMenuRef.current = null;
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setOpenActionEpisodeId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openActionEpisodeId]);

  const handleEpisodeAction = useCallback((episode: Episode, action: "edit" | "derive" | "close" | "reopen" | "delete") => {
    switch (action) {
      case "edit":
        setEditingEpisode(episode);
        break;
      case "derive":
        setDerivingEpisode(episode);
        break;
      case "close":
        setClosingEpisode(episode);
        break;
      case "reopen":
        setReopeningEpisode(episode);
        break;
      case "delete":
        setDeletingEpisode(episode);
        break;
      default:
        break;
    }
    setOpenActionEpisodeId(null);
  }, []);

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por código, paciente o profesional"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 md:w-72"
          />
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg border border-primary/30 bg-white px-4 py-2 text-sm font-medium text-primary shadow-sm transition hover:bg-primary hover:text-white"
          >
            Crear episodio
          </button>
        </div>
      </header>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-muted">Cargando episodios...</div>
        ) : isError ? (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            No pudimos obtener episodios en vivo. Se muestran datos mock.
          </div>
        ) : episodes.length === 0 ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-muted">
            No se encontraron episodios con el criterio ingresado.
          </div>
        ) : (
          <div className="relative overflow-x-auto md:overflow-visible">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th
                    onClick={() => handleSort("codigo")}
                    className="cursor-pointer whitespace-nowrap px-4 py-2 text-left font-medium text-slate-600 uppercase tracking-wide"
                  >
                    Código{sortField === "codigo" ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
                  </th>
                  <th
                    onClick={() => handleSort("paciente")}
                    className="cursor-pointer whitespace-nowrap px-4 py-2 text-left font-medium text-slate-600 uppercase tracking-wide"
                  >
                    Paciente{sortField === "paciente" ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
                  </th>
                  <th
                    onClick={() => handleSort("profesional")}
                    className="cursor-pointer whitespace-nowrap px-4 py-2 text-left font-medium text-slate-600 uppercase tracking-wide"
                  >
                    Profesional{sortField === "profesional" ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
                  </th>
                  <th
                    onClick={() => handleSort("institucion")}
                    className="cursor-pointer whitespace-nowrap px-4 py-2 text-left font-medium text-slate-600 uppercase tracking-wide"
                  >
                    Institución{sortField === "institucion" ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
                  </th>
                  <th
                    onClick={() => handleSort("estado")}
                    className="cursor-pointer whitespace-nowrap px-4 py-2 text-left font-medium text-slate-600 uppercase tracking-wide"
                  >
                    Estado{sortField === "estado" ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
                  </th>
                  <th
                    onClick={() => handleSort("sla")}
                    className="cursor-pointer whitespace-nowrap px-4 py-2 text-left font-medium text-slate-600 uppercase tracking-wide"
                  >
                    SLA{sortField === "sla" ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600 uppercase tracking-wide">Documentos</th>
                  <th className="px-4 py-2 text-right font-medium text-slate-600 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {sortedEpisodes.map((episode) => (
                  <tr
                    key={episode.id}
                    className={`hover:bg-slate-50 ${episode.estado === "CERRADO" ? "bg-slate-100" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{episode.codigo}</div>
                      <div className="text-xs text-muted">
                        {new Date(episode.fechaAlta).toLocaleString()} · {episode.titulo}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{episode.paciente}</td>
                    <td className="px-4 py-3 text-slate-700">{episode.currentProfessional}</td>
                    <td className="px-4 py-3 text-slate-700">{episode.institucion}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {stateLabels[episode.estado] ?? episode.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex-1 rounded-full bg-slate-100">
                        <div className={`h-2 rounded-full ${urgencyBadge[episode.computedUrgency]}`} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-primary hover:text-primary"
                        title="Ver documentos"
                        onClick={() => setSelectedEpisode(episode)}
                      >
                        <FiFileText className="text-sm" />
                        Documentos
                      </button>
                    </td>
                    <td className="relative px-4 py-3 text-right">
                      <div
                        className="relative inline-block text-left"
                        ref={openActionEpisodeId === episode.id ? actionMenuRef : undefined}
                      >
                        <button
                          className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-primary hover:text-primary"
                          title="Acciones rápidas"
                          onClick={() =>
                            setOpenActionEpisodeId((current) => (current === episode.id ? null : episode.id))
                          }
                        >
                          <FiMoreVertical className="text-lg" />
                        </button>
                        {openActionEpisodeId === episode.id && (
                          <div className="absolute right-0 z-10 mt-2 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                            <button
                              className="block w-full px-4 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-100"
                              onClick={() => handleEpisodeAction(episode, "edit")}
                            >
                              Editar episodio
                            </button>
                            <button
                              className="block w-full px-4 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-100"
                              onClick={() => handleEpisodeAction(episode, "derive")}
                            >
                              Derivar episodio
                            </button>
                            {episode.estado === "CERRADO" ? (
                              <button
                                className="block w-full px-4 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-100"
                                onClick={() => handleEpisodeAction(episode, "reopen")}
                              >
                                Reabrir episodio
                              </button>
                            ) : (
                              <button
                                className="block w-full px-4 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-100"
                                onClick={() => handleEpisodeAction(episode, "close")}
                              >
                                Cerrar episodio
                              </button>
                            )}
                            <button
                              className="block w-full px-4 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
                              onClick={() => handleEpisodeAction(episode, "delete")}
                            >
                              Borrar episodio
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {selectedEpisode && (
        <EpisodeDetailDrawer episode={selectedEpisode} onClose={() => setSelectedEpisode(null)} />
      )}
      {showCreateModal && (
        <CreateEpisodeModal
          institutions={institutions}
          professionals={professionals}
          patients={patients}
          isSubmitting={createEpisodeMutation.isLoading}
          error={createEpisodeMutation.isError ? (createEpisodeMutation.error as Error).message : null}
          onClose={() => setShowCreateModal(false)}
          onSubmit={(values) => createEpisodeMutation.mutate(values)}
        />
      )}
      {editingEpisode && (
        <EditEpisodeModal
          episode={editingEpisode}
          isSubmitting={updateEpisodeMutation.isLoading}
          onClose={() => setEditingEpisode(null)}
          onSubmit={(values) => updateEpisodeMutation.mutate(values)}
        />
      )}
      {derivingEpisode && (
        <DeriveEpisodeModal
          episode={derivingEpisode}
          professionals={professionals}
          isSubmitting={updateEpisodeMutation.isLoading}
          onClose={() => setDerivingEpisode(null)}
          onSubmit={(values) => updateEpisodeMutation.mutate(values)}
        />
      )}
      {deletingEpisode && (
        <DeleteEpisodeDialog
          episode={deletingEpisode}
          isSubmitting={deleteEpisodeMutation.isLoading}
          onClose={() => setDeletingEpisode(null)}
          onConfirm={() => deleteEpisodeMutation.mutate({ id: deletingEpisode.id })}
        />
      )}
      {closingEpisode && (
        <CloseEpisodeDialog
          episode={closingEpisode}
          isSubmitting={updateEpisodeMutation.isLoading}
          onClose={() => setClosingEpisode(null)}
          onConfirm={(payload) => updateEpisodeMutation.mutate(payload)}
        />
      )}
      {reopeningEpisode && (
        <ReopenEpisodeDialog
          episode={reopeningEpisode}
          isSubmitting={updateEpisodeMutation.isLoading}
          onClose={() => setReopeningEpisode(null)}
          onConfirm={(payload) => updateEpisodeMutation.mutate(payload)}
        />
      )}
    </section>
  );
};

const episodeSchema = z.object({
  institutionId: z.string().min(1, "Seleccioná la institución"),
  professionalId: z.string().min(1, "Seleccioná el profesional"),
  patientId: z.string().min(1, "Seleccioná el paciente"),
  titulo: z.string().min(1, "Ingresá el título del episodio"),
  notas: z.string().optional(),
});

type EpisodeFormData = z.infer<typeof episodeSchema>;

interface CreateEpisodeModalProps {
  institutions: Institution[];
  professionals: Professional[];
  patients: PatientsResponse["items"];
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (data: CreateEpisodePayload) => void;
}

const CreateEpisodeModal = ({
  institutions,
  professionals,
  patients,
  isSubmitting,
  error,
  onClose,
  onSubmit,
}: CreateEpisodeModalProps) => {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<EpisodeFormData>({
    resolver: zodResolver(episodeSchema),
    defaultValues: {
      institutionId: "",
      professionalId: "",
      patientId: "",
      titulo: "",
      notas: "",
    },
  });

  const institutionIdValue = useWatch({
    control,
    name: "institutionId",
  }) ?? "";

  const filteredProfessionals = useMemo(() => {
    if (!institutionIdValue) return professionals;
    return professionals.filter((pro) =>
      pro.instituciones.some((inst) => inst.institutionId === institutionIdValue),
    );
  }, [professionals, institutionIdValue]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Nuevo episodio</h3>
            <p className="text-xs text-muted">Seleccioná paciente, institución y profesional responsable.</p>
          </div>
          <button onClick={onClose} className="text-sm text-primary underline">
            Cerrar
          </button>
        </div>
        <form
          className="space-y-4"
          onSubmit={handleSubmit((values) => {
            const selectedInstitution = institutions.find((inst) => inst.id === values.institutionId);
            const selectedProfessional = professionals.find((pro) => pro.id === values.professionalId);
            const selectedPatient = patients.find((patient) => patient.id === values.patientId);

            const payload: CreateEpisodePayload = {
              institutionId: values.institutionId,
              professionalId: values.professionalId,
              patientId: values.patientId,
              titulo: values.titulo.trim(),
              notas: values.notas?.trim() || undefined,
              urgencia: "verde",
              institutionName: selectedInstitution?.nombre,
              professionalName: selectedProfessional
                ? `${selectedProfessional.apellido}, ${selectedProfessional.nombre}`
                : undefined,
              patientName: selectedPatient ? `${selectedPatient.apellido}, ${selectedPatient.nombre}` : undefined,
            };

            onSubmit(payload);
          })}
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted">Institución</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                {...register("institutionId")}
                onChange={(event) => {
                  const value = event.target.value;
                  setValue("institutionId", value);
                  setValue("professionalId", "");
                }}
              >
                <option value="">Seleccioná institución</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.nombre}
                  </option>
                ))}
              </select>
              {errors.institutionId && <p className="text-xs text-red-500">{errors.institutionId.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Profesional responsable</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                {...register("professionalId")}
              >
                <option value="">Seleccioná profesional</option>
                {filteredProfessionals.map((pro) => (
                  <option key={pro.id} value={pro.id}>
                    {pro.apellido}, {pro.nombre} ({pro.especialidad})
                  </option>
                ))}
              </select>
              {errors.professionalId && <p className="text-xs text-red-500">{errors.professionalId.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Paciente</label>
              <select className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" {...register("patientId")}>
                <option value="">Seleccioná paciente</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.apellido}, {patient.nombre} ({patient.dni})
                  </option>
                ))}
              </select>
              {errors.patientId && <p className="text-xs text-red-500">{errors.patientId.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Título del episodio</label>
              <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" {...register("titulo")} />
              {errors.titulo && <p className="text-xs text-red-500">{errors.titulo.message}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted">Notas</label>
              <textarea className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" rows={3} {...register("notas")} />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            {error && <p className="flex-1 text-xs text-red-500">{error}</p>}
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition disabled:bg-slate-400"
            >
              {isSubmitting ? "Guardando..." : "Crear episodio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const editEpisodeSchema = z.object({
  id: z.string().min(1),
  titulo: z.string().min(1, "Ingresá el título"),
  estado: z.string().min(1, "Seleccioná el estado"),
  urgencia: z.enum(["verde", "amarillo", "rojo"]),
  notas: z.string().optional(),
});

type EditEpisodeFormData = z.infer<typeof editEpisodeSchema>;

interface EditEpisodeModalProps {
  episode: Episode;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateEpisodePayload) => void;
}

const EditEpisodeModal = ({ episode, isSubmitting, onClose, onSubmit }: EditEpisodeModalProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditEpisodeFormData>({
    resolver: zodResolver(editEpisodeSchema),
    defaultValues: {
      id: episode.id,
      titulo: episode.titulo,
      estado: episode.estado,
      urgencia: episode.urgencia,
      notas: episode.notas ?? "",
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Editar episodio</h3>
            <p className="text-xs text-muted">Actualizá la información del episodio seleccionado.</p>
          </div>
          <button onClick={onClose} className="text-sm text-primary underline">
            Cerrar
          </button>
        </div>
        <form
          className="space-y-4"
          onSubmit={handleSubmit((values) =>
            onSubmit({
              id: values.id,
              titulo: values.titulo.trim(),
              estado: values.estado,
              urgencia: values.urgencia,
              notas: values.notas?.trim() || undefined,
            }),
          )}
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted">Título</label>
              <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" {...register("titulo")} />
              {errors.titulo && <p className="text-xs text-red-500">{errors.titulo.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Estado</label>
              <select className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" {...register("estado")}>
                {Object.keys(stateLabels).map((key) => (
                  <option key={key} value={key}>
                    {stateLabels[key] ?? key}
                  </option>
                ))}
              </select>
              {errors.estado && <p className="text-xs text-red-500">{errors.estado.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Urgencia</label>
              <select className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" {...register("urgencia")}>
                <option value="verde">Verde</option>
                <option value="amarillo">Amarillo</option>
                <option value="rojo">Rojo</option>
              </select>
              {errors.urgencia && <p className="text-xs text-red-500">{errors.urgencia.message}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted">Notas</label>
              <textarea
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                rows={3}
                {...register("notas")}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition disabled:bg-slate-400"
            >
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const deriveEpisodeSchema = z.object({
  id: z.string().min(1),
  professionalId: z.string().min(1, "Seleccioná el profesional destino"),
  notas: z.string().optional(),
});

type DeriveEpisodeFormData = z.infer<typeof deriveEpisodeSchema>;

interface DeriveEpisodeModalProps {
  episode: Episode;
  professionals: Professional[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateEpisodePayload) => void;
}

const DeriveEpisodeModal = ({ episode, professionals, isSubmitting, onClose, onSubmit }: DeriveEpisodeModalProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DeriveEpisodeFormData>({
    resolver: zodResolver(deriveEpisodeSchema),
    defaultValues: {
      id: episode.id,
      professionalId: episode.professionalId ?? "",
      notas: "",
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Derivar episodio</h3>
            <p className="text-xs text-muted">Elegí el profesional que continuará con el episodio.</p>
          </div>
          <button onClick={onClose} className="text-sm text-primary underline">
            Cerrar
          </button>
        </div>
        <form
          className="space-y-4"
          onSubmit={handleSubmit((values) => {
            const selectedProfessional = professionals.find((pro) => pro.id === values.professionalId);
            onSubmit({
              id: values.id,
              estado: "DERIVADO_A_MEDICO",
              profesionalId: selectedProfessional?.id,
              profesionalNombre: selectedProfessional
                ? `${selectedProfessional.apellido}, ${selectedProfessional.nombre}`
                : undefined,
              notas: values.notas?.trim() || undefined,
            });
          })}
        >
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted">Profesional destino</label>
              <select className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" {...register("professionalId")}>
                <option value="">Seleccioná profesional</option>
                {professionals.map((pro) => (
                  <option key={pro.id} value={pro.id}>
                    {pro.apellido}, {pro.nombre} ({pro.especialidad})
                  </option>
                ))}
              </select>
              {errors.professionalId && <p className="text-xs text-red-500">{errors.professionalId.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Notas</label>
              <textarea
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                rows={3}
                {...register("notas")}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition disabled:bg-slate-400"
            >
              {isSubmitting ? "Derivando..." : "Derivar episodio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DeleteEpisodeDialogProps {
  episode: Episode;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteEpisodeDialog = ({ episode, isSubmitting, onClose, onConfirm }: DeleteEpisodeDialogProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">Eliminar episodio</h3>
        <p className="mt-2 text-sm text-muted">
          ¿Querés borrar el episodio <span className="font-semibold text-slate-900">{episode.codigo}</span>? Esta acción elimina el
          registro local. Cuando la API esté disponible, también se intentará borrar en el servidor.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-70"
          >
            {isSubmitting ? "Borrando..." : "Borrar episodio"}
          </button>
        </div>
      </div>
    </div>
  );
};

interface CloseEpisodeDialogProps {
  episode: Episode;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (payload: UpdateEpisodePayload) => void;
}

const closeEpisodeSchema = z.object({
  notas: z.string().optional(),
});

type CloseEpisodeFormData = z.infer<typeof closeEpisodeSchema>;

const CloseEpisodeDialog = ({ episode, isSubmitting, onClose, onConfirm }: CloseEpisodeDialogProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CloseEpisodeFormData>({
    resolver: zodResolver(closeEpisodeSchema),
    defaultValues: {
      notas: "",
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">Cerrar episodio</h3>
        <p className="mt-2 text-sm text-muted">
          Se marcará el episodio <span className="font-semibold text-slate-900">{episode.codigo}</span> como finalizado.
          Podés dejar una nota de cierre para el registro clínico.
        </p>
        <form
          className="mt-4 space-y-3"
          onSubmit={handleSubmit((values) =>
            onConfirm({
              id: episode.id,
              estado: "CERRADO",
              urgencia: "verde",
              notas: values.notas?.trim() || undefined,
            }),
          )}
        >
          <div>
            <label className="text-xs font-medium text-muted">Notas de cierre</label>
            <textarea
              rows={4}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              {...register("notas")}
            />
            {errors.notas && <p className="text-xs text-red-500">{errors.notas.message}</p>}
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-70"
            >
              {isSubmitting ? "Cerrando..." : "Cerrar episodio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ReopenEpisodeDialogProps {
  episode: Episode;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (payload: UpdateEpisodePayload) => void;
}

const ReopenEpisodeDialog = ({ episode, isSubmitting, onClose, onConfirm }: ReopenEpisodeDialogProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">Reabrir episodio</h3>
        <p className="mt-2 text-sm text-muted">
          El episodio <span className="font-semibold text-slate-900">{episode.codigo}</span> volverá a estado inicial para continuar
          la atención.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            onClick={() =>
              onConfirm({
                id: episode.id,
                estado: "CREADO",
                urgencia: "verde",
              })
            }
            disabled={isSubmitting}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-70"
          >
            {isSubmitting ? "Reabriendo..." : "Reabrir episodio"}
          </button>
        </div>
      </div>
    </div>
  );
};
