import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardMetrics } from "../../api/dashboard";
import { downloadCsv } from "../../utils/export-csv";
import { usePageHeader } from "../../shared/page-header";

export const DashboardPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: getDashboardMetrics,
    staleTime: 60_000,
  });
  const { setConfig } = usePageHeader();

  const episodesOpen = data?.episodesByStatus.find((item) => item.status === "Episodios abiertos")?.count ?? 0;
  const psychToDoctorHours = data?.averageTimes.psychToDoctorHours ?? 0;
  const psychToDoctorSlaHours = data?.averageTimes.psychToDoctorSlaHours ?? 0;
  const alertsCount = data?.alerts.length ?? 0;

  useEffect(() => {
    const loading = isLoading && !data;
    setConfig({
      title: "Dashboard",
      subtitle: "Estado general de episodios y compromisos operativos",
      highlights: [
        {
          label: "Episodios abiertos",
          value: loading ? "Cargando..." : String(episodesOpen),
          helper: loading ? undefined : isError ? "Datos de referencia" : "Datos en vivo",
        },
        {
          label: "Psico → Médico",
          value: loading ? "Cargando..." : `${psychToDoctorHours}h`,
          helper: loading ? undefined : `SLA objetivo ${psychToDoctorSlaHours}h`,
        },
        {
          label: "Alertas activas",
          value: loading ? "Cargando..." : String(alertsCount),
          helper: loading
            ? undefined
            : alertsCount === 0
              ? "Sin alertas en este momento"
              : "Revisá la sección de SLA y alertas",
        },
      ],
    });
  }, [alertsCount, data, episodesOpen, isError, isLoading, psychToDoctorHours, psychToDoctorSlaHours, setConfig]);

  const cards = [
    {
      title: "Episodios abiertos",
      value: data?.episodesByStatus.find((item) => item.status === "Episodios abiertos")?.count ?? 0,
      subtext: "vs semana pasada",
    },
    {
      title: "Tiempo promedio Psicología → Médico",
      value: `${data?.averageTimes.psychToDoctorHours ?? 0}h`,
      subtext: `Objetivo ≤ ${data?.averageTimes.psychToDoctorSlaHours ?? 0}h`,
    },
    {
      title: "% BYPASS",
      value: `${data?.bypassPercentage ?? 0}%`,
      subtext: "Calculado sobre episodios activos",
    },
    {
      title: "Propuestas aceptadas",
      value: `${data?.proposalsAcceptedPercentage ?? 0}%`,
      subtext: "Últimos 30 días",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-muted">
        Cargando métricas en vivo...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 px-6 py-8 text-sm text-amber-700">
        No pudimos obtener las métricas en vivo. Se muestran datos de referencia. Verifica la conexión con la API.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Resumen operativo</h2>
          <button
            onClick={() => exportMetricsCsv(data)}
            className="w-full sm:w-auto rounded-lg border border-primary/30 bg-white px-4 py-2 text-sm font-medium text-primary shadow-sm transition hover:bg-primary hover:text-white"
          >
            Exportar CSV
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div key={card.title} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <span className="text-sm text-muted">{card.title}</span>
              <div className="text-2xl font-semibold mt-2">{card.value}</div>
              <span className="text-xs text-slate-500">{card.subtext}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h3 className="font-semibold text-slate-800 mb-3">Embudo por fase</h3>
          <p className="text-sm text-muted">
            Pronto mostraremos una visual embebida con datos en tiempo real. Episodios por estado:
          </p>
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            {data.episodesByStatus.map((item) => (
              <li key={item.status} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                <span>{item.status}</span>
                <span className="font-semibold text-slate-900">{item.count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h3 className="font-semibold text-slate-800 mb-3">SLA y alertas</h3>
          {data.alerts.length === 0 ? (
            <p className="text-sm text-emerald-600">Sin alertas activas. Todos los SLAs se cumplen.</p>
          ) : (
            <ul className="text-sm text-muted list-disc list-inside space-y-2">
              {data.alerts.map((alert) => (
                <li key={alert}>{alert}</li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
);
};

const exportMetricsCsv = (metrics: Awaited<ReturnType<typeof getDashboardMetrics>>) => {
  const headers = ["Métrica", "Valor"];
  const rows: string[][] = [
    ["Episodios abiertos", String(metrics.episodesByStatus.find((item) => item.status === "Episodios abiertos")?.count ?? 0)],
    ["% BYPASS", `${metrics.bypassPercentage}%`],
    ["% Propuestas aceptadas", `${metrics.proposalsAcceptedPercentage}%`],
    ["Tiempo Psicología → Médico (h)", String(metrics.averageTimes.psychToDoctorHours)],
    ["SLA Psicología → Médico (h)", String(metrics.averageTimes.psychToDoctorSlaHours)],
    ["Tiempo Pedido → Extracción (h)", String(metrics.averageTimes.orderToExtractionHours)],
    ["SLA Pedido → Extracción (h)", String(metrics.averageTimes.orderToExtractionSlaHours)],
    ["Tiempo Extracción → Resultados (h)", String(metrics.averageTimes.extractionToResultsHours)],
    ["SLA Extracción → Resultados (h)", String(metrics.averageTimes.extractionToResultsSlaHours)],
  ];
  metrics.alerts.forEach((alert, index) => {
    rows.push([`Alerta ${index + 1}`, alert]);
  });

  downloadCsv(`vitalminds-dashboard-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
};
