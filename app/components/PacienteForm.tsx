"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import SearchableSelect, {
  type SearchableOption,
} from "@/app/components/SearchableSelect";
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

export type PacienteFormValues =
  z.infer<typeof pacienteSchema>;

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
  onSubmit: (
    data: PacienteFormValues
  ) => Promise<void>;

  tutores: Opcion[];
  especies: Opcion[];
  sexos: Opcion[];

  onCancel?: () => void;
  submitLabel?: string;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<PacienteFormValues>({
    resolver:
      zodResolver(pacienteSchema),

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

  const especieValue =
    watch("especie");

  const sexoValue =
    watch("sexo");

  const tutorValue =
    watch("tutor");

  const activoValue =
    watch("activo");

  const esterilizadoValue =
    watch("esterilizado");

  const especiesOptions:
    SearchableOption[] =
    especies.map((e) => ({
      id: e.id,
      nombre: e.nombre,
    }));

  const sexosOptions =
    sexos.map((s) => ({
      id: s.id,
      nombre: s.nombre,
    }));

  const tutoresOptions =
    tutores.map((t) => ({
      id: t.id,
      nombre: t.nombre,
    }));

  return (
    <form
      onSubmit={
        handleSubmit(onSubmit)
      }
    >
      <div className="grid gap-3 md:grid-cols-2">

        <input
          className="input"
          placeholder="Nombre *"
          {...register("nombre")}
        />

        <SearchableSelect
          label="Especie *"
          options={
            especiesOptions
          }
          value={especieValue}
          onChange={(v) =>
            setValue(
              "especie",
              v
            )
          }
          placeholder="Buscar especie..."
        />

        <input
          className="input"
          placeholder="Raza"
          {...register("raza")}
        />

        <SearchableSelect
          label="Sexo *"
          options={
            sexosOptions
          }
          value={sexoValue}
          onChange={(v) =>
            setValue(
              "sexo",
              v
            )
          }
          placeholder="Buscar sexo..."
        />

        <input
          className="input"
          type="date"
          {...register(
            "fecha_nacimiento"
          )}
        />

        <input
          className="input"
          placeholder="Color"
          {...register("color")}
        />

        <SearchableSelect
          label="Tutor *"
          options={
            tutoresOptions
          }
          value={tutorValue}
          onChange={(v) =>
            setValue(
              "tutor",
              v
            )
          }
          placeholder="Buscar tutor..."
        />

        <input
          className="input"
          placeholder="Chip"
          {...register("chip")}
        />

        <label>
          <input
            type="checkbox"
            checked={
              esterilizadoValue
            }
            {...register(
              "esterilizado"
            )}
          />
          Esterilizado
        </label>

        <label>
          <input
            type="checkbox"
            checked={
              activoValue
            }
            {...register(
              "activo"
            )}
          />
          Activo
        </label>

        <textarea
          className="
            input
            md:col-span-2
          "
          placeholder="
            Observaciones
          "
          {...register(
            "observaciones"
          )}
        />
      </div>

      <div className="
        mt-4
        flex
        gap-2
      ">
        <button
          className="
            btn-primary
          "
          disabled={
            isSubmitting
          }
        >
          {
            isSubmitting
              ? "Guardando..."
              : submitLabel
          }
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={
              onCancel
            }
            className="
              btn-secondary
            "
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}