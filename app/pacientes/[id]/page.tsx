"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

type Vacuna = {
  id: number;
  nombre_vacuna: string;
  fecha_aplicacion: string;
  proxima_dosis?: string;
  observaciones?: string;
};

export default function DetallePacientePage() {
  const params = useParams();
  const pacienteId = params.id as string;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const [vacunas, setVacunas] = useState<Vacuna[]>([]);
  const [loading, setLoading] = useState(true);

  const [vacunaForm, setVacunaForm] = useState({
    nombre_vacuna: "",
    fecha_aplicacion: "",
    proxima_dosis: "",
    observaciones: "",
  });

  const getToken = () => sessionStorage.getItem("access");

  const cargarVacunas = async () => {
    const res = await fetch(`${apiUrl}/vacunas/?paciente=${pacienteId}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    const data = await res.json();
    setVacunas(data);
  };

  const cargarDatos = async () => {
    setLoading(true);
    await cargarVacunas();
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [pacienteId]);

  const crearVacuna = async () => {
    if (!vacunaForm.nombre_vacuna || !vacunaForm.fecha_aplicacion) {
      toast.warning("Nombre y fecha son obligatorios");
      return;
    }

    const res = await fetch(`${apiUrl}/vacunas/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        paciente: Number(pacienteId),
        nombre_vacuna: vacunaForm.nombre_vacuna,
        fecha_aplicacion: vacunaForm.fecha_aplicacion,
        proxima_dosis: vacunaForm.proxima_dosis || null,
        observaciones: vacunaForm.observaciones || null,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      toast.error("No se pudo crear la vacuna");
      console.log(error);
      return;
    }

    setVacunaForm({
      nombre_vacuna: "",
      fecha_aplicacion: "",
      proxima_dosis: "",
      observaciones: "",
    });

    cargarVacunas();
  };

  const vacunaVencida = (fecha: string) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const f = new Date(fecha);
    f.setHours(0, 0, 0, 0);

    return f < hoy;
  };

  if (loading) {
    return <main className="p-8">Cargando...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-4xl">

        {/* FORM VACUNA */}
        <section className="card mb-8">
          <h2 className="subtitle mb-4">Registrar vacuna</h2>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="input"
              placeholder="Nombre vacuna *"
              value={vacunaForm.nombre_vacuna}
              onChange={(e) =>
                setVacunaForm({ ...vacunaForm, nombre_vacuna: e.target.value })
              }
            />

            <input
              type="date"
              className="input"
              value={vacunaForm.fecha_aplicacion}
              onChange={(e) =>
                setVacunaForm({
                  ...vacunaForm,
                  fecha_aplicacion: e.target.value,
                })
              }
            />

            <input
              type="date"
              className="input"
              value={vacunaForm.proxima_dosis}
              onChange={(e) =>
                setVacunaForm({
                  ...vacunaForm,
                  proxima_dosis: e.target.value,
                })
              }
            />

            <textarea
              className="input md:col-span-2"
              placeholder="Observaciones"
              value={vacunaForm.observaciones}
              onChange={(e) =>
                setVacunaForm({
                  ...vacunaForm,
                  observaciones: e.target.value,
                })
              }
            />
          </div>

          <button onClick={crearVacuna} className="btn-primary mt-4">
            Guardar vacuna
          </button>
        </section>

        {/* LISTADO VACUNAS */}
        <section>
          <h2 className="subtitle mb-4">Vacunas</h2>

          {vacunas.length === 0 ? (
            <div className="card">
              <p className="text-muted">Sin vacunas registradas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vacunas.map((v) => (
                <div key={v.id} className="card">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold">
                        {v.nombre_vacuna}
                      </p>

                      <p className="text-sm text-muted">
                        Aplicada: {v.fecha_aplicacion}
                      </p>

                      {v.proxima_dosis && (
                        <p
                          className={`text-sm ${
                            vacunaVencida(v.proxima_dosis)
                              ? "text-red-600"
                              : "text-orange-600"
                          }`}
                        >
                          Próxima: {v.proxima_dosis}
                        </p>
                      )}
                    </div>

                    {v.proxima_dosis && vacunaVencida(v.proxima_dosis) && (
                      <span className="text-red-600 text-xs font-bold">
                        ⚠️ Vencida
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}