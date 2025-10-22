using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VitalMinds.Clinic.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddEpisodeAssignmentsAndDocuments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Documents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EpisodeId = table.Column<Guid>(type: "uuid", nullable: false),
                    Tipo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Nombre = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Version = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    PdfUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Hash = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    StorageProvider = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    SubidoPorUserId = table.Column<string>(type: "text", nullable: true),
                    SubidoPorProfessionalId = table.Column<Guid>(type: "uuid", nullable: true),
                    FechaSubida = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Firmado = table.Column<bool>(type: "boolean", nullable: false),
                    FirmadoPorUserId = table.Column<string>(type: "text", nullable: true),
                    FirmadoPorProfessionalId = table.Column<Guid>(type: "uuid", nullable: true),
                    FechaFirma = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Documents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Documents_AspNetUsers_FirmadoPorUserId",
                        column: x => x.FirmadoPorUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Documents_AspNetUsers_SubidoPorUserId",
                        column: x => x.SubidoPorUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Documents_Episodes_EpisodeId",
                        column: x => x.EpisodeId,
                        principalTable: "Episodes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Documents_Professionals_FirmadoPorProfessionalId",
                        column: x => x.FirmadoPorProfessionalId,
                        principalTable: "Professionals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Documents_Professionals_SubidoPorProfessionalId",
                        column: x => x.SubidoPorProfessionalId,
                        principalTable: "Professionals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "EpisodeAssignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EpisodeId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProfessionalId = table.Column<Guid>(type: "uuid", nullable: false),
                    AssignedByProfessionalId = table.Column<Guid>(type: "uuid", nullable: true),
                    Rol = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FechaAsignacion = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    FechaFinalizacion = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Notas = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EpisodeAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EpisodeAssignments_Episodes_EpisodeId",
                        column: x => x.EpisodeId,
                        principalTable: "Episodes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EpisodeAssignments_Professionals_AssignedByProfessionalId",
                        column: x => x.AssignedByProfessionalId,
                        principalTable: "Professionals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_EpisodeAssignments_Professionals_ProfessionalId",
                        column: x => x.ProfessionalId,
                        principalTable: "Professionals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DocumentSignatures",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EpisodeDocumentId = table.Column<Guid>(type: "uuid", nullable: false),
                    Proveedor = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Estado = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    HashDocumento = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    Motivo = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    FirmadoPorUserId = table.Column<string>(type: "text", nullable: true),
                    FirmadoPorProfessionalId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreadoEl = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    FirmadoEl = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentSignatures", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DocumentSignatures_AspNetUsers_FirmadoPorUserId",
                        column: x => x.FirmadoPorUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_DocumentSignatures_Documents_EpisodeDocumentId",
                        column: x => x.EpisodeDocumentId,
                        principalTable: "Documents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DocumentSignatures_Professionals_FirmadoPorProfessionalId",
                        column: x => x.FirmadoPorProfessionalId,
                        principalTable: "Professionals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Documents_EpisodeId",
                table: "Documents",
                column: "EpisodeId");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_FirmadoPorProfessionalId",
                table: "Documents",
                column: "FirmadoPorProfessionalId");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_FirmadoPorUserId",
                table: "Documents",
                column: "FirmadoPorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_SubidoPorProfessionalId",
                table: "Documents",
                column: "SubidoPorProfessionalId");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_SubidoPorUserId",
                table: "Documents",
                column: "SubidoPorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentSignatures_EpisodeDocumentId",
                table: "DocumentSignatures",
                column: "EpisodeDocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentSignatures_FirmadoPorProfessionalId",
                table: "DocumentSignatures",
                column: "FirmadoPorProfessionalId");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentSignatures_FirmadoPorUserId",
                table: "DocumentSignatures",
                column: "FirmadoPorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_EpisodeAssignments_AssignedByProfessionalId",
                table: "EpisodeAssignments",
                column: "AssignedByProfessionalId");

            migrationBuilder.CreateIndex(
                name: "IX_EpisodeAssignments_EpisodeId",
                table: "EpisodeAssignments",
                column: "EpisodeId");

            migrationBuilder.CreateIndex(
                name: "IX_EpisodeAssignments_ProfessionalId",
                table: "EpisodeAssignments",
                column: "ProfessionalId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DocumentSignatures");

            migrationBuilder.DropTable(
                name: "EpisodeAssignments");

            migrationBuilder.DropTable(
                name: "Documents");
        }
    }
}
