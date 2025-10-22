import { apiClient } from "./client";

export interface Professional {
  id: string;
  nombre: string;
  apellido: string;
  especialidad: string;
  matricula: string;
  fechaAlta: string;
  telefono: string;
  email: string;
  direccion?: string;
  activo: boolean;
  instituciones: Array<{ institutionId: string; nombre: string; activo: boolean; fechaAlta: string }>;
}

const seedProfessionals: Professional[] = [
  {
    id: "prof-1",
    nombre: "Pablo",
    apellido: "Psicologo",
    especialidad: "Psicología Clínica",
    matricula: "MP-12345",
    fechaAlta: new Date().toISOString(),
    telefono: "+54 9 11 5555 0101",
    email: "psico.demo@vitalminds.local",
    activo: true,
    instituciones: [
      {
        institutionId: "inst-1",
        nombre: "VitalMinds Demo",
        activo: true,
        fechaAlta: new Date().toISOString(),
      },
    ],
  },
  {
    id: "prof-2",
    nombre: "Maria",
    apellido: "Medica",
    especialidad: "Medicina Clínica",
    matricula: "MN-54321",
    fechaAlta: new Date().toISOString(),
    telefono: "+54 9 11 5555 0202",
    email: "medico.demo@vitalminds.local",
    activo: true,
    instituciones: [
      {
        institutionId: "inst-1",
        nombre: "VitalMinds Demo",
        activo: true,
        fechaAlta: new Date().toISOString(),
      },
    ],
  },
];

const STORAGE_KEY = "vitalminds:professionals";
let runtimeProfessionals: Professional[] = [...seedProfessionals];

const persistProfessionals = (professionals: Professional[]) => {
  runtimeProfessionals = professionals;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(professionals));
  }
};

const ensureStorageSeeded = () => {
  if (typeof window === "undefined") {
    return;
  }
  if (!window.localStorage.getItem(STORAGE_KEY)) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(runtimeProfessionals));
  }
};

const readLocalProfessionals = (): Professional[] => {
  if (typeof window === "undefined") {
    return [...runtimeProfessionals];
  }

  ensureStorageSeeded();

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      persistProfessionals(runtimeProfessionals);
      return [...runtimeProfessionals];
    }

    const parsed = JSON.parse(rawValue) as Professional[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      persistProfessionals(runtimeProfessionals);
      return [...runtimeProfessionals];
    }

    runtimeProfessionals = parsed;
    return [...parsed];
  } catch (error) {
    console.warn("No se pudieron leer profesionales locales, uso seed en memoria", error);
    return [...runtimeProfessionals];
  }
};

const filterProfessionals = (professionals: Professional[], institutionId?: string) => {
  if (!institutionId) {
    return professionals;
  }
  return professionals.filter((professional) =>
    professional.instituciones.some((inst) => inst.institutionId === institutionId),
  );
};

const getLocalProfessionals = (institutionId?: string) => {
  const professionals = readLocalProfessionals();
  return filterProfessionals(professionals, institutionId);
};

const upsertLocalProfessional = (professional: Professional) => {
  const professionals = readLocalProfessionals();
  const index = professionals.findIndex((item) => item.id === professional.id);
  const nextList =
    index >= 0
      ? professionals.map((item) => (item.id === professional.id ? professional : item))
      : [...professionals, professional];

  persistProfessionals(nextList);
  return professional;
};

export const getProfessionals = async (institutionId?: string): Promise<Professional[]> => {
  try {
    const response = await apiClient.get<{ ok?: boolean; data?: Professional[] }>("/professionals", {
      params: { institutionId },
    });

    if (Array.isArray(response.data?.data) && response.data.data.length > 0) {
      if (!institutionId) {
        persistProfessionals(response.data.data);
      }
      return response.data.data;
    }
  } catch (error) {
    console.warn("No se pudo obtener profesionales, usando datos locales", error);
  }

  return getLocalProfessionals(institutionId);
};

export interface CreateProfessionalPayload {
  nombre: string;
  apellido: string;
  especialidad: string;
  matricula: string;
  telefono: string;
  email: string;
  direccion?: string;
  instituciones?: string[];
  institucionesDetalle?: Array<{ id: string; nombre: string }>;
}

