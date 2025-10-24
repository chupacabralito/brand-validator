'use client';

import { useState } from 'react';
import { CompositeScoreResult } from '@/lib/services/compositeScore';

interface CompositeScoreBarProps {
  compositeResult: CompositeScoreResult | null;
  isLoading: boolean;
}

export default function CompositeScoreBar({ compositeResult, isLoading }: CompositeScoreBarProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400 bg-green-600/20 border-green-600/30';
    if (score >= 70) return 'text-blue-400 bg-blue-600/20 border-blue-600/30';
    if (score >= 50) return 'text-yellow-400 bg-yellow-600/20 border-yellow-600/30';
    return 'text-red-400 bg-red-600/20 border-red-600/30';
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'fair': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // Always render the component, even if no data
  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-800 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Brand Score</h3>
              <p className="text-sm text-gray-400">Calculating overall brand strength...</p>
            </div>
          </div>
          <div className="animate-pulse">
            <div className="h-8 w-16 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!compositeResult) {
    return (
      <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-800 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Brand Score</h3>
              <p className="text-sm text-gray-400">Complete a search to see your brand score</p>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-500">--</div>
            <div className="text-xs text-gray-400">/100</div>
          </div>
        </div>
      </div>
    );
  }

  const brandIcon = (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );

  return (
    <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-800 p-6 mb-8">
      <div className="flex items-center justify-between">
        {/* Left side - Brand Score */}
        <div className="flex items-center">
          <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center mr-4">
            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Brand Score</h3>
            <p className="text-sm text-gray-400">Overall brand strength assessment</p>
          </div>
        </div>

        {/* Center - Score and Recommendation */}
        <div className="flex items-center space-x-6">
          <div className="text-center relative">
            <div className={`text-2xl font-bold px-4 py-2 rounded-lg border ${getScoreColor(compositeResult.overallScore)}`}>
              {compositeResult.overallScore}
            </div>
            <div className="text-xs text-gray-400 mt-1">/100</div>
            {/* Tooltip trigger */}
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="absolute -top-1 -right-1 w-5 h-5 bg-gray-600 hover:bg-gray-500 rounded-full flex items-center justify-center transition-colors"
              title="Show score breakdown"
            >
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
          <div className="text-center">
            <div className={`text-lg font-semibold capitalize ${getRecommendationColor(compositeResult.recommendation)}`}>
              {compositeResult.recommendation}
            </div>
            <div className="text-xs text-gray-400">Assessment</div>
          </div>
        </div>

        {/* Right side - Score Breakdown (only show when breakdown is toggled) */}
        {showBreakdown && (
          <div className="flex items-center space-x-6">
            {/* Domain Score */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-white">Domain</span>
              </div>
              <div className="text-lg font-bold text-blue-400">{compositeResult.breakdown.domain.score}</div>
              <div className="text-xs text-gray-400">/100</div>
            </div>

            {/* Social Score */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <div className="w-3 h-3 bg-pink-600 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-white">Social</span>
              </div>
              <div className="text-lg font-bold text-pink-400">{compositeResult.breakdown.social.score}</div>
              <div className="text-xs text-gray-400">/100</div>
            </div>

            {/* Trademark Score */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <div className="w-3 h-3 bg-purple-600 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-white">Trademark</span>
              </div>
              <div className="text-lg font-bold text-purple-400">{compositeResult.breakdown.trademark.score}</div>
              <div className="text-xs text-gray-400">/100</div>
            </div>

            {/* Name Quality Score */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <div className="w-3 h-3 bg-green-600 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-white">Name</span>
              </div>
              <div className="text-lg font-bold text-green-400">{compositeResult.breakdown.brand.score}</div>
              <div className="text-xs text-gray-400">/100</div>
            </div>
          </div>
        )}
      </div>

      {/* Score Calculation Breakdown - only show when breakdown is toggled */}
      {showBreakdown && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="mb-3">
            <h4 className="text-sm font-medium text-white mb-2">Score Calculation</h4>
            <div className="grid grid-cols-4 gap-4 text-xs">
              <div className="text-center">
                <div className="text-blue-400 font-medium">Domain</div>
                <div className="text-gray-300">{compositeResult.breakdown.domain.score} × 25%</div>
                <div className="text-gray-400">= {Math.round(compositeResult.breakdown.domain.score * 0.25)}</div>
              </div>
              <div className="text-center">
                <div className="text-pink-400 font-medium">Social</div>
                <div className="text-gray-300">{compositeResult.breakdown.social.score} × 20%</div>
                <div className="text-gray-400">= {Math.round(compositeResult.breakdown.social.score * 0.20)}</div>
              </div>
              <div className="text-center">
                <div className="text-purple-400 font-medium">Trademark</div>
                <div className="text-gray-300">{compositeResult.breakdown.trademark.score} × 30%</div>
                <div className="text-gray-400">= {Math.round(compositeResult.breakdown.trademark.score * 0.30)}</div>
              </div>
              <div className="text-center">
                <div className="text-green-400 font-medium">Name</div>
                <div className="text-gray-300">{compositeResult.breakdown.brand.score} × 25%</div>
                <div className="text-gray-400">= {Math.round(compositeResult.breakdown.brand.score * 0.25)}</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-600 text-center">
              <div className="text-sm text-gray-300">
                Total: {Math.round(compositeResult.breakdown.domain.score * 0.25 + compositeResult.breakdown.social.score * 0.20 + compositeResult.breakdown.trademark.score * 0.30 + compositeResult.breakdown.brand.score * 0.25)}/100
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Summary - always show */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-sm text-gray-300">{compositeResult.summary}</p>
      </div>
    </div>
  );
}
