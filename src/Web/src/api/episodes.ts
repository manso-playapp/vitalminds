import { apiClient } from "./client";

export interface Episode {
  id: string;
  codigo: string;
  titulo: string;
  fechaAlta: string;
  paciente: string;
  profesional: string;
  institucion: string;
  estado: string;
  urgencia: "verde" | "amarillo" | "rojo";
  notas?: string;
  patientId?: string;
  professionalId?: string;
  institutionId?: string;
}

export interface EpisodeDocument {
  id: string;
  nombre: string;
  tipo: "evaluacion" | "pedido" | "resultado" | "informe";
  fecha: string;
  firmado: boolean;
  firmadoPor?: string;
  url: string;
  hash?: string;
}

export interface EpisodeAssignment {
  id: string;
  rol: string;
  professionalId: string;
  profesionalNombre: string;
  assignedByProfessionalId?: string;
  asignadoPorNombre?: string;
  fechaAsignacion: string;
  fechaFinalizacion?: string;
  notas?: string;
}

const mockEpisodes: Episode[] = [
  {
    id: "epi-1",
    codigo: "EPI-VM01-202410140900",
    titulo: "Evaluación estrés crónico",
    fechaAlta: new Date().toISOString(),
    paciente: "Gutiérrez, María",
    profesional: "Psicologo, Pablo",
    institucion: "VitalMinds Demo",
    estado: "EVAL_PSICO_EN_PROCESO",
    urgencia: "verde",
    professionalId: "prof-1",
    patientId: "mock-1",
    institutionId: "inst-1",
  },
  {
    id: "epi-2",
    codigo: "EPI-VM01-202410131100",
    titulo: "Seguimiento mindfulness",
    fechaAlta: new Date(Date.now() - 86400000).toISOString(),
    paciente: "Manso, Javier",
    profesional: "Medica, Maria",
    institucion: "VitalMinds Demo",
    estado: "DERIVADO_A_MEDICO",
    urgencia: "amarillo",
    professionalId: "prof-2",
    patientId: "mock-2",
    institutionId: "inst-1",
  },
  {
    id: "epi-3",
    codigo: "EPI-VM01-202410101500",
    titulo: "Resultados laboratorio",
    fechaAlta: new Date(Date.now() - 3 * 86400000).toISOString(),
    paciente: "Gutiérrez, María",
    profesional: "Medica, Maria",
    institucion: "VitalMinds Demo",
    estado: "PEDIDO_LAB_EMITIDO",
    urgencia: "rojo",
    professionalId: "prof-2",
    patientId: "mock-1",
    institutionId: "inst-1",
  },
];

const mockDocuments: Record<string, EpisodeDocument[]> = {
  "epi-1": [
    {
      id: "doc-1",
      nombre: "Evaluación Psicológica - 2024-10-10",
      tipo: "evaluacion",
      fecha: new Date().toISOString(),
      firmado: true,
      firmadoPor: "Psicologo, Pablo",
      url: "/mock/evaluacion-epi-1.pdf",
      hash: "sha256-1234567890abcdef",
    },
    {
      id: "doc-2",
      nombre: "Informe Integrado v1",
      tipo: "informe",
      fecha: new Date().toISOString(),
      firmado: false,
      url: "/mock/informe-epi-1.pdf",
    },
  ],
  "epi-2": [
    {
      id: "doc-3",
      nombre: "Pedido de Laboratorio",
      tipo: "pedido",
      fecha: new Date().toISOString(),
      firmado: true,
      firmadoPor: "Medica, Maria",
      url: "/mock/pedido-epi-2.pdf",
      hash: "sha256-fedcba0987654321",
    },
  ],
};

export const getEpisodes = async (): Promise<Episode[]> => {
  try {
    const response = await apiClient.get<{ ok?: boolean; data?: Episode[] }>("/episodes");
    if (Array.isArray(response.data?.data) && response.data.data.length > 0) {
      persistEpisodes(response.data.data);
      return response.data.data;
    }
  } catch (error) {
    console.warn("No se pudieron obtener episodios, uso mock", error);
  }

  return getLocalEpisodes();
};

export const getEpisodeDocuments = async (episodeId: string): Promise<EpisodeDocument[]> => {
  try {
    const response = await apiClient.get<{ ok?: boolean; data?: EpisodeDocument[] }>(
      `/episodes/${episodeId}/documents`,
    );
    if (Array.isArray(response.data?.data)) {
      return response.data.data;
    }
    return mockDocuments[episodeId] ?? [];
  } catch (error) {
    console.warn("No se pudieron obtener documentos del episodio, uso mock", error);
    return mockDocuments[episodeId] ?? [];
  }
};

export const getEpisodeAssignments = async (episodeId: string): Promise<EpisodeAssignment[]> => {
  try {
    const response = await apiClient.get<{ ok?: boolean; data?: EpisodeAssignment[] }>(
      `/episodes/${episodeId}/assignments`,
    );
    if (Array.isArray(response.data?.data)) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.warn("No se pudieron obtener las asignaciones del episodio, uso mock vacío", error);
    return [];
  }
};

export interface CreateEpisodePayload {
  patientId: string;
  institutionId: string;
  professionalId: string;
  titulo: string;
  notas?: string;
  patientName?: string;
  professionalName?: string;
  institutionName?: string;
  urgencia?: Episode["urgencia"];
}

