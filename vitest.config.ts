import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // No forzamos jsdom — los tests actuales son unitarios puros (fast-check)
    // y no necesitan un entorno de browser. Si en el futuro se añaden tests
    // de componentes React, instalar @vitest/browser o jsdom y descomentar:
    // environment: "jsdom",

    // Patrones de archivos de test
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next"],

    // Cobertura de código
    // Ejecutar con: npm run test -- --coverage
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      // Umbrales mínimos — el build falla si no se alcanzan
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
      include: ["lib/**/*.ts"],
      exclude: [
        "lib/index.ts",   // barrel export — no tiene lógica propia
        "**/*.d.ts",
      ],
    },

    // Timeout por test (ms)
    testTimeout: 10_000,
  },

  resolve: {
    alias: {
      // Mismo alias que usa Next.js para @/
      "@": path.resolve(__dirname, "."),
    },
  },
});
