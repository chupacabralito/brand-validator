'use client';

import { useState, useEffect } from 'react';
import { TrademarkSearchResult, TrademarkMatch, NextStep, BusinessCategory, CategoryRisk } from '@/lib/services/trademarkSearch';
import StandardContainer from './StandardContainer';

interface TrademarkSearchResultsProps {
  result: TrademarkSearchResult | null;
  isLoading: boolean;
  onAffiliateClick?: (partner: string, offer: string, brand: string) => void;
  onCategoryChange?: (category: string) => void;
}

export default function TrademarkSearchResults({ result, isLoading, onAffiliateClick, onCategoryChange }: TrademarkSearchResultsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categorySpecificData, setCategorySpecificData] = useState<{
    businessCategory: BusinessCategory | null;
    categorySpecificRisks: CategoryRisk[];
    updatedRiskAssessment: any;
  } | null>(null);

  // Handle category selection
  const handleCategoryChange = async (category: string) => {
    setSelectedCategory(category);
    
    if (category === 'all') {
      setCategorySpecificData(null);
      if (onCategoryChange) onCategoryChange('all');
      return;
    }

    if (!result) return;

    try {
      // Simulate category-specific assessment (in real implementation, this would call the API)
      const categoryData = await getCategorySpecificAssessment(category);
      setCategorySpecificData(categoryData);
      
      if (onCategoryChange) onCategoryChange(category);
    } catch (error) {
      console.error('Error getting category-specific assessment:', error);
    }
  };

  // NO SIMULATION ALLOWED - Use real trademark search API
  const getCategorySpecificAssessment = async (category: string) => {
    // Call real trademark search service with category
    try {
      const response = await fetch('/api/trademark-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          brandName: result?.exactMatches[0]?.mark || 'unknown',
          classes: getCategoryClasses(category),
          includeInternational: false
        })
      });
      
      if (!response.ok) {
        throw new Error('Trademark search failed');
      }
      
      const trademarkData = await response.json();
      return trademarkData;
    } catch (error) {
      console.error('Category-specific trademark search failed:', error);
      throw new Error('Cannot provide category-specific assessment without real trademark data');
    }
  };

  const getCategoryDescription = (category: string): string => {
    const descriptions = {
      'Apparel & Fashion': 'Clothing, footwear, and fashion accessories',
      'Technology & Software': 'Software, hardware, and technology services',
      'Food & Beverage': 'Food products, restaurants, and beverages',
      'Health & Wellness': 'Healthcare, fitness, and wellness services',
      'Beauty & Personal Care': 'Beauty products and personal care services',
      'Automotive': 'Automotive products and services',
      'Real Estate': 'Real estate and property services',
      'Entertainment & Media': 'Entertainment, media, and publishing',
      'Education & Training': 'Educational services and training',
      'Financial Services': 'Financial and banking services'
    };
    return descriptions[category as keyof typeof descriptions] || 'General business services';
  };

  const getCategorySpecificRisks = (category: string): string[] => {
    const risks = {
      'Apparel & Fashion': [
        'Highly saturated market with many existing trademarks',
        'Fashion brands often use similar naming patterns',
        'International fashion brands may have global protection',
        'Fast fashion creates rapid trademark conflicts'
      ],
      'Health & Wellness': [
        'Health claims are heavily regulated',
        'Medical terminology creates conflicts',
        'Wellness industry is highly saturated',
        'FDA regulations affect trademark strategy'
      ],
      'Technology & Software': [
        'Tech companies often use generic terms',
        'Software patents can create conflicts',
        'International tech companies have global reach',
        'Rapid innovation creates new trademark categories'
      ],
      'Food & Beverage': [
        'Food industry has many established brands',
        'Geographic indicators can create conflicts',
        'Health claims require careful trademark strategy',
        'International food brands have global protection'
      ]
    };
    return risks[category as keyof typeof risks] || ['General business risks'];
  };

  const getCategoryRecommendations = (category: string): string[] => {
    const recommendations = {
      'Apparel & Fashion': [
        'Conduct thorough international search',
        'Consider unique design elements in trademark',
        'Monitor fashion industry trends for conflicts',
        'File in multiple international classes'
      ],
      'Health & Wellness': [
        'Avoid medical claims in trademark',
        'Focus on lifestyle and wellness positioning',
        'Consider regulatory compliance requirements',
        'Monitor health industry trademark filings'
      ],
      'Technology & Software': [
        'Focus on distinctive elements beyond generic terms',
        'Consider software-specific trademark strategies',
        'Monitor tech industry trademark filings',
        'File in multiple relevant classes (9, 35, 42)'
      ],
      'Food & Beverage': [
        'Avoid generic food terms',
        'Consider geographic limitations',
        'Focus on distinctive packaging and presentation',
        'Monitor food industry trademark trends'
      ]
    };
    return recommendations[category as keyof typeof recommendations] || ['General trademark recommendations'];
  };

  const getCategoryClasses = (category: string): number[] => {
    const classes = {
      'Apparel & Fashion': [25, 35],
      'Technology & Software': [9, 35, 42],
      'Food & Beverage': [29, 30, 32, 43],
      'Health & Wellness': [5, 10, 44],
      'Beauty & Personal Care': [3, 44],
      'Automotive': [12, 37],
      'Real Estate': [36, 37],
      'Entertainment & Media': [9, 35, 41, 42],
      'Education & Training': [35, 41],
      'Financial Services': [36]
    };
    return classes[category as keyof typeof classes] || [35, 42];
  };

  const getCategorySaturation = (category: string): number => {
    const saturation = {
      'Apparel & Fashion': 85,
      'Health & Wellness': 80,
      'Technology & Software': 70,
      'Food & Beverage': 75,
      'Beauty & Personal Care': 75,
      'Automotive': 70,
      'Real Estate': 65,
      'Entertainment & Media': 70,
      'Education & Training': 60,
      'Financial Services': 75
    };
    return saturation[category as keyof typeof saturation] || 60;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-400 bg-red-600/20 border-red-600/30';
      case 'medium': return 'text-yellow-400 bg-yellow-600/20 border-yellow-600/30';
      case 'low': return 'text-green-400 bg-green-600/20 border-green-600/30';
      default: return 'text-gray-400 bg-gray-600/20 border-gray-600/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-800 p-6">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white">Trademark Search</h3>
        </div>
        <div className="text-center text-blue-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div>
          Running comprehensive trademark search...
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  // Debug logging
  console.log('TrademarkSearchResults Debug:', {
    overallRisk: result.riskAssessment.overallRisk,
    exactMatches: result.exactMatches.length,
    similarMatches: result.similarMatches.length,
    riskFactors: result.riskAssessment.riskFactors
  });

  const trademarkIcon = (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const riskLevel = result?.riskAssessment?.overallRisk || 'Unknown';
  const capitalizedRiskLevel = riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1);
  const scoreColor = riskLevel === 'low' ? 'green' : riskLevel === 'medium' ? 'yellow' : 'red';

  return (
    <StandardContainer
      icon={trademarkIcon}
      title="Trademark Search"
      score={`${capitalizedRiskLevel} risk`}
      scoreColor={scoreColor}
      color="purple"
    >

      {/* Category Selection */}
      <div className="mb-4">
        <h3 className="font-semibold mb-2 text-white text-sm">Business Category</h3>
        <div className="flex flex-wrap gap-2">
          {['all', 'Apparel & Fashion', 'Technology & Software', 'Food & Beverage', 'Health & Wellness', 'Beauty & Personal Care', 'Automotive', 'Real Estate', 'Entertainment & Media', 'Education & Training', 'Financial Services'].map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
              }`}
            >
              {category === 'all' ? 'All Categories' : category}
            </button>
          ))}
        </div>
      </div>

      {/* Category Assessment */}
      <div className="mb-4">
        <h3 className="font-semibold mb-2 text-white text-sm">Category Assessment</h3>
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
          {categorySpecificData ? (
            // Category-specific assessment
            categorySpecificData.categorySpecificRisks.map((risk, index) => (
              <div key={index}>
                {/* 1. Category */}
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-white">{risk.category}</span>
                  {/* 2. Risk Assessment Level */}
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    risk.riskLevel === 'high' ? 'bg-red-600/20 text-red-400 border border-red-600/30' :
                    risk.riskLevel === 'medium' ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30' :
                    'bg-green-600/20 text-green-400 border border-green-600/30'
                  }`}>
                    {risk.riskLevel.toUpperCase()} RISK
                  </span>
                </div>
                
                {/* 3. Specific Risks */}
                <div className="mb-3">
                  <h4 className="text-xs font-medium text-gray-300 mb-2">Specific Risks:</h4>
                  <ul className="text-xs text-gray-400 space-y-1">
                    {risk.specificRisks.map((specificRisk, riskIndex) => (
                      <li key={riskIndex} className="flex items-start">
                        <span className="text-red-400 mr-2">•</span>
                        <span>{specificRisk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* 4. Professional Help Option */}
                {risk.riskLevel === 'high' && onAffiliateClick && (
                  <div className="border-t border-gray-700 pt-3">
                    <h4 className="text-xs font-medium text-gray-300 mb-2">Professional Help</h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => onAffiliateClick('trademarkfactory', 'trademark', 'your brand')}
                        className="w-full bg-blue-600 text-white py-2 px-3 rounded text-xs hover:bg-blue-700 transition-colors"
                      >
                        Get Professional Trademark Search
                      </button>
                      <button
                        onClick={() => onAffiliateClick('trademarkcenter', 'search', 'your brand')}
                        className="w-full bg-gray-600 text-white py-2 px-3 rounded text-xs hover:bg-gray-700 transition-colors"
                      >
                        Trademark Research Report
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            // Generic assessment for "All Categories"
            <div>
              {/* 1. Category */}
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-white">All Categories</span>
                {/* 2. Risk Assessment Level */}
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  result.riskAssessment.overallRisk === 'high' ? 'bg-red-600/20 text-red-400 border border-red-600/30' :
                  result.riskAssessment.overallRisk === 'medium' ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30' :
                  'bg-green-600/20 text-green-400 border border-green-600/30'
                }`}>
                  {result.riskAssessment.overallRisk.toUpperCase()} RISK
                </span>
              </div>
              
              {/* 3. Specific Risks */}
              <div className="mb-3">
                <h4 className="text-xs font-medium text-gray-300 mb-2">Risk Factors:</h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  {result.riskAssessment.riskFactors.map((riskFactor, riskIndex) => (
                    <li key={riskIndex} className="flex items-start">
                      <span className="text-red-400 mr-2">•</span>
                      <span>{riskFactor}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* 4. Professional Help Option */}
              {result.riskAssessment.overallRisk === 'high' && onAffiliateClick && (
                <div className="border-t border-gray-700 pt-3">
                  <h4 className="text-xs font-medium text-gray-300 mb-2">Professional Help</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => onAffiliateClick('trademarkfactory', 'trademark', 'your brand')}
                      className="w-full bg-blue-600 text-white py-2 px-3 rounded text-xs hover:bg-blue-700 transition-colors"
                    >
                      Get Professional Trademark Search
                    </button>
                    <button
                      onClick={() => onAffiliateClick('trademarkcenter', 'search', 'your brand')}
                      className="w-full bg-gray-600 text-white py-2 px-3 rounded text-xs hover:bg-gray-700 transition-colors"
                    >
                      Trademark Research Report
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Trademark Analysis */}
      <div className="mb-4">
        <h3 className="font-semibold mb-3 text-white">Trademark Analysis</h3>
        
        {result && (
          <div className="space-y-6">
            {/* Trademark Affiliate Buttons */}
          {/* Similar Matches - Expandable */}
          {result.similarMatches.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-white text-sm">Similar ({result.similarMatches.length})</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  (categorySpecificData?.updatedRiskAssessment?.overallRisk || result.riskAssessment.overallRisk) === 'high'
                    ? 'bg-red-600/20 text-red-400 border border-red-600/30'
                    : (categorySpecificData?.updatedRiskAssessment?.overallRisk || result.riskAssessment.overallRisk) === 'medium'
                    ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30'
                    : 'bg-green-600/20 text-green-400 border border-green-600/30'
                }`}>
                  {(categorySpecificData?.updatedRiskAssessment?.overallRisk || result.riskAssessment.overallRisk) === 'high' ? 'High Risk' : 
                   (categorySpecificData?.updatedRiskAssessment?.overallRisk || result.riskAssessment.overallRisk) === 'medium' ? 'Medium Risk' : 'Low Risk'}
                </span>
              </div>
              <div className="space-y-2">
                {result.similarMatches.slice(0, 2).map((match, index) => {
                  // Convert similarity score to risk level
                  const getSimilarityLevel = (score: number) => {
                    if (score >= 80) return { level: 'High', color: 'text-red-400' };
                    if (score >= 60) return { level: 'Medium', color: 'text-orange-400' };
                    return { level: 'Low', color: 'text-yellow-400' };
                  };
                  
                  const similarity = getSimilarityLevel(match.similarityScore);
                  
                  return (
                    <div key={index} className="border border-gray-600/30 rounded p-3 bg-gray-800/50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-white text-sm">{match.mark}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${similarity.color}`}>
                          {similarity.level} Similarity
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-300 space-y-1">
                        <p className="truncate"><span className="font-medium">Owner:</span> {match.owner}</p>
                        <p className="truncate"><span className="font-medium">Status:</span> {match.status}</p>
                        {match.registrationNumber && (
                          <p className="truncate"><span className="font-medium">Reg #:</span> {match.registrationNumber}</p>
                        )}
                        {match.filingDate && (
                          <p className="truncate"><span className="font-medium">Filed:</span> {new Date(match.filingDate).toLocaleDateString()}</p>
                        )}
                        {match.classes.length > 0 && (
                          <p className="truncate"><span className="font-medium">Classes:</span> {match.classes.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* Show all remaining matches */}
                {result.similarMatches.length > 2 && (
                  <div className="space-y-2">
                    {result.similarMatches.slice(2).map((match, index) => {
                      const getSimilarityLevel = (score: number) => {
                        if (score >= 80) return { level: 'High', color: 'text-red-400' };
                        if (score >= 60) return { level: 'Medium', color: 'text-orange-400' };
                        return { level: 'Low', color: 'text-yellow-400' };
                      };
                      
                      const similarity = getSimilarityLevel(match.similarityScore);
                      
                      return (
                        <div key={index + 2} className="border border-gray-600/30 rounded p-3 bg-gray-800/50">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-white text-sm">{match.mark}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${similarity.color}`}>
                              {similarity.level} Similarity
                            </span>
                          </div>
                          
                          <div className="text-xs text-gray-300 space-y-1">
                            <p className="truncate"><span className="font-medium">Owner:</span> {match.owner}</p>
                            <p className="truncate"><span className="font-medium">Status:</span> {match.status}</p>
                            {match.registrationNumber && (
                              <p className="truncate"><span className="font-medium">Reg #:</span> {match.registrationNumber}</p>
                            )}
                            {match.filingDate && (
                              <p className="truncate"><span className="font-medium">Filed:</span> {new Date(match.filingDate).toLocaleDateString()}</p>
                            )}
                            {match.classes.length > 0 && (
                              <p className="truncate"><span className="font-medium">Classes:</span> {match.classes.join(', ')}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {(result.riskAssessment.overallRisk === 'high' || result.riskAssessment.overallRisk === 'medium') && onAffiliateClick && (
            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
              <h4 className="font-semibold mb-3 text-white text-sm">Get Professional Help</h4>
              <div className="space-y-2">
                <button
                  onClick={() => onAffiliateClick('trademarkfactory', 'trademark', 'your brand')}
                  className="w-full bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  Professional Trademark Search
                </button>
                <button
                  onClick={() => onAffiliateClick('trademarkcenter', 'search', 'your brand')}
                  className="w-full bg-gray-600 text-white py-2 px-3 rounded text-sm hover:bg-gray-700 transition-colors"
                >
                  Trademark Research Report
                </button>
                <button
                  onClick={() => onAffiliateClick('trademarkplus', 'filing', 'your brand')}
                  className="w-full bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  Trademark Filing Service
                </button>
              </div>
            </div>
          )}

          {/* Exact Matches - Compact */}
          {result.exactMatches.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 text-red-400 text-sm">Exact Matches ({result.exactMatches.length})</h4>
              <div className="space-y-2">
                {result.exactMatches.slice(0, 2).map((match, index) => (
                  <div key={index} className="border border-red-600/30 rounded p-2 bg-red-600/10">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-red-300 text-sm">{match.mark}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${getRiskColor(match.riskLevel)}`}>
                        {match.riskLevel.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-300 space-y-1">
                      <p className="truncate"><span className="font-medium">Owner:</span> {match.owner}</p>
                      <p className="truncate"><span className="font-medium">Status:</span> {match.status}</p>
                      {match.registrationNumber && (
                        <p className="truncate"><span className="font-medium">Reg #:</span> {match.registrationNumber}</p>
                      )}
                      {match.filingDate && (
                        <p className="truncate"><span className="font-medium">Filed:</span> {new Date(match.filingDate).toLocaleDateString()}</p>
                      )}
                      {match.classes.length > 0 && (
                        <p className="truncate"><span className="font-medium">Classes:</span> {match.classes.join(', ')}</p>
                      )}
                    </div>
                  </div>
                ))}
                {result.exactMatches.length > 2 && (
                  <div className="text-xs text-gray-400 text-center">
                    +{result.exactMatches.length - 2} more matches
                  </div>
                )}
              </div>
            </div>
          )}

          </div>
        )}
      </div>
    </StandardContainer>
  );
}
