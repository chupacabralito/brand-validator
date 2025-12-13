'use client';

interface ExpandButtonProps {
  expanded: boolean;
  onClick: () => void;
  expandedCount?: number;
  expandedLabel?: string;
  collapsedLabel?: string;
  className?: string;
}

/**
 * Unified expand/collapse button component
 * Matches "Show more" patterns across all rails
 * Usage: <ExpandButton expanded={show} onClick={() => setShow(!show)} expandedCount={10} />
 */
export default function ExpandButton({
  expanded,
  onClick,
  expandedCount,
  expandedLabel,
  collapsedLabel,
  className = ''
}: ExpandButtonProps) {
  // Generate default labels
  const defaultCollapsedLabel = expandedCount
    ? `Show ${expandedCount} more ${expandedCount === 1 ? 'item' : 'items'}`
    : 'Show more';
  const defaultExpandedLabel = expandedCount
    ? `Hide ${expandedCount} additional ${expandedCount === 1 ? 'item' : 'items'}`
    : 'Show less';

  return (
    <button
      onClick={onClick}
      className={`mt-3 w-full text-xs text-gray-400 hover:text-gray-300 py-2 px-3 rounded-lg border border-gray-700 hover:border-gray-600 bg-gray-800/30 hover:bg-gray-800/50 transition-colors flex items-center justify-center gap-2 ${className}`}
    >
      <span>{expanded ? (expandedLabel || defaultExpandedLabel) : (collapsedLabel || defaultCollapsedLabel)}</span>
      <svg
        className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}
