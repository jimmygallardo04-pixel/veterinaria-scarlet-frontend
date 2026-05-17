"use client";

import { useEffect, useRef, useState } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** Si se provee, requiere que el usuario escriba esta palabra exactamente antes de habilitar el botón */
  requireKeyword?: string;
}

/**
 * Diálogo de confirmación accesible.
 * Reemplaza el confirm() nativo del browser.
 *
 * Uso:
 *   const [open, setOpen] = useState(false);
 *   <ConfirmDialog
 *     open={open}
 *     title="Eliminar paciente"
 *     message="Esta acción no se puede deshacer."
 *     danger
 *     requireKeyword="ELIMINAR"
 *     onConfirm={() => { eliminar(); setOpen(false); }}
 *     onCancel={() => setOpen(false)}
 *   />
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  onConfirm,
  onCancel,
  requireKeyword,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [inputValue, setInputValue] = useState("");

  // Limpiar input cuando se abre/cierra
  useEffect(() => {
    if (open) {
      setInputValue("");
      // Foco automático en el input si hay keyword, si no, en cancelar
      setTimeout(() => {
        if (requireKeyword) {
          inputRef.current?.focus();
        } else {
          cancelRef.current?.focus();
        }
      }, 50);
    }
  }, [open, requireKeyword]);

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  const keywordMatch = requireKeyword 
    ? inputValue.trim().toLowerCase() === requireKeyword.toLowerCase()
    : true;

  const isConfirmDisabled = requireKeyword ? !keywordMatch : false;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="text-lg font-semibold text-slate-900 mb-2">
          {title}
        </h2>

        <p className="text-sm text-slate-600 mb-4">{message}</p>

        {requireKeyword && (
          <div className="mb-6">
            <label htmlFor="confirm-keyword" className="block text-sm font-medium text-slate-700 mb-1">
              Por favor escribe <strong className="select-none">{requireKeyword}</strong> para confirmar:
            </label>
            <input
              ref={inputRef}
              id="confirm-keyword"
              type="text"
              className="input w-full"
              autoComplete="off"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={requireKeyword}
              onKeyDown={(e) => {
                if (e.key === "Enter" && keywordMatch) {
                  e.preventDefault();
                  onConfirm();
                }
              }}
            />
          </div>
        )}

        <div className={`flex justify-end gap-3 ${!requireKeyword ? "mt-6" : ""}`}>
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="btn-secondary"
          >
            {cancelLabel}
          </button>

          <button
            onClick={onConfirm}
            disabled={isConfirmDisabled}
            className={`${danger ? "btn-danger-solid" : "btn-primary"} ${
              isConfirmDisabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
