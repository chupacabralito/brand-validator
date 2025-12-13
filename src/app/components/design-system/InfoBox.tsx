'use client';

import React from 'react';

export type InfoBoxVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

interface InfoBoxProps {
  variant?: InfoBoxVariant;
  children: React.ReactNode;
  className?: string;
}

/**
 * Unified information display box component
 * Matches Domain pricing/WHOIS box patterns with subtle colored variants
 * Usage: <InfoBox variant="neutral">...</InfoBox>
 */
export default function InfoBox({
  variant = 'neutral',
  children,
  className = ''
}: InfoBoxProps) {
  const variants: Record<InfoBoxVariant, string> = {
    neutral: 'bg-gray-800/50 border-gray-700/50',
    success: 'bg-green-900/10 border-green-600/20',
    warning: 'bg-yellow-900/10 border-yellow-600/20',
    danger: 'bg-red-900/10 border-red-600/20',
    info: 'bg-blue-900/10 border-blue-600/20'
  };

  return (
    <div className={`p-3 rounded-lg border ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}
