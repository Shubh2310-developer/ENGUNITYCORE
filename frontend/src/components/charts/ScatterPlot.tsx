'use client';

import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ScatterPlotProps {
  data: Array<{ x: number; y: number; [key: string]: any }>;
  xKey?: string;
  yKey?: string;
  color?: string;
  height?: number;
  title?: string;
}

export const ScatterPlot: React.FC<ScatterPlotProps> = ({
  data,
  xKey = 'x',
  yKey = 'y',
  color = '#8884d8',
  height = 400,
  title
}) => {
  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" dataKey={xKey} name={xKey} />
          <YAxis type="number" dataKey={yKey} name={yKey} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Legend />
          <Scatter name="Data Points" data={data} fill={color} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};
