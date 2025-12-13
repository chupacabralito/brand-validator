/**
 * Design Tokens
 *
 * Shared constants for consistent styling across components
 * Single source of truth for colors, spacing, and patterns
 */

export const DesignTokens = {
  // Card Styles
  card: {
    base: 'bg-gray-800/50 rounded-lg border border-gray-700/50',
    hover: 'hover:border-gray-600 hover:bg-gray-800 transition-all',
    padding: {
      compact: 'p-2',
      default: 'p-3',
      large: 'p-4'
    }
  },

  // Status Colors
  status: {
    success: {
      dot: 'bg-green-400',
      badge: 'bg-green-600/20 text-green-400 border-green-600/30',
      box: 'bg-green-900/10 border-green-600/20',
      accent: 'border-l-green-500'
    },
    warning: {
      dot: 'bg-yellow-400',
      badge: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
      box: 'bg-yellow-900/10 border-yellow-600/20',
      accent: 'border-l-yellow-500'
    },
    danger: {
      dot: 'bg-red-400',
      badge: 'bg-red-600/20 text-red-400 border-red-600/30',
      box: 'bg-red-900/10 border-red-600/20',
      accent: 'border-l-red-500'
    },
    info: {
      dot: 'bg-blue-400',
      badge: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
      box: 'bg-blue-900/10 border-blue-600/20',
      accent: 'border-l-blue-500'
    },
    neutral: {
      dot: 'bg-gray-400',
      badge: 'bg-gray-600/20 text-gray-400 border-gray-600/30',
      box: 'bg-gray-800/50 border-gray-700/50',
      accent: 'border-l-gray-500'
    }
  },

  // Button Styles
  button: {
    primary: 'w-full px-6 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2',
    secondary: 'px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors',
    tertiary: 'px-3 py-1.5 bg-gray-700/50 text-gray-400 text-xs font-medium rounded hover:bg-gray-700 transition-colors',
    expand: 'w-full text-xs text-gray-400 hover:text-gray-300 py-2 px-3 rounded-lg border border-gray-700 hover:border-gray-600 bg-gray-800/30 hover:bg-gray-800/50 transition-colors'
  },

  // Typography
  typography: {
    heading: {
      h1: 'text-xl font-bold text-white',
      h2: 'text-lg font-bold text-white',
      h3: 'text-sm font-semibold text-white'
    },
    body: {
      default: 'text-sm text-gray-300',
      small: 'text-xs text-gray-300',
      muted: 'text-xs text-gray-400'
    }
  },

  // Spacing
  spacing: {
    gap: {
      tight: 'gap-2',
      default: 'gap-3',
      relaxed: 'gap-4'
    },
    margin: {
      tight: 'mb-2',
      default: 'mb-4',
      relaxed: 'mb-6'
    }
  },

  // Transitions
  transitions: {
    colors: 'transition-colors',
    all: 'transition-all',
    transform: 'transition-transform'
  }
} as const;
