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
      const response = await fetch('/api/domain-check', {
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
  }, [domainResult, socialResult, trademarkResult, brandKit]);

  // Calculate composite score when all individual results are available
  useEffect(() => {
    if (domainResult || socialResult || trademarkResult || brandKit) {
      console.log('Individual results available, calculating composite score...');
      console.log('Domain:', domainResult);
      console.log('Social:', socialResult);
      console.log('Trademark:', trademarkResult);
      console.log('Brand:', brandKit);
      
      const timer = setTimeout(() => {
        calculateCompositeScore();
      }, 1000);
      
      return () => clearTimeout(timer);
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

    console.log('Refreshing domain data (bypassing cache)...');
    setIsLoading(true);

    try {
      const response = await fetch('/api/domain-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: domainResult.query,
          refresh: true // Force cache bypass
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
        // Domain search flow
        const [domainResponse, brandResponse] = await Promise.all([
          fetch('/api/domain-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domain: searchQuery })
          }),
          fetch('/api/brand-kit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              idea: `Brand for ${searchQuery}`,
              tone: 'modern',
              audience: 'tech professionals',
              domain: searchQuery
            })
          })
        ]);

        const domainData = await domainResponse.json();
        const brandData = await brandResponse.json();

        console.log('Domain API response:', domainData);
        console.log('Brand API response:', brandData);

        setDomainResult(domainData);
        setBrandKit(brandData);

        // Generate trademark search for the domain root
        const domainRoot = searchQuery.split('.')[0];
        const trademarkResponse = await fetch('/api/trademark-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brandName: domainRoot })
        });
        const trademarkData = await trademarkResponse.json();
        setTrademarkResult(trademarkData);

        // Check social handles
        const socialResponse = await fetch('/api/social-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ handleBase: domainRoot })
        });
        const socialData = await socialResponse.json();
        setSocialResult(socialData);

        // Composite score will be calculated automatically via useEffect

      } else {
        // Idea search flow
        const brandResponse = await fetch('/api/brand-kit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idea: searchQuery,
            tone: 'modern',
            audience: 'general audience'
          })
        });

        const brandData = await brandResponse.json();
        setBrandKit(brandData);

        // For idea searches, don't automatically check domain availability
        // Let the user choose which generated name to check
        setDomainResult(null);


        // Check social handles
        const socialResponse = await fetch('/api/social-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ handleBase: searchQuery.toLowerCase().replace(/\s/g, '') })
        });
        const socialData = await socialResponse.json();
        setSocialResult(socialData);

        // Run trademark search for the idea
        const trademarkResponse = await fetch('/api/trademark-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            brandName: searchQuery,
            classes: [35, 42], // Default business classes for ideas
            includeInternational: false
          })
        });
        const trademarkData = await trademarkResponse.json();
        setTrademarkResult(trademarkData);

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
            The fastest domain validation tool on the internet
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Check domain availability, generate brand kits, validate trademarks, and get IP guidance.
            Our tool shows comprehensive results as you type, surfacing the best domain options at your fingertips.
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
                onAffiliateClick={handleAffiliateClick}
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