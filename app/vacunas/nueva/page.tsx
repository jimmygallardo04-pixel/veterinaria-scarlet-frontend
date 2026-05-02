"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

type Paciente = {
  id: number;
  nombre: string;
  tutor_nombre: string;
};

type FormVacuna = {
  paciente: string;
  nombre_vacuna: string;
  fecha_aplicacion: string;
  proxima_dosis: string;
  observaciones: string;
};

const formInicial: FormVacuna = {
  paciente: "",
  nombre_vacuna: "",
  fecha_aplicacion: "",
  proxima_dosis: "",
  observaciones: "",
};

export default function NuevaVacunaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const pacienteParam = searchParams.get("paciente");
  const fichaParam = searchParams.get("ficha");

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [form, setForm] = useState<FormVacuna>({
    ...formInicial,
    paciente: pacienteParam || "",
  });

  const [guardando, setGuardando] = useState(false);

  const getToken = () => sessionStorage.getItem("access");

  const cargarPacientes = async () => {
    try {
      const res = await fetch(`${apiUrl}/pacientes/`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!res.ok) {
        toast.error("Error cargando pacientes");
        return;
      }

      const data = await res.json();
      setPacientes(data);
    } catch (error) {
      console.log(error);
      toast.error("Error cargando pacientes");
    }
  };

  useEffect(() => {
    cargarPacientes();
  }, []);

  const guardarVacuna = async () => {
    if (!form.paciente || !form.nombre_vacuna || !form.fecha_aplicacion) {
      toast.warning("Completa paciente, vacuna y fecha");
      return;
    }

    try {
      setGuardando(true);

      const res = await fetch(`${apiUrl}/vacunas/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          paciente: Number(form.paciente),
          nombre_vacuna: form.nombre_vacuna,
          fecha_aplicacion: form.fecha_aplicacion,
          proxima_dosis: form.proxima_dosis || null,
          observaciones: form.observaciones || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        console.log(error);
        toast.error("No se pudo registrar la vacuna");
        return;
      }

      toast.success("Vacuna registrada correctamente");

      // 🔥 volver a la ficha
      if (fichaParam) {
        router.push(`/fichas/${fichaParam}`);
      } else {
        router.push("/fichas");
      }
    } catch (error) {
      console.log(error);
      toast.error("Error registrando vacuna");
    } finally {
      setGuardando(false);
    }
  };

  const pacienteSeleccionado = pacientes.find(
    (p) => String(p.id) === form.paciente
  );

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="title">Registrar vacuna</h1>
          <p className="text-muted">
            Agrega una vacuna al historial del paciente.
          </p>
        </div>

        <section className="card">
          <h2 className="subtitle mb-4">Paciente</h2>

          <select
            className="input w-full"
            value={form.paciente}
            onChange={(e) => setForm({ ...form, paciente: e.target.value })}
          >
            <option value="">Seleccionar paciente *</option>
            {pacientes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} · Tutor: {p.tutor_nombre}
              </option>
            ))}
          </select>

          {pacienteSeleccionado && (
            <p className="mt-3 text-sm text-muted">
              <strong>{pacienteSeleccionado.nombre}</strong> ·{" "}
              {pacienteSeleccionado.tutor_nombre}
            </p>
          )}
        </section>

        <section className="card">
          <h2 className="subtitle mb-4">Vacuna</h2>

          <input
            className="input mb-3"
            placeholder="Nombre vacuna *"
            value={form.nombre_vacuna}
            onChange={(e) =>
              setForm({ ...form, nombre_vacuna: e.target.value })
            }
          />

          <input
            className="input mb-3"
            type="date"
            value={form.fecha_aplicacion}
            onChange={(e) =>
              setForm({ ...form, fecha_aplicacion: e.target.value })
            }
          />

          <input
            className="input mb-3"
            type="date"
            value={form.proxima_dosis}
            onChange={(e) =>
              setForm({ ...form, proxima_dosis: e.target.value })
            }
          />

          <textarea
            className="input"
            placeholder="Observaciones"
            value={form.observaciones}
            onChange={(e) =>
              setForm({ ...form, observaciones: e.target.value })
            }
          />

          <div className="mt-4 flex gap-2">
            <button
              onClick={guardarVacuna}
              disabled={guardando}
              className="btn-primary"
            >
              {guardando ? "Guardando..." : "Guardar vacuna"}
            </button>

            <button
              onClick={() =>
                fichaParam
                  ? router.push(`/fichas/${fichaParam}`)
                  : router.back()
              }
              className="rounded-lg border px-4 py-2"
            >
              Cancelar
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}