import { apiClient } from "./client";

export interface DashboardMetrics {
  episodesByStatus: Array<{ status: string; count: number }>;
  averageTimes: {
    psychToDoctorHours: number;
    psychToDoctorSlaHours: number;
    orderToExtractionHours: number;
    orderToExtractionSlaHours: number;
    extractionToResultsHours: number;
    extractionToResultsSlaHours: number;
  };
  bypassPercentage: number;
  proposalsAcceptedPercentage: number;
  alerts: string[];
}

const mockMetrics: DashboardMetrics = {
  episodesByStatus: [
    { status: "Episodios abiertos", count: 24 },
    { status: "Episodios cerrados", count: 58 },
  ],
  averageTimes: {
    psychToDoctorHours: 36,
    psychToDoctorSlaHours: 48,
    orderToExtractionHours: 60,
    orderToExtractionSlaHours: 72,
    extractionToResultsHours: 96,
    extractionToResultsSlaHours: 120,
  },
  bypassPercentage: 42,
  proposalsAcceptedPercentage: 68,
  alerts: [
    "3 episodios exceden SLA Psicología → Médico (≥ 48h)",
    "2 episodios sin resultados luego de 5 días hábiles",
    "1 propuesta pendiente de envío",
  ],
};

export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  try {
    const response = await apiClient.get<{ ok: boolean; data: DashboardMetrics }>("/dashboard");
    if (response.data?.ok && response.data?.data) {
      return response.data.data;
    }
    return mockMetrics;
  } catch (error) {
    console.warn("Fallo al obtener métricas, se usan datos mock", error);
    return mockMetrics;
  }
};
