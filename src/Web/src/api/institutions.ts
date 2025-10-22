import { apiClient } from "./client";

export interface Institution {
  id: string;
  nombre: string;
  razonSocial: string;
  cuit: string;
  fechaAlta: string;
  direccion: string;
  telefono: string;
  activo: boolean;
  condicionIVA?: string;
  email?: string;
  banco?: string;
  cbu?: string;
  aliasCbu?: string;
  esProfesionalIndependiente?: boolean;
}

const seedInstitutions: Institution[] = [
  {
    id: "inst-1",
    nombre: "VitalMinds Demo",
    razonSocial: "VitalMinds Demo S.A.",
    cuit: "30-12345678-9",
    fechaAlta: new Date().toISOString(),
    direccion: "Av. Siempreviva 123, Buenos Aires",
    telefono: "+54 11 5555-0000",
    activo: true,
    condicionIVA: "Responsable Inscripto",
    email: "contacto@vitalminds.local",
    banco: "Banco Nación",
    cbu: "0000000000000000000000",
    aliasCbu: "vitalminds.demo",
    esProfesionalIndependiente: false,
  },
  {
    id: "inst-2",
    nombre: "Clínica Salud Integral",
    razonSocial: "Salud Integral SRL",
    cuit: "30-87654321-0",
    fechaAlta: new Date().toISOString(),
    direccion: "Av. Córdoba 987, Rosario",
    telefono: "+54 341 444-5566",
    activo: true,
    condicionIVA: "Responsable Inscripto",
    email: "info@saludintegral.fake",
    banco: "Banco Galicia",
    cbu: "0000000000000000000001",
    aliasCbu: "s.integral.demo",
    esProfesionalIndependiente: false,
  },
];

const STORAGE_KEY = "vitalminds:institutions";
let runtimeInstitutions: Institution[] = [...seedInstitutions];

const persistInstitutions = (institutions: Institution[]) => {
  runtimeInstitutions = institutions;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(institutions));
  }
};

const readLocalInstitutions = (): Institution[] => {
  if (typeof window === "undefined") {
    return [...runtimeInstitutions];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      persistInstitutions(runtimeInstitutions);
      return [...runtimeInstitutions];
    }

    const parsed = JSON.parse(raw) as Institution[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      persistInstitutions(runtimeInstitutions);
      return [...runtimeInstitutions];
    }

    runtimeInstitutions = parsed;
    return [...parsed];
  } catch (error) {
    console.warn("No se pudieron leer instituciones locales, uso memoria", error);
    return [...runtimeInstitutions];
  }
};

const upsertLocalInstitution = (institution: Institution) => {
  const institutions = readLocalInstitutions();
  const index = institutions.findIndex((item) => item.id === institution.id);
  const next =
    index >= 0 ? institutions.map((item) => (item.id === institution.id ? institution : item)) : [...institutions, institution];
  persistInstitutions(next);
  return institution;
};

export const getInstitutions = async (): Promise<Institution[]> => {
  try {
    const response = await apiClient.get<{ ok?: boolean; data?: Institution[] }>("/institutions");
    if (Array.isArray(response.data?.data) && response.data.data.length > 0) {
      persistInstitutions(response.data.data);
      return response.data.data;
    }
  } catch (error) {
    console.warn("No se pudo obtener instituciones, usando datos locales", error);
  }

  return readLocalInstitutions();
};

export interface CreateInstitutionPayload {
  nombre: string;
  razonSocial: string;
  cuit: string;
  condicionIVA: string;
  email: string;
  telefono: string;
  direccion: string;
  banco: string;
  cbu: string;
  aliasCbu: string;
  esProfesionalIndependiente: boolean;
}

export interface UpdateInstitutionPayload extends CreateInstitutionPayload {
  id: string;
  activo?: boolean;
}

export interface DeleteInstitutionPayload {
  id: string;
}

