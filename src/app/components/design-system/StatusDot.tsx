'use client';

export type StatusDotType = 'success' | 'warning' | 'danger' | 'info';

interface StatusDotProps {
  status: StatusDotType;
  className?: string;
}

/**
 * Unified status indicator dot component
 * Matches Domain and Social rail patterns
 * Usage: <StatusDot status="success" />
 */
export default function StatusDot({ status, className = '' }: StatusDotProps) {
  const colors: Record<StatusDotType, string> = {
    success: 'bg-green-400',
    warning: 'bg-yellow-400',
    danger: 'bg-red-400',
    info: 'bg-blue-400'
  };

  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${colors[status]} ${className}`}
      aria-label={`${status} status`}
    />
  );
}
