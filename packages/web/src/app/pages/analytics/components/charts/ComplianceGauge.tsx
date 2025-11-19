/**
 * Compliance Gauge Component
 * Displays compliance percentage as a radial gauge
 */

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface ComplianceGaugeProps {
  value: number; // 0-100 percentage
  label: string;
  className?: string;
}

export function ComplianceGauge({ value, label, className = '' }: ComplianceGaugeProps) {
  // Ensure value is between 0 and 100
  const normalizedValue = Math.max(0, Math.min(100, value));

  // Determine color based on regulatory compliance thresholds
  // ≥95% = compliant (green), 85-94% = warning (yellow), <85% = critical (red)
  const getColor = (val: number) => {
    if (val >= 95) return '#10b981'; // green - meets regulatory standards
    if (val >= 85) return '#f59e0b'; // yellow - below target, needs attention
    return '#ef4444'; // red - critical non-compliance risk
  };

  const color = getColor(normalizedValue);

  const data = [
    { name: 'Completed', value: normalizedValue },
    { name: 'Remaining', value: 100 - normalizedValue },
  ];

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            startAngle={180}
            endAngle={0}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={0}
            dataKey="value"
          >
            <Cell fill={color} />
            <Cell fill="#e5e7eb" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 text-center">
        <div className="text-3xl font-bold" style={{ color }}>
          {normalizedValue.toFixed(1)}%
        </div>
        <div className="text-sm text-gray-600 mt-1">{label}</div>
      </div>
    </div>
  );
}
