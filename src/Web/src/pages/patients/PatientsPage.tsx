import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { FiX } from "react-icons/fi";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPatient, CreatePatientPayload, getPatients, Patient, PatientsResponse } from "../../api/patients";
import { Episode, getEpisodes } from "../../api/episodes";
import { usePageHeader } from "../../shared/page-header";

export const PatientsPage = () => {
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const { data, isLoading, isError, refetch, isFetching } = useQuery<PatientsResponse>({
    queryKey: ["patients", search],
    queryFn: () => getPatients(search.trim() || undefined),
    placeholderData: (previousData) => previousData,
  });
  const { setConfig } = usePageHeader();
  const createPatientMutation = useMutation({
    mutationFn: createPatient,
    onSuccess: () => {
      setShowCreateModal(false);
      refetch();
    },
  });

  const items: Patient[] = useMemo(() => data?.items ?? [], [data]);

  const consentSummary = useMemo(() => {
    const total = items.length;
    const withConsent = items.filter((p: Patient) => p.consentimiento).length;
    return { total, withConsent };
  }, [items]);

  const totalPatients = data?.total ?? consentSummary.total;
  const pendingConsent = Math.max(totalPatients - consentSummary.withConsent, 0);
  const consentRate = totalPatients > 0 ? Math.round((consentSummary.withConsent / totalPatients) * 100) : 0;

  useEffect(() => {
    const loading = isLoading && !data;
    const refreshing = isFetching && !loading;
    setConfig({
      title: "Pacientes",
      subtitle: "Consultá consentimientos y accedé al historial de episodios desde cada ficha.",
      highlights: [
        {
          label: "Pacientes totales",
          value: loading ? "Cargando..." : String(totalPatients),
          helper: loading ? undefined : refreshing ? "Actualizando..." : undefined,
        },
        {
          label: "Consentimiento activo",
          value: loading ? "Cargando..." : String(consentSummary.withConsent),
          helper:
            loading || totalPatients === 0
              ? undefined
              : `${consentRate}% con consentimiento`,
        },
        {
          label: "Pendientes",
          value: loading ? "Cargando..." : String(pendingConsent),
          helper:
            loading || pendingConsent === 0
              ? loading
                ? undefined
                : "Todos actualizados"
              : "Revisá consentimientos pendientes",
        },
      ],
    });
  }, [consentRate, consentSummary.withConsent, data, isFetching, isLoading, pendingConsent, setConfig, totalPatients]);

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg border border-primary/30 bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary/90"
          >
            Alta de paciente
          </button>
          <button
            onClick={() => refetch()}
            className="rounded-lg border border-primary/30 bg-white px-4 py-2 text-sm font-medium text-primary shadow-sm transition hover:bg-primary hover:text-white"
          >
            Actualizar
          </button>
        </div>
      </header>

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <label className="block text-xs text-muted uppercase tracking-wide">Buscar por nombre o DNI</label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ej: 30123456 o María"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm text-slate-600 md:w-64">
            <div className="rounded-md bg-slate-50 px-3 py-2">
              <dt>Total pacientes</dt>
              <dd className="text-lg font-semibold text-slate-900">{consentSummary.total}</dd>
            </div>
            <div className="rounded-md bg-slate-50 px-3 py-2">
              <dt>Consentimiento activo</dt>
              <dd className="text-lg font-semibold text-slate-900">{consentSummary.withConsent}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-6">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center text-muted">Cargando pacientes...</div>
          ) : isError ? (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              No pudimos obtener la lista desde la API. Se muestran datos de referencia.
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-muted">
              No encontramos pacientes con el criterio ingresado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-slate-600 uppercase tracking-wide">Paciente</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-600 uppercase tracking-wide">DNI</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-600 uppercase tracking-wide">Contacto</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-600 uppercase tracking-wide">Cobertura</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-600 uppercase tracking-wide">Consentimiento</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-600 uppercase tracking-wide"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {items.map((patient: Patient) => (
                    <tr key={patient.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {patient.apellido}, {patient.nombre}
                        </div>
                        <div className="text-xs text-muted">{patient.email}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{patient.dni}</td>
                      <td className="px-4 py-3">
                        <div className="text-slate-700">{patient.telefono}</div>
                        {patient.email && <div className="text-xs text-muted">{patient.email}</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{patient.prepaga ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                            patient.consentimiento
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {patient.consentimiento ? "Activo" : "Pendiente"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          className="rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-primary hover:text-primary"
                          onClick={() => setSelectedPatient(patient)}
                        >
                          Ver detalles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {isFetching && (
          <div className="mt-3 text-xs text-muted">Actualizando datos desde el servidor...</div>
        )}
      </div>
      {selectedPatient && (
        <PatientDetailDrawer patient={selectedPatient} onClose={() => setSelectedPatient(null)} />
      )}
      {showCreateModal && (
        <CreatePatientModal
          isSubmitting={createPatientMutation.isLoading}
          onClose={() => setShowCreateModal(false)}
          onSubmit={(values) => createPatientMutation.mutate(values)}
        />
      )}
    </section>
  );
};

const patientSchema = z.object({
  nombre: z.string().trim().min(1, "Ingresá el nombre"),
  apellido: z.string().trim().min(1, "Ingresá el apellido"),
  dni: z.string().trim().min(6, "Ingresá el DNI"),
  telefono: z.string().trim().min(6, "Ingresá el teléfono"),
  email: z
    .string()
    .trim()
    .email("Email inválido")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
  prepaga: z.string().trim().optional(),
  consentimiento: z.boolean(),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface CreatePatientModalProps {
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePatientPayload) => void;
}

const CreatePatientModal = ({ isSubmitting, onClose, onSubmit }: CreatePatientModalProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      nombre: "",
      apellido: "",
      dni: "",
      telefono: "",
      email: undefined,
      prepaga: "",
      consentimiento: true,
    },
  });

  const handleFormSubmit = (values: PatientFormData) => {
    const payload: CreatePatientPayload = {
      nombre: values.nombre.trim(),
      apellido: values.apellido.trim(),
      dni: values.dni.trim(),
      telefono: values.telefono.trim(),
      email: values.email?.trim() || undefined,
      prepaga: values.prepaga?.trim() || undefined,
      consentimiento: values.consentimiento,
    };
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Nuevo paciente</h3>
            <p className="text-xs text-muted">
              Registrá los datos básicos del paciente para iniciar el seguimiento clínico.
            </p>
          </div>
          <button onClick={onClose} className="text-sm text-primary underline">
            Cerrar
          </button>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted">Nombre</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                {...register("nombre")}
              />
              {errors.nombre && <p className="text-xs text-red-500">{errors.nombre.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Apellido</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                {...register("apellido")}
              />
              {errors.apellido && <p className="text-xs text-red-500">{errors.apellido.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted">DNI</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                {...register("dni")}
              />
              {errors.dni && <p className="text-xs text-red-500">{errors.dni.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Teléfono</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                {...register("telefono")}
              />
              {errors.telefono && <p className="text-xs text-red-500">{errors.telefono.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Email</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                {...register("email")}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Cobertura / Prepaga</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                {...register("prepaga")}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              {...register("consentimiento")}
            />
            <div>
              <p className="text-sm font-medium text-slate-900">Consentimiento informado activo</p>
              <p className="text-xs text-muted">
                Confirmá si el paciente ya firmó su consentimiento para compartir información.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
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
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Guardando..." : "Crear paciente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface PatientDetailDrawerProps {
  patient: Patient;
  onClose: () => void;
}

const PatientDetailDrawer = ({ patient, onClose }: PatientDetailDrawerProps) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["patient-episodes", patient.id],
    queryFn: () => getEpisodes(),
  });

  const patientEpisodes = useMemo(() => {
    const allEpisodes = data ?? [];
    const normalizedName = `${patient.apellido}, ${patient.nombre}`.toLowerCase();
    return allEpisodes.filter((episode: Episode) => {
      if (episode.patientId && episode.patientId === patient.id) {
        return true;
      }
      return episode.paciente.toLowerCase() === normalizedName;
    });
  }, [data, patient]);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="hidden flex-1 bg-black/30 md:block" onClick={onClose} />
      <div className="relative h-full w-full max-w-3xl bg-white shadow-2xl md:ml-auto">
        <header className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Paciente</p>
            <h3 className="text-xl font-semibold text-slate-900">
              {patient.apellido}, {patient.nombre}
            </h3>
            <p className="text-xs text-muted">DNI {patient.dni}</p>
          </div>
          <button
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-primary hover:text-primary"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <FiX className="text-lg" />
          </button>
        </header>
        <div className="flex h-full flex-col gap-4 overflow-y-auto px-6 py-5">
          <section className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <h4 className="text-sm font-semibold text-slate-800">Datos de contacto</h4>
            <dl className="mt-3 grid grid-cols-1 gap-3 text-sm text-slate-700 md:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Teléfono</dt>
                <dd>{patient.telefono}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Email</dt>
                <dd>{patient.email ?? "No informado"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Cobertura</dt>
                <dd>{patient.prepaga ?? "No informado"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Consentimiento</dt>
                <dd>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      patient.consentimiento ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {patient.consentimiento ? "Activo" : "Pendiente"}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Fecha de alta</dt>
                <dd>{patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : "No disponible"}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-800">Episodios vinculados</h4>
                <p className="text-xs text-muted">
                  Visualizá los episodios creados para este paciente y su estado actual.
                </p>
              </div>
            </div>
            {isLoading ? (
              <div className="flex h-32 items-center justify-center text-muted">Cargando episodios...</div>
            ) : isError ? (
              <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
                No pudimos obtener los episodios. Se muestran datos locales si están disponibles.
              </div>
            ) : patientEpisodes.length === 0 ? (
              <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-muted">
                Este paciente todavía no tiene episodios registrados.
              </div>
            ) : (
              <ul className="mt-3 space-y-3">
                {patientEpisodes.map((episode) => (
                  <li
                    key={episode.id}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{episode.titulo}</p>
                        <p className="text-xs text-muted">
                          Código {episode.codigo} · {new Date(episode.fechaAlta).toLocaleString()} · {episode.institucion}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                          {episode.estado}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                            episode.urgencia === "rojo"
                              ? "bg-red-50 text-red-700"
                              : episode.urgencia === "amarillo"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {episode.urgencia}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
