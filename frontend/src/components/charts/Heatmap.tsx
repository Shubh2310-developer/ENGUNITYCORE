'use client';

import React from 'react';

interface HeatmapProps {
  data: Array<{ x: string; y: string; value: number }>;
  height?: number | string;
  title?: string;
}

export const Heatmap: React.FC<HeatmapProps> = ({ data, height, title }) => {
  // Get unique x and y values
  const xValues = Array.from(new Set(data.map(d => d.x)));
  const yValues = Array.from(new Set(data.map(d => d.y)));
  
  // Find min and max values for color scaling
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  
  // Color scale function
  const getColor = (value: number) => {
    if (maxValue === minValue) return 'rgba(59, 130, 246, 0.5)';
    const normalized = (value - minValue) / (maxValue - minValue);

    // Using a more professional color scale (Blue-Slate-Red)
    if (normalized < 0.5) {
      // Blue to light
      const intensity = normalized * 2;
      return `rgba(59, 130, 246, ${0.1 + intensity * 0.9})`;
    } else {
      // Light to red
      const intensity = (normalized - 0.5) * 2;
      return `rgba(239, 68, 68, ${0.1 + intensity * 0.9})`;
    }
  };

  // Create a map for quick lookup
  const dataMap = new Map(data.map(d => [`${d.x}-${d.y}`, d.value]));

  return (
    <div className="w-full h-full flex flex-col">
      {title && <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>}
      <div className="overflow-auto border border-gray-100 rounded-xl bg-gray-50/30 shadow-inner p-2 custom-scrollbar flex-1" style={{ maxHeight: height ? (typeof height === 'number' ? `${height}px` : height) : '400px' }}>
        <table className="border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="p-2 sticky left-0 top-0 bg-white z-20 min-w-[120px]"></th>
              {xValues.map(x => (
                <th key={x} className="p-2 sticky top-0 bg-white z-10 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center min-w-[80px]">
                  <div className="truncate w-20 mx-auto" title={x}>{x}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {yValues.map(y => (
              <tr key={y}>
                <td className="p-2 sticky left-0 bg-white z-10 text-[10px] font-bold text-gray-500 uppercase tracking-tight border-r border-gray-50">
                  <div className="truncate w-28" title={y}>{y}</div>
                </td>
                {xValues.map(x => {
                  const value = dataMap.get(`${x}-${y}`) || 0;
                  const color = getColor(value);
                  const isIntense = Math.abs((value - minValue) / (maxValue - minValue) - 0.5) > 0.3;

                  return (
                    <td
                      key={`${x}-${y}`}
                      className="p-3 text-center text-xs font-mono rounded-md transition-all hover:scale-105 hover:z-20 cursor-default shadow-sm"
                      style={{
                        backgroundColor: color,
                        color: isIntense ? 'white' : 'black',
                      }}
                      title={`${x} vs ${y}: ${value.toFixed(4)}`}
                    >
                      {value.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 flex items-center justify-center">
        <div className="flex items-center gap-3 px-4 py-2 bg-white border border-gray-100 rounded-full shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase">{minValue.toFixed(1)}</span>
          <div className="w-32 h-2 rounded-full" style={{ background: 'linear-gradient(to right, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 1), rgba(239, 68, 68, 1))' }}></div>
          <span className="text-[10px] font-bold text-gray-400 uppercase">{maxValue.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
};
