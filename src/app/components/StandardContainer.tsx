'use client';

import React from 'react';

interface StandardContainerProps {
  icon: React.ReactNode;
  title: string;           // H1 - Main title
  score?: string;          // H2 - Overarching score/assessment
  scoreColor?: 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'orange';
  children: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'indigo' | 'pink';
  className?: string;
}

const colorClasses = {
  blue: {
    iconBg: 'bg-blue-600/20',
    iconColor: 'text-blue-400',
    scoreBg: 'bg-blue-600/10',
    scoreText: 'text-blue-300'
  },
  green: {
    iconBg: 'bg-green-600/20',
    iconColor: 'text-green-400',
    scoreBg: 'bg-green-600/10',
    scoreText: 'text-green-300'
  },
  purple: {
    iconBg: 'bg-purple-600/20',
    iconColor: 'text-purple-400',
    scoreBg: 'bg-purple-600/10',
    scoreText: 'text-purple-300'
  },
  orange: {
    iconBg: 'bg-orange-600/20',
    iconColor: 'text-orange-400',
    scoreBg: 'bg-orange-600/10',
    scoreText: 'text-orange-300'
  },
  indigo: {
    iconBg: 'bg-indigo-600/20',
    iconColor: 'text-indigo-400',
    scoreBg: 'bg-indigo-600/10',
    scoreText: 'text-indigo-300'
  },
  pink: {
    iconBg: 'bg-pink-600/20',
    iconColor: 'text-pink-400',
    scoreBg: 'bg-pink-600/10',
    scoreText: 'text-pink-300'
  }
};

const scoreColorClasses = {
  green: 'text-green-400',
  yellow: 'text-yellow-400',
  red: 'text-red-400',
  blue: 'text-blue-400',
  purple: 'text-purple-400',
  orange: 'text-orange-400'
};

function StandardContainer({ 
  icon, 
  title, 
  score, 
  scoreColor = 'blue',
  children, 
  color,
  className = ''
}: StandardContainerProps) {
  const colors = colorClasses[color];
  const scoreTextColor = scoreColorClasses[scoreColor];

  return (
    <div className={`bg-gray-900 rounded-xl shadow-lg border border-gray-800 p-6 ${className}`}>
      {/* H1 - Logo and Title */}
      <div className="flex items-center mb-4">
        <div className={`w-10 h-10 ${colors.iconBg} rounded-lg flex items-center justify-center mr-3`}>
          <div className={`w-6 h-6 ${colors.iconColor}`}>
            {icon}
          </div>
        </div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
      </div>
      
      {/* H2 - Overarching Score/Assessment */}
      {score && (
        <div className={`mb-6 p-4 ${colors.scoreBg} rounded-lg border border-gray-700`}>
          <h2 className={`text-2xl font-bold ${scoreTextColor}`}>
            {score}
          </h2>
        </div>
      )}

      {/* H3 - Details and Additional Configurations */}
      {children}
    </div>
  );
}

export default StandardContainer;
