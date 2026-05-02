"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

type Tutor = {
  id: number;
  nombre: string;
};

type Opcion = {
  id: number;
  nombre: string;
};

type Paciente = {
  id: number;
  nombre: string;
  tutor: number;
  especie: number;
  sexo?: number | null;
  tutor_nombre: string;
  especie_nombre?: string;
  sexo_nombre?: string;
  raza?: string | null;
  fecha_nacimiento?: string | null;
  edad?: number | null;
  color?: string | null;
  esterilizado: boolean;
  observaciones?: string | null;
};

type PacienteForm = {
  nombre: string;
  especie: string;
  raza: string;
  sexo: string;
  fecha_nacimiento: string;
  color: string;
  esterilizado: boolean;
  observaciones: string;
  tutor: string;
};

const formInicial: PacienteForm = {
  nombre: "",
  especie: "",
  raza: "",
  sexo: "",
  fecha_nacimiento: "",
  color: "",
  esterilizado: false,
  observaciones: "",
  tutor: "",
};

export default function PacientesPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [tutores, setTutores] = useState<Tutor[]>([]);
  const [especies, setEspecies] = useState<Opcion[]>([]);
  const [sexos, setSexos] = useState<Opcion[]>([]);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEspecie, setFiltroEspecie] = useState("");
  const [filtroSexo, setFiltroSexo] = useState("");

  const [form, setForm] = useState<PacienteForm>(formInicial);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<PacienteForm>(formInicial);

  const [loading, setLoading] = useState(true);

  const getToken = () => sessionStorage.getItem("access");

  const authHeaders = {
    Authorization: `Bearer ${getToken()}`,
  };

  const cargarPacientes = async () => {
    const res = await fetch(`${apiUrl}/pacientes/`, {
      headers: authHeaders,
    });

    if (!res.ok) {
      toast.error("Error cargando pacientes");
      return;
    }

    const data = await res.json();
    setPacientes(data);
  };

  const cargarTutores = async () => {
    const res = await fetch(`${apiUrl}/tutores/`, {
      headers: authHeaders,
    });

    if (!res.ok) return;

    const data = await res.json();
    setTutores(data);
  };

  const cargarEspecies = async () => {
    const res = await fetch(`${apiUrl}/especies/`, {
      headers: authHeaders,
    });

    if (!res.ok) return;

    const data = await res.json();
    setEspecies(data);
  };

  const cargarSexos = async () => {
    const res = await fetch(`${apiUrl}/sexos/`, {
      headers: authHeaders,
    });

    if (!res.ok) return;

    const data = await res.json();
    setSexos(data);
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      await Promise.all([
        cargarPacientes(),
        cargarTutores(),
        cargarEspecies(),
        cargarSexos(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const pacientesFiltrados = useMemo(() => {
    return pacientes.filter((p) => {
      const texto = `${p.nombre} ${p.tutor_nombre} ${p.especie_nombre ?? ""} ${
        p.raza ?? ""
      } ${p.color ?? ""} ${p.sexo_nombre ?? ""}`.toLowerCase();

      const coincideBusqueda = texto.includes(busqueda.toLowerCase());

      const coincideEspecie = filtroEspecie
        ? String(p.especie) === filtroEspecie
        : true;

      const coincideSexo = filtroSexo
        ? String(p.sexo ?? "") === filtroSexo
        : true;

      return coincideBusqueda && coincideEspecie && coincideSexo;
    });
  }, [pacientes, busqueda, filtroEspecie, filtroSexo]);

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroEspecie("");
    setFiltroSexo("");
  };

  const crearPaciente = async () => {
    if (!form.nombre || !form.tutor || !form.especie || !form.sexo) {
      toast.warning("Completa nombre, tutor, especie y sexo");
      return;
    }

    const res = await fetch(`${apiUrl}/pacientes/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({
        nombre: form.nombre,
        especie: Number(form.especie),
        raza: form.raza || null,
        sexo: Number(form.sexo),
        fecha_nacimiento: form.fecha_nacimiento || null,
        color: form.color || null,
        esterilizado: form.esterilizado,
        observaciones: form.observaciones || null,
        tutor: Number(form.tutor),
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      console.log(error);
      toast.error("No se pudo crear el paciente");
      return;
    }

    toast.success("Paciente creado correctamente");
    setForm(formInicial);
    cargarPacientes();
  };

  const iniciarEdicion = (paciente: Paciente) => {
    setEditandoId(paciente.id);
    setEditForm({
      nombre: paciente.nombre || "",
      especie: String(paciente.especie || ""),
      raza: paciente.raza || "",
      sexo: paciente.sexo ? String(paciente.sexo) : "",
      fecha_nacimiento: paciente.fecha_nacimiento || "",
      color: paciente.color || "",
      esterilizado: paciente.esterilizado || false,
      observaciones: paciente.observaciones || "",
      tutor: String(paciente.tutor || ""),
    });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setEditForm(formInicial);
  };

  const guardarEdicion = async (id: number) => {
    if (!editForm.nombre || !editForm.tutor || !editForm.especie || !editForm.sexo) {
      toast.warning("Completa nombre, tutor, especie y sexo");
      return;
    }

    const res = await fetch(`${apiUrl}/pacientes/${id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({
        nombre: editForm.nombre,
        especie: Number(editForm.especie),
        raza: editForm.raza || null,
        sexo: Number(editForm.sexo),
        fecha_nacimiento: editForm.fecha_nacimiento || null,
        color: editForm.color || null,
        esterilizado: editForm.esterilizado,
        observaciones: editForm.observaciones || null,
        tutor: Number(editForm.tutor),
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      console.log(error);
      toast.error("No se pudo editar el paciente");
      return;
    }

    toast.success("Paciente actualizado");
    cancelarEdicion();
    cargarPacientes();
  };

  const eliminarPaciente = async (id: number) => {
    const confirmar = confirm("¿Eliminar paciente?");
    if (!confirmar) return;

    const res = await fetch(`${apiUrl}/pacientes/${id}/`, {
      method: "DELETE",
      headers: authHeaders,
    });

    if (!res.ok) {
      toast.error("No se pudo eliminar el paciente");
      return;
    }

    toast.success("Paciente eliminado");
    cargarPacientes();
  };

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="title">Pacientes 🐶🐱</h1>
            <p className="text-muted">
              Gestiona pacientes, fichas clínicas y citas desde un solo lugar.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/fichas" className="rounded-lg border px-4 py-2 text-sm">
              Ver fichas
            </Link>

            <Link href="/citas" className="btn-primary text-sm">
              Nueva cita
            </Link>
          </div>
        </div>

        <section className="card mb-6">
          <h2 className="subtitle mb-4">Buscar y filtrar</h2>

          <div className="grid gap-3 md:grid-cols-4">
            <input
              className="input md:col-span-2"
              placeholder="Buscar por nombre, tutor, especie, raza, sexo o color..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />

            <select
              className="input"
              value={filtroEspecie}
              onChange={(e) => setFiltroEspecie(e.target.value)}
            >
              <option value="">Todas las especies</option>
              {especies.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>

            <select
              className="input"
              value={filtroSexo}
              onChange={(e) => setFiltroSexo(e.target.value)}
            >
              <option value="">Todos los sexos</option>
              {sexos.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-muted">
              Mostrando {pacientesFiltrados.length} de {pacientes.length} pacientes
            </p>

            <button onClick={limpiarFiltros} className="text-sm text-green-700">
              Limpiar filtros
            </button>
          </div>
        </section>

        <section className="card mb-8">
          <h2 className="subtitle mb-4">Crear paciente</h2>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="input"
              placeholder="Nombre *"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />

            <select
              className="input"
              value={form.especie}
              onChange={(e) => setForm({ ...form, especie: e.target.value })}
            >
              <option value="">Seleccionar especie *</option>
              {especies.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>

            <input
              className="input"
              placeholder="Raza"
              value={form.raza}
              onChange={(e) => setForm({ ...form, raza: e.target.value })}
            />

            <select
              className="input"
              value={form.sexo}
              onChange={(e) => setForm({ ...form, sexo: e.target.value })}
            >
              <option value="">Seleccionar sexo *</option>
              {sexos.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>

            <input
              className="input"
              type="date"
              value={form.fecha_nacimiento}
              onChange={(e) =>
                setForm({ ...form, fecha_nacimiento: e.target.value })
              }
            />

            <input
              className="input"
              placeholder="Color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            />

            <select
              className="input"
              value={form.tutor}
              onChange={(e) => setForm({ ...form, tutor: e.target.value })}
            >
              <option value="">Seleccionar tutor *</option>
              {tutores.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.esterilizado}
                onChange={(e) =>
                  setForm({ ...form, esterilizado: e.target.checked })
                }
              />
              Esterilizado
            </label>

            <textarea
              className="input md:col-span-2"
              placeholder="Observaciones"
              value={form.observaciones}
              onChange={(e) =>
                setForm({ ...form, observaciones: e.target.value })
              }
            />
          </div>

          <button onClick={crearPaciente} className="btn-primary mt-4">
            Crear paciente
          </button>
        </section>

        {loading ? (
          <div className="card">
            <p className="text-muted">Cargando pacientes...</p>
          </div>
        ) : pacientesFiltrados.length === 0 ? (
          <div className="card">
            <p className="text-muted">No hay pacientes para mostrar.</p>
          </div>
        ) : (
          <section className="space-y-3">
            {pacientesFiltrados.map((p) => (
              <div key={p.id} className="card">
                {editandoId === p.id ? (
                  <div>
                    <h2 className="subtitle mb-4">Editar paciente</h2>

                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        className="input"
                        placeholder="Nombre *"
                        value={editForm.nombre}
                        onChange={(e) =>
                          setEditForm({ ...editForm, nombre: e.target.value })
                        }
                      />

                      <select
                        className="input"
                        value={editForm.especie}
                        onChange={(e) =>
                          setEditForm({ ...editForm, especie: e.target.value })
                        }
                      >
                        <option value="">Seleccionar especie *</option>
                        {especies.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.nombre}
                          </option>
                        ))}
                      </select>

                      <input
                        className="input"
                        placeholder="Raza"
                        value={editForm.raza}
                        onChange={(e) =>
                          setEditForm({ ...editForm, raza: e.target.value })
                        }
                      />

                      <select
                        className="input"
                        value={editForm.sexo}
                        onChange={(e) =>
                          setEditForm({ ...editForm, sexo: e.target.value })
                        }
                      >
                        <option value="">Seleccionar sexo *</option>
                        {sexos.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nombre}
                          </option>
                        ))}
                      </select>

                      <input
                        className="input"
                        type="date"
                        value={editForm.fecha_nacimiento}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            fecha_nacimiento: e.target.value,
                          })
                        }
                      />

                      <input
                        className="input"
                        placeholder="Color"
                        value={editForm.color}
                        onChange={(e) =>
                          setEditForm({ ...editForm, color: e.target.value })
                        }
                      />

                      <select
                        className="input"
                        value={editForm.tutor}
                        onChange={(e) =>
                          setEditForm({ ...editForm, tutor: e.target.value })
                        }
                      >
                        <option value="">Seleccionar tutor *</option>
                        {tutores.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nombre}
                          </option>
                        ))}
                      </select>

                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={editForm.esterilizado}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              esterilizado: e.target.checked,
                            })
                          }
                        />
                        Esterilizado
                      </label>

                      <textarea
                        className="input md:col-span-2"
                        placeholder="Observaciones"
                        value={editForm.observaciones}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            observaciones: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => guardarEdicion(p.id)}
                        className="btn-primary"
                      >
                        Guardar cambios
                      </button>

                      <button
                        onClick={cancelarEdicion}
                        className="rounded-lg border px-4 py-2 text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                      <Link
                        href={`/pacientes/${p.id}`}
                        className="text-lg font-semibold text-slate-900 hover:underline"
                      >
                        {p.nombre}
                      </Link>

                      <div className="mt-1 text-sm text-muted">
                        {p.especie_nombre || "Sin especie"}
                        {p.raza ? ` · ${p.raza}` : ""}
                        {p.sexo_nombre ? ` · ${p.sexo_nombre}` : ""}
                        {p.edad ? ` · ${p.edad} años` : ""}
                        {p.color ? ` · ${p.color}` : ""}
                        {" · Tutor: "}
                        {p.tutor_nombre}
                      </div>

                      {p.observaciones && (
                        <p className="mt-2 text-sm text-slate-700">
                          {p.observaciones}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/pacientes/${p.id}`}
                        className="btn-primary text-center text-sm"
                      >
                        Ver ficha
                      </Link>

                      <Link
                        href={`/fichas/nueva?paciente=${p.id}`}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                      >
                        Nueva ficha
                      </Link>

                      <Link
                        href={`/citas?paciente=${p.id}`}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Nueva cita
                      </Link>

                      <button
                        onClick={() => iniciarEdicion(p)}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => eliminarPaciente(p.id)}
                        className="btn-danger text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

// "use client";

// import { useEffect, useState } from "react";
// import Link from "next/link";
// import { toast } from "sonner";

// type Tutor = {
//   id: number;
//   nombre: string;
// };

// type Opcion = {
//   id: number;
//   nombre: string;
// };

// type Paciente = {
//   id: number;
//   nombre: string;
//   especie_nombre?: string;
//   sexo_nombre?: string;
//   raza?: string;
//   edad?: number;
//   color?: string;
//   tutor_nombre: string;
// };

// export default function PacientesPage() {
//   const [pacientes, setPacientes] = useState<Paciente[]>([]);
//   const [tutores, setTutores] = useState<Tutor[]>([]);
//   const [especies, setEspecies] = useState<Opcion[]>([]);
//   const [sexos, setSexos] = useState<Opcion[]>([]);

//   const [busqueda, setBusqueda] = useState("");

//   const [form, setForm] = useState({
//     nombre: "",
//     especie: "",
//     raza: "",
//     sexo: "",
//     fecha_nacimiento: "",
//     color: "",
//     esterilizado: false,
//     observaciones: "",
//     tutor: "",
//   });

//   const apiUrl = process.env.NEXT_PUBLIC_API_URL;
//   const getToken = () => sessionStorage.getItem("access");

//   const fetchPacientes = async () => {
//     const res = await fetch(`${apiUrl}/pacientes/`, {
//       headers: { Authorization: `Bearer ${getToken()}` },
//     });
//     const data = await res.json();
//     setPacientes(data);
//   };

//   const fetchTutores = async () => {
//     const res = await fetch(`${apiUrl}/tutores/`, {
//       headers: { Authorization: `Bearer ${getToken()}` },
//     });
//     const data = await res.json();
//     setTutores(data);
//   };

//   const fetchEspecies = async () => {
//     const res = await fetch(`${apiUrl}/especies/`, {
//       headers: { Authorization: `Bearer ${getToken()}` },
//     });
//     const data = await res.json();
//     setEspecies(data);
//   };

//   const fetchSexos = async () => {
//     const res = await fetch(`${apiUrl}/sexos-paciente/`, {
//       headers: { Authorization: `Bearer ${getToken()}` },
//     });
//     const data = await res.json();
//     setSexos(data);
//   };

//   useEffect(() => {
//     fetchPacientes();
//     fetchTutores();
//     fetchEspecies();
//     fetchSexos();
//   }, []);

//   const pacientesFiltrados = pacientes.filter((p) => {
//     const texto = `${p.nombre} ${p.tutor_nombre} ${p.especie_nombre ?? ""} ${
//       p.raza ?? ""
//     } ${p.color ?? ""}`.toLowerCase();

//     return texto.includes(busqueda.toLowerCase());
//   });

//   const crearPaciente = async () => {
//     if (!form.nombre || !form.tutor || !form.especie) {
//       toast.warning("Completa los campos obligatorios");
//       return;
//     }

//     const res = await fetch(`${apiUrl}/pacientes/`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${getToken()}`,
//       },
//       body: JSON.stringify({
//         nombre: form.nombre,
//         especie: Number(form.especie),
//         raza: form.raza || null,
//         sexo: form.sexo ? Number(form.sexo) : null,
//         fecha_nacimiento: form.fecha_nacimiento || null,
//         color: form.color || null,
//         esterilizado: form.esterilizado,
//         observaciones: form.observaciones || null,
//         tutor: Number(form.tutor),
//       }),
//     });

//     if (!res.ok) {
//       const error = await res.json();
//       toast.error("No se pudo crear el paciente");
//       console.log(error);
//       return;
//     }

//     setForm({
//       nombre: "",
//       especie: "",
//       raza: "",
//       sexo: "",
//       fecha_nacimiento: "",
//       color: "",
//       esterilizado: false,
//       observaciones: "",
//       tutor: "",
//     });

//     fetchPacientes();
//   };

//   const eliminarPaciente = async (id: number) => {
//     const confirmar = confirm("¿Eliminar paciente?");
//     if (!confirmar) return;

//     await fetch(`${apiUrl}/pacientes/${id}/`, {
//       method: "DELETE",
//       headers: {
//         Authorization: `Bearer ${getToken()}`,
//       },
//     });

//     fetchPacientes();
//   };

//   return (
//     <main className="min-h-screen bg-slate-100 p-8">
//       <div className="mx-auto max-w-5xl">
//         <h1 className="title mb-6">Pacientes 🐶🐱</h1>

//         {/* BUSCADOR */}
//         <div className="mb-6">
//           <input
//             className="input w-full"
//             placeholder="Buscar por nombre, tutor, especie, raza o color..."
//             value={busqueda}
//             onChange={(e) => setBusqueda(e.target.value)}
//           />
//         </div>

//         {/* FORM */}
//         <div className="card mb-8">
//           <h2 className="subtitle mb-4">Crear paciente</h2>

//           <div className="grid gap-3 md:grid-cols-2">
//             <input
//               className="input"
//               placeholder="Nombre *"
//               value={form.nombre}
//               onChange={(e) => setForm({ ...form, nombre: e.target.value })}
//             />

//             <select
//               className="input"
//               value={form.especie}
//               onChange={(e) => setForm({ ...form, especie: e.target.value })}
//             >
//               <option value="">Seleccionar especie *</option>
//               {especies.map((e) => (
//                 <option key={e.id} value={e.id}>
//                   {e.nombre}
//                 </option>
//               ))}
//             </select>

//             <input
//               className="input"
//               placeholder="Raza"
//               value={form.raza}
//               onChange={(e) => setForm({ ...form, raza: e.target.value })}
//             />

//             <select
//               className="input"
//               value={form.sexo}
//               onChange={(e) => setForm({ ...form, sexo: e.target.value })}
//             >
//               <option value="">Seleccionar sexo</option>
//               {sexos.map((s) => (
//                 <option key={s.id} value={s.id}>
//                   {s.nombre}
//                 </option>
//               ))}
//             </select>

//             <input
//               className="input"
//               type="date"
//               value={form.fecha_nacimiento}
//               onChange={(e) =>
//                 setForm({ ...form, fecha_nacimiento: e.target.value })
//               }
//             />

//             <input
//               className="input"
//               placeholder="Color"
//               value={form.color}
//               onChange={(e) => setForm({ ...form, color: e.target.value })}
//             />

//             <select
//               className="input"
//               value={form.tutor}
//               onChange={(e) => setForm({ ...form, tutor: e.target.value })}
//             >
//               <option value="">Seleccionar tutor *</option>
//               {tutores.map((t) => (
//                 <option key={t.id} value={t.id}>
//                   {t.nombre}
//                 </option>
//               ))}
//             </select>

//             <label className="flex items-center gap-2 text-sm text-slate-700">
//               <input
//                 type="checkbox"
//                 checked={form.esterilizado}
//                 onChange={(e) =>
//                   setForm({ ...form, esterilizado: e.target.checked })
//                 }
//               />
//               Esterilizado
//             </label>

//             <textarea
//               className="input md:col-span-2"
//               placeholder="Observaciones"
//               value={form.observaciones}
//               onChange={(e) =>
//                 setForm({ ...form, observaciones: e.target.value })
//               }
//             />
//           </div>

//           <button onClick={crearPaciente} className="btn-primary mt-4">
//             Crear paciente
//           </button>
//         </div>

//         {/* LISTA */}
//         <div className="space-y-3">
//           {pacientesFiltrados.map((p) => (
//             <div
//               key={p.id}
//               className="card flex items-center justify-between"
//             >
//               <div>
//                 <Link
//                   href={`/pacientes/${p.id}`}
//                   className="font-semibold underline"
//                 >
//                   {p.nombre}
//                 </Link>

//                 <div className="text-sm text-muted">
//                   {p.especie_nombre || "Sin especie"}
//                   {p.raza ? ` · ${p.raza}` : ""}
//                   {p.sexo_nombre ? ` · ${p.sexo_nombre}` : ""}
//                   {p.edad ? ` · ${p.edad} años` : ""}
//                   {p.color ? ` · ${p.color}` : ""}
//                   {" - "}
//                   {p.tutor_nombre}
//                 </div>
//               </div>

//               <button
//                 onClick={() => eliminarPaciente(p.id)}
//                 className="btn-danger text-sm"
//               >
//                 Eliminar
//               </button>
//             </div>
//           ))}
//         </div>
//       </div>
//     </main>
//   );
// }