# Sistema de Cierre Automático de Sesión por Inactividad

## Descripción General

Este documento describe la implementación del sistema de cierre automático de sesión por inactividad en Veterinaria Scarlet, así como los riesgos de seguridad asociados y las medidas de mitigación.

## Características Implementadas

### 1. Detección de Inactividad

El sistema detecta los siguientes eventos como actividad del usuario:
- Movimiento del mouse (`mousemove`, `mousedown`)
- Clicks (`click`)
- Teclado (`keydown`, `keyup`, `keypress`)
- Scroll (`scroll`, `wheel`)
- Touch (`touchstart`, `touchmove`)

### 2. Flujo de Inactividad

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Actividad del Usuario                        │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Reset del Timer de Inactividad                   │
│                  (Se reinicia el contador a 15 min)                 │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                     ┌─────────────────────────────┐
                     │    ¿15 min sin actividad?   │
                     └─────────────────────────────┘
                                   │
                          ┌────────┴────────┐
                          │                 │
                         NO               SÍ
                          │                 │
                          ▼                 ▼
                   ┌──────────┐   ┌─────────────────────────────┐
                   │ Esperar  │   │  Mostrar Advertencia        │
                   │ Actividad│   │  "Sesión expira en 1 min"   │
                   └──────────┘   └─────────────────────────────┘
                                           │
                                           ▼
                                 ┌─────────────────────────────┐
                                 │    ¿Usuario interactúa?     │
                                 └─────────────────────────────┘
                                           │
                                  ┌────────┴────────┐
                                  │                 │
                                 SÍ                NO
                                  │                 │
                                  ▼                 ▼
                        ┌─────────────────┐  ┌─────────────────────┐
                        │  Extender       │  │ Cerrar Sesión       │
                        │  Sesión         │  │ - Limpiar tokens    │
                        │  (Refresh JWT)  │  │ - Redirigir login   │
                        └─────────────────┘  └─────────────────────┘
```

### 3. Sincronización entre Pestañas

El sistema utiliza `localStorage` para comunicar eventos entre pestañas abiertas:

- **Activity**: Cuando una pestaña detecta actividad, notifica a las demás
- **Extend**: Cuando un usuario extiende sesión, todas las pestañas resetean timers
- **Logout**: Cuando una pestaña cierra sesión, todas las demás también cierran

### 4. Configuración

Las variables de entorno controlan el comportamiento:

| Variable | Default | Descripción |
|----------|---------|-------------|
| `NEXT_PUBLIC_SESSION_TIMEOUT_MS` | 900000 (15 min) | Tiempo total de inactividad |
| `NEXT_PUBLIC_SESSION_WARNING_MS` | 60000 (1 min) | Tiempo de advertencia |

## Arquitectura Técnica

### Componentes

1. **`useSessionInactivity` Hook** (`lib/hooks/useSessionInactivity.ts`)
   - Core del sistema de detección de inactividad
   - Gestiona timers y eventos
   - Sincroniza entre pestañas vía localStorage

2. **`SessionInactivityWarning` Component** (`app/components/SessionInactivityWarning.tsx`)
   - Modal de advertencia con countdown
   - Botones para extender o cerrar sesión

3. **`SessionManager` Component** (`app/components/SessionManager.tsx`)
   - Integra hook + componente de advertencia
   - Maneja refresh de token
   - Gestiona logout y redirección

4. **Endpoint `/api/auth/refresh`** (`app/api/auth/refresh/route.ts`)
   - Refresh de JWT usando refresh_token de cookies HttpOnly
   - Actualiza access_token en cookies

### Flujo de Tokens

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Login Inicial                               │
│                    (username + password)                            │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Backend Django devuelve:                         │
│                  - access_token (1 hora validez)                    │
│                  - refresh_token (7 días validez)                   │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Next.js guarda en cookies HttpOnly:                    │
│                  - access_token (path=/)                            │
│                  - refresh_token (path=/)                           │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Cookies NO son accesibles por JavaScript               │
│              (protección contra XSS)                                │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│         Cada petición incluye cookies automáticamente               │
│         Django valida access_token en cada request                 │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Si access_token expira (401):                          │
│         1. Frontend llama a /api/auth/refresh                      │
│         2. Backend valida refresh_token                            │
│         3. Devuelve nuevo access_token                             │
│         4. Frontend actualiza cookie                               │
└─────────────────────────────────────────────────────────────────────┘
```

## Riesgos de Seguridad y Mitigaciones

### 1. Tokens en Cookies HttpOnly ✅ MITIGADO

**Riesgo**: Tokens JWT almacenados en localStorage/sessionStorage son vulnerables a XSS.

**Mitigación**: 
- Tokens almacenados en cookies HttpOnly
- Cookies configuradas con `SameSite=Lax` y `Secure` (en producción)
- No accesibles desde JavaScript

### 2. Session Fixation ✅ MITIGADO

**Riesgo**: Atacante podría forzar una sesión conocida.

**Mitigación**:
- JWT genera tokens únicos por sesión
- Refresh token rota con cada refresh (si el backend lo configura)
- Logout invalida ambas partes (frontend + backend)

### 3. CSRF (Cross-Site Request Forgery) ✅ MITIGADO PARCIALMENTE

