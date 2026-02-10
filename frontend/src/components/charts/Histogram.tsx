'use client';

import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface HistogramProps {
  data: Array<{ range: string; count: number }>;
  height?: number;
  title?: string;
  color?: string;
}

export const Histogram: React.FC<HistogramProps> = ({
  data,
  height = 400,
  title,
  color = '#8884d8'
}) => {
  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="range" label={{ value: 'Range', position: 'insideBottom', offset: -5 }} />
          <YAxis label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill={color} name="Frequency" />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};
