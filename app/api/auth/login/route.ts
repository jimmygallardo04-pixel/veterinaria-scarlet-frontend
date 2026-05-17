import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  try {
    const body = await request.json();

    // Redirigir la petición al backend de Django
    const res = await fetch(`${API_URL}/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      let errorMessage = "Credenciales inválidas";
      
      if (res.status === 429) {
        errorMessage = "Demasiados intentos. Intenta de nuevo en unos minutos.";
      } else if (errorData.detail) {
        errorMessage = errorData.detail;
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: res.status }
      );
    }

    const data = await res.json();
    
    // Configurar las HttpOnly cookies
    const cookieStore = await cookies();

    cookieStore.set("access_token", data.access, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 día
    });

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
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
