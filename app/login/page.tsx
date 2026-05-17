"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!username || !password) {
      toast.warning("Ingresa usuario y contraseña");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Error al iniciar sesión");
        return;
      }

      router.push("/dashboard");
      router.refresh(); // Forzamos refresh para asegurar que los Server Components lean la cookie nueva
    } catch {
      toast.error("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="card w-full max-w-sm">
        {/* Logo / título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-100 mb-4">
            <span className="text-2xl">🐾</span>
          </div>
          <h1 className="title">Veterinaria Scarlet</h1>
          <p className="text-muted mt-1">Ingresa a tu cuenta</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Usuario o correo
            </label>
            <input
              className="input"
              placeholder="Tu correo o nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Contraseña
            </label>
            <input
              className="input"
              placeholder="Tu contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Ingresando...
              </span>
            ) : (
              "Ingresar"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          ¿No tienes una cuenta?{" "}
          <Link href="/registro" className="text-green-600 hover:underline font-medium">
            Registra tu clínica
          </Link>
        </p>
      </div>
    </main>
  );
}
