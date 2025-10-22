import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FiMoreVertical, FiX } from "react-icons/fi";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createInstitution,
  deleteInstitution,
  getInstitutions,
  Institution,
  updateInstitution,
  UpdateInstitutionPayload,
} from "../../api/institutions";
import { usePageHeader } from "../../shared/page-header";

export const InstitutionsPage = () => {
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [openActionInstitutionId, setOpenActionInstitutionId] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);
  const [viewingInstitution, setViewingInstitution] = useState<Institution | null>(null);
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null);
  const [deletingInstitution, setDeletingInstitution] = useState<Institution | null>(null);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["institutions"],
    queryFn: () => getInstitutions(),
  });
  const { setConfig } = usePageHeader();

  const createInstitutionMutation = useMutation({
    mutationFn: createInstitution,
    onSuccess: () => {
      setShowCreateModal(false);
      refetch();
    },
  });

  const updateInstitutionMutation = useMutation({
    mutationFn: updateInstitution,
    onSuccess: () => {
      setEditingInstitution(null);
      refetch();
    },
  });

  const deleteInstitutionMutation = useMutation({
    mutationFn: deleteInstitution,
    onSuccess: () => {
      setDeletingInstitution(null);
      refetch();
    },
  });

  const institutionStats = useMemo(() => {
    const list = data ?? [];
    const total = list.length;
    const active = list.filter((inst) => inst.activo).length;
    const independents = list.filter((inst) => inst.esProfesionalIndependiente).length;
    return { total, active, independents };
  }, [data]);

  useEffect(() => {
    const hasRemoteInstitutions = Array.isArray(data) && data.length > 0;
    const loading = isLoading && !hasRemoteInstitutions;
    setConfig({
      title: "Instituciones",
      subtitle: "Visualizá clínicas y consultorios registrados. Cada institución administra sus profesionales.",
      highlights: [
        {
          label: "Registradas",
          value: loading ? "Cargando..." : String(institutionStats.total),
          helper: loading ? undefined : isError ? "Datos de referencia" : undefined,
        },
        {
          label: "Activas",
          value: loading ? "Cargando..." : String(institutionStats.active),
          helper:
            loading || institutionStats.total === 0
              ? loading
                ? undefined
                : "Sin registros"
              : `${institutionStats.active} operativas`,
        },
        {
          label: "Independientes",
          value: loading ? "Cargando..." : String(institutionStats.independents),
          helper:
            loading || institutionStats.independents === 0
              ? loading
                ? undefined
                : "Sin profesionales independientes"
              : "Gestionan su propia facturación",
        },
      ],
    });
  }, [data, institutionStats.active, institutionStats.independents, institutionStats.total, isError, isLoading, setConfig]);

  useEffect(() => {
    if (!openActionInstitutionId) {
      actionMenuRef.current = null;
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setOpenActionInstitutionId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openActionInstitutionId]);

  const handleInstitutionAction = useCallback((institution: Institution, action: "view" | "edit" | "delete") => {
    switch (action) {
      case "view":
        setViewingInstitution(institution);
        break;
      case "edit":
        setEditingInstitution(institution);
        break;
      case "delete":
        setDeletingInstitution(institution);
        break;
      default:
        break;
    }
    setOpenActionInstitutionId(null);
  }, []);

  const institutions: Institution[] = useMemo(() => {
    const all = data ?? [];
    if (!search) return all;
    const lowered = search.trim().toLowerCase();
    return all.filter(
      (inst) =>
        inst.nombre.toLowerCase().includes(lowered) ||
        inst.razonSocial.toLowerCase().includes(lowered) ||
        inst.cuit.replace(/-/g, "").includes(lowered.replace(/-/g, "")),
    );
  }, [data, search]);

  return (
    <section className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Listado de instituciones</h3>
            <p className="text-xs text-muted">
              Al conectar la API se reemplazará este mock por los datos reales.
            </p>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, razón social o CUIT"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 md:w-64"
            />
            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded-lg border border-primary/30 bg-white px-4 py-2 text-sm font-medium text-primary shadow-sm transition hover:bg-primary hover:text-white"
            >
              Alta de institución
            </button>
          </div>
        </div>
        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-muted">Cargando instituciones...</div>
        ) : isError ? (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            No pudimos obtener las instituciones en vivo. Se muestran datos de referencia.
          </div>
        ) : institutions.length === 0 ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-muted">
            No se encontraron instituciones con el criterio ingresado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-slate-600 uppercase tracking-wide">Institución</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600 uppercase tracking-wide">CUIT</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600 uppercase tracking-wide">Dirección</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600 uppercase tracking-wide">Teléfono</th>
                  <th className="px-4 py-2 text-right font-medium text-slate-600 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {institutions.map((inst) => (
                  <tr key={inst.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{inst.nombre}</div>
                      <div className="text-xs text-muted">Razón social: {inst.razonSocial}</div>
                      <div className="text-xs text-muted">Alta: {new Date(inst.fechaAlta).toLocaleDateString()}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{inst.cuit}</td>
                    <td className="px-4 py-3 text-slate-700">{inst.direccion}</td>
                    <td className="px-4 py-3 text-slate-700">{inst.telefono}</td>
                    <td className="relative px-4 py-3 text-right">
                      <div
                        className="relative inline-block text-left"
                        ref={openActionInstitutionId === inst.id ? actionMenuRef : undefined}
                      >
                        <button
                          className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-primary hover:text-primary"
                          title="Acciones rápidas"
                          onClick={() =>
                            setOpenActionInstitutionId((current) => (current === inst.id ? null : inst.id))
                          }
                        >
                          <FiMoreVertical className="text-lg" />
                        </button>
                        {openActionInstitutionId === inst.id && (
                          <div className="absolute right-0 z-10 mt-2 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                            <button
                              className="block w-full px-4 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-100"
                              onClick={() => handleInstitutionAction(inst, "view")}
                            >
                              Ver ficha
                            </button>
                            <button
                              className="block w-full px-4 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-100"
                              onClick={() => handleInstitutionAction(inst, "edit")}
                            >
                              Editar datos
                            </button>
                            <button
                              className="block w-full px-4 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
                              onClick={() => handleInstitutionAction(inst, "delete")}
                            >
                              Eliminar institución
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
      {showCreateModal && (
        <CreateInstitutionModal
          isSubmitting={createInstitutionMutation.isLoading}
          onClose={() => setShowCreateModal(false)}
          onSubmit={(values) => createInstitutionMutation.mutate(values)}
        />
      )}
      {viewingInstitution && (
        <InstitutionDetailModal institution={viewingInstitution} onClose={() => setViewingInstitution(null)} />
      )}
      {editingInstitution && (
        <EditInstitutionModal
          institution={editingInstitution}
          isSubmitting={updateInstitutionMutation.isLoading}
          onClose={() => setEditingInstitution(null)}
          onSubmit={(values) => updateInstitutionMutation.mutate(values)}
        />
      )}
      {deletingInstitution && (
        <DeleteInstitutionDialog
          institution={deletingInstitution}
          isSubmitting={deleteInstitutionMutation.isLoading}
          onClose={() => setDeletingInstitution(null)}
          onConfirm={() => deleteInstitutionMutation.mutate({ id: deletingInstitution.id })}
        />
      )}
    </section>
  );
};

const institutionSchema = z.object({
  nombre: z.string().min(1, "Ingresá el nombre"),
  razonSocial: z.string().min(1, "Ingresá la razón social"),
  cuit: z.string().min(11, "Cuit inválido"),
  condicionIVA: z.string().min(1, "Seleccioná la condición"),
  email: z.string().email("Email inválido"),
  telefono: z.string().min(6, "Ingresá un teléfono válido"),
  direccion: z.string().min(1, "Ingresá la dirección"),
  banco: z.string().min(1, "Ingresá el banco"),
  cbu: z.string().min(22, "CBU inválido"),
  aliasCbu: z.string().min(1, "Ingresá el alias"),
  esProfesionalIndependiente: z.boolean().default(false),
});

type InstitutionFormData = z.infer<typeof institutionSchema>;

interface CreateInstitutionModalProps {
  onClose: () => void;
  onSubmit: (data: InstitutionFormData) => void;
  isSubmitting: boolean;
}

const CreateInstitutionModal = ({ onClose, onSubmit, isSubmitting }: CreateInstitutionModalProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InstitutionFormData>({
    resolver: zodResolver(institutionSchema),
    defaultValues: {
      nombre: "",
      razonSocial: "",
      cuit: "",
      condicionIVA: "Responsable Inscripto",
      email: "",
      telefono: "",
      direccion: "",
      banco: "",
      cbu: "",
      aliasCbu: "",
      esProfesionalIndependiente: false,
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Nueva institución</h3>
            <p className="text-xs text-muted">Completá los datos fiscales y de contacto.</p>
          </div>
          <button onClick={onClose} className="text-sm text-primary underline">
            Cerrar
          </button>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted">Nombre comercial</label>
              <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" {...register("nombre")} />
              {errors.nombre && <p className="text-xs text-red-500">{errors.nombre.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Razón social</label>
              <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" {...register("razonSocial")} />
              {errors.razonSocial && <p className="text-xs text-red-500">{errors.razonSocial.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted">CUIT</label>
              <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" {...register("cuit")} />
              {errors.cuit && <p className="text-xs text-red-500">{errors.cuit.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Condición frente al IVA</label>
              <select className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" {...register("condicionIVA")}>
                <option value="Responsable Inscripto">Responsable Inscripto</option>
                <option value="Monotributo">Monotributo</option>
                <option value="Exento">Exento</option>
              </select>
              {errors.condicionIVA && <p className="text-xs text-red-500">{errors.condicionIVA.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Email</label>
              <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" {...register("email")} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Teléfono</label>
              <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" {...register("telefono")} />
              {errors.telefono && <p className="text-xs text-red-500">{errors.telefono.message}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted">Dirección</label>
              <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" {...register("direccion")} />
              {errors.direccion && <p className="text-xs text-red-500">{errors.direccion.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Banco</label>
              <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" {...register("banco")} />
              {errors.banco && <p className="text-xs text-red-500">{errors.banco.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted">CBU</label>
              <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" {...register("cbu")} />
              {errors.cbu && <p className="text-xs text-red-500">{errors.cbu.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Alias CBU</label>
              <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" {...register("aliasCbu")} />
              {errors.aliasCbu && <p className="text-xs text-red-500">{errors.aliasCbu.message}</p>}
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <input type="checkbox" {...register("esProfesionalIndependiente")} />
              <span className="text-xs text-muted">Profesional independiente (sin clínica asociada)</span>
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
              {isSubmitting ? "Guardando..." : "Crear institución"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface InstitutionDetailModalProps {
  institution: Institution;
  onClose: () => void;
}

const InstitutionDetailModal = ({ institution, onClose }: InstitutionDetailModalProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{institution.nombre}</h3>
          <p className="text-xs text-muted">Razón social: {institution.razonSocial}</p>
        </div>
        <button onClick={onClose} className="rounded-full border border-slate-200 p-2 text-slate-500">
          <FiX />
        </button>
      </div>
      <dl className="grid grid-cols-1 gap-3 text-sm text-slate-700 md:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">CUIT</dt>
          <dd>{institution.cuit}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Condición IVA</dt>
          <dd>{institution.condicionIVA ?? "No informado"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Dirección</dt>
          <dd>{institution.direccion}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Teléfono</dt>
          <dd>{institution.telefono}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Email</dt>
          <dd>{institution.email ?? "No informado"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Banco</dt>
          <dd>{institution.banco ?? "No informado"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">CBU</dt>
          <dd>{institution.cbu ?? "No informado"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Alias</dt>
          <dd>{institution.aliasCbu ?? "No informado"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Fecha de alta</dt>
          <dd>{new Date(institution.fechaAlta).toLocaleDateString()}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Estado</dt>
          <dd>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                institution.activo ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              {institution.activo ? "Activo" : "Inactivo"}
            </span>
          </dd>
        </div>
      </dl>
    </div>
  </div>
);

interface EditInstitutionModalProps {
  institution: Institution;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: UpdateInstitutionPayload) => void;
}

const EditInstitutionModal = ({ institution, isSubmitting, onClose, onSubmit }: EditInstitutionModalProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InstitutionFormData>({
    resolver: zodResolver(institutionSchema),
    defaultValues: {
      nombre: institution.nombre,
      razonSocial: institution.razonSocial,
      cuit: institution.cuit,
      condicionIVA: institution.condicionIVA ?? "Responsable Inscripto",
      email: institution.email ?? "",
      telefono: institution.telefono,
      direccion: institution.direccion,
      banco: institution.banco ?? "",
      cbu: institution.cbu ?? "",
      aliasCbu: institution.aliasCbu ?? "",
      esProfesionalIndependiente: institution.esProfesionalIndependiente ?? false,
    },
  });

  const handleEditSubmit = (values: InstitutionFormData) => {
    const payload: UpdateInstitutionPayload = {
      id: institution.id,
      nombre: values.nombre,
      razonSocial: values.razonSocial,
      cuit: values.cuit,
      condicionIVA: values.condicionIVA,
      email: values.email,
      telefono: values.telefono,
      direccion: values.direccion,
      banco: values.banco,
      cbu: values.cbu,
      aliasCbu: values.aliasCbu,
      esProfesionalIndependiente: values.esProfesionalIndependiente,
      activo: institution.activo,
    };
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Editar institución</h3>
            <p className="text-xs text-muted">Actualizá los datos fiscales y de contacto.</p>
          </div>
          <button onClick={onClose} className="rounded-full border border-slate-200 p-2 text-slate-500">
            <FiX />
          </button>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit(handleEditSubmit)}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted">Nombre comercial</label>
              <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" {...register("nombre")} />
              {errors.nombre && <p className="text-xs text-red-500">{errors.nombre.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Razón social</label>
              <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" {...register("razonSocial")} />
              {errors.razonSocial && <p className="text-xs text-red-500">{errors.razonSocial.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted">CUIT</label>
              <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" {...register("cuit")} />
              {errors.cuit && <p className="text-xs text-red-500">{errors.cuit.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Condición frente al IVA</label>
              <select className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" {...register("condicionIVA")}>
                <option value="Responsable Inscripto">Responsable Inscripto</option>
                <option value="Monotributo">Monotributo</option>
                <option value="Exento">Exento</option>
              </select>
              {errors.condicionIVA && <p className="text-xs text-red-500">{errors.condicionIVA.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Email</label>
              <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" {...register("email")} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Teléfono</label>
              <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" {...register("telefono")} />
              {errors.telefono && <p className="text-xs text-red-500">{errors.telefono.message}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted">Dirección</label>
              <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" {...register("direccion")} />
              {errors.direccion && <p className="text-xs text-red-500">{errors.direccion.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Banco</label>
              <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" {...register("banco")} />
              {errors.banco && <p className="text-xs text-red-500">{errors.banco.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted">CBU</label>
              <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" {...register("cbu")} />
              {errors.cbu && <p className="text-xs text-red-500">{errors.cbu.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Alias CBU</label>
              <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" {...register("aliasCbu")} />
              {errors.aliasCbu && <p className="text-xs text-red-500">{errors.aliasCbu.message}</p>}
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <input type="checkbox" {...register("esProfesionalIndependiente")} />
              <span className="text-xs text-muted">Profesional independiente (sin clínica asociada)</span>
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

interface DeleteInstitutionDialogProps {
  institution: Institution;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteInstitutionDialog = ({ institution, isSubmitting, onClose, onConfirm }: DeleteInstitutionDialogProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
      <h3 className="text-lg font-semibold text-slate-900">Eliminar institución</h3>
      <p className="mt-2 text-sm text-muted">
        ¿Confirmás que querés eliminar la institución <span className="font-semibold text-slate-900">{institution.nombre}</span>?
        El registro desaparecerá de la vista actual. Cuando la API esté disponible se intentará borrar en el servidor.
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
          {isSubmitting ? "Eliminando..." : "Eliminar"}
        </button>
      </div>
    </div>
  </div>
);