export const createInstitution = async (payload: CreateInstitutionPayload) => {
  try {
    const response = await apiClient.post<{ ok?: boolean; data?: Institution; item?: Institution }>(
      "/institutions",
      {
        nombre: payload.nombre,
        razonSocial: payload.razonSocial,
        cuit: payload.cuit,
        condicionIVA: payload.condicionIVA,
        email: payload.email,
        telefono: payload.telefono,
        direccion: payload.direccion,
        banco: payload.banco,
        cbu: payload.cbu,
        aliasCbu: payload.aliasCbu,
        esProfesionalIndependiente: payload.esProfesionalIndependiente,
      },
    );

    if (response.status >= 200 && response.status < 300) {
      const createdInstitution = response.data?.data ?? response.data?.item ?? null;
      if (createdInstitution) {
        return upsertLocalInstitution(createdInstitution);
      }
    }
  } catch (error) {
    console.warn("No se pudo crear la institución en la API, uso almacenamiento local", error);
  }

  const now = new Date().toISOString();
  const fallbackInstitution: Institution = {
    id: `inst-${Date.now()}`,
    nombre: payload.nombre,
    razonSocial: payload.razonSocial,
    cuit: payload.cuit,
    fechaAlta: now,
    direccion: payload.direccion,
    telefono: payload.telefono,
    activo: true,
    condicionIVA: payload.condicionIVA,
    email: payload.email,
    banco: payload.banco,
    cbu: payload.cbu,
    aliasCbu: payload.aliasCbu,
    esProfesionalIndependiente: payload.esProfesionalIndependiente,
  };

  return upsertLocalInstitution(fallbackInstitution);
};

export const updateInstitution = async (payload: UpdateInstitutionPayload) => {
  try {
    const response = await apiClient.put<{ ok?: boolean; data?: Institution; item?: Institution }>(
      `/institutions/${payload.id}`,
      {
        nombre: payload.nombre,
        razonSocial: payload.razonSocial,
        cuit: payload.cuit,
        condicionIVA: payload.condicionIVA,
        email: payload.email,
        telefono: payload.telefono,
        direccion: payload.direccion,
        banco: payload.banco,
        cbu: payload.cbu,
        aliasCbu: payload.aliasCbu,
        esProfesionalIndependiente: payload.esProfesionalIndependiente,
        activo: payload.activo ?? true,
      },
    );

    if (response.status >= 200 && response.status < 300) {
      const updatedInstitution = response.data?.data ?? response.data?.item ?? null;
      if (updatedInstitution) {
        return upsertLocalInstitution(updatedInstitution);
      }
    }
  } catch (error) {
    console.warn("No se pudo actualizar la institución en la API, uso almacenamiento local", error);
  }

  const existing = readLocalInstitutions().find((item) => item.id === payload.id);
  if (!existing) {
    throw new Error("No encontramos la institución a actualizar");
  }

  const merged: Institution = {
    ...existing,
    nombre: payload.nombre,
    razonSocial: payload.razonSocial,
    cuit: payload.cuit,
    direccion: payload.direccion,
    telefono: payload.telefono,
    activo: payload.activo ?? existing.activo,
    condicionIVA: payload.condicionIVA ?? existing.condicionIVA,
    email: payload.email ?? existing.email,
    banco: payload.banco ?? existing.banco,
    cbu: payload.cbu ?? existing.cbu,
    aliasCbu: payload.aliasCbu ?? existing.aliasCbu,
    esProfesionalIndependiente:
      payload.esProfesionalIndependiente ?? existing.esProfesionalIndependiente,
  };

  return upsertLocalInstitution(merged);
};

export const deleteInstitution = async ({ id }: DeleteInstitutionPayload) => {
  try {
    const response = await apiClient.delete<{ ok?: boolean }>(`/institutions/${id}`);
    if (response.status >= 200 && response.status < 300) {
      persistInstitutions(readLocalInstitutions().filter((inst) => inst.id !== id));
      return true;
    }
  } catch (error) {
    console.warn("No se pudo borrar la institución en la API, eliminando localmente", error);
  }

  persistInstitutions(readLocalInstitutions().filter((inst) => inst.id !== id));
  return true;
};