**Riesgo**: Sitios maliciosos podrían hacer peticiones en nombre del usuario.

**Mitigación**:
- Cookie `SameSite=Lax` previene la mayoría de ataques CSRF
- Django CSRF middleware activo
- **Recomendación**: Considerar `SameSite=Strict` para mayor seguridad

### 4. Timeout de Inactividad ✅ IMPLEMENTADO

**Riesgo**: Sesiones abiertas en computadoras públicas/compartidas.

**Mitigación**:
- Cierre automático después de 15 minutos de inactividad
- Advertencia 1 minuto antes del cierre
- Opción de extender sesión manualmente

### 5. Múltiples Pestañas ✅ IMPLEMENTADO

**Riesgo**: Inconsistencia entre pestañas, sesión activa en una pero cerrada en otra.

**Mitigación**:
- Sincronización vía localStorage events
- Logout en una pestaña cierra todas
- Actividad en una pestaña resetea timers en todas

### 6. Token Expirado Durante Uso ✅ MITIGADO

**Riesgo**: Token expira mientras usuario está activo.

**Mitigación**:
- Sistema de refresh automático con refresh_token
- Si refresh falla, se fuerza logout
- Access token de 1 hora es suficiente para uso normal

### 7. Logout Incompleto ⚠️ ATENCIÓN

**Riesgo**: Logout no limpia todas las cookies en todos los navegadores.

**Mitigación**:
- Uso de `navigator.sendBeacon()` para asegurar petición de logout
- También se usa `fetch()` con `keepalive: true`
- Limpieza de sessionStorage y localStorage local

### 8. Falta de Invalidación en Backend ⚠️ RECOMENDACIÓN

**Riesgo**: JWT no se invalida en backend hasta expiración natural.

**Situación Actual**:
- Django SimpleJWT no tiene blacklist por defecto
- Refresh tokens podrían seguir siendo válidos después de logout

**Recomendaciones**:
1. Habilitar `BLACKLIST_AFTER_ROTATION` en Django SimpleJWT
2. Implementar token blacklist en backend
3. Considerar usar sesiones en servidor en lugar de JWT stateless

## Configuración Recomendada para Producción

### Backend Django (`settings.py`)

```python
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "AUTH_HEADER_TYPES": ("Bearer",),
    # Habilitar blacklist para invalidación de tokens
    "BLACKLIST_AFTER_ROTATION": True,
}

# Añadir a INSTALLED_APPS:
# 'rest_framework_simplejwt.token_blacklist'
```

### Frontend Next.js

```env
# Tiempos más estrictos para datos sensibles
NEXT_PUBLIC_SESSION_TIMEOUT_MS=900000    # 15 minutos
NEXT_PUBLIC_SESSION_WARNING_MS=60000     # 1 minuto

# En producción:
# - HTTPS obligatorio
# - Cookies con Secure flag
# - SameSite=Strict si es posible
```

## Consideraciones de UX

### 1. Advertencia Clara
- Modal visible con countdown
- Mensaje explicativo del motivo
- Dos opciones claras: extender o cerrar

### 2. Notificaciones
- Toast informativo al cerrar por inactividad
- Toast de confirmación al extender sesión

### 3. Redirección Suave
- Redirigir a login con parámetro `?reason=inactivity`
- Mostrar mensaje amigable en página de login

## Testing Recomendado

### Pruebas Manuales

1. **Test de timeout básico**:
   - Iniciar sesión
   - Esperar 15 minutos sin actividad
   - Verificar que aparece advertencia
   - Verificar cierre automático

2. **Test de extensión**:
   - Esperar advertencia
   - Click en "Continuar sesión"
   - Verificar que timer se resetea

3. **Test multi-pestaña**:
   - Abrir 2-3 pestañas
   - Actividad en una → todas resetean
   - Logout en una → todas cierran

4. **Test de refresh token**:
   - Esperar a que access_token expire (1 hora)
   - Hacer petición
   - Verificar refresh automático

### Pruebas Automatizadas

```typescript
// Ejemplo de test con Vitest
describe('Session Inactivity', () => {
  it('should show warning after inactivity timeout', async () => {
    // Simular paso de tiempo
    vi.advanceTimersByTime(14 * 60 * 1000); // 14 minutos
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    
    vi.advanceTimersByTime(1 * 60 * 1000); // 1 minuto más
    expect(screen.queryByRole('alertdialog')).toBeInTheDocument();
  });
});
```

## Conclusión

El sistema implementa un cierre automático de sesión robusto con:
- ✅ Detección multi-evento de actividad
- ✅ Sincronización entre pestañas
- ✅ Advertencia previa al cierre
- ✅ Extensión manual de sesión
- ✅ Limpieza completa de tokens
- ✅ Cookies HttpOnly seguras

**Riesgos residuales**:
- JWT no se invalida en backend (recomendar blacklist)
- Posibles edge cases con logout en navegadores antiguos

**Próximas mejoras recomendadas**:
1. Implementar token blacklist en Django
2. Añadir opción de "recordar dispositivo" para confiar en equipos conocidos
3. Implementar 2FA para mayor seguridad
4. Añadir logging de sesiones para auditoría