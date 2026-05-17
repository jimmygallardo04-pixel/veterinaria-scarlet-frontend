"use client";

import { useState, useEffect } from "react";

interface MinimizableSectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
  icon?: string;
  persistent?: boolean;
  onMinimize?: (isMinimized: boolean) => void;
}

export default function MinimizableSection({
  id,
  title,
  children,
  icon = "⬇️",
  persistent = true,
  onMinimize,
}: MinimizableSectionProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  const storageKey = `minimized_${id}`;

  useEffect(() => {
    if (persistent && typeof window !== "undefined") {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        const minimized = stored === "true";
        setIsMinimized(minimized);
      }
    }
  }, [id, persistent, storageKey]);

  const toggleMinimize = () => {
    const newState = !isMinimized;
    setIsMinimized(newState);

    if (persistent) {
      localStorage.setItem(storageKey, String(newState));
    }

    onMinimize?.(newState);
  };

  return (
    <section className="card">
      <div className="flex items-center justify-between gap-4">
        <h2 className="subtitle">{title}</h2>
        <button
          onClick={toggleMinimize}
          aria-label={isMinimized ? "Expandir" : "Minimizar"}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-900"
          title={isMinimized ? "Expandir sección" : "Minimizar sección"}
        >
          <svg
            className={`w-5 h-5 transition-transform duration-200 ${
              isMinimized ? "rotate-90" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </button>
      </div>

      {!isMinimized && (
        <div className="mt-4 animate-fadeIn">
          {children}
        </div>
      )}

      {isMinimized && (
        <p className="text-xs text-slate-400 mt-2">Sección minimizada</p>
      )}
    </section>
  );
}
