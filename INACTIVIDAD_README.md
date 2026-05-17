# Sistema de Inactividad - Guía de Implementación

## Resumen

Se ha implementado un sistema completo de cierre automático de sesión por inactividad para Veterinaria Scarlet. Este sistema:

1. **Detecta inactividad** del usuario (mouse, teclado, scroll, touch)
2. **Muestra advertencia** 1 minuto antes del cierre automático
3. **Permite extender sesión** con un click
4. **Sincroniza entre pestañas** abiertas
5. **Limpia tokens** y redirige al login

## Configuración Rápida

### 1. Variables de Entorno

Copia `.env.local.example` a `.env.local`:

```bash
cp .env.local.example .env.local
```

Ajusta los tiempos de inactividad si es necesario:

```env
# Tiempo total de inactividad (default: 15 minutos)
NEXT_PUBLIC_SESSION_TIMEOUT_MS=900000

# Tiempo de advertencia (default: 1 minuto)
NEXT_PUBLIC_SESSION_WARNING_MS=60000
```

### 2. Verificar Integración

El sistema ya está integrado en `app/layout.tsx`:

```tsx
import SessionManager from "@/app/components/SessionManager";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Navbar />
        <SessionManager inactivityConfig={SESSION_CONFIG}>
          {children}
        </SessionManager>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
```

### 3. Probar

1. Inicia sesión en la aplicación
2. Espera 14 minutos sin interactuar
3. Debería aparecer el modal de advertencia
4. Haz click en "Continuar sesión" para extender
5. O espera 1 minuto más para ver el cierre automático

## Archivos Creados/Modificados

### Nuevos Archivos

| Archivo | Propósito |
|---------|-----------|
| `lib/hooks/useSessionInactivity.ts` | Hook principal con sincronización entre pestañas |
| `app/components/SessionInactivityWarning.tsx` | Modal de advertencia mejorado |
| `app/components/SessionManager.tsx` | Componente que integra todo |
| `app/api/auth/refresh/route.ts` | Endpoint para refresh de token |
| `.env.local.example` | Ejemplo de variables de entorno |
| `SEGURIDAD_INACTIVIDAD.md` | Documentación de seguridad |

### Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `app/layout.tsx` | Integración de SessionManager |
| `app/components/AuthGuard.tsx` | Limpieza de código obsoleto |
| `lib/session.ts` | Funciones mejoradas de limpieza |
| `lib/hooks/index.ts` | Exportación de nuevos hooks |

## Uso del Sistema

### Para Usuarios Finales

1. **Advertencia de Inactividad**:
   - Después de 14 minutos sin actividad, aparecerá un modal
   - El countdown muestra el tiempo restante (1 minuto)
   - Puedes "Continuar sesión" o "Cerrar sesión"

2. **Extender Sesión**:
   - Haz click en "Continuar sesión"
   - El timer se resetea a 15 minutos
   - Recibirás una notificación de confirmación

3. **Cierre Automático**:
   - Si no interactúas, la sesión se cierra automáticamente
   - Serás redirigido al login
   - Verás un mensaje explicativo

### Para Desarrolladores

#### Usar el Hook Directamente

```tsx
import { useSessionInactivity } from "@/lib/hooks";

function MiComponente() {
  const { isWarningShown, countdownMs, extendSession, hideWarning } = 
    useSessionInactivity({
      config: {
        inactivityTimeoutMs: 15 * 60 * 1000, // 15 minutos
        warningTimeMs: 60 * 1000, // 1 minuto
      },
      enabled: true,
      onLogout: () => {
        // Manejar logout
        console.log("Sesión cerrada por inactividad");
      },
      extendSession: async () => {
        // Lógica para extender sesión
        await fetch("/api/auth/refresh", { method: "POST" });
      },
    });

  return (
    <>
      {/* Contenido */}
      {isWarningShown && (
        <div className="modal">
          <p>Quedan {countdownMs / 1000} segundos</p>
          <button onClick={extendSession}>Extender</button>
        </div>
      )}
    </>
  );
}
```

#### Configuración Personalizada por Ruta

```tsx
// En una ruta específica que requiera más seguridad
<SessionManager
  inactivityConfig={{
    inactivityTimeoutMs: 5 * 60 * 1000, // 5 minutos
    warningTimeMs: 30 * 1000, // 30 segundos
  }}
  enabled={true}
>
  {children}
</SessionManager>
```

#### Deshabilitar en Rutas Públicas

El SessionManager ya está configurado para no interferir en rutas públicas. Si necesitas control adicional:

```tsx
import { usePathname } from "next/navigation";

function MiLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicRoute = pathname === "/login" || pathname === "/registro";

  return (
    <SessionManager enabled={!isPublicRoute}>
      {children}
    </SessionManager>
  );
}
```

## Sincronización entre Pestañas

El sistema usa `localStorage` para comunicar eventos:

### Eventos Broadcast

```typescript
// Cuando hay actividad en una pestaña
localStorage.setItem("session_inactivity", JSON.stringify({
  type: "activity",
  timestamp: Date.now(),
  tabId: "tab_123_abc"
}));

// Cuando se extiende sesión
localStorage.setItem("session_inactivity", JSON.stringify({
  type: "extend",
  timestamp: Date.now(),
  tabId: "tab_123_abc"
}));

// Cuando se cierra sesión
localStorage.setItem("session_inactivity", JSON.stringify({
  type: "logout",
  timestamp: Date.now(),
  tabId: "tab_123_abc"
}));
```

