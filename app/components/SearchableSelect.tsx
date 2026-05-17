"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { SEARCH_DEBOUNCE_MS } from "@/lib/constants";

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
  renderSelected,
  className = "",
  name,
}: SearchableSelectProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get selected option
  const selectedOption = useMemo(
    () => options.find((o) => String(o.id) === String(value)),
    [options, value]
  );

  // Debounced search
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset highlighted index when options change
  useEffect(() => {
    setHighlightedIndex(filteredOptions.length > 0 ? 0 : -1);
  }, [filteredOptions]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
      setIsOpen(true);
    },
    []
  );

  const handleSelect = useCallback(
    (option: SearchableOption) => {
      onChange(String(option.id));
      setSearchTerm("");
      setIsOpen(false);
      inputRef.current?.blur();
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen) {
        if (e.key === "ArrowDown" || e.key === "Enter") {
          setIsOpen(true);
          e.preventDefault();
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
            handleSelect(filteredOptions[highlightedIndex]);
          }
          break;
        case "Escape":
          setIsOpen(false);
          inputRef.current?.blur();
          break;
      }
    },
    [isOpen, filteredOptions, highlightedIndex, handleSelect]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange("");
      setSearchTerm("");
    },
    [onChange]
  );

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Render option content
  const renderOptionContent = (option: SearchableOption) => {
    if (renderOption) {
      return renderOption(option);
    }
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

  // Render selected content
  const renderSelectedContent = () => {
    if (!selectedOption) return null;
    if (renderSelected) {
      return renderSelected(selectedOption);
    }
    return (
      <div className="flex flex-col">
        <span className="font-medium text-slate-900 truncate">
          {selectedOption.nombre}
        </span>
        {selectedOption.descripcion && (
          <span className="text-sm text-slate-500 truncate">
            {selectedOption.descripcion}
          </span>
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

      {/* Input/Search field */}
      <div
        className={`
          flex items-center gap-2 px-3 py-2
          border border-slate-300 rounded-lg
          bg-white cursor-text
          focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent
          transition-shadow
          ${disabled ? "bg-slate-100 cursor-not-allowed opacity-60" : ""}
        `}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        <input
          ref={inputRef}
          type="text"
          className="flex-1 min-w-0 bg-transparent outline-none text-slate-900 placeholder:text-slate-400 text-sm"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          onFocus={() => !disabled && setIsOpen(true)}
          disabled={disabled}
          name={name}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        />

        {/* Clear button */}
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Limpiar selección"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Dropdown arrow */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); toggleOpen(); }}
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          disabled={disabled}
          aria-label={isOpen ? "Cerrar" : "Abrir"}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Selected value display (when not searching) */}
      {!searchTerm && selectedOption && !isOpen && (
        <div className="hidden">{renderSelectedContent()}</div>
      )}

      {/* Dropdown */}
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
            filteredOptions.map((option, index) => (
              <div
                key={option.id}
                className={`
                  px-3 py-2 cursor-pointer transition-colors
                  ${
                    index === highlightedIndex
                      ? "bg-green-50 text-green-900"
                      : "hover:bg-slate-50"
                  }
                  ${String(option.id) === String(value) ? "bg-green-100" : ""}
                `}
                onClick={() => handleSelect(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
                role="option"
                aria-selected={String(option.id) === String(value)}
              >
                {renderOptionContent(option)}
              </div>
            ))
          )}
        </div>
      )}

      {/* Hidden select for form submission */}
      {name && (
        <select name={name} value={value || ""} onChange={(e) => onChange(e.target.value)} className="hidden">
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