export interface UpdateProfessionalPayload extends CreateProfessionalPayload {
  id: string;
}

const buildInstitutionsPayload = (
  payload: CreateProfessionalPayload,
  fallbackInstitutions?: Professional["instituciones"],
) => {
  const now = new Date().toISOString();

  if (payload.institucionesDetalle && payload.institucionesDetalle.length > 0) {
    return payload.institucionesDetalle.map((inst) => ({
      institutionId: inst.id,
      nombre: inst.nombre,
      activo: true,
      fechaAlta: now,
    }));
  }

  if (payload.instituciones && payload.instituciones.length > 0) {
    return payload.instituciones.map((instId) => ({
      institutionId: instId,
      nombre:
        fallbackInstitutions?.find((inst) => inst.institutionId === instId)?.nombre ?? "Institución pendiente",
      activo: true,
      fechaAlta: now,
    }));
  }

  return (
    fallbackInstitutions ?? [
      {
        institutionId: "inst-pendiente",
        nombre: "Institución pendiente",
        activo: true,
        fechaAlta: now,
      },
    ]
  );
};

export const createProfessional = async (payload: CreateProfessionalPayload) => {
  try {
    const response = await apiClient.post<{ ok?: boolean; data?: Professional; item?: Professional }>(
      "/professionals",
      {
        nombre: payload.nombre,
        apellido: payload.apellido,
        especialidad: payload.especialidad,
        matricula: payload.matricula,
        telefono: payload.telefono,
        email: payload.email,
        direccion: payload.direccion,
        institucionIds: payload.instituciones ?? [],
      },
    );

    if (response.status >= 200 && response.status < 300) {
      const createdProfessional = response.data?.data ?? response.data?.item ?? null;
      if (createdProfessional) {
        upsertLocalProfessional(createdProfessional);
        return createdProfessional;
      }
    }
  } catch (error) {
    console.warn("No se pudo crear el profesional en la API, uso almacenamiento local", error);
  }

  const now = new Date().toISOString();
  const fallbackProfessional: Professional = {
    id: `prof-mock-${Date.now()}`,
    nombre: payload.nombre,
    apellido: payload.apellido,
    especialidad: payload.especialidad,
    matricula: payload.matricula,
    fechaAlta: now,
    telefono: payload.telefono,
    email: payload.email,
    direccion: payload.direccion,
    activo: true,
    instituciones: buildInstitutionsPayload(payload),
  };

  return upsertLocalProfessional(fallbackProfessional);
};

export const updateProfessional = async (payload: UpdateProfessionalPayload) => {
  try {
    const response = await apiClient.put<{ ok?: boolean; data?: Professional; item?: Professional }>(
      `/professionals/${payload.id}`,
      {
        nombre: payload.nombre,
        apellido: payload.apellido,
        especialidad: payload.especialidad,
        matricula: payload.matricula,
        telefono: payload.telefono,
        email: payload.email,
        direccion: payload.direccion,
        institucionIds: payload.instituciones ?? [],
      },
    );

    if (response.status >= 200 && response.status < 300) {
      const updatedProfessional = response.data?.data ?? response.data?.item ?? null;
      if (updatedProfessional) {
        upsertLocalProfessional(updatedProfessional);
        return updatedProfessional;
      }
    }
  } catch (error) {
    console.warn("No se pudo actualizar el profesional en la API, uso almacenamiento local", error);
  }

  const existing = readLocalProfessionals().find((item) => item.id === payload.id);
  const now = existing?.fechaAlta ?? new Date().toISOString();

  const merged: Professional = {
    id: payload.id,
    nombre: payload.nombre,
    apellido: payload.apellido,
    especialidad: payload.especialidad,
    matricula: payload.matricula,
    fechaAlta: now,
    telefono: payload.telefono,
    email: payload.email,
    direccion: payload.direccion,
    activo: existing?.activo ?? true,
    instituciones: buildInstitutionsPayload(payload, existing?.instituciones),
  };

  return upsertLocalProfessional(merged);
};
