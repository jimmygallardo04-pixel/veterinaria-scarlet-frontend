import type { NextConfig } from "next";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://veterinaria-scarlet-backend.onrender.com";

// Extraer solo el origen (protocolo + host) de la URL de la API para la CSP
function getApiOrigin(url: string): string {
  try {
    const { origin } = new URL(url);
    return origin;
  } catch {
    return url;
  }
}

const apiOrigin = getApiOrigin(API_URL);

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://*.supabase.co";

/**
 * Content Security Policy
 *
 * - default-src 'self'          → solo recursos del mismo origen por defecto
 * - script-src 'self' 'unsafe-inline' → Next.js necesita inline scripts para hydration
 * - style-src 'self' 'unsafe-inline'  → Tailwind genera estilos inline
 * - img-src 'self' data: blob:        → imágenes locales + data URIs (jsPDF usa blob)
 * - connect-src                       → fetch al backend y a Supabase
 * - font-src 'self'                   → fuentes locales
 * - frame-ancestors 'none'            → evita clickjacking (equivale a X-Frame-Options: DENY)
 * - object-src 'none'                 → deshabilita plugins (Flash, etc.)
 * - base-uri 'self'                   → evita inyección de <base> tag
 */
const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  `connect-src 'self' ${apiOrigin} ${supabaseUrl}`,
  "font-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
]
  .join("; ")
  .trim();

const securityHeaders = [
  // Evita que el navegador infiera el tipo MIME (MIME sniffing)
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Evita que la página sea embebida en iframes (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // Fuerza HTTPS durante 1 año e incluye subdominios
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  // Controla qué información de referrer se envía
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Deshabilita funcionalidades del navegador que no se usan
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Content Security Policy
  { key: "Content-Security-Policy", value: cspHeader },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Aplicar a todas las rutas
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
