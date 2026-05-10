'use client';

import * as React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';

interface BookingActivityChartProps {
  data: { date: string; created: number; completed: number; cancelled: number }[];
}

export function BookingActivityChart({ data }: BookingActivityChartProps) {
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-gray-200/50 bg-white/95 backdrop-blur-xl p-3 shadow-xl dark:border-gray-700/50 dark:bg-gray-800/95">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{label}</p>
          {payload.map((entry, i) => (
            <p key={i} className="text-sm flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-600 dark:text-gray-300">{entry.name}:</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" className="dark:opacity-20" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: '#94A3B8' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(val) => {
            const d = new Date(val);
            return d.toLocaleDateString('en-US', { weekday: 'short' });
          }}
        />
        <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          iconType="circle"
          iconSize={8}
        />
        <Bar
          dataKey="created"
          name="Created"
          fill="#3B82F6"
          radius={[4, 4, 0, 0]}
          maxBarSize={24}
        />
        <Bar
          dataKey="completed"
          name="Completed"
          fill="#10B981"
          radius={[4, 4, 0, 0]}
          maxBarSize={24}
        />
        <Bar
          dataKey="cancelled"
          name="Cancelled"
          fill="#EF4444"
          radius={[4, 4, 0, 0]}
          maxBarSize={24}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
