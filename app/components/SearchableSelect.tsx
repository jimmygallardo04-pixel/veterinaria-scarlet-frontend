"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";

export interface SearchableOption {
  id: number | string;
  nombre: string;
  descripcion?: string;
  infoAdicional?: string;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: string | number | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  searchFields?: Array<keyof SearchableOption>;
  renderOption?: (option: SearchableOption) => React.ReactNode;
  renderSelected?: (option: SearchableOption) => React.ReactNode;
  className?: string;
  name?: string;
}

/** Devuelve true solo si value es un ID real (no vacío, no null, no 0) */
function hasValue(v: string | number | null | undefined): boolean {
  return v != null && v !== "" && v !== 0;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Buscar...",
  emptyMessage = "No se encontraron resultados",
  label,
  required = false,
  disabled = false,
  searchFields = ["nombre", "descripcion"],
  renderOption,
  className = "",
  name,
}: SearchableSelectProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Opción seleccionada — solo cuando value es un ID real
  const selectedOption = useMemo(() => {
    if (!hasValue(value)) return undefined;
    return options.find((o) => String(o.id) === String(value));
  }, [options, value]);

  // Opciones filtradas por búsqueda
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const term = searchTerm.toLowerCase().trim();
    return options.filter((option) =>
      searchFields.some((field) => {
        const fieldValue = option[field];
        if (fieldValue == null) return false;
        return String(fieldValue).toLowerCase().includes(term);
      })
    );
  }, [options, searchTerm, searchFields]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openDropdown = useCallback(() => {
    if (disabled) return;
    setSearchTerm("");
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [disabled]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setSearchTerm("");
  }, []);

  const handleSelect = useCallback(
    (option: SearchableOption) => {
      onChange(String(option.id));
      setSearchTerm("");
      setIsOpen(false);
    },
    [onChange]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange("");
      setSearchTerm("");
      setIsOpen(false);
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        closeDropdown();
        inputRef.current?.blur();
      }
    },
    [closeDropdown]
  );

  // Lo que muestra el input:
  // - Abierto: texto de búsqueda (vacío al abrir, el usuario escribe)
  // - Cerrado con selección: nombre de la opción seleccionada
  // - Cerrado sin selección: vacío → muestra placeholder
  const inputDisplayValue = isOpen
    ? searchTerm
    : selectedOption
    ? selectedOption.nombre
    : "";

  const renderOptionContent = (option: SearchableOption) => {
    if (renderOption) return renderOption(option);
    return (
      <div className="flex flex-col">
        <span className="font-medium text-slate-900">{option.nombre}</span>
        {option.descripcion && (
          <span className="text-sm text-slate-500">{option.descripcion}</span>
        )}
        {option.infoAdicional && (
          <span className="text-xs text-slate-400 mt-0.5">{option.infoAdicional}</span>
        )}
      </div>
    );
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-medium text-slate-500 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Campo de entrada */}
      <div
        className={`
          flex items-center gap-2 px-3 py-2
          border rounded-lg bg-white cursor-text
          transition-shadow
          ${isOpen ? "ring-2 ring-green-500 border-transparent" : "border-slate-300"}
          ${disabled ? "bg-slate-100 cursor-not-allowed opacity-60" : ""}
        `}
        onClick={() => !disabled && !isOpen && openDropdown()}
      >
        <input
          ref={inputRef}
          type="text"
          className="flex-1 min-w-0 bg-transparent outline-none text-slate-900 placeholder:text-slate-400 text-sm"
          placeholder={placeholder}
          value={inputDisplayValue}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => !disabled && !isOpen && openDropdown()}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        />

        {/* Botón limpiar — solo si hay valor seleccionado */}
        {hasValue(value) && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition-colors flex-shrink-0"
            aria-label="Limpiar selección"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Flecha */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            isOpen ? closeDropdown() : openDropdown();
          }}
          className={`text-slate-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
          disabled={disabled}
          aria-label={isOpen ? "Cerrar" : "Abrir"}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Lista desplegable */}
      {isOpen && (
        <div
          className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto"
          role="listbox"
        >
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-4 text-center text-slate-500 text-sm">
              {emptyMessage}
            </div>
          ) : (
            filteredOptions.map((option, index) => {
              // isSelected: true SOLO si hay un value real y coincide con esta opción
              const isSelected =
                hasValue(value) && String(option.id) === String(value);

              return (
                <div
                  key={`option-${option.id}-${index}`}
                  className={`
                    px-3 py-2 cursor-pointer transition-colors flex items-center gap-2
                    ${isSelected ? "bg-green-100 hover:bg-green-100" : "hover:bg-slate-50"}
                  `}
                  onClick={() => handleSelect(option)}
                  role="option"
                  aria-selected={isSelected}
                >
                  {/* Checkmark solo en la opción seleccionada */}
                  <span
                    className={`flex-shrink-0 w-4 h-4 ${
                      isSelected ? "text-green-600" : "text-transparent"
                    }`}
                  >
                    <svg viewBox="0 0 16 16" fill="currentColor">
                      <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" />
                    </svg>
                  </span>
                  <div className="flex-1 min-w-0">
                    {renderOptionContent(option)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Select oculto para formularios nativos */}
      {name && (
        <select
          name={name}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="hidden"
          aria-hidden="true"
        >
          <option value="">Seleccionar</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.nombre}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
