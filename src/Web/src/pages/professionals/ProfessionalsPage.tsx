import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FiMoreVertical } from "react-icons/fi";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createProfessional,
  CreateProfessionalPayload,
  getProfessionals,
  Professional,
  updateProfessional,
  UpdateProfessionalPayload,
} from "../../api/professionals";
import { getInstitutions, Institution } from "../../api/institutions";
import { usePageHeader } from "../../shared/page-header";

const professionalSchema = z.object({
  nombre: z.string().min(1, "Ingresá el nombre"),
  apellido: z.string().min(1, "Ingresá el apellido"),
  especialidad: z.string().min(1, "Ingresá la especialidad"),
  matricula: z.string().min(1, "Ingresá la matrícula"),
  telefono: z.string().min(6, "Ingresá el teléfono"),
  email: z.string().email("Email inválido"),
  direccion: z.string().optional(),
  instituciones: z.array(z.string()).optional(),
});

type ProfessionalFormData = z.infer<typeof professionalSchema>;

export const ProfessionalsPage = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["professionals"],
    queryFn: () => getProfessionals(),
  });
  const { data: institutionsData } = useQuery({
    queryKey: ["institutions"],
    queryFn: () => getInstitutions(),
  });
  const { setConfig } = usePageHeader();

  const createProfessionalMutation = useMutation({
    mutationFn: createProfessional,
    onSuccess: () => {
      setShowCreateModal(false);
      refetch();
    },
  });

  const professionals: Professional[] = useMemo(() => data ?? [], [data]);
  const institutions: Institution[] = useMemo(() => institutionsData ?? [], [institutionsData]);
  const activeProfessionals = useMemo(() => professionals.filter((prof) => prof.activo).length, [professionals]);
  const institutionsLinked = useMemo(() => {
    const linked = new Set<string>();
    professionals.forEach((prof) => {
      prof.instituciones.forEach((inst) => linked.add(inst.institutionId));
    });
    return linked.size;
  }, [professionals]);

  useEffect(() => {
    const hasRemoteProfessionals = Array.isArray(data) && data.length > 0;
    const loading = isLoading && !hasRemoteProfessionals;
    setConfig({
      title: "Profesionales",
      subtitle: "Administrá datos de contacto, matrículas y asignaciones por institución.",
      highlights: [
        {
          label: "Registrados",
          value: loading ? "Cargando..." : String(professionals.length),
          helper: loading ? undefined : isError ? "Datos de referencia" : undefined,
        },
        {
          label: "Activos",
          value: loading ? "Cargando..." : String(activeProfessionals),
          helper:
            loading || professionals.length === 0
              ? loading
                ? undefined
                : "Sin profesionales"
              : `${activeProfessionals} habilitados`,
        },
        {
          label: "Instituciones",
          value: loading ? "Cargando..." : String(institutionsLinked),
          helper:
            loading || institutionsLinked === 0
              ? loading
                ? undefined
                : "Vinculá profesionales"
              : "Con al menos un profesional asignado",
        },
      ],
    });
  }, [activeProfessionals, data, institutionsLinked, isError, isLoading, professionals.length, setConfig]);

  const updateProfessionalMutation = useMutation({
    mutationFn: updateProfessional,
    onSuccess: () => {
      setEditingProfessional(null);
      refetch();
    },
  });

  useEffect(() => {
    if (!openMenuId) {
      menuRef.current = null;
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  const toCreatePayload = useCallback(
    (values: ProfessionalFormData): CreateProfessionalPayload => {
      const selectedInstitutionIds = values.instituciones ?? [];
      const selectedInstitutions = institutions.filter((inst) => selectedInstitutionIds.includes(inst.id));
      return {
        nombre: values.nombre.trim(),
        apellido: values.apellido.trim(),
        especialidad: values.especialidad.trim(),
        matricula: values.matricula.trim(),
        telefono: values.telefono.trim(),
        email: values.email.trim(),
        direccion: values.direccion?.trim() || undefined,
        instituciones: selectedInstitutionIds,
        institucionesDetalle: selectedInstitutions.map((inst) => ({ id: inst.id, nombre: inst.nombre })),
      };
    },
    [institutions],
  );

  const toUpdatePayload = useCallback(
    (id: string, values: ProfessionalFormData): UpdateProfessionalPayload => ({
      id,
      ...toCreatePayload(values),
    }),
    [toCreatePayload],
  );

  const editingInitialValues = useMemo<ProfessionalFormData | undefined>(() => {
    if (!editingProfessional) {
      return undefined;
    }
    return {
      nombre: editingProfessional.nombre,
      apellido: editingProfessional.apellido,
      especialidad: editingProfessional.especialidad,
      matricula: editingProfessional.matricula,
      telefono: editingProfessional.telefono,
      email: editingProfessional.email,
      direccion: editingProfessional.direccion ?? "",
      instituciones: editingProfessional.instituciones.map((inst) => inst.institutionId),
    };
  }, [editingProfessional]);

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full rounded-lg border border-primary/30 bg-white px-4 py-2 text-sm font-medium text-primary shadow-sm transition hover:bg-primary hover:text-white md:w-auto"
        >
          Alta de profesional
        </button>
      </header>
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-muted">Cargando profesionales...</div>
        ) : isError ? (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            No pudimos obtener los profesionales desde la API. Se muestran datos de referencia.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-slate-600 uppercase tracking-wide">Profesional</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600 uppercase tracking-wide">Especialidad</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600 uppercase tracking-wide">Matrícula</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600 uppercase tracking-wide">Instituciones</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600 uppercase tracking-wide">Contacto</th>
                  <th className="px-4 py-2 text-right font-medium text-slate-600 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {professionals.map((profesional) => (
                  <tr key={profesional.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {profesional.apellido}, {profesional.nombre}
                      </div>
                      <div className="text-xs text-muted">
                        Alta: {new Date(profesional.fechaAlta).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{profesional.especialidad}</td>
                    <td className="px-4 py-3 text-slate-700">{profesional.matricula}</td>
                    <td className="px-4 py-3">
                      <ul className="space-y-1">
                        {profesional.instituciones.map((inst) => (
                          <li key={inst.institutionId} className="text-slate-700">
                            {inst.nombre}{" "}
                            <span className="text-xs text-muted">
                              ({inst.activo ? "Activo" : "Inactivo"})
                            </span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-700">{profesional.telefono}</div>
                      <div className="text-xs text-blue-600">{profesional.email}</div>
                    </td>
                    <td className="relative px-4 py-3 text-right">
                      <div
                        className="relative inline-block text-left"
                        ref={openMenuId === profesional.id ? menuRef : undefined}
                      >
                        <button
                          onClick={() =>
                            setOpenMenuId((current) => (current === profesional.id ? null : profesional.id))
                          }
                          className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-primary hover:text-primary"
                          title="Acciones"
                        >
                          <FiMoreVertical className="text-lg" />
                        </button>
                        {openMenuId === profesional.id && (
                          <div className="absolute right-0 z-10 mt-2 w-40 rounded-lg border border-slate-200 bg-white py-1 text-left shadow-lg">
                            <button
                              onClick={() => {
                                setEditingProfessional(profesional);
                                setOpenMenuId(null);
                              }}
                              className="block w-full px-4 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-100"
                            >
                              Editar datos
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
        <ProfessionalModal
          mode="create"
          institutions={institutions}
          isSubmitting={createProfessionalMutation.isLoading}
          onClose={() => setShowCreateModal(false)}
          onSubmit={(values) => createProfessionalMutation.mutate(toCreatePayload(values))}
        />
      )}
      {editingProfessional && (
        <ProfessionalModal
          mode="edit"
          institutions={institutions}
          isSubmitting={updateProfessionalMutation.isLoading}
          initialValues={editingInitialValues}
          onClose={() => {
            setEditingProfessional(null);
            setOpenMenuId(null);
          }}
          onSubmit={(values) => {
            if (!editingProfessional) {
              return;
            }
            updateProfessionalMutation.mutate(toUpdatePayload(editingProfessional.id, values));
          }}
        />
      )}
    </section>
  );
};

interface ProfessionalModalProps {
  institutions: Institution[];
  isSubmitting: boolean;
  mode: "create" | "edit";
  initialValues?: ProfessionalFormData;
  onClose: () => void;
  onSubmit: (data: ProfessionalFormData) => void;
}

const ProfessionalModal = ({
  institutions,
  isSubmitting,
  mode,
  initialValues,
  onClose,
  onSubmit,
}: ProfessionalModalProps) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<ProfessionalFormData>({
    resolver: zodResolver(professionalSchema),
    defaultValues: {
      nombre: initialValues?.nombre ?? "",
      apellido: initialValues?.apellido ?? "",
      especialidad: initialValues?.especialidad ?? "",
      matricula: initialValues?.matricula ?? "",
      telefono: initialValues?.telefono ?? "",
      email: initialValues?.email ?? "",
      direccion: initialValues?.direccion ?? "",
      instituciones: initialValues?.instituciones ?? [],
    },
  });

  useEffect(() => {
    reset({
      nombre: initialValues?.nombre ?? "",
      apellido: initialValues?.apellido ?? "",
      especialidad: initialValues?.especialidad ?? "",
      matricula: initialValues?.matricula ?? "",
      telefono: initialValues?.telefono ?? "",
      email: initialValues?.email ?? "",
      direccion: initialValues?.direccion ?? "",
      instituciones: initialValues?.instituciones ?? [],
    });
  }, [initialValues, reset]);

  const isEditMode = mode === "edit";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {isEditMode ? "Editar profesional" : "Nuevo profesional"}
            </h3>
            <p className="text-xs text-muted">
              {isEditMode
                ? "Actualizá los datos y asociaciones del profesional seleccionado."
                : "Completa los datos del profesional y asociá instituciones."}
            </p>
          </div>
          <button onClick={onClose} className="text-sm text-primary underline">
            Cerrar
          </button>
        </div>
        <form
          className="space-y-4"
          onSubmit={handleSubmit((values) => {
            onSubmit({
              ...values,
              direccion: values.direccion?.trim() ?? "",
            });
          })}
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted">Nombre</label>
              <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" {...register("nombre")} />
              {errors.nombre && <p className="text-xs text-red-500">{errors.nombre.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Apellido</label>
              <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" {...register("apellido")} />
              {errors.apellido && <p className="text-xs text-red-500">{errors.apellido.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Especialidad</label>
              <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" {...register("especialidad")} />
              {errors.especialidad && <p className="text-xs text-red-500">{errors.especialidad.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Matrícula</label>
              <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" {...register("matricula")} />
              {errors.matricula && <p className="text-xs text-red-500">{errors.matricula.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Teléfono</label>
              <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" {...register("telefono")} />
              {errors.telefono && <p className="text-xs text-red-500">{errors.telefono.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Email</label>
              <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" {...register("email")} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted">Dirección</label>
              <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" {...register("direccion")} />
              {errors.direccion && <p className="text-xs text-red-500">{errors.direccion.message}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-muted">Instituciones</label>
              <select
                multiple
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                {...register("instituciones")}
                onChange={(event) => {
                  const values = Array.from(event.target.selectedOptions).map((option) => option.value);
                  setValue("instituciones", values, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
                }}
              >
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.nombre}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-muted">Usá Ctrl/Cmd para seleccionar múltiples instituciones.</p>
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
              {isSubmitting ? "Guardando..." : isEditMode ? "Guardar cambios" : "Crear profesional"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
