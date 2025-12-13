'use client';

import React from 'react';

export type ItemCardAccent = 'success' | 'warning' | 'danger' | 'info';

interface ItemCardProps {
  children: React.ReactNode;
  accentColor?: ItemCardAccent;
  onClick?: () => void;
  className?: string;
}

/**
 * Unified card component for list items
 * Matches Domain and Social rail card patterns with optional border-left accent
 * Usage: <ItemCard accentColor="danger">...</ItemCard>
 */
export default function ItemCard({
  children,
  accentColor,
  onClick,
  className = ''
}: ItemCardProps) {
  const accents: Record<ItemCardAccent, string> = {
    success: 'border-l-green-500',
    warning: 'border-l-yellow-500',
    danger: 'border-l-red-500',
    info: 'border-l-blue-500'
  };

  const accent = accentColor ? `border-l-2 ${accents[accentColor]}` : '';
  const cursor = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-gray-600 hover:bg-gray-800 transition-all ${accent} ${cursor} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
