'use client';

export type StatusBadgeType = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

interface StatusBadgeProps {
  status: StatusBadgeType;
  label: string;
  className?: string;
}

/**
 * Unified status badge component
 * Matches Domain and Social rail badge patterns
 * Usage: <StatusBadge status="success" label="Available" />
 */
export default function StatusBadge({ status, label, className = '' }: StatusBadgeProps) {
  const colors: Record<StatusBadgeType, string> = {
    success: 'bg-green-600/20 text-green-400 border-green-600/30',
    warning: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
    danger: 'bg-red-600/20 text-red-400 border-red-600/30',
    neutral: 'bg-gray-600/20 text-gray-400 border-gray-600/30',
    info: 'bg-blue-600/20 text-blue-400 border-blue-600/30'
  };

  return (
    <span
      className={`px-2 py-0.5 text-xs rounded-full font-medium whitespace-nowrap border ${colors[status]} ${className}`}
    >
      {label}
    </span>
  );
}
