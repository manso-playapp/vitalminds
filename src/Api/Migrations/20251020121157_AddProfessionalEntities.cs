using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VitalMinds.Clinic.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddProfessionalEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Codigo",
                table: "Episodes",
                type: "character varying(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "FechaAlta",
                table: "Episodes",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<Guid>(
                name: "ProfessionalId",
                table: "Episodes",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Titulo",
                table: "Episodes",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Urgencia",
                table: "Episodes",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "ProfessionalId",
                table: "AspNetUsers",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Professionals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Nombre = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Apellido = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Especialidad = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Matricula = table.Column<string>(type: "text", nullable: false),
                    FechaAlta = table.Column<DateOnly>(type: "date", nullable: false),
                    Telefono = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Direccion = table.Column<string>(type: "text", nullable: true),
                    Activo = table.Column<bool>(type: "boolean", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Professionals", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "InstitutionProfessionals",
                columns: table => new
                {
                    InstitutionId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProfessionalId = table.Column<Guid>(type: "uuid", nullable: false),
                    FechaAlta = table.Column<DateOnly>(type: "date", nullable: false),
                    Activo = table.Column<bool>(type: "boolean", nullable: false),
                    Rol = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InstitutionProfessionals", x => new { x.InstitutionId, x.ProfessionalId });
                    table.ForeignKey(
                        name: "FK_InstitutionProfessionals_Institutions_InstitutionId",
                        column: x => x.InstitutionId,
                        principalTable: "Institutions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_InstitutionProfessionals_Professionals_ProfessionalId",
                        column: x => x.ProfessionalId,
                        principalTable: "Professionals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Episodes_Codigo",
                table: "Episodes",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Episodes_ProfessionalId",
                table: "Episodes",
                column: "ProfessionalId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_ProfessionalId",
                table: "AspNetUsers",
                column: "ProfessionalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InstitutionProfessionals_ProfessionalId",
                table: "InstitutionProfessionals",
                column: "ProfessionalId");

            migrationBuilder.CreateIndex(
                name: "IX_Professionals_Email",
                table: "Professionals",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Professionals_Matricula",
                table: "Professionals",
                column: "Matricula",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUsers_Professionals_ProfessionalId",
                table: "AspNetUsers",
                column: "ProfessionalId",
                principalTable: "Professionals",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Episodes_Professionals_ProfessionalId",
                table: "Episodes",
                column: "ProfessionalId",
                principalTable: "Professionals",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUsers_Professionals_ProfessionalId",
                table: "AspNetUsers");

            migrationBuilder.DropForeignKey(
                name: "FK_Episodes_Professionals_ProfessionalId",
                table: "Episodes");

            migrationBuilder.DropTable(
                name: "InstitutionProfessionals");

            migrationBuilder.DropTable(
                name: "Professionals");

            migrationBuilder.DropIndex(
                name: "IX_Episodes_Codigo",
                table: "Episodes");

            migrationBuilder.DropIndex(
                name: "IX_Episodes_ProfessionalId",
                table: "Episodes");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_ProfessionalId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "Codigo",
                table: "Episodes");

            migrationBuilder.DropColumn(
                name: "FechaAlta",
                table: "Episodes");

            migrationBuilder.DropColumn(
                name: "ProfessionalId",
                table: "Episodes");

            migrationBuilder.DropColumn(
                name: "Titulo",
                table: "Episodes");

            migrationBuilder.DropColumn(
                name: "Urgencia",
                table: "Episodes");

            migrationBuilder.DropColumn(
                name: "ProfessionalId",
                table: "AspNetUsers");
        }
    }
}
