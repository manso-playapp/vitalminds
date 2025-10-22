import { apiClient } from "./client";

export interface Patient {
  id: string;
  dni: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email?: string;
  prepaga?: string;
  consentimiento: boolean;
  createdAt?: string;
}

export interface PatientsResponse {
  items: Patient[];
  total: number;
}

const seedPatients: PatientsResponse = {
  items: [
    {
      id: "mock-1",
      dni: "30123456",
      nombre: "María",
      apellido: "Gutiérrez",
      telefono: "+54 9 11 5555 0001",
      email: "maria@example.com",
      prepaga: "OSDE",
      consentimiento: true,
    },
    {
      id: "mock-2",
      dni: "32876543",
      nombre: "Javier",
      apellido: "Manso",
      telefono: "+54 9 11 5555 0002",
      email: "javier@example.com",
      prepaga: "Swiss Medical",
      consentimiento: true,
    },
  ],
  total: 2,
};

const STORAGE_KEY = "vitalminds:patients";
let runtimePatients: PatientsResponse = { items: [...seedPatients.items], total: seedPatients.total };

const persistPatients = (patients: PatientsResponse) => {
  runtimePatients = {
    items: [...patients.items],
    total: patients.items.length,
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(runtimePatients));
  }
};

const readLocalPatients = (): PatientsResponse => {
  if (typeof window === "undefined") {
    return { items: [...runtimePatients.items], total: runtimePatients.total };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      persistPatients(runtimePatients);
      return { items: [...runtimePatients.items], total: runtimePatients.total };
    }

    const parsed = JSON.parse(raw) as PatientsResponse;
    if (!parsed?.items || !Array.isArray(parsed.items) || parsed.items.length === 0) {
      persistPatients(runtimePatients);
      return { items: [...runtimePatients.items], total: runtimePatients.total };
    }

    runtimePatients = {
      items: [...parsed.items],
      total: parsed.items.length,
    };
    return { items: [...runtimePatients.items], total: runtimePatients.total };
  } catch (error) {
    console.warn("No se pudieron leer pacientes locales, uso memoria", error);
    return { items: [...runtimePatients.items], total: runtimePatients.total };
  }
};

const filterPatients = (search?: string): PatientsResponse => {
  const source = readLocalPatients();
  if (!search) {
    return source;
  }

  const normalizedSearch = search.trim().toLowerCase();
  const filteredItems = source.items.filter((patient) => {
    const fullName = `${patient.nombre} ${patient.apellido}`.toLowerCase();
    return (
      patient.dni.toLowerCase().includes(normalizedSearch) ||
      fullName.includes(normalizedSearch) ||
      (patient.email?.toLowerCase().includes(normalizedSearch) ?? false)
    );
  });

  return {
    items: filteredItems,
    total: filteredItems.length,
  };
};

const upsertLocalPatient = (patient: Patient) => {
  const current = readLocalPatients();
  const index = current.items.findIndex((item) => item.id === patient.id);
  const nextItems =
    index >= 0 ? current.items.map((item) => (item.id === patient.id ? patient : item)) : [...current.items, patient];
  persistPatients({ items: nextItems, total: nextItems.length });
  return patient;
};

export const getPatients = async (search?: string): Promise<PatientsResponse> => {
  try {
    const response = await apiClient.get<{ ok?: boolean; data?: PatientsResponse; items?: Patient[] }>(
      "/patients",
      {
        params: {
          search,
        },
      },
    );

    if (Array.isArray(response.data?.items) && response.data.items.length > 0) {
      const normalized = { items: response.data.items, total: response.data.items.length };
      persistPatients(normalized);
      return search ? filterPatients(search) : normalized;
    }

    if (response.data?.data?.items && response.data.data.items.length > 0) {
      persistPatients(response.data.data);
      return search ? filterPatients(search) : response.data.data;
    }

    return filterPatients(search);
  } catch (error) {
    console.warn("Fallo al obtener pacientes, uso datos locales", error);
    return filterPatients(search);
  }
};

export interface CreatePatientPayload {
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  email?: string;
  prepaga?: string;
  consentimiento: boolean;
}

export const createPatient = async (payload: CreatePatientPayload): Promise<Patient> => {
  try {
    const response = await apiClient.post<{ ok?: boolean; data?: Patient; item?: Patient }>("/patients", {
      nombre: payload.nombre,
      apellido: payload.apellido,
      dni: payload.dni,
      telefono: payload.telefono,
      email: payload.email,
      prepaga: payload.prepaga,
      consentimiento: payload.consentimiento,
    });

    if (response.status >= 200 && response.status < 300) {
      const remotePatient = response.data?.data ?? response.data?.item ?? null;
      if (remotePatient) {
        return upsertLocalPatient(remotePatient);
      }
    }
  } catch (error) {
    console.warn("Fallo al crear paciente en la API, uso almacenamiento local", error);
  }

  const fallbackPatient: Patient = {
    id: `mock-${Date.now()}`,
    nombre: payload.nombre,
    apellido: payload.apellido,
    dni: payload.dni,
    telefono: payload.telefono,
    email: payload.email,
    prepaga: payload.prepaga,
    consentimiento: payload.consentimiento,
    createdAt: new Date().toISOString(),
  };

  return upsertLocalPatient(fallbackPatient);
};
