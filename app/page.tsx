import Link from "next/link";

/**
 * Landing page pública — visible sin autenticación.
 * El AuthGuard no aplica aquí porque esta ruta no está protegida.
 * Si el usuario ya tiene sesión, el AuthGuard lo redirige a /dashboard.
 */
export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">

      {/* Nav */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="font-bold text-green-700 text-lg">🐾 Veterinaria Scarlet</span>
          <Link href="/login" className="btn-primary">
            Ingresar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-1.5 text-sm font-medium text-green-700 mb-6">
          Sistema de gestión veterinaria
        </div>

        <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-6">
          Todo el historial clínico
          <br />
          <span className="text-green-600">de tus pacientes, en un solo lugar</span>
        </h1>

        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10">
          Fichas clínicas, vacunas, tratamientos, citas y documentos.
          Diseñado para veterinarios que quieren enfocarse en sus pacientes, no en el papeleo.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login" className="btn-primary text-base px-8 py-3">
            Acceder al sistema
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Todo lo que necesitas
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: "📋",
                title: "Fichas clínicas",
                desc: "Registra cada consulta con datos vitales, diagnóstico, tratamiento e indicaciones. Historial completo por paciente.",
              },
              {
                icon: "💉",
                title: "Vacunas y alertas",
                desc: "Controla el calendario de vacunación. Recibe alertas automáticas de vacunas vencidas y próximas a vencer.",
              },
              {
                icon: "📅",
                title: "Agenda de citas",
                desc: "Calendario visual con drag & drop. Crea, mueve y gestiona citas directamente desde la vista mensual o semanal.",
              },
              {
                icon: "💊",
                title: "Tratamientos",
                desc: "Registra medicamentos, dosis y frecuencias. Visualiza qué pacientes están actualmente en tratamiento.",
              },
              {
                icon: "📎",
                title: "Documentos",
                desc: "Adjunta radiografías, exámenes y recetas en PDF o imagen. Almacenamiento seguro en la nube.",
              },
              {
                icon: "👥",
                title: "Tutores",
                desc: "Gestiona los datos de contacto de los propietarios. Vincula múltiples mascotas a un mismo tutor.",
              },
            ].map((f) => (
              <div key={f.title} className="card">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 text-center px-6">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">
          ¿Listo para empezar?
        </h2>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          Accede al sistema con tus credenciales y empieza a gestionar tu clínica hoy.
        </p>
        <Link href="/login" className="btn-primary text-base px-8 py-3">
          Ingresar al sistema
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 text-center">
        <p className="text-muted">© {new Date().getFullYear()} Veterinaria Scarlet</p>
      </footer>

    </main>
  );
}
