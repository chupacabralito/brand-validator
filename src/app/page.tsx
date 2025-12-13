'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import SearchBox from '@/app/components/SearchBox';
import { DomainResult, BrandKit, SocialCheckResult } from '@/lib/models/DomainResult';
import { TrademarkSearchResult } from '@/lib/services/trademarkSearch';
import { CompositeScoreResult } from '@/lib/services/compositeScore';

// Lazy load result components - only loaded when search results are available
// This reduces initial bundle size and improves time-to-interactive
const DomainRail = dynamic(() => import('@/app/components/DomainRail'), {
  loading: () => <div className="bg-gray-800 rounded-lg p-6 animate-pulse h-96"></div>,
  ssr: false
});

const BrandKitRail = dynamic(() => import('@/app/components/BrandKitRail'), {
  loading: () => <div className="bg-gray-800 rounded-lg p-6 animate-pulse h-96"></div>,
  ssr: false
});

const SocialHandlesRail = dynamic(() => import('@/app/components/SocialHandlesRail'), {
  loading: () => <div className="bg-gray-800 rounded-lg p-6 animate-pulse h-96"></div>,
  ssr: false
});

const TrademarkSearchResults = dynamic(() => import('@/app/components/TrademarkSearchResults'), {
  loading: () => <div className="bg-gray-800 rounded-lg p-6 animate-pulse h-96"></div>,
  ssr: false
});

const CompositeScoreBar = dynamic(() => import('@/app/components/CompositeScoreBar'), {
  loading: () => <div className="bg-gray-800 rounded-lg p-4 mb-8 animate-pulse h-24"></div>,
  ssr: false
});

