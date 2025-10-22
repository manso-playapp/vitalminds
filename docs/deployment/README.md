# Despliegue recomendado (Render + Vercel)

Este documento resume el flujo sugerido para alojar la API .NET + PostgreSQL en Render y el frontend React en Vercel. Con esta configuración mantienes costos bajos, conservas autenticación/roles reales y evitas tareas de infraestructura manual.

## 1. Preparar el repositorio

Antes de tocar servicios externos, deja listo el proyecto localmente:

1. Ubícate en la raíz del repo (donde está este archivo) y copia los archivos de ejemplo:
   ```bash
   cp .env.example .env
   cp src/Web/.env.example src/Web/.env
   ```
   Estos `.env` **no** se suben a Git; sólo viven en tu entorno o en los paneles de Render/Vercel.
2. Abre `.env` (backend) y reemplaza `JWT_SECRET` por una cadena aleatoria larga. Desde macOS/Linux puedes generar una con:
   ```bash
   openssl rand -hex 32
   ```
   El resto de variables (`POSTGRES_*`, `JWT_*`, etc.) las completarás con los datos de Render.
3. Abre `src/Web/.env` (frontend). Mientras trabajes localmente deja `VITE_API_BASE_URL=http://localhost:8080`. Cuando despliegues la API en Render, cambia ese valor por la URL pública que te entregue (ej. `https://vitalminds-api.onrender.com`).
4. Vérifica que la app corre en local con las nuevas variables:
   ```bash
   # Terminal 1
   pnpm -C src/Web dev
   # Terminal 2 (si usas Docker Compose)
   docker compose up api postgres
   ```
   Si todo carga correctamente en `http://localhost:5173`, ya puedes avanzar a Render/Vercel.

## 2. Render – Base de datos PostgreSQL

1. Crea una cuenta en [Render](https://render.com) y selecciona **New → PostgreSQL**.
2. Plan sugerido: **Hobby** (USD 7/mes) para evitar suspensión luego de 90 días. Define nombre (ej. `vitalminds-db`).
3. Copia los valores provistos por Render (host, usuario, password, database, puerto).
4. Crea un **Environment Group** en Render (opcional) o ten a mano los pares clave/valor:

   | Variable             | Valor de ejemplo (Render)             |
   | -------------------- | -------------------------------------- |
   | `POSTGRES_HOST`      | `oregon-postgres.render.com`           |
   | `POSTGRES_PORT`      | `5432`                                 |
   | `POSTGRES_DB`        | `vitalminds`                           |
   | `POSTGRES_USER`      | `vital_admin`                          |
   | `POSTGRES_PASSWORD`  | `***`                                  |

## 3. Render – Servicio API (.NET)

1. Desde la consola de Render: **New → Web Service**.
2. Conecta tu repositorio de GitHub y apunta a la carpeta raíz.
3. Ajustes principales:
   - **Runtime**: *Docker*
   - **Dockerfile path**: `src/Api/Dockerfile`
   - **Root Directory**: `.` (la raíz del repo)
   - **Port**: `8080`
   - **Plan**: *Starter* (USD 7/mes) o superior para evitar suspensión.
4. Variables de entorno requeridas (pegar las mismas del paso anterior). Puedes usar el string completo (`Internal Database URL`) o los campos individuales:

   | Variable              | Descripción                                           |
   | --------------------- | ----------------------------------------------------- |
   | `POSTGRES_CONNECTION_STRING` | Opcional. Pega el valor completo `postgresql://...` de Render |
   | `POSTGRES_HOST`       | Host de la DB en Render (si no usas `POSTGRES_CONNECTION_STRING`) |
   | `POSTGRES_PORT`       | Puerto de la DB                                       |
   | `POSTGRES_DB`         | Nombre de la base                                     |
   | `POSTGRES_USER`       | Usuario de la base                                    |
   | `POSTGRES_PASSWORD`   | Contraseña de la base                                 |
   | `POSTGRES_SSL_MODE`   | Usa `Require` en Render, `Disable` en local           |
   | `POSTGRES_TRUST_SERVER_CERTIFICATE` | Usa `true` en Render                    |
   | `JWT_SECRET`          | Clave secreta generada (mínimo 32 caracteres)         |
   | `JWT_ISSUER`          | Ej. `vitalminds`                                      |
   | `JWT_AUDIENCE`        | Ej. `vitalminds-api`                                  |
   | `WHATSAPP_STUB_ENABLED` | `true` mientras no haya integración real             |
5. Deploy inicial: Render construirá la imagen Docker, aplicará migraciones y ejecutará el seeder. Usuarios creados por defecto:

   | Rol            | Usuario                     | Password     |
   | -------------- | --------------------------- | ------------ |
   | Superadmin     | `admin@vitalminds.local`    | `Admin123!`  |
   | Institution    | `vital@institucion.local`   | `Institucion123!` |
   | Psicólogo      | `psico.demo@vitalminds.local` | `Psico123!` |
   | Médico         | `medico.demo@vitalminds.local` | `Medico123!` |
   | Extraccionista | `extraccion@vitalminds.local` | `Extra123!` |
   | Laboratorio    | `lab@vitalminds.local`      | `Lab12345!`  |

6. Comprueba que el endpoint `/health` responda `200 OK` y que la documentación `/swagger` sea accesible (Render necesita que habilites manualmente “Public” en Settings → Environment si quieres compartir Swagger).

## 4. Vercel – Frontend React

1. Crea una cuenta en [Vercel](https://vercel.com) y elige **New Project**.
2. Importa el repositorio, selecciona la carpeta `src/Web`.
3. Ajustes sugeridos:
   - **Framework Preset**: *Vite*
   - **Build Command**: `pnpm build`
   - **Install Command**: `pnpm install`
   - **Output Directory**: `dist`
4. Variable de entorno:
   - `VITE_API_BASE_URL` = URL pública del servicio Render (ej. `https://vitalminds-api.onrender.com`)
5. Realiza el primer deploy. Vercel genera una URL por rama; cuando publiques a `main`, obtendrás la URL final con HTTPS.

## 5. Pruebas finales

1. Ingresa a la URL de Vercel, inicia sesión con `admin@vitalminds.local / Admin123!`.
2. Navega con otros usuarios para verificar restricciones por rol.
3. Valida que se guardan episodios/pacientes y que los datos persisten tras recargar (la API apunta al Postgres gestionado).
4. Configura backups automáticos en Render (DB → Backups) y revisa los logs de la API tras cada deploy.

## 6. Mantenimiento y futuros ajustes

- Si más adelante deseas un dominio propio, puedes apuntarlo a Vercel (frontend) y crear un subdominio para la API en Render usando un CNAME.
- Para entornos de prueba, duplica la base en Render y usa otra rama con variables `VITE_API_BASE_URL` distintas.
- Cuando integres un servicio real de WhatsApp/email, actualiza `WHATSAPP_STUB_ENABLED` a `false` y configura los proveedores necesarios.

Con este flujo podrás desplegar rápidamente, validar autorizaciones por rol y escalar sin administrar servidores manualmente.
