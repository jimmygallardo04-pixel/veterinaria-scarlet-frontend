"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Opcion } from "@/lib/types";

export const pacienteSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  especie: z.string().min(1, "La especie es obligatoria"),
  raza: z.string().optional(),
  sexo: z.string().min(1, "El sexo es obligatorio"),
  fecha_nacimiento: z.string().optional(),
  color: z.string().optional(),
  esterilizado: z.boolean(),
  chip: z.string().optional(),
  observaciones: z.string().optional(),
  tutor: z.string().min(1, "El tutor es obligatorio"),
  activo: z.boolean(),
});

export type PacienteFormValues = z.infer<typeof pacienteSchema>;

export default function PacienteForm({
  defaultValues,
  onSubmit,
  tutores,
  especies,
  sexos,
  onCancel,
  submitLabel = "Guardar",
}: {
  defaultValues?: Partial<PacienteFormValues>;
  onSubmit: (data: PacienteFormValues) => Promise<void>;
  tutores: Opcion[];
  especies: Opcion[];
  sexos: Opcion[];
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PacienteFormValues>({
    resolver: zodResolver(pacienteSchema),
    defaultValues: {
      nombre: "",
      especie: "",
      raza: "",
      sexo: "",
      fecha_nacimiento: "",
      color: "",
      esterilizado: false,
      chip: "",
      observaciones: "",
      tutor: "",
      activo: true,
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-3 md:grid-cols-2">

        {/* Nombre */}
        <div className="flex flex-col gap-1">
          <input
            className="input"
            placeholder="Nombre *"
            {...register("nombre")}
          />
          {errors.nombre && (
            <span className="text-xs text-red-500">{errors.nombre.message}</span>
          )}
        </div>

        {/* Especie */}
        <div className="flex flex-col gap-1">
          <select className="input" {...register("especie")}>
            <option value="">Seleccionar especie *</option>
            {especies.map((e, i) => (
              <option key={`especie-${e.id ?? i}`} value={String(e.id)}>
                {e.nombre}
              </option>
            ))}
          </select>
          {errors.especie && (
            <span className="text-xs text-red-500">{errors.especie.message}</span>
          )}
        </div>

        {/* Raza */}
        <input
          className="input"
          placeholder="Raza"
          {...register("raza")}
        />

        {/* Sexo */}
        <div className="flex flex-col gap-1">
          <select className="input" {...register("sexo")}>
            <option value="">Seleccionar sexo *</option>
            {sexos.map((s, i) => (
              <option key={`sexo-${s.id ?? i}`} value={String(s.id)}>
                {s.nombre}
              </option>
            ))}
          </select>
          {errors.sexo && (
            <span className="text-xs text-red-500">{errors.sexo.message}</span>
          )}
        </div>

        {/* Fecha nacimiento */}
        <input
          className="input"
          type="date"
          {...register("fecha_nacimiento")}
        />

        {/* Color */}
        <input
          className="input"
          placeholder="Color"
          {...register("color")}
        />

        {/* Tutor */}
        <div className="flex flex-col gap-1">
          <select className="input" {...register("tutor")}>
            <option value="">Seleccionar tutor *</option>
            {tutores.map((t, i) => (
              <option key={`tutor-${t.id ?? i}`} value={String(t.id)}>
                {t.nombre}
              </option>
            ))}
          </select>
          {errors.tutor && (
            <span className="text-xs text-red-500">{errors.tutor.message}</span>
          )}
        </div>

        {/* Chip */}
        <input
          className="input"
          placeholder="Chip"
          {...register("chip")}
        />

        {/* Checkboxes */}
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" {...register("esterilizado")} />
          Esterilizado
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" {...register("activo")} />
          Activo
        </label>

        {/* Observaciones */}
        <textarea
          className="input md:col-span-2"
          placeholder="Observaciones"
          rows={3}
          {...register("observaciones")}
        />
      </div>

      <div className="mt-4 flex gap-2">
        <button className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
