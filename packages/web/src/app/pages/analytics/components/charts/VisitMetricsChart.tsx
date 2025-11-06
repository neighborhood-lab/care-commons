/**
 * Visit Metrics Chart Component
 * Displays visit statistics using a bar chart
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { VisitMetrics } from '@/types/analytics-types';

interface VisitMetricsChartProps {
  data: VisitMetrics;
  className?: string;
}

export function VisitMetricsChart({ data, className = '' }: VisitMetricsChartProps) {
  const chartData = [
    { name: 'Scheduled', value: data.scheduled, color: '#3b82f6' },
    { name: 'Completed', value: data.completed, color: '#10b981' },
    { name: 'In Progress', value: data.inProgress, color: '#f59e0b' },
    { name: 'Missed', value: data.missed, color: '#ef4444' },
  ];

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
            }}
          />
          <Legend />
          <Bar dataKey="value" name="Visits" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
