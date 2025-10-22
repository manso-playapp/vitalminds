import { useEffect } from "react";
import { usePageHeader } from "../../shared/page-header";

export const SettingsPage = () => {
  const { setConfig } = usePageHeader();

  useEffect(() => {
    setConfig({
      title: "Parámetros",
      subtitle: "Configurá SLAs, catálogos y feature flags por institución.",
      highlights: [
        {
          label: "Módulos disponibles",
          value: "4",
          helper: "SLAs, estudios, motor BYPASS y plantillas",
        },
        {
          label: "Feature flags",
          value: "2",
          helper: "WhatsApp y HL7/FHIR",
        },
        {
          label: "Última actualización",
          value: "—",
          helper: "Sincronizá al conectar la API",
        },
      ],
    });
  }, [setConfig]);

  return (
    <section className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <p className="text-sm text-muted">
          Mostraremos secciones por módulo para editar JSON estructurado con validaciones hint y vista previa de plantillas.
        </p>
        <p className="text-sm text-muted">
          También habilitaremos feature flags para WhatsApp y HL7/FHIR directamente desde esta sección.
        </p>
      </div>
    </section>
  );
};
