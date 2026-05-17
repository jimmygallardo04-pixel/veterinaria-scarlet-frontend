"use client";

export type TutorFormValues = {
  nombre: string;
  rut: string;
  telefono: string;
  email: string;
  direccion: string;
  activo: boolean;
};

export const TUTOR_FORM_INICIAL: TutorFormValues = {
  nombre: "",
  rut: "",
  telefono: "",
  email: "",
  direccion: "",
  activo: true,
};

export function tutorToForm(tutor: {
  nombre: string;
  rut?: string | null;
  telefono: string;
  email?: string | null;
  direccion?: string | null;
  activo: boolean;
}): TutorFormValues {
  return {
    nombre: tutor.nombre,
    rut: tutor.rut ?? "",
    telefono: tutor.telefono,
    email: tutor.email ?? "",
    direccion: tutor.direccion ?? "",
    activo: tutor.activo,
  };
}

export default function TutorForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  guardando = false,
  submitLabel = "Guardar tutor",
}: {
  value: TutorFormValues;
  onChange: (value: TutorFormValues) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  guardando?: boolean;
  submitLabel?: string;
}) {
  return (
    <div>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
        <input
          className="input"
          placeholder="Nombre *"
          value={value.nombre}
          onChange={(e) => onChange({ ...value, nombre: e.target.value })}
        />

        <input
          className="input"
          placeholder="RUT"
          value={value.rut}
          onChange={(e) => onChange({ ...value, rut: e.target.value })}
        />

        <input
          className="input"
          placeholder="Teléfono *"
          value={value.telefono}
          onChange={(e) => onChange({ ...value, telefono: e.target.value })}
        />

        <input
          className="input"
          placeholder="Email"
          type="email"
          value={value.email}
          onChange={(e) => onChange({ ...value, email: e.target.value })}
        />

        <input
          className="input sm:col-span-2"
          placeholder="Dirección"
          value={value.direccion}
          onChange={(e) => onChange({ ...value, direccion: e.target.value })}
        />

        <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
          <input
            type="checkbox"
            checked={value.activo}
            onChange={(e) => onChange({ ...value, activo: e.target.checked })}
          />
          Tutor activo
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button onClick={onSubmit} disabled={guardando} className="btn-primary">
          {guardando ? "Guardando..." : submitLabel}
        </button>

        {onCancel && (
          <button onClick={onCancel} className="btn-secondary">
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}