export interface UpdateEpisodePayload {
  id: string;
  titulo?: string;
  notas?: string;
  estado?: Episode["estado"];
  urgencia?: Episode["urgencia"];
  profesionalId?: string;
  profesionalNombre?: string;
  institucion?: string;
}

export interface DeleteEpisodePayload {
  id: string;
}

const STORAGE_KEY = "vitalminds:episodes";
let runtimeEpisodes: Episode[] = [...mockEpisodes];

const persistEpisodes = (episodes: Episode[]) => {
  runtimeEpisodes = episodes;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(episodes));
  }
};

const readLocalEpisodes = (): Episode[] => {
  if (typeof window === "undefined") {
    return [...runtimeEpisodes];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      persistEpisodes(runtimeEpisodes);
      return [...runtimeEpisodes];
    }
    const parsed = JSON.parse(raw) as Episode[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      persistEpisodes(runtimeEpisodes);
      return [...runtimeEpisodes];
    }
    runtimeEpisodes = parsed;
    return [...parsed];
  } catch (error) {
    console.warn("No se pudieron leer episodios locales, uso memoria", error);
    return [...runtimeEpisodes];
  }
};

const getLocalEpisodes = () => {
  return readLocalEpisodes();
};

const upsertEpisode = (episode: Episode) => {
  const episodes = readLocalEpisodes();
  const index = episodes.findIndex((item) => item.id === episode.id);
  const next = index >= 0 ? episodes.map((item) => (item.id === episode.id ? episode : item)) : [...episodes, episode];
  persistEpisodes(next);
  return episode;
};

const removeEpisode = (id: string) => {
  const episodes = readLocalEpisodes().filter((episode) => episode.id !== id);
  persistEpisodes(episodes);
};

const generateEpisodeCode = (institutionName?: string) => {
  const prefix = institutionName ? institutionName.slice(0, 4).toUpperCase() : "EPI";
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 12);
  return `${prefix}-${timestamp}`;
};

export const createEpisode = async (payload: CreateEpisodePayload) => {
  try {
    const response = await apiClient.post<{ ok?: boolean; data?: Episode; item?: Episode }>("/episodes", {
      patientId: payload.patientId,
      institutionId: payload.institutionId,
      professionalId: payload.professionalId,
      titulo: payload.titulo,
      notas: payload.notas,
    });

    if (response.status >= 200 && response.status < 300) {
      const createdEpisode = response.data?.data ?? response.data?.item ?? null;
      if (createdEpisode) {
        upsertEpisode(createdEpisode);
        return createdEpisode;
      }
    }
  } catch (error) {
    console.warn("No se pudo crear el episodio en la API, se usa almacenamiento local", error);
  }

  const now = new Date();
  const fallbackEpisode: Episode = {
    id: `epi-${Date.now()}`,
    codigo: generateEpisodeCode(payload.institutionName),
    titulo: payload.titulo,
    fechaAlta: now.toISOString(),
    paciente: payload.patientName ?? payload.patientId,
    profesional: payload.professionalName ?? payload.professionalId,
    institucion: payload.institutionName ?? payload.institutionId,
    estado: "CREADO",
    urgencia: payload.urgencia ?? "verde",
    notas: payload.notas,
    patientId: payload.patientId,
    professionalId: payload.professionalId,
    institutionId: payload.institutionId,
  };

  return upsertEpisode(fallbackEpisode);
};

export const updateEpisode = async (payload: UpdateEpisodePayload) => {
  try {
    const response = await apiClient.put<{ ok?: boolean; data?: Episode; item?: Episode }>(`/episodes/${payload.id}`, {
      titulo: payload.titulo,
      notas: payload.notas,
      estado: payload.estado,
      urgencia: payload.urgencia,
      profesionalId: payload.profesionalId,
    });

    if (response.status >= 200 && response.status < 300) {
      const updatedEpisode = response.data?.data ?? response.data?.item ?? null;
      if (updatedEpisode) {
        return upsertEpisode(updatedEpisode);
      }
    }
  } catch (error) {
    console.warn("No se pudo actualizar el episodio en la API, uso almacenamiento local", error);
  }

  const episodes = readLocalEpisodes();
  const existing = episodes.find((episode) => episode.id === payload.id);

  if (!existing) {
    throw new Error("No encontramos el episodio a actualizar");
  }

  const merged: Episode = {
    ...existing,
    titulo: payload.titulo ?? existing.titulo,
    estado: payload.estado ?? existing.estado,
    urgencia: payload.urgencia ?? existing.urgencia,
    profesional: payload.profesionalNombre ?? existing.profesional,
    professionalId: payload.profesionalId ?? existing.professionalId,
    notas: payload.notas ?? existing.notas,
    institucion: payload.institucion ?? existing.institucion,
  };

  return upsertEpisode(merged);
};

export const deleteEpisode = async ({ id }: DeleteEpisodePayload) => {
  try {
    const response = await apiClient.delete<{ ok?: boolean }>(`/episodes/${id}`);
    if (response.status >= 200 && response.status < 300) {
      removeEpisode(id);
      return true;
    }
  } catch (error) {
    console.warn("No se pudo borrar el episodio en la API, eliminando localmente", error);
  }

  removeEpisode(id);
  return true;
};
