import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";

/**
 * Universal Proxy para peticiones al backend.
 * Recibe peticiones en /api/proxy/* y las reenvía a NEXT_PUBLIC_API_URL/*
 * adjuntando el Authorization Bearer token extraído de las cookies seguras HttpOnly.
 */
export async function ALL(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // Preservar el slash final exacto de la URL original para evitar redirecciones 301/403 en Django
  const cleanPath = request.nextUrl.pathname.replace(/^\/api\/proxy/, "");
  
  const searchParams = request.nextUrl.searchParams.toString();
  const queryString = searchParams ? `?${searchParams}` : "";
  
  // Limpiar barras extra
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const safeApiUrl = API_URL?.replace(/\/$/, "") || "";
  const safeCleanPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  
  let finalPath = safeCleanPath;
  if (!finalPath.endsWith("/")) {
    finalPath += "/";
  }
  
  const backendUrl = `${safeApiUrl}${finalPath}${queryString}`;

  const cookieStore = await cookies();
  let token = cookieStore.get("access_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;

  // Lógica para interceptar el cuerpo de la petición
  let body: BodyInit | null | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    // Revisar Content-Type
    const contentType = request.headers.get("Content-Type");
    if (contentType?.includes("multipart/form-data")) {
      body = await request.formData();
    } else {
      body = await request.text();
      // Si el texto está vacío, body = null
      if (!body) body = null;
    }
  }

  // Prepara los headers para Django
  const headers = new Headers();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  const contentType = request.headers.get("Content-Type");
  if (contentType && !contentType.includes("multipart/form-data")) {
    headers.set("Content-Type", contentType);
  } else if (!contentType && body && typeof body === "string") {
    headers.set("Content-Type", "application/json");
  }

  let res: Response;
  try {
    res = await fetch(backendUrl, {
      method: request.method,
      headers,
      body,
    });
  } catch (error) {
    console.error("Proxy fetch error:", backendUrl, error);
    return NextResponse.json({ error: "Error de conexión con el backend", details: String(error) }, { status: 502 });
  }

  // Si da 401 o 403 y tenemos refresh_token, intentamos renovar
  if ((res.status === 401 || res.status === 403) && refreshToken) {
    const refreshRes = await fetch(`${safeApiUrl}/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      token = data.access;
      
      // Intentar actualizar la cookie si es posible. En Edge runtime NextRequest
      // a veces requiere usar NextResponse. Sin embargo NextResponse lo mandaremos
      // al final, agregando el header Set-Cookie si aplica.
      
      // Reintentar petición original
      headers.set("Authorization", `Bearer ${token}`);
      res = await fetch(backendUrl, {
        method: request.method,
        headers,
        body,
      });

      // Crear respuesta con nuevos datos
      const responseBody = await res.arrayBuffer();
      const nextResponse = new NextResponse(responseBody, {
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
      });
      
      // Anexar la nueva cookie de access_token en el response que enviaremos al cliente
      nextResponse.cookies.set("access_token", token as string, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      });
      
      return nextResponse;
    }
  }

  // Si no se renovó o fue exitoso a la primera
  const responseBody = await res.arrayBuffer();
  
  // Remover el Content-Encoding para que Next.js no comprima algo doblemente y rompa la decodificación
  const responseHeaders = new Headers(res.headers);
  responseHeaders.delete("Content-Encoding");
  responseHeaders.delete("Content-Length");

  return new NextResponse(responseBody, {
    status: res.status,
    statusText: res.statusText,
    headers: responseHeaders,
  });
}

// Next.js Route Handlers deben exportar los métodos HTTP que manejan.
// export async function ALL... no funciona igual en Next 13+, se exporta cada verbo:
export const GET = ALL;
export const POST = ALL;
export const PUT = ALL;
export const PATCH = ALL;
export const DELETE = ALL;
