# Veterinaria Scarlet — Frontend

Aplicación web para gestión clínica veterinaria. Fichas clínicas, vacunas, tratamientos, citas y documentos.

## Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS v4
- Sonner (notificaciones)
- Supabase (almacenamiento de archivos)
- React Big Calendar (agenda de citas)
- Vercel (deployment)

## Levantar en local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.local.example .env.local  # editar con tus valores

# 3. Levantar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL base del backend Django |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anon de Supabase |

Ejemplo `.env.local`:
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

## Estructura de rutas

```
/                   → Landing page (pública)
/login              → Inicio de sesión
/dashboard          → Panel principal
/pacientes          → Lista de pacientes
/pacientes/[id]     → Detalle: vacunas, fichas, citas, tratamientos
/fichas             → Lista de fichas clínicas
/fichas/nueva       → Nueva ficha (formulario completo)
/fichas/[id]        → Detalle de ficha
/fichas/[id]/editar → Editar ficha
/citas              → Lista de citas
/citas/nueva        → Nueva cita (formulario directo)
/citas/calendario   → Vista de calendario con drag & drop
/tutores            → Lista y gestión de tutores
/alertas            → Vacunas vencidas y tratamientos activos
/vacunas/nueva      → Registrar vacuna
/tratamientos/nuevo → Registrar tratamiento
/archivos/nuevo     → Subir documento
/configuracion      → Mantenedores (solo admin)
```

## Autenticación

JWT almacenado en `sessionStorage`. El `AuthGuard` valida el token en cada navegación y renueva automáticamente usando el refresh token. Al cerrar el navegador la sesión expira.

## Roles

- **admin** — acceso completo incluyendo `/configuracion`
- **veterinario** — acceso clínico completo, sin configuración

El rol se obtiene del endpoint `/api/me/` y se cachea en `sessionStorage`.

## Componentes reutilizables

| Componente | Uso |
|---|---|
| `BackButton` | Botón de volver con flecha |
| `ConfirmDialog` | Modal de confirmación (reemplaza `confirm()`) |
| `PageSkeleton` | Skeleton animado para estados de carga |
| `AuthGuard` | Protección de rutas + refresh de token |
| `Navbar` | Navegación con nombre de usuario y rol |

## Cliente HTTP

`lib/api.ts` — wrapper de `fetch` con:
- Header `Authorization` automático
- Refresh de token si recibe 401
- Redirección a `/login` si el refresh falla

```ts
import { apiFetch } from "@/lib/api";
const res = await apiFetch("/pacientes/");
```

## Configurar dominio propio en Vercel

Sigue estos pasos para conectar un dominio personalizado al frontend desplegado en Vercel:

1. **Añadir el dominio en el panel de Vercel**
   - Ve a tu proyecto en [vercel.com](https://vercel.com) → pestaña **Settings** → sección **Domains**.
   - Haz clic en **Add** e ingresa tu dominio (p. ej. `mivetapp.com` o `www.mivetapp.com`).
   - Vercel te mostrará los registros DNS que debes configurar en tu proveedor (normalmente un registro `A` o `CNAME`). Una vez propagados, Vercel emite el certificado TLS automáticamente.

2. **Actualizar `NEXT_PUBLIC_API_URL`**
   - En el panel de Vercel → **Settings** → **Environment Variables**, actualiza `NEXT_PUBLIC_API_URL` con la URL de producción del backend:
     ```
     NEXT_PUBLIC_API_URL=https://api.mivetapp.com/api
     ```
   - Asegúrate de que la variable esté configurada para el entorno **Production** (y opcionalmente Preview).

3. **Redeploy**
   - Después de guardar la variable de entorno, haz un nuevo deploy desde Vercel (o haz push a `main`) para que el cambio tome efecto. Las variables de entorno `NEXT_PUBLIC_*` se inyectan en tiempo de build, por lo que un redeploy es obligatorio.

4. **Verificar CORS en el backend**
   - Confirma que el dominio del frontend está incluido en la variable `CORS_ALLOWED_ORIGINS` del backend (ver instrucciones en `veterinaria-scarlet-backend/README.md`).

## Build y deployment

```bash
npm run build   # verificar que compila sin errores
npm run lint    # linting
```

El proyecto se despliega automáticamente en Vercel al hacer push a `main`.
