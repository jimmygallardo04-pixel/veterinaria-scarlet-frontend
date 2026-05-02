"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

type Ficha = {
  id: number;
  paciente: number;
  paciente_nombre: string;
  fecha: string;
  motivo_consulta: string;
  diagnostico?: string | null;
  tratamiento?: string | null;
};

export default function FichasPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(true);

  const getToken = () => sessionStorage.getItem("access");

  const cargarFichas = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${apiUrl}/fichas/`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!res.ok) {
        toast.error("Error cargando fichas clínicas");
        return;
      }

      const data = await res.json();
      setFichas(data);
    } catch (error) {
      toast.error("Error cargando fichas clínicas");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarFichas();
  }, []);

  const fichasFiltradas = fichas.filter((f) => {
    const texto = `${f.paciente_nombre} ${f.motivo_consulta} ${
      f.diagnostico ?? ""
    } ${f.tratamiento ?? ""}`.toLowerCase();

    return texto.includes(busqueda.toLowerCase());
  });

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="title mb-6">Fichas clínicas</h1>

        {/* 🔍 Buscador */}
        <div className="mb-6">
          <input
            className="input w-full"
            placeholder="Buscar por paciente, motivo, diagnóstico o tratamiento..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {/* ⏳ Loading */}
        {loading && (
          <div className="card">
            <p className="text-muted">Cargando fichas clínicas...</p>
          </div>
        )}

        {/* 📋 Lista */}
        {!loading && (
          <section className="space-y-3">
            {fichasFiltradas.length === 0 ? (
              <div className="card">
                <p className="text-muted">
                  No hay fichas clínicas registradas.
                </p>
              </div>
            ) : (
              fichasFiltradas.map((ficha) => (
                <div key={ficha.id} className="card">
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    
                    {/* 🐶 Info ficha */}
                    <div>
                      <p className="text-sm text-muted">
                        {new Date(ficha.fecha).toLocaleString()}
                      </p>

                      <h2 className="font-semibold text-slate-900">
                        {ficha.paciente_nombre}
                      </h2>

                      <p className="text-sm text-slate-700">
                        {ficha.motivo_consulta}
                      </p>

                      {ficha.diagnostico && (
                        <p className="mt-2 text-sm text-muted">
                          <strong>Diagnóstico:</strong>{" "}
                          {ficha.diagnostico}
                        </p>
                      )}
                    </div>

                    {/* 🔘 Acciones */}
                    <div className="flex flex-col gap-2 sm:flex-row">
                      
                      {/* 👉 NUEVO: ir a ficha */}
                      <Link
                        href={`/fichas/${ficha.id}`}
                        className="btn-primary text-center"
                      >
                        Ver ficha
                      </Link>

                      {/* 👉 existente: ir a paciente */}
                      <Link
                        href={`/pacientes/${ficha.paciente}`}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Ver paciente
                      </Link>
                    </div>

                  </div>
                </div>
              ))
            )}
          </section>
        )}
      </div>
    </main>
  );
}