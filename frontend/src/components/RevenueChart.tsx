'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface RevenueData {
  date: string;
  parqueadero: number;
  lavadero: number;
}

interface RevenueChartProps {
  data: RevenueData[];
  chartType?: 'bar' | 'line';
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data, chartType = 'bar' }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      notation: 'compact',
      compactDisplay: 'short'
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-lg p-4 shadow-xl">
          <p className="text-white font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
          <div className="border-t border-slate-600 mt-2 pt-2">
            <p className="text-white font-semibold text-sm">
              Total: {formatCurrency(payload[0].value + payload[1].value)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 shadow-2xl">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">📊 Comparativa de Ingresos</h3>
        <p className="text-slate-400">Parqueadero vs Lavadero</p>
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        {chartType === 'bar' ? (
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <Bar 
              dataKey="parqueadero" 
              name="Parqueadero" 
              fill="#8b5cf6" 
              radius={[8, 8, 0, 0]}
            />
            <Bar 
              dataKey="lavadero" 
              name="Lavadero" 
              fill="#3b82f6" 
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        ) : (
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <Line 
              type="monotone"
              dataKey="parqueadero" 
              name="Parqueadero" 
              stroke="#8b5cf6"
              strokeWidth={3}
              dot={{ fill: '#8b5cf6', r: 6 }}
              activeDot={{ r: 8 }}
            />
            <Line 
              type="monotone"
              dataKey="lavadero" 
              name="Lavadero" 
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 6 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;
