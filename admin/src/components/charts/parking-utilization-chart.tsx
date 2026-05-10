'use client';

import * as React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { formatPercentage } from '@/utils';
import { generateColorPalette } from '@/utils';

interface ParkingUtilizationChartProps {
  data: { parking_id: number; parking_name: string; total_slots: number; available_slots: number; occupancy_rate: number }[];
}

export function ParkingUtilizationChart({ data }: ParkingUtilizationChartProps) {
  const colors = generateColorPalette(data.length);

  const chartData = data.map((item, i) => ({
    name: item.parking_name,
    value: Math.round(item.occupancy_rate),
    color: colors[i],
    available: item.available_slots,
    total: item.total_slots,
  }));

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: { name: string; value: number; available: number; total: number; color: string } }[] }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="rounded-xl border border-gray-200/50 bg-white/95 backdrop-blur-xl p-3 shadow-xl dark:border-gray-700/50 dark:bg-gray-800/95">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{d.name}</p>
          <p className="text-xs text-gray-500">Occupancy: <span className="font-semibold">{formatPercentage(d.value)}</span></p>
          <p className="text-xs text-gray-500">Available: <span className="font-semibold">{d.available}/{d.total}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={110}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 16 }}
          iconType="circle"
          iconSize={8}
          formatter={(value: string) => (
            <span className="text-gray-600 dark:text-gray-400">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
