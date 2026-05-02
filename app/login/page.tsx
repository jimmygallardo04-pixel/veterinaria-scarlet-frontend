"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      toast.error("Credenciales inválidas");
      return;
    }

    const data = await res.json();
    sessionStorage.setItem("access", data.access);
    sessionStorage.setItem("refresh", data.refresh);

    localStorage.removeItem("access");
    localStorage.removeItem("refresh");

    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="card w-full max-w-sm">
        <h1 className="title mb-1 text-center">
          Veterinaria Scarlet
        </h1>

        <p className="text-muted text-center mb-6">
          Ingreso privado
        </p>

        <input
          className="input w-full mb-3"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          className="input w-full mb-4"
          placeholder="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="btn-primary w-full"
        >
          Ingresar
        </button>
      </div>
    </main>
  );
}