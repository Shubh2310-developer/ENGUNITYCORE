'use client';

import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BarChartProps {
  data: any[];
  xKey: string;
  yKeys: string[];
  colors?: string[];
  height?: number;
  title?: string;
  horizontal?: boolean;
}

const DEFAULT_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

export const BarChart: React.FC<BarChartProps> = ({
  data,
  xKey,
  yKeys,
  colors = DEFAULT_COLORS,
  height = 400,
  title,
  horizontal = false
}) => {
  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          {horizontal ? (
            <>
              <XAxis type="number" />
              <YAxis dataKey={xKey} type="category" />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} />
              <YAxis />
            </>
          )}
          <Tooltip />
          <Legend />
          {yKeys.map((key, index) => (
            <Bar key={key} dataKey={key} fill={colors[index % colors.length]} />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};
