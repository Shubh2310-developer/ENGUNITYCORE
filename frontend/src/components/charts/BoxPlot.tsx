'use client';

import React from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Line,
  Scatter
} from 'recharts';

interface BoxPlotData {
  name: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
}

interface BoxPlotProps {
  data: BoxPlotData[];
  height?: number;
  title?: string;
  color?: string;
}

const BoxPlotItem = (props: any) => {
  const { x, y, width, height, min, q1, median, q3, max, color } = props;

  if (x === undefined || y === undefined) return null;

  const centerX = x + width / 2;

  // Scales for calculating vertical positions
  // Recharts passes 'y' as the top of the bar (q3) and 'height' as q3 - q1
  // We need to map the values to coordinate space
  const yScale = height / (q3 - q1);
  const getCoord = (val: number) => y + (q3 - val) * yScale;

  const yMin = getCoord(min);
  const yQ1 = getCoord(q1);
  const yMedian = getCoord(median);
  const yQ3 = getCoord(q3);
  const yMax = getCoord(max);

  return (
    <g>
      {/* Vertical whisker line */}
      <line x1={centerX} y1={yMax} x2={centerX} y2={yMin} stroke="#1e293b" strokeWidth={1.5} />

      {/* Horizontal whiskers */}
      <line x1={centerX - 10} y1={yMax} x2={centerX + 10} y2={yMax} stroke="#1e293b" strokeWidth={1.5} />
      <line x1={centerX - 10} y1={yMin} x2={centerX + 10} y2={yMin} stroke="#1e293b" strokeWidth={1.5} />

      {/* IQR Box */}
      <rect x={x} y={yQ3} width={width} height={yQ1 - yQ3} fill={color} fillOpacity={0.6} stroke="#1e293b" strokeWidth={1} />

      {/* Median Line */}
      <line x1={x} y1={yMedian} x2={x + width} y2={yMedian} stroke="#ef4444" strokeWidth={2} />
    </g>
  );
};

export const BoxPlot: React.FC<BoxPlotProps> = ({
  data,
  height = 400,
  title,
  color = '#3b82f6'
}) => {
  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} />
          <YAxis axisLine={false} tickLine={false} />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload;
                return (
                  <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg text-sm">
                    <p className="font-bold mb-1">{d.name}</p>
                    <p className="text-gray-600">Max: <span className="font-mono">{d.max}</span></p>
                    <p className="text-blue-600 font-medium">Q3: <span className="font-mono">{d.q3}</span></p>
                    <p className="text-red-600 font-bold">Median: <span className="font-mono">{d.median}</span></p>
                    <p className="text-blue-600 font-medium">Q1: <span className="font-mono">{d.q1}</span></p>
                    <p className="text-gray-600">Min: <span className="font-mono">{d.min}</span></p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="q3"
            shape={(props: any) => <BoxPlotItem {...props} color={color} />}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
