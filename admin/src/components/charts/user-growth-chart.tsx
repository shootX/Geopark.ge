'use client';

import * as React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { formatNumber } from '@/utils';

interface UserGrowthChartProps {
  data: { date: string; total: number; new_users: number }[];
}

export function UserGrowthChart({ data }: UserGrowthChartProps) {
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-gray-200/50 bg-white/95 backdrop-blur-xl p-3 shadow-xl dark:border-gray-700/50 dark:bg-gray-800/95">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
          {payload.map((entry, i) => (
            <p key={i} className="text-sm flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-600 dark:text-gray-300">{entry.name}:</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{formatNumber(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" className="dark:opacity-20" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: '#94A3B8' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(val) => {
            const d = new Date(val);
            return d.toLocaleDateString('en-US', { month: 'short' });
          }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#94A3B8' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(val) => formatNumber(val)}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="total"
          name="Total Users"
          stroke="#8B5CF6"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#8B5CF6', stroke: '#fff', strokeWidth: 2 }}
        />
        <Line
          type="monotone"
          dataKey="new_users"
          name="New Users"
          stroke="#F59E0B"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
