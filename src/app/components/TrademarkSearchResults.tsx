'use client';

import { useState, useEffect } from 'react';
import { TrademarkSearchResult, TrademarkMatch, NextStep, BusinessCategory, CategoryRisk } from '@/lib/services/trademarkSearch';
import StandardContainer from './StandardContainer';
import AffiliateCTA, { Partner } from './AffiliateCTA';
import { StatusDot, StatusBadge, ItemCard, InfoBox, ExpandButton } from './design-system';

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
  const [showAllMatches, setShowAllMatches] = useState(false);

  // Trademark filing partners
  const trademarkPartners: Partner[] = [
    { name: 'LegalZoom', partner: 'legalzoom', color: 'bg-blue-600' },
    { name: 'Trademark Engine', partner: 'trademarkengine', color: 'bg-green-600' },
    { name: 'Trademark Factory', partner: 'trademarkfactory', color: 'bg-purple-600' },
    { name: 'CorpNet', partner: 'corpnet', color: 'bg-orange-600' },
    { name: 'Rocket Lawyer', partner: 'rocketlawyer', color: 'bg-red-600' }
  ];

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

  if (!result || !result.riskAssessment) {
    return null;
  }

  // Debug logging
  console.log('TrademarkSearchResults Debug:', {
    overallRisk: result.riskAssessment?.overallRisk,
    exactMatches: result.exactMatches?.length || 0,
    similarMatches: result.similarMatches?.length || 0,
    riskFactors: result.riskAssessment?.riskFactors?.length || 0
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
      title="Trademark Check"
      score={`${capitalizedRiskLevel} risk`}
      scoreColor={scoreColor}
      color="purple"
    >

      {/* PRIMARY CTA - Status-driven */}
      {onAffiliateClick && (
        <div className="mb-6">
          {riskLevel === 'low' ? (
            <button
              onClick={() => onAffiliateClick(trademarkPartners[0].partner, 'trademark', result.exactMatches[0]?.mark || result.similarMatches[0]?.mark || 'brand')}
              className="w-full px-6 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              File Trademark
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : riskLevel === 'medium' ? (
            <button
              onClick={() => onAffiliateClick(trademarkPartners[0].partner, 'trademark', result.exactMatches[0]?.mark || result.similarMatches[0]?.mark || 'brand')}
              className="w-full px-6 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              File Trademark
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => onAffiliateClick(trademarkPartners[0].partner, 'attorney', result.exactMatches[0]?.mark || result.similarMatches[0]?.mark || 'brand')}
              className="w-full px-6 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              Consult Attorney
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Domain Safety Summary */}
      <InfoBox
        variant={riskLevel === 'low' ? 'success' : riskLevel === 'medium' ? 'warning' : 'danger'}
        className="mb-4"
      >
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <h3 className="font-semibold mb-1 text-white text-sm">
              {riskLevel === 'low' && 'Safe to use this domain'}
              {riskLevel === 'medium' && 'Verify before purchasing'}
              {riskLevel === 'high' && 'High trademark risk - avoid this domain'}
            </h3>
            <p className={`text-xs ${riskLevel === 'low' ? 'text-green-300' : riskLevel === 'medium' ? 'text-yellow-300' : 'text-red-300'}`}>
              {result.riskAssessment.recommendations[0]}
            </p>
          </div>
        </div>
      </InfoBox>

      {/* Risk Factors - Only show if there are actual concerns */}
      {result.riskAssessment.riskFactors.length > 0 && riskLevel !== 'low' && (
        <div className="mb-4">
          <h3 className="font-semibold mb-2 text-white text-sm">Why This Matters</h3>
          <InfoBox variant="neutral">
            <ul className="text-xs text-gray-300 space-y-1">
              {result.riskAssessment.riskFactors.map((riskFactor, riskIndex) => (
                <li key={riskIndex} className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  <span>{riskFactor}</span>
                </li>
              ))}
            </ul>
          </InfoBox>
        </div>
      )}

      {/* Trademark Conflicts - Only show HIGH RISK matches */}
      {(result.exactMatches.length > 0 || result.similarMatches.length > 0) && (
        <div className="mb-4">
          <h3 className="font-semibold mb-2 text-white text-sm">Trademark Conflicts</h3>

          {/* Exact Matches - HIGH RISK - Limit to top 3 by default */}
          {result.exactMatches.length > 0 && (
            <div className="mb-3">
              <div className="space-y-2">
                {(showAllMatches ? result.exactMatches : result.exactMatches.slice(0, 3)).map((match, index) => (
                  <ItemCard key={index} accentColor="danger">
                    <StatusDot status="danger" className="mt-1.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-medium text-white text-sm truncate">{match.mark}</span>
                        <StatusBadge status="danger" label="High risk" />
                      </div>
                      <div className="text-xs text-gray-400">
                        <p><span className="font-medium text-gray-300">Owner:</span> {match.owner}</p>
                        {match.notes && <p className="mt-1 text-gray-300">{match.notes}</p>}
                      </div>
                    </div>
                  </ItemCard>
                ))}
              </div>

              {/* Show More button if there are more than 3 exact matches */}
              {result.exactMatches.length > 3 && (
                <ExpandButton
                  expanded={showAllMatches}
                  onClick={() => setShowAllMatches(!showAllMatches)}
                  expandedCount={result.exactMatches.length - 3}
                  collapsedLabel={`Show ${result.exactMatches.length - 3} more conflicts`}
                  expandedLabel={`Hide ${result.exactMatches.length - 3} additional conflicts`}
                />
              )}
            </div>
          )}

          {/* Similar Matches - Only show high similarity - Limit to top 3 */}
          {result.similarMatches.filter(m => m.similarityScore >= 80).length > 0 && (
            <div>
              <div className="space-y-2">
                {(showAllMatches
                  ? result.similarMatches.filter(m => m.similarityScore >= 80)
                  : result.similarMatches.filter(m => m.similarityScore >= 80).slice(0, 3)
                ).map((match, index) => (
                  <ItemCard key={index} accentColor="warning">
                    <StatusDot status="warning" className="mt-1.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-medium text-white text-sm truncate">{match.mark}</span>
                        <StatusBadge status="warning" label="Similar" />
                      </div>
                      <div className="text-xs text-gray-400">
                        <p><span className="font-medium text-gray-300">Owner:</span> {match.owner}</p>
                        {match.notes && <p className="mt-1 text-gray-300">{match.notes}</p>}
                      </div>
                    </div>
                  </ItemCard>
                ))}
              </div>

              {/* Show More button if there are more than 3 similar matches */}
              {result.similarMatches.filter(m => m.similarityScore >= 80).length > 3 && (
                <ExpandButton
                  expanded={showAllMatches}
                  onClick={() => setShowAllMatches(!showAllMatches)}
                  expandedCount={result.similarMatches.filter(m => m.similarityScore >= 80).length - 3}
                  collapsedLabel={`Show ${result.similarMatches.filter(m => m.similarityScore >= 80).length - 3} more similar matches`}
                  expandedLabel="Hide additional similar matches"
                />
              )}
            </div>
          )}

          {/* No conflicts shown - low risk similar matches exist but aren't concerning */}
          {result.exactMatches.length === 0 && result.similarMatches.filter(m => m.similarityScore >= 80).length === 0 && result.similarMatches.length > 0 && (
            <p className="text-xs text-gray-400">
              Some similar trademarks exist but are not considered high risk for domain use.
            </p>
          )}
        </div>
      )}

      {/* No conflicts at all */}
      {result.exactMatches.length === 0 && result.similarMatches.length === 0 && riskLevel === 'low' && (
        <div className="mb-4">
          <p className="text-xs text-green-300">
            ✅ No trademark conflicts detected in USPTO database.
          </p>
        </div>
      )}
    </StandardContainer>
  );
}
