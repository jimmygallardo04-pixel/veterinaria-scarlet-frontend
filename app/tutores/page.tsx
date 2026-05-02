"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type Tutor = {
  id: number;
  nombre: string;
  rut?: string;
  telefono: string;
  email?: string;
  direccion?: string;
};

export default function TutoresPage() {
  const [tutores, setTutores] = useState<Tutor[]>([]);
  const [form, setForm] = useState({
    nombre: "",
    rut: "",
    telefono: "",
    email: "",
    direccion: "",
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const getToken = () => sessionStorage.getItem("access");

  const cargarTutores = async () => {
    const res = await fetch(`${apiUrl}/tutores/`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    const data = await res.json();
    setTutores(data);
  };

  const crearTutor = async () => {
    if (!form.nombre || !form.telefono) {
      toast.warning("Nombre y teléfono son obligatorios");
      return;
    }

    const res = await fetch(`${apiUrl}/tutores/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      toast.error("Error creando tutor");
      return;
    }

    setForm({
      nombre: "",
      rut: "",
      telefono: "",
      email: "",
      direccion: "",
    });

    cargarTutores();
  };

  const eliminarTutor = async (id: number) => {
    const confirmar = confirm("¿Eliminar este tutor?");
    if (!confirmar) return;

    const res = await fetch(`${apiUrl}/tutores/${id}/`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    if (!res.ok) {
      toast.error("Error eliminando tutor");
      return;
    }

    cargarTutores();
  };

  useEffect(() => {
    cargarTutores();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="title mb-6">Tutores</h1>

        <section className="card mb-8">
          <h2 className="subtitle mb-4">Crear tutor</h2>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="input"
              placeholder="Nombre *"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />

            <input
              className="input"
              placeholder="RUT"
              value={form.rut}
              onChange={(e) => setForm({ ...form, rut: e.target.value })}
            />

            <input
              className="input"
              placeholder="Teléfono *"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            />

            <input
              className="input"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <input
              className="input md:col-span-2"
              placeholder="Dirección"
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
            />
          </div>

          <button onClick={crearTutor} className="btn-primary mt-4">
            Guardar tutor
          </button>
        </section>

        <section className="space-y-3">
          {tutores.map((tutor) => (
            <div
              key={tutor.id}
              className="card flex items-center justify-between"
            >
              <div>
                <h3 className="font-semibold text-slate-900">{tutor.nombre}</h3>

                <p className="text-sm text-muted">
                  {tutor.telefono} {tutor.email ? `· ${tutor.email}` : ""}
                </p>

                {tutor.direccion && (
                  <p className="text-sm text-muted">{tutor.direccion}</p>
                )}
              </div>

              <button
                onClick={() => eliminarTutor(tutor.id)}
                className="btn-danger text-sm"
              >
                Eliminar
              </button>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}