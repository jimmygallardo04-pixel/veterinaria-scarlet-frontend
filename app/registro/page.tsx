"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { saveTokens } from "@/lib/session";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Paso = "email" | "codigo" | "datos";

type DatosForm = {
  nombre_clinica: string;
  nombre_admin: string;
  password: string;
  clave_acceso: string;
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function RegistroPage() {
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>("email");
  const [loading, setLoading] = useState(false);

  // Paso 1 — email
  const [email, setEmail] = useState("");

  // Paso 2 — código OTP
  const [codigo, setCodigo] = useState("");
  const [codigoError, setCodigoError] = useState("");

  // Paso 3 — datos de la clínica
  const [datos, setDatos] = useState<DatosForm>({
    nombre_clinica: "",
    nombre_admin: "",
    password: "",
    clave_acceso: "",
  });
  const [datosErrors, setDatosErrors] = useState<{ email?: string; password?: string }>({});

  // ── Paso 1: solicitar código ──────────────────────────────────────────────

  const handleSolicitarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.warning("Ingresa tu correo electrónico"); return; }

    try {
      setLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/verificar-email/solicitar/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        toast.success("Código enviado. Revisa tu correo.");
        setPaso("codigo");
        return;
      }

      if (res.status === 400) {
        if (data.email) {
          toast.error(Array.isArray(data.email) ? data.email[0] : data.email);
        } else {
          toast.error(data.detail || "Error al enviar el código.");
        }
        return;
      }

      toast.error("No se pudo enviar el código. Intenta nuevamente.");
    } catch {
      toast.error("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // ── Paso 2: validar código ────────────────────────────────────────────────

  const handleValidarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (codigo.trim().length !== 6) { toast.warning("El código tiene 6 dígitos"); return; }

    try {
      setLoading(true);
      setCodigoError("");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/verificar-email/validar/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), codigo: codigo.trim() }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        toast.success("Correo verificado correctamente.");
        setPaso("datos");
        return;
      }

      setCodigoError(data.detail || "Código incorrecto o expirado.");
    } catch {
      toast.error("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // ── Paso 3: crear cuenta ──────────────────────────────────────────────────

  const handleCrearCuenta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!datos.nombre_clinica || !datos.nombre_admin || !datos.password || !datos.clave_acceso) {
      toast.warning("Completa todos los campos");
      return;
    }

    try {
      setLoading(true);
      setDatosErrors({});

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/registro/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_clinica: datos.nombre_clinica.trim(),
          nombre_admin: datos.nombre_admin.trim(),
          email: email.trim(),
          password: datos.password,
          registro_secret_key: datos.clave_acceso,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        saveTokens(data.access, data.refresh);
        router.push("/dashboard");
        return;
      }

      if (res.status === 400) {
        const errorData = await res.json();
        const newErrors: typeof datosErrors = {};
        if (errorData.email) newErrors.email = Array.isArray(errorData.email) ? errorData.email[0] : errorData.email;
        if (errorData.password) newErrors.password = Array.isArray(errorData.password) ? errorData.password[0] : errorData.password;
        if (Object.keys(newErrors).length > 0) { setDatosErrors(newErrors); return; }
        toast.error(errorData.detail || "Error al registrar. Verifica los datos.");
        return;
      }

      if (res.status === 403) {
        const errorData = await res.json();
        toast.error(errorData.detail || "Clave de acceso incorrecta.");
        return;
      }

      toast.error("Error al registrar. Intenta nuevamente.");    } catch {
      toast.error("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="card w-full max-w-sm">

        {/* Logo / título */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-100 mb-4">
            <span className="text-2xl">🐾</span>
          </div>
          <h1 className="title">Veterinaria Scarlet</h1>
          <p className="text-muted mt-1">Registra tu clínica</p>
        </div>

        {/* Indicador de pasos */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {(["email", "codigo", "datos"] as Paso[]).map((p, i) => (
            <div key={p} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                paso === p
                  ? "bg-green-600 text-white"
                  : (["email", "codigo", "datos"].indexOf(paso) > i)
                    ? "bg-green-200 text-green-700"
                    : "bg-slate-200 text-slate-400"
              }`}>
                {i + 1}
              </div>
              {i < 2 && <div className={`w-8 h-0.5 ${
                ["email", "codigo", "datos"].indexOf(paso) > i ? "bg-green-300" : "bg-slate-200"
              }`} />}
            </div>
          ))}
        </div>

        {/* ── Paso 1: Email ── */}
        {paso === "email" && (
          <form onSubmit={handleSolicitarCodigo} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Correo electrónico
              </label>
              <input
                className="input"
                placeholder="admin@tuclinica.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                disabled={loading}
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Te enviaremos un código de verificación a este correo.
              </p>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando código...
                </span>
              ) : "Enviar código de verificación"}
            </button>
          </form>
        )}

        {/* ── Paso 2: Código OTP ── */}
        {paso === "codigo" && (
          <form onSubmit={handleValidarCodigo} className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 mb-4">
                Enviamos un código de 6 dígitos a{" "}
                <span className="font-medium text-slate-800">{email}</span>.
                Revisa tu bandeja de entrada.
              </p>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Código de verificación
              </label>
              <input
                className={`input text-center text-2xl tracking-widest font-mono${codigoError ? " border-red-400 focus:ring-red-300" : ""}`}
                placeholder="000000"
                value={codigo}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setCodigo(val);
                  setCodigoError("");
                }}
                maxLength={6}
                inputMode="numeric"
                autoFocus
                disabled={loading}
              />
              {codigoError && (
                <p className="mt-1 text-sm text-red-600">{codigoError}</p>
              )}
            </div>
            <button type="submit" disabled={loading || codigo.length !== 6} className="btn-primary w-full">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verificando...
                </span>
              ) : "Verificar código"}
            </button>
            <button
              type="button"
              onClick={() => { setPaso("email"); setCodigo(""); setCodigoError(""); }}
              className="w-full text-sm text-slate-500 hover:text-slate-700 transition-colors"
              disabled={loading}
            >
              ← Cambiar correo
            </button>
          </form>
        )}

        {/* ── Paso 3: Datos de la clínica ── */}
        {paso === "datos" && (
          <form onSubmit={handleCrearCuenta} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nombre de la clínica
              </label>
              <input
                className="input"
                placeholder="Ej: Clínica Veterinaria Scarlet"
                value={datos.nombre_clinica}
                onChange={(e) => setDatos((p) => ({ ...p, nombre_clinica: e.target.value }))}
                autoComplete="organization"
                autoFocus
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nombre del administrador
              </label>
              <input
                className="input"
                placeholder="Tu nombre completo"
                value={datos.nombre_admin}
                onChange={(e) => setDatos((p) => ({ ...p, nombre_admin: e.target.value }))}
                autoComplete="name"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Contraseña
              </label>
              <input
                className={`input${datosErrors.password ? " border-red-400 focus:ring-red-300" : ""}`}
                placeholder="Mínimo 8 caracteres"
                type="password"
                value={datos.password}
                onChange={(e) => {
                  setDatos((p) => ({ ...p, password: e.target.value }));
                  setDatosErrors((p) => ({ ...p, password: undefined }));
                }}
                autoComplete="new-password"
                disabled={loading}
              />
              {datosErrors.password && (
                <p className="mt-1 text-sm text-red-600">{datosErrors.password}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Clave de acceso
              </label>
              <input
                className="input"
                placeholder="Clave proporcionada por el administrador"
                type="password"
                value={datos.clave_acceso}
                onChange={(e) => setDatos((p) => ({ ...p, clave_acceso: e.target.value }))}
                autoComplete="off"
                disabled={loading}
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Solicita esta clave al administrador del sistema para poder crear tu cuenta.
              </p>
            </div>
            {datosErrors.email && (
              <p className="text-sm text-red-600">{datosErrors.email}</p>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creando cuenta...
                </span>
              ) : "Crear cuenta"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-slate-500 mt-6">
          ¿Ya tienes una cuenta?{" "}
          <Link href="/login" className="text-green-600 hover:underline font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
