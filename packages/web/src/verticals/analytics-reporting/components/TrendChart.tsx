/**
 * Trend Chart Component
 * Line charts for displaying trends over time using Recharts
 */

import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/core/components/index.js';

export interface TrendDataPoint {
  label: string;
  [key: string]: string | number;
}

interface TrendChartProps {
  title: string;
  data: TrendDataPoint[];
  lines: Array<{
    dataKey: string;
    name: string;
    color: string;
  }>;
  chartType?: 'line' | 'area';
  height?: number;
  valueFormatter?: (value: number) => string;
  isLoading?: boolean;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  title,
  data,
  lines,
  chartType = 'line',
  height = 300,
  valueFormatter,
  isLoading = false,
}) => {
  const formatValue = (value: number) => {
    if (valueFormatter) {
      return valueFormatter(value);
    }
    return value.toLocaleString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-semibold text-gray-900">
                {formatValue(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <Card.Header title={title} />
        <Card.Content>
          <div
            className="animate-pulse bg-gray-200 rounded"
            style={{ height: `${height}px` }}
          ></div>
        </Card.Content>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <Card.Header title={title} />
        <Card.Content>
          <div
            className="flex items-center justify-center text-gray-500"
            style={{ height: `${height}px` }}
          >
            No data available
          </div>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header title={title} />
      <Card.Content>
        <ResponsiveContainer width="100%" height={height}>
          {chartType === 'area' ? (
            <AreaChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="label"
                stroke="#6b7280"
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <YAxis
                stroke="#6b7280"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickFormatter={formatValue}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              {lines.map((line) => (
                <Area
                  key={line.dataKey}
                  type="monotone"
                  dataKey={line.dataKey}
                  name={line.name}
                  stroke={line.color}
                  fill={line.color}
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          ) : (
            <LineChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="label"
                stroke="#6b7280"
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <YAxis
                stroke="#6b7280"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickFormatter={formatValue}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              {lines.map((line) => (
                <Line
                  key={line.dataKey}
                  type="monotone"
                  dataKey={line.dataKey}
                  name={line.name}
                  stroke={line.color}
                  strokeWidth={2}
                  dot={{ fill: line.color, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </Card.Content>
    </Card>
  );
};
