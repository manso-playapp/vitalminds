import { useQuery } from "@tanstack/react-query";
import { FiDownload, FiX, FiUpload, FiFileText, FiMoreVertical } from "react-icons/fi";
import { Episode, getEpisodeDocuments, EpisodeDocument, getEpisodeAssignments } from "../../../api/episodes";
import { useMemo } from "react";

interface EpisodeDetailDrawerProps {
  episode: Episode;
  onClose: () => void;
}

const documentLabel: Record<EpisodeDocument["tipo"], string> = {
  evaluacion: "Evaluación",
  pedido: "Pedido médico",
  resultado: "Resultado de laboratorio",
  informe: "Informe integrado",
};

export const EpisodeDetailDrawer = ({ episode, onClose }: EpisodeDetailDrawerProps) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["episode-documents", episode.id],
    queryFn: () => getEpisodeDocuments(episode.id),
  });
  const { data: assignmentsData } = useQuery({
    queryKey: ["episode-assignments", episode.id],
    queryFn: () => getEpisodeAssignments(episode.id),
  });

  const documents = useMemo(() => data ?? [], [data]);
  const sortedDocuments = useMemo(() => {
    return [...documents].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [documents]);

  const assignments = useMemo(() => assignmentsData ?? [], [assignmentsData]);
  const sortedAssignments = useMemo(
    () =>
      [...assignments].sort(
        (a, b) => new Date(b.fechaAsignacion).getTime() - new Date(a.fechaAsignacion).getTime(),
      ),
    [assignments],
  );

  const currentAssignment = sortedAssignments[0];
  const previousAssignments = sortedAssignments.slice(1);

  const currentProfessionalName = currentAssignment?.profesionalNombre ?? episode.profesional;
  const previousProfessionalNames = useMemo(() => {
    const unique = new Set<string>();
    previousAssignments.forEach((assignment) => {
      if (assignment.profesionalNombre && assignment.profesionalNombre !== currentProfessionalName) {
        unique.add(assignment.profesionalNombre);
      }
    });
    return Array.from(unique);
  }, [previousAssignments, currentProfessionalName]);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="hidden flex-1 bg-black/30 md:block" onClick={onClose} />
      <div className="relative h-full w-full max-w-3xl bg-white shadow-2xl md:ml-auto">
        <header className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">{episode.codigo}</p>
            <h3 className="text-xl font-semibold text-slate-900">{episode.titulo}</h3>
            <p className="text-sm text-muted">Paciente: {episode.paciente}</p>
          </div>
          <button
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-primary hover:text-primary"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <FiX className="text-lg" />
          </button>
        </header>

        <div className="flex flex-col gap-4 px-6 py-5">
          <section className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <h4 className="text-sm font-semibold text-slate-800">Profesionales que intervinieron</h4>
            <p className="text-xs text-muted">
              Muestra el historial de derivaciones (quién derivó a quién). Cuando la API real esté conectada, esta lista
              se alimentará del endpoint GET /episodes/{"{id}"}/assignments.
            </p>
            {sortedAssignments.length === 0 ? (
              <p className="py-3 text-xs text-muted">No hay derivaciones registradas para este episodio.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {sortedAssignments.map((assignment, index) => (
                  <li key={assignment.id} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {assignment.profesionalNombre} <span className="text-xs text-muted">({assignment.rol})</span>
                        </p>
                        <p className="text-xs text-muted">
                          Asignado el {new Date(assignment.fechaAsignacion).toLocaleString()}
                          {assignment.asignadoPorNombre && (
                            <>
                              {" "}
                              por <span className="font-medium text-slate-700">{assignment.asignadoPorNombre}</span>
                            </>
                          )}
                          {assignment.fechaFinalizacion && (
                            <> · finalizó {new Date(assignment.fechaFinalizacion).toLocaleString()}</>
                          )}
                        </p>
                      </div>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        #{index + 1}
                      </span>
                    </div>
                    {assignment.notas && (
                      <p className="mt-1 text-xs text-slate-600">Notas: {assignment.notas}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h4 className="text-lg font-semibold text-slate-800">Documentos</h4>
              <p className="text-xs text-muted">
                Visualizá los PDFs asociados al episodio y registrá la firma digital cuando corresponda.
              </p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-white px-4 py-2 text-sm font-medium text-primary shadow-sm transition hover:bg-primary hover:text-white">
              <FiUpload />
              Subir documento
            </button>
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-700">
            <p>
              <span className="font-semibold text-slate-900">Profesional actual: </span>
              {currentProfessionalName}
            </p>
            {previousProfessionalNames.length > 0 && (
              <p className="mt-1">
                Intervinieron previamente:{" "}
                <span className="font-medium text-slate-900">{previousProfessionalNames.join(", ")}</span>
              </p>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            Para carga real conectaremos la API de storage/firma. Esta vista muestra datos mock y el flujo esperado
            (subir PDF, firmar digitalmente, descargar, ver hash).
          </div>

          {isLoading ? (
            <div className="flex h-40 items-center justify-center text-muted">Cargando documentos...</div>
          ) : isError ? (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              No pudimos obtener los documentos del episodio. Se muestran datos de referencia.
            </div>
          ) : sortedDocuments.length === 0 ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-muted">
              Aún no se registraron documentos para este episodio.
            </div>
          ) : (
            <div className="space-y-3">
              {sortedDocuments.map((doc) => (
                <article
                  key={doc.id}
                  className="flex items-start justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                      <FiFileText />
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-slate-900">{doc.nombre}</h5>
                      <p className="text-xs text-muted">
                        {documentLabel[doc.tipo]} · {new Date(doc.fecha).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted">
                        {doc.firmado
                          ? `Firmado digitalmente por ${doc.firmadoPor ?? "profesional"}.`
                          : "Pendiente de firma digital."}
                        {doc.hash && <span className="ml-2 text-[10px] text-slate-400">Hash: {doc.hash}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-primary hover:text-primary"
                      onClick={() => window.open(doc.url, "_blank", "noopener")}
                    >
                      <FiDownload className="text-sm" />
                      Ver PDF
                    </button>
                    <button className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-primary hover:text-primary">
                      <FiMoreVertical />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
