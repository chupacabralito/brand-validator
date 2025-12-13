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
      {/* Main Score Row - Always Stable */}
      <div className="flex items-center justify-between mb-4">
        {/* Left side - Brand Score */}
        <div className="flex items-center">
          <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center mr-4">
            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Overall Brand Score</h3>
            <p className="text-sm text-gray-400">Weighted average of all components</p>
          </div>
        </div>

        {/* Right side - Score and Recommendation */}
        <div className="flex items-center space-x-6">
          <div className="text-center">
            <div className={`text-2xl font-bold px-4 py-2 rounded-lg border ${getScoreColor(compositeResult.overallScore)}`}>
              {compositeResult.overallScore}
            </div>
            <div className="text-xs text-gray-400 mt-1">/100</div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-semibold capitalize ${getRecommendationColor(compositeResult.recommendation)}`}>
              {compositeResult.recommendation}
            </div>
            <div className="text-xs text-gray-400">Assessment</div>
          </div>
        </div>
      </div>

      {/* Breakdown Toggle Button */}
      <button
        onClick={() => setShowBreakdown(!showBreakdown)}
        className="w-full flex items-center justify-center gap-2 py-2 px-4 text-sm text-indigo-400 hover:text-indigo-300 hover:bg-indigo-600/10 rounded-lg transition-colors border border-gray-700/50 hover:border-indigo-600/30"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {showBreakdown ? 'Hide' : 'Show'} Score Breakdown
        <svg className={`w-4 h-4 transition-transform ${showBreakdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Score Breakdown - Expandable Section */}
      {showBreakdown && (
        <div className="mt-4 pt-4 border-t border-gray-700 space-y-4">
          {/* Calculation Explanation */}
          <div className="bg-indigo-900/20 rounded-lg p-3 border border-indigo-600/30">
            <p className="text-xs text-indigo-300 mb-1">
              <span className="font-semibold">Overall Score Calculation:</span>
            </p>
            <p className="text-xs text-gray-300">
              Domain ({compositeResult.breakdown.domain.score}) × {compositeResult.breakdown.domain.weight * 100}% +
              Social ({compositeResult.breakdown.social.score}) × {compositeResult.breakdown.social.weight * 100}% +
              Trademark ({compositeResult.breakdown.trademark.score}) × {compositeResult.breakdown.trademark.weight * 100}% +
              Name Quality ({compositeResult.breakdown.brand.score}) × {compositeResult.breakdown.brand.weight * 100}% = <span className="font-semibold text-indigo-300">{compositeResult.overallScore}</span>
            </p>
          </div>

          {/* Component Scores Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Domain Score */}
            <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span className="text-xs font-medium text-white">Domain</span>
              </div>
              <div className="text-2xl font-bold text-blue-400">{compositeResult.breakdown.domain.score}</div>
              <div className="text-xs text-gray-400 mt-1">Weight: {compositeResult.breakdown.domain.weight * 100}%</div>
            </div>

            {/* Social Score */}
            <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-pink-600 rounded-full"></div>
                <span className="text-xs font-medium text-white">Social</span>
              </div>
              <div className="text-2xl font-bold text-pink-400">{compositeResult.breakdown.social.score}</div>
              <div className="text-xs text-gray-400 mt-1">Weight: {compositeResult.breakdown.social.weight * 100}%</div>
            </div>

            {/* Trademark Score */}
            <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                <span className="text-xs font-medium text-white">Trademark</span>
              </div>
              <div className="text-2xl font-bold text-purple-400">{compositeResult.breakdown.trademark.score}</div>
              <div className="text-xs text-gray-400 mt-1">Weight: {compositeResult.breakdown.trademark.weight * 100}%</div>
            </div>

            {/* Name Quality Score */}
            <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                <span className="text-xs font-medium text-white">Name Quality</span>
              </div>
              <div className="text-2xl font-bold text-green-400">{compositeResult.breakdown.brand.score}</div>
              <div className="text-xs text-gray-400 mt-1">Weight: {compositeResult.breakdown.brand.weight * 100}%</div>
            </div>
          </div>

          {/* Detailed Factors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Domain Factors */}
            {compositeResult.breakdown.domain.factors.length > 0 && (
              <div className="bg-gray-800/20 rounded-lg p-3 border border-gray-700/30">
                <h5 className="text-xs font-semibold text-blue-400 mb-2">Domain Factors</h5>
                <ul className="text-xs text-gray-300 space-y-1">
                  {compositeResult.breakdown.domain.factors.map((factor, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Social Factors */}
            {compositeResult.breakdown.social.factors.length > 0 && (
              <div className="bg-gray-800/20 rounded-lg p-3 border border-gray-700/30">
                <h5 className="text-xs font-semibold text-pink-400 mb-2">Social Factors</h5>
                <ul className="text-xs text-gray-300 space-y-1">
                  {compositeResult.breakdown.social.factors.map((factor, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-pink-400 mr-2">•</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Trademark Factors */}
            {compositeResult.breakdown.trademark.factors.length > 0 && (
              <div className="bg-gray-800/20 rounded-lg p-3 border border-gray-700/30">
                <h5 className="text-xs font-semibold text-purple-400 mb-2">Trademark Factors</h5>
                <ul className="text-xs text-gray-300 space-y-1">
                  {compositeResult.breakdown.trademark.factors.map((factor, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-purple-400 mr-2">•</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Brand Factors */}
            {compositeResult.breakdown.brand.factors.length > 0 && (
              <div className="bg-gray-800/20 rounded-lg p-3 border border-gray-700/30">
                <h5 className="text-xs font-semibold text-green-400 mb-2">Name Quality Factors</h5>
                <ul className="text-xs text-gray-300 space-y-1">
                  {compositeResult.breakdown.brand.factors.map((factor, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-green-400 mr-2">•</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
