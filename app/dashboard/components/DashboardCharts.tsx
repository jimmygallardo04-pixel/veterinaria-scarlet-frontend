"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

type CitaData = {
  fecha: string;
  citas: number;
};

type EspecieData = {
  name: string;
  value: number;
};

// Paleta de colores vibrantes y modernos
const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

interface DashboardChartsProps {
  dataCitas: CitaData[];
  dataEspecies: EspecieData[];
}

export default function DashboardCharts({ dataCitas, dataEspecies }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      
      {/* Gráfico Flujo de Citas */}
      <div className="card p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Flujo de Pacientes</h2>
          <p className="text-sm text-slate-500">Citas atendidas en los últimos días</p>
        </div>
        
        <div className="h-72 w-full">
          {dataCitas.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400">
              No hay datos suficientes
            </div>
          ) : (
            <ResponsiveContainer width="99%" height={280}>
              <BarChart data={dataCitas} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="fecha" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#64748b", fontSize: 12 }} 
                />
                <Tooltip 
                  cursor={{ fill: "#f1f5f9" }}
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                />
                <Bar 
                  dataKey="citas" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]} 
                  barSize={40}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Gráfico Demográfico (Donut) */}
      <div className="card p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Distribución Demográfica</h2>
          <p className="text-sm text-slate-500">Porcentaje de pacientes por especie</p>
        </div>
        
        <div className="h-72 w-full">
          {dataEspecies.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400">
              No hay datos suficientes
            </div>
          ) : (
            <ResponsiveContainer width="99%" height={280}>
              <PieChart>
                <Pie
                  data={dataEspecies}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {dataEspecies.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => <span className="text-slate-700 text-sm">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
}
