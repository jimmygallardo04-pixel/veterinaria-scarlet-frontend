import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtDecode } from "jwt-decode";

// Rutas que no requieren autenticación
const PUBLIC_ROUTES = ["/login", "/registro"];

/**
 * Proxy (middleware) server-side para autenticación.
 *
 * Responsabilidades:
 * - Valida tokens en HttpOnly cookies
 * - Auto-refresh si token expira en menos de 15 min
 * - Redirige a login si no autenticado
 * - Protege rutas privadas en SSR
 * - Redirige usuarios autenticados fuera de login/registro
 *
 * Nota: En Next.js 15+, usar proxy.ts en lugar de middleware.ts
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // No interceptar rutas de la API del BFF ni recursos estáticos
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/)
  ) {
    return NextResponse.next();
  }

  // Si se solicita logout (desde beforeunload)
  if (request.nextUrl.searchParams.get("action") === "logout") {
    const cleanUrl = new URL("/login", request.url);
    const response = NextResponse.redirect(cleanUrl);
    response.cookies.set("access_token", "", { maxAge: 0, path: "/" });
    response.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });
    return response;
  }

  // Si se solicita forzar limpieza de sesión (legacy)
  if (pathname === "/login" && request.nextUrl.searchParams.get("clear_session") === "1") {
    const cleanUrl = new URL("/login", request.url);
    const response = NextResponse.redirect(cleanUrl);
    response.cookies.set("access_token", "", { maxAge: 0, path: "/" });
    response.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });
    return response;
  }

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  // Rutas públicas: dejar pasar pero redirigir autenticados
  if (isPublicRoute) {
    if (accessToken) {
      // Autenticado en login/registro → redirigir a dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Ruta raíz (/)
  if (pathname === "/") {
    if (accessToken) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Rutas privadas: validar token
  if (!accessToken) {
    return redirectToLogin(request, "no_session");
  }

  try {
    const decoded = jwtDecode<{ exp: number }>(accessToken);
    const expiresAt = decoded.exp * 1000; // Convertir a ms
    const now = Date.now();
    const timeToExpire = expiresAt - now;

    // Si token expira en menos de 15 minutos Y hay refresh token, auto-refresh
    if (timeToExpire > 0 && timeToExpire < 15 * 60 * 1000 && refreshToken) {
      return autoRefreshToken(request, refreshToken);
    }

    // Si token ya expiró, redirigir a login
    if (timeToExpire <= 0) {
      return redirectToLogin(request, "token_expired");
    }

    // Token válido, dejar pasar
    return NextResponse.next();
  } catch (error) {
    console.error("Error validating token in proxy:", error);
    return redirectToLogin(request, "invalid_token");
  }
}

/**
 * Intenta renovar el access token usando el refresh token
 */
async function autoRefreshToken(
  request: NextRequest,
  refreshToken: string
): Promise<NextResponse> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  if (!API_URL) {
    console.error("NEXT_PUBLIC_API_URL not configured");
    return redirectToLogin(request, "config_error");
  }

  try {
    const res = await fetch(`${API_URL}/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!res.ok) {
      console.warn(`Refresh token failed: ${res.status}`);
      return redirectToLogin(request, "refresh_failed");
    }

    const data = await res.json();

    // Crear response y configurar cookies
    const response = NextResponse.next();

    response.cookies.set("access_token", data.access, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 día
    });

    if (data.refresh) {
      response.cookies.set("refresh_token", data.refresh, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 días
      });
    }

    return response;
  } catch (error) {
    console.error("Error refreshing token in proxy:", error);
    return redirectToLogin(request, "refresh_error");
  }
}

/**
 * Redirige a login, limpia cookies y añade razón como query param
 */
function redirectToLogin(
  request: NextRequest,
  reason: string
): NextResponse {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("reason", reason);

  const response = NextResponse.redirect(loginUrl);

  // Limpiar cookies expiradas
  response.cookies.set("access_token", "", { maxAge: 0, path: "/" });
  response.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });

  return response;
}

export const config = {
  // Configurar las rutas que este middleware debe evaluar
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