export default function Home() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [domainResult, setDomainResult] = useState<DomainResult | null>(null);
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [socialResult, setSocialResult] = useState<SocialCheckResult | null>(null);
  const [trademarkResult, setTrademarkResult] = useState<TrademarkSearchResult | null>(null);
  const [compositeResult, setCompositeResult] = useState<CompositeScoreResult | null>(null);
  const [selectedTrademarkCategory, setSelectedTrademarkCategory] = useState<string>('all');

  // Debug: Log when composite result changes
  useEffect(() => {
    console.log('Composite result state changed:', compositeResult);
  }, [compositeResult]);

  const handleDomainCheck = async (domain: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/domain-check-fast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain })
      });
      const data = await response.json();
      setDomainResult(data);
    } catch (error) {
      console.error('Domain check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCompositeScore = useCallback(async () => {
    console.log('=== COMPOSITE SCORE CALCULATION ===');
    console.log('Domain Result:', domainResult);
    console.log('Social Result:', socialResult);
    console.log('Trademark Result:', trademarkResult);
    console.log('Brand Kit:', brandKit);

    if (!domainResult && !socialResult && !trademarkResult && !brandKit) {
      console.log('No results available for composite score');
      setCompositeResult(null);
      return;
    }

    try {
      console.log('Sending request to composite score API...');
      const response = await fetch('/api/composite-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainResult,
          socialResult,
          trademarkResult,
          brandKit,
          selectedTrademarkCategory
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Composite score API response:', data);
      setCompositeResult(data);
      console.log('Composite result state updated');
    } catch (error) {
      console.error('Error calculating composite score:', error);
    }
  }, [domainResult, socialResult, trademarkResult, brandKit, selectedTrademarkCategory]);

  // Calculate composite score ONLY when ALL critical results are available
  useEffect(() => {
    // Check if we have all the results we expect based on search type
    const hasAllResults = domainResult && socialResult && trademarkResult && brandKit;

    if (hasAllResults) {
      console.log('All results available, calculating composite score...');
      console.log('Domain:', domainResult);
      console.log('Social:', socialResult);
      console.log('Trademark:', trademarkResult);
      console.log('Brand:', brandKit);

      // Small delay to ensure all state updates have settled
      const timer = setTimeout(() => {
        calculateCompositeScore();
      }, 300);

      return () => clearTimeout(timer);
    } else {
      console.log('Waiting for all results before calculating composite score...');
      console.log('Has domain:', !!domainResult);
      console.log('Has social:', !!socialResult);
      console.log('Has trademark:', !!trademarkResult);
      console.log('Has brand:', !!brandKit);
    }
  }, [domainResult, socialResult, trademarkResult, brandKit, calculateCompositeScore]);

  const handleAffiliateClick = async (partner: string, offer: string, url: string) => {
    try {
      const response = await fetch('/api/affiliate/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partner, offer, url })
      });
      
      if (response.ok) {
        // Get the redirect URL from the response
        const redirectUrl = response.headers.get('location') || response.url;
        window.open(redirectUrl, '_blank');
      } else {
        console.error('Affiliate click failed:', response.statusText);
      }
    } catch (error) {
      console.error('Affiliate click error:', error);
    }
  };

  const handleTrademarkCategoryChange = (category: string) => {
    setSelectedTrademarkCategory(category);
    // Recalculate composite score when category changes
    if (domainResult && socialResult && trademarkResult && brandKit) {
      calculateCompositeScore();
    }
  };

  const handleDomainRefresh = async () => {
    if (!domainResult) return;

    console.log('Refreshing domain data...');
    setIsLoading(true);

    try {
      const response = await fetch('/api/domain-check-fast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: domainResult.query
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Refreshed domain data:', data);
      setDomainResult(data);

      // Recalculate composite score with fresh data
      setTimeout(() => {
        calculateCompositeScore();
      }, 500);
    } catch (error) {
      console.error('Domain refresh failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    console.log('Search initiated for:', searchQuery);
    setIsLoading(true);
    setQuery(searchQuery);

    try {
      // Check if it's a domain or idea
      const isDomain = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,}|[a-zA-Z]{2,}\.[a-zA-Z]{2,})$/.test(searchQuery);
      const isPotentialDomain = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?$/.test(searchQuery) && !searchQuery.includes(' ');

      if (isDomain || isPotentialDomain) {
        console.log('Domain search detected for:', searchQuery);
        const domainRoot = searchQuery.split('.')[0];

        // PROGRESSIVE RENDERING: Start domain check immediately (fastest API)
        // This allows UI to update in <500ms without waiting for slow APIs
        const domainPromise = fetch('/api/domain-check-fast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: searchQuery }),
          signal: AbortSignal.timeout(5000)
        })
        .then(res => res.json())
        .then(data => {
          console.log('Domain API response (instant):', data);
          setDomainResult(data);
          setIsLoading(false); // Stop loading spinner immediately
          return data;
        })
        .catch(err => {
          console.error('Domain check failed:', err);
          return null;
        });

        // Run slower APIs in parallel WITHOUT blocking UI
        const slowAPIsPromise = Promise.all([
          fetch('/api/brand-kit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              idea: `Brand for ${searchQuery}`,
              tone: 'modern',
              audience: 'tech professionals',
              domain: searchQuery
            }),
            signal: AbortSignal.timeout(15000)
          }),
          fetch('/api/trademark-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ brandName: domainRoot }),
            signal: AbortSignal.timeout(35000)
          }),
          fetch('/api/social-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ handleBase: domainRoot }),
            signal: AbortSignal.timeout(15000)
          })
        ])
        .then(([brandRes, trademarkRes, socialRes]) =>
          Promise.all([brandRes.json(), trademarkRes.json(), socialRes.json()])
        )
        .then(([brandData, trademarkData, socialData]) => {
          console.log('Brand API response:', brandData);
          console.log('Trademark API response:', trademarkData);
          console.log('Social API response:', socialData);

          setBrandKit(brandData);
          setTrademarkResult(trademarkData);
          setSocialResult(socialData);

          return { brandData, trademarkData, socialData };
        })
        .catch(err => {
          console.error('Slow APIs failed:', err);
          return null;
        });

        // Wait for domain result (fast) but don't block on slow APIs
        await domainPromise;

        // Composite score will be calculated automatically via useEffect when all results available

      } else {
        // Idea search flow - run all APIs in parallel
        const handleBase = searchQuery.toLowerCase().replace(/\s/g, '');

        const [brandResponse, socialResponse, trademarkResponse] = await Promise.all([
          fetch('/api/brand-kit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              idea: searchQuery,
              tone: 'modern',
              audience: 'general audience'
            }),
            signal: AbortSignal.timeout(15000) // 15s timeout (AI generation can be slow)
          }),
          fetch('/api/social-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ handleBase }),
            signal: AbortSignal.timeout(15000) // 15s timeout (Zyla API can be slow)
          }),
          fetch('/api/trademark-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              brandName: searchQuery,
              classes: [35, 42], // Default business classes for ideas
              includeInternational: false
            }),
            signal: AbortSignal.timeout(35000) // 35s timeout (trademark search is slowest)
          })
        ]);

        // Parse all responses in parallel
        const [brandData, socialData, trademarkData] = await Promise.all([
          brandResponse.json(),
          socialResponse.json(),
          trademarkResponse.json()
        ]);

        console.log('Brand API response:', brandData);
        console.log('Social API response:', socialData);
        console.log('Trademark API response:', trademarkData);

        setBrandKit(brandData);
        setSocialResult(socialData);
        setTrademarkResult(trademarkData);

        // For idea searches, don't automatically check domain availability
        setDomainResult(null);

        // Composite score will be calculated automatically via useEffect
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="mr-3">
              <Image
                src="/logo.png"
                alt="Domain Hunk Logo"
                width={64}
                height={64}
                priority
              />
            </div>
            <h1 className="text-4xl font-bold text-white">
              Domain Hunk
            </h1>
          </div>
          <h2 className="text-2xl font-semibold text-gray-200 mb-4">
            The most complete domain validation tool on the web
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Check domains and trademarks, generate logo kits, and get social handle availability in one search.
          </p>
        </div>

        {/* Search Box */}
        <div className="max-w-4xl mx-auto mb-16">
          <SearchBox onSearch={handleSearch} isLoading={isLoading} />
        </div>

        {/* Results */}
        {(domainResult || brandKit || trademarkResult || socialResult || compositeResult) && (
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Search Results</h3>
              <p className="text-gray-300">Complete brand validation results for your search</p>
            </div>

            {/* Composite Score Bar */}
            <CompositeScoreBar 
              compositeResult={compositeResult} 
              isLoading={isLoading}
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* Left Rail - Domain Verify */}
              <DomainRail
                domainResult={domainResult}
                isLoading={isLoading}
                onRefresh={handleDomainRefresh}
              />

              {/* Middle Left Rail - Trademark Search */}
              <TrademarkSearchResults 
                result={trademarkResult} 
                isLoading={isLoading}
                onAffiliateClick={handleAffiliateClick}
                onCategoryChange={handleTrademarkCategoryChange}
              />

              {/* Middle Right Rail - Social Handles */}
              <SocialHandlesRail
                socialResult={socialResult}
                isLoading={isLoading}
                onAffiliateClick={handleAffiliateClick}
              />

              {/* Right Rail - Brand Kit */}
              <BrandKitRail
                brandKit={brandKit}
                isLoading={isLoading}
                onCheckDomain={handleDomainCheck}
                searchTerm={query}
              />
            </div>
          </div>
        )}



      </div>
    </div>
  );
}