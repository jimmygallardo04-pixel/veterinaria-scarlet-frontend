import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Endpoint para refresh de token JWT.
 * 
 * Este endpoint:
 * 1. Obtiene el refresh_token de las cookies HttpOnly
 * 2. Lo envía al backend Django para obtener un nuevo access_token
 * 3. Actualiza las cookies con el nuevo access_token
 * 
 * Se utiliza cuando:
 * - El usuario extiende sesión por inactividad
 * - El access_token expira durante una petición
 */
export async function POST() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  if (!API_URL) {
    return NextResponse.json(
      { error: "API_URL no configurada" },
      { status: 500 }
    );
  }

  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No hay refresh token" },
        { status: 401 }
      );
    }

    // Llamar al endpoint de refresh de Django
    const res = await fetch(`${API_URL}/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!res.ok) {
      // Token inválido o expirado - limpiar sesión
      cookieStore.set("access_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      cookieStore.set("refresh_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });

      return NextResponse.json(
        { error: "Refresh token inválido o expirado" },
        { status: 401 }
      );
    }

    const data = await res.json();

    // Actualizar access_token (el refresh_token sigue siendo el mismo)
    cookieStore.set("access_token", data.access, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 día
    });

    // Si el backend devuelve un nuevo refresh_token, actualizarlo
    if (data.refresh) {
      cookieStore.set("refresh_token", data.refresh, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 días
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error refreshing token:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}