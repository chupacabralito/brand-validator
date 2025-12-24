'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import SearchBox from '@/app/components/SearchBox';
import DomainRail from '@/app/components/DomainRail';
import BrandKitRail from '@/app/components/BrandKitRail';
import SocialHandlesRail from '@/app/components/SocialHandlesRail';
import TrademarkSearchResults from '@/app/components/TrademarkSearchResults';
import CompositeScoreBar from '@/app/components/CompositeScoreBar';
import { DomainResult, BrandKit, SocialCheckResult } from '@/lib/models/DomainResult';
import { TrademarkSearchResult } from '@/lib/services/trademarkSearch';
import { CompositeScoreResult } from '@/lib/services/compositeScore';

// NO DYNAMIC IMPORTS - Load all components immediately to prevent layout shift
// This ensures the grid structure renders instantly and data populates progressively

export default function Home() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Individual loading states for each rail (progressive loading)
  const [isDomainLoading, setIsDomainLoading] = useState(false);
  const [isBrandLoading, setIsBrandLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const [isTrademarkLoading, setIsTrademarkLoading] = useState(false);

  // Results state
  const [domainResult, setDomainResult] = useState<DomainResult | null>(null);
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
  const [socialResult, setSocialResult] = useState<SocialCheckResult | null>(null);
  const [trademarkResult, setTrademarkResult] = useState<TrademarkSearchResult | null>(null);
  const [compositeResult, setCompositeResult] = useState<CompositeScoreResult | null>(null);
  const [selectedTrademarkCategory, setSelectedTrademarkCategory] = useState<string>('all');

  // Show results grid flag - appears immediately on search
  const [showResults, setShowResults] = useState(false);

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

  // OPTIMIZATION: Cache results when composite score is calculated
  useEffect(() => {
    if (compositeResult && query) {
      const cacheKey = `search_${query.toLowerCase()}`;
      const cacheData = {
        timestamp: Date.now(),
        domain: domainResult,
        brand: brandKit,
        social: socialResult,
        trademark: trademarkResult,
        composite: compositeResult
      };

      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
        console.log('Cached results for query:', query);
      } catch (e) {
        console.warn('Failed to cache results:', e);
      }
    }
  }, [compositeResult, query, domainResult, brandKit, socialResult, trademarkResult]);

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

    // OPTIMIZATION: Client-side cache check (instant for repeated searches)
    const cacheKey = `search_${searchQuery.toLowerCase()}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const cachedData = JSON.parse(cached);
        const cacheAge = Date.now() - cachedData.timestamp;

        // Use cache if < 5 minutes old
        if (cacheAge < 5 * 60 * 1000) {
          console.log('Using cached results (age:', Math.floor(cacheAge / 1000), 'seconds)');
          setShowResults(true);
          setDomainResult(cachedData.domain || null);
          setBrandKit(cachedData.brand || null);
          setSocialResult(cachedData.social || null);
          setTrademarkResult(cachedData.trademark || null);
          setCompositeResult(cachedData.composite || null);
          setQuery(searchQuery);
          return; // Skip API calls entirely!
        }
      } catch (e) {
        console.warn('Cache parse error:', e);
      }
    }

    setIsLoading(true);
    setQuery(searchQuery);

    // Show results grid immediately (empty skeleton)
    setShowResults(true);

    // Reset all results and set all to loading
    setDomainResult(null);
    setBrandKit(null);
    setSocialResult(null);
    setTrademarkResult(null);
    setCompositeResult(null);

    try {
      // Check if it's a domain or idea
      const isDomain = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,}|[a-zA-Z]{2,}\.[a-zA-Z]{2,})$/.test(searchQuery);
      const isPotentialDomain = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?$/.test(searchQuery) && !searchQuery.includes(' ');

      if (isDomain || isPotentialDomain) {
        console.log('Domain search detected for:', searchQuery);
        const domainRoot = searchQuery.split('.')[0];

        // Set individual loading states
        setIsDomainLoading(true);
        setIsBrandLoading(true);
        setIsSocialLoading(true);
        setIsTrademarkLoading(true);

        // PROGRESSIVE RENDERING: Start domain check immediately (fastest API)
        // This allows UI to update in <500ms without waiting for slow APIs
        fetch('/api/domain-check-fast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain: searchQuery }),
          signal: AbortSignal.timeout(5000)
        })
        .then(res => res.json())
        .then(data => {
          console.log('Domain API response (instant):', data);
          setDomainResult(data);
          setIsDomainLoading(false);
          setIsLoading(false); // Stop main loading spinner
        })
        .catch(err => {
          console.error('Domain check failed:', err);
          setIsDomainLoading(false);
        });

        // Brand Kit API (independent)
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
        })
        .then(res => res.json())
        .then(data => {
          console.log('Brand API response:', data);
          setBrandKit(data);
          setIsBrandLoading(false);
        })
        .catch(err => {
          console.error('Brand API failed:', err);
          setIsBrandLoading(false);
        });

        // Trademark Search API (independent)
        fetch('/api/trademark-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brandName: domainRoot }),
          signal: AbortSignal.timeout(35000)
        })
        .then(res => res.json())
        .then(data => {
          console.log('Trademark API response:', data);
          setTrademarkResult(data);
          setIsTrademarkLoading(false);
        })
        .catch(err => {
          console.error('Trademark API failed:', err);
          setIsTrademarkLoading(false);
        });

        // Social Check API (independent)
        fetch('/api/social-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ handleBase: domainRoot }),
          signal: AbortSignal.timeout(15000)
        })
        .then(res => res.json())
        .then(data => {
          console.log('Social API response:', data);
          setSocialResult(data);
          setIsSocialLoading(false);
        })
        .catch(err => {
          console.error('Social API failed:', err);
          setIsSocialLoading(false);
        });

        // Composite score will be calculated automatically via useEffect when all results available

      } else {
        // Idea search flow - progressive loading for ideas too
        const handleBase = searchQuery.toLowerCase().replace(/\s/g, '');

        // Set individual loading states (no domain for ideas)
        setIsDomainLoading(false);
        setIsBrandLoading(true);
        setIsSocialLoading(true);
        setIsTrademarkLoading(true);

        // Brand Kit API (independent)
        fetch('/api/brand-kit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idea: searchQuery,
            tone: 'modern',
            audience: 'general audience'
          }),
          signal: AbortSignal.timeout(15000)
        })
        .then(res => res.json())
        .then(data => {
          console.log('Brand API response:', data);
          setBrandKit(data);
          setIsBrandLoading(false);
          setIsLoading(false); // Stop main spinner after first result
        })
        .catch(err => {
          console.error('Brand API failed:', err);
          setIsBrandLoading(false);
        });

        // Social Check API (independent)
        fetch('/api/social-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ handleBase }),
          signal: AbortSignal.timeout(15000)
        })
        .then(res => res.json())
        .then(data => {
          console.log('Social API response:', data);
          setSocialResult(data);
          setIsSocialLoading(false);
        })
        .catch(err => {
          console.error('Social API failed:', err);
          setIsSocialLoading(false);
        });

        // Trademark Search API (independent)
        fetch('/api/trademark-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brandName: searchQuery,
            classes: [35, 42],
            includeInternational: false
          }),
          signal: AbortSignal.timeout(35000)
        })
        .then(res => res.json())
        .then(data => {
          console.log('Trademark API response:', data);
          setTrademarkResult(data);
          setIsTrademarkLoading(false);
        })
        .catch(err => {
          console.error('Trademark API failed:', err);
          setIsTrademarkLoading(false);
        });

        // Composite score will be calculated automatically via useEffect
      }
    } catch (error) {
      console.error('Search error:', error);
      setIsLoading(false);
      setIsDomainLoading(false);
      setIsBrandLoading(false);
      setIsSocialLoading(false);
      setIsTrademarkLoading(false);
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
                src="/logo-new.png"
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

        {/* Results - Grid appears IMMEDIATELY with loading skeletons */}
        {showResults && (
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">Search Results</h3>
              <p className="text-gray-300">Complete brand validation results for your search</p>
            </div>

            {/* Composite Score Bar - Shows immediately, populates when data arrives */}
            <CompositeScoreBar
              compositeResult={compositeResult}
              isLoading={!compositeResult && (isDomainLoading || isBrandLoading || isSocialLoading || isTrademarkLoading)}
            />

            {/* Grid structure renders INSTANTLY - no layout shift */}
            {/* Progressive loading order: Fastest → Slowest (Domain ~500ms, Social ~2-4s, Trademark ~3-10s, Brand ~5-15s) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* Left Rail - Domain Verify (FASTEST: ~500ms) */}
              <DomainRail
                domainResult={domainResult}
                isLoading={isDomainLoading}
                onRefresh={handleDomainRefresh}
              />

              {/* Middle Left Rail - Social Handles (FAST: ~2-4s) */}
              <SocialHandlesRail
                socialResult={socialResult}
                isLoading={isSocialLoading}
                onAffiliateClick={handleAffiliateClick}
              />

              {/* Middle Right Rail - Trademark Search (SLOWER: ~3-10s) */}
              <TrademarkSearchResults
                result={trademarkResult}
                isLoading={isTrademarkLoading}
                onAffiliateClick={handleAffiliateClick}
                onCategoryChange={handleTrademarkCategoryChange}
              />

              {/* Right Rail - Brand Kit (SLOWEST: ~5-15s - uses AI) */}
              <BrandKitRail
                brandKit={brandKit}
                isLoading={isBrandLoading}
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