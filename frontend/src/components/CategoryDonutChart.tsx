"use client";

import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatINR } from "@/lib/utils";
import type { CategorySpend } from "./SpendAnalytics";

interface Props {
  data: CategorySpend[];
  activeCategory: string | null;
  onCategoryClick: (category: string) => void;
}

const COLORS = ['#0F1E36', '#0ea5e9', '#14b8a6', '#6366f1', '#94a3b8'];

export function CategoryDonutChart({ data, activeCategory, onCategoryClick }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Sort data so the biggest categories get the consistent colors, limit to top 5
  const chartData = useMemo(() => {
    return [...data].sort((a, b) => b.value - a.value).slice(0, 5);
  }, [data]);

  const total = useMemo(() => chartData.reduce((acc, curr) => acc + curr.value, 0), [chartData]);

  if (data.length === 0 || total === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <p className="text-sm text-slate-500">No category data available</p>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-lg font-bold text-[#0F1E36] mb-4">Category Breakdown</h2>
      
      <div className="flex-1 min-h-[200px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="80%"
              stroke="none"
              onClick={(entry: any) => {
                if (entry && entry.name) {
                  onCategoryClick(entry.name as string);
                }
              }}
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {chartData.map((entry, index) => {
                const isActive = activeCategory === entry.name;
                const isHovered = hoveredIndex === index;
                const isFaded = activeCategory ? !isActive : false;
                
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    style={{ 
                      cursor: "pointer",
                      transition: "all 0.2s ease-in-out",
                      opacity: isFaded ? 0.3 : (isHovered ? 0.8 : 1),
                      transform: isHovered ? "scale(1.03)" : "scale(1)",
                      transformOrigin: "center"
                    }}
                  />
                );
              })}
            </Pie>
            <Tooltip 
              formatter={(value: any) => formatINR(Number(value))}
              contentStyle={{ borderRadius: '12px', border: '1px solid rgba(150, 220, 240, 0.4)', background: 'rgba(255, 255, 255, 0.9)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {chartData.map((entry, index) => {
          const isActive = activeCategory === entry.name;
          const isFaded = activeCategory ? !isActive : false;
          
          return (
            <button
              key={entry.name}
              onClick={() => onCategoryClick(entry.name)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all"
              style={{
                opacity: isFaded ? 0.5 : 1,
                background: isActive ? 'rgba(255, 255, 255, 0.5)' : 'transparent'
              }}
            >
              <span 
                className="w-3 h-3 rounded-full shrink-0" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }} 
              />
              <span className="text-sm font-medium text-slate-600 truncate max-w-[100px]">
                {entry.name}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