### Escuchar Eventos

```typescript
window.addEventListener("storage", (event) => {
  if (event.key === "session_inactivity" && event.newValue) {
    const message = JSON.parse(event.newValue);
    
    switch (message.type) {
      case "logout":
        // Cerrar sesión en esta pestaña también
        clearSession();
        router.push("/login");
        break;
      case "activity":
      case "extend":
        // Resetear timer local
        resetInactivityTimer();
        break;
    }
  }
});
```

## Manejo de Tokens JWT

### Flujo de Refresh

1. **Access Token Expira**:
   ```
   Request → 401 Unauthorized
   ```

2. **Frontend Intenta Refresh**:
   ```
   POST /api/auth/refresh
   Cookie: refresh_token=xxx
   ```

3. **Backend Valida y Devuelve Nuevo Token**:
   ```json
   { "access": "nuevo_access_token" }
   ```

4. **Frontend Actualiza Cookie**:
   ```
   Set-Cookie: access_token=nuevo_access_token; HttpOnly; ...
   ```

### Endpoint de Refresh

El endpoint `/api/auth/refresh` ya está implementado en `app/api/auth/refresh/route.ts`:

```typescript
export async function POST() {
  const refreshToken = await cookies().then(c => c.get("refresh_token")?.value);
  
  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  const res = await fetch(`${API_URL}/refresh/`, {
    method: "POST",
    body: JSON.stringify({ refresh: refreshToken }),
  });

  if (!res.ok) {
    // Limpiar cookies y retornar error
    return NextResponse.json({ error: "Invalid refresh" }, { status: 401 });
  }

  const { access, refresh } = await res.json();
  
  // Actualizar cookies
  cookieStore.set("access_token", access, { httpOnly: true, ... });
  if (refresh) {
    cookieStore.set("refresh_token", refresh, { httpOnly: true, ... });
  }

  return NextResponse.json({ success: true });
}
```

## Limpieza de Sesión

La función `clearSession()` en `lib/session.ts`:

```typescript
export function clearSession(): void {
  // 1. Limpiar sessionStorage
  sessionStorage.removeItem("user_me");
  
  // 2. Limpiar localStorage de sincronización
  localStorage.removeItem("session_inactivity");
  
  // 3. Limpiar cookies HttpOnly (vía API)
  navigator.sendBeacon("/api/auth/logout", new Blob([]));
  fetch("/api/auth/logout", { method: "POST", keepalive: true });
}
```

## Configuración de Producción

### Backend Django

Asegúrate de que `settings.py` tenga:

```python
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# CORS configurado correctamente
CORS_ALLOWED_ORIGINS = [
    "https://tudominio.com",
]
```

### Frontend Next.js

Variables de entorno en Vercel/producción:

```env
NEXT_PUBLIC_API_URL=https://api.tudominio.com/api
NEXT_PUBLIC_SESSION_TIMEOUT_MS=900000
NEXT_PUBLIC_SESSION_WARNING_MS=60000
```

### HTTPS Obligatorio

En producción, las cookies deben tener `Secure: true`:

```typescript
// En app/api/auth/login/route.ts
cookieStore.set("access_token", data.access, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // ✅
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24,
});
```

## Troubleshooting

### El Modal no Aparece

1. Verifica que `enabled={true}` en SessionManager
2. Revisa la consola por errores
3. Asegúrate de que los eventos se están detectando:
   ```javascript
   // En consola del navegador
   document.addEventListener("mousemove", () => console.log("activity"));
   ```

### La Sesión no se Extiende

1. Verifica que `/api/auth/refresh` existe y responde
2. Revisa que `refresh_token` está en las cookies
3. Comprueba que el backend Django está accesible

### Problemas entre Pestañas

1. Verifica que `localStorage` está habilitado
2. Revisa que no hay errores en el event listener de `storage`
3. Asegúrate de que las pestañas comparten el mismo origen

### Tokens no se Limpian

1. Verifica que `/api/auth/logout` existe
2. Revisa que `navigator.sendBeacon` funciona en el navegador
3. Comprueba que no hay errores de CORS

## Próximos Pasos Recomendados

1. **Implementar Token Blacklist en Django**:
   - Añadir `rest_framework_simplejwt.token_blacklist` a INSTALLED_APPS
   - Configurar `BLACKLIST_AFTER_ROTATION = True`

2. **Añadir Logging de Sesiones**:
   - Registrar eventos de login/logout/inactividad
   - Útil para auditoría y debugging

3. **Mejorar UX**:
   - Sonido de advertencia opcional
   - Contador de advertencias mostradas
   - Opción "No mostrar de nuevo" temporal

4. **Seguridad Adicional**:
   - Implementar 2FA
   - Añadir verificación de IP/user-agent
   - Limitar sesiones concurrentes

## Soporte

Para problemas o preguntas:
- Revisa `SEGURIDAD_INACTIVIDAD.md` para detalles de seguridad
- Consulta los archivos de código comentados
- Prueba en modo desarrollo con `npm run dev`