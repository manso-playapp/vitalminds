using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using VitalMinds.Clinic.Api.Domain.Entities;

namespace VitalMinds.Clinic.Api.Infrastructure.Services;

public class PdfService
{
    public async Task<string> GenerateMedicalOrderAsync(Episode episode, MedicalOrder order, string outputDirectory)
    {
        Directory.CreateDirectory(outputDirectory);
        var filePath = Path.Combine(outputDirectory, $"pedido-medico-{episode.Id}-{DateTime.UtcNow:yyyyMMddHHmmss}.pdf");

        await Task.Run(() =>
        {
            Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Margin(40);
                    page.Size(PageSizes.A4);
                    page.DefaultTextStyle(x => x.FontSize(12));

                    page.Header().Text("Pedido Médico VitalMinds Clinic").SemiBold().FontSize(18);

                    page.Content().Column(col =>
                    {
                        col.Item().Text($"Paciente: {episode.Patient.Apellido}, {episode.Patient.Nombre}");
                        col.Item().Text($"Institución: {episode.Institution.Nombre}");
                        col.Item().Text($"Profesional: {order.Firmante.Nombre} {order.Firmante.Apellido}");
                        col.Item().LineHorizontal(1);

                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.ConstantColumn(120);
                                columns.RelativeColumn();
                                columns.ConstantColumn(120);
                            });

                            table.Header(header =>
                            {
                                header.Cell().Text("Código").SemiBold();
                                header.Cell().Text("Nombre").SemiBold();
                                header.Cell().Text("Valor (ARS)").SemiBold();
                            });

                            foreach (var item in order.Items)
                            {
                                table.Cell().Text(item.Codigo);
                                table.Cell().Text($"{item.Nombre} ({item.Complejidad})");
                                table.Cell().Text(item.ValorArs.ToString("C"));
                            }
                        });
                    });

                    page.Footer().AlignRight().Text($"Generado el {DateTime.UtcNow:dd/MM/yyyy HH:mm} UTC");
                });
            }).GeneratePdf(filePath);
        });

        return filePath;
    }

    public async Task<string> GenerateIntegratedReportAsync(Episode episode, IntegratedReport report, string outputDirectory)
    {
        Directory.CreateDirectory(outputDirectory);
        var filePath = Path.Combine(outputDirectory, $"informe-integrado-{episode.Id}-{DateTime.UtcNow:yyyyMMddHHmmss}.pdf");

        await Task.Run(() =>
        {
            Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Margin(40);
                    page.Size(PageSizes.A4);
                    page.DefaultTextStyle(x => x.FontSize(12));
                    page.Header().Text($"Informe Integrado {episode.Institution.Nombre}").SemiBold().FontSize(18);
                    page.Content().Column(col =>
                    {
                        col.Item().Text($"Tipo de informe: {report.TipoInforme}");
                        col.Item().Text($"Paciente: {episode.Patient.Apellido}, {episode.Patient.Nombre}");
                        col.Item().Text($"Emitido por: {report.FirmadoPor.Nombre} {report.FirmadoPor.Apellido}");
                        col.Item().LineHorizontal(1);
                        col.Item().Text("Contenido del informe pendiente de definir.").Italic();
                    });
                });
            }).GeneratePdf(filePath);
        });

        return filePath;
    }
}
