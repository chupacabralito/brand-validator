'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isBrandKitResponse = (value: unknown): value is BrandKit => {
  if (!isRecord(value)) {
    return false;
  }

  const { brandName, tones } = value;

  if (typeof brandName !== 'string' || !isRecord(tones)) {
    return false;
  }

  return ['modern', 'playful', 'formal'].every((tone) => tone in tones);
};

const getApiErrorMessage = (value: unknown, fallback: string): string => {
  if (!isRecord(value)) {
    return fallback;
  }

  if (typeof value.message === 'string' && value.message.trim()) {
    return value.message;
  }

  if (typeof value.error === 'string' && value.error.trim()) {
    return value.error;
  }

  return fallback;
};

const parseBrandKitResponse = async (response: Response): Promise<BrandKit> => {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, 'Brand kit generation failed'));
  }

  if (!isBrandKitResponse(data)) {
    throw new Error('Brand kit response was missing required fields');
  }

  return data;
};

const parseJsonResponse = async <T,>(
  response: Response,
  fallbackMessage: string = `Request failed with status ${response.status}`
): Promise<T> => {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, fallbackMessage));
  }

  return data as T;
};

const isAbortError = (error: unknown): boolean => {
  return error instanceof Error && error.name === 'AbortError';
};

type ResponseParser<T> = (response: Response) => Promise<T>;

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
  const [brandKitError, setBrandKitError] = useState<string | null>(null);
  const [socialResult, setSocialResult] = useState<SocialCheckResult | null>(null);
  const [trademarkResult, setTrademarkResult] = useState<TrademarkSearchResult | null>(null);
  const [compositeResult, setCompositeResult] = useState<CompositeScoreResult | null>(null);
  const [selectedTrademarkCategory, setSelectedTrademarkCategory] = useState<string>('all');

  // Show results grid flag - appears immediately on search
  const [showResults, setShowResults] = useState(false);

  const activeSearchIdRef = useRef(0);
  const activeRequestControllersRef = useRef<AbortController[]>([]);

  const cancelActiveRequests = useCallback(() => {
    activeRequestControllersRef.current.forEach((controller) => controller.abort());
    activeRequestControllersRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      cancelActiveRequests();
    };
  }, [cancelActiveRequests]);

  const createRequestSignal = useCallback((timeoutMs: number) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
    activeRequestControllersRef.current.push(controller);

    const release = () => {
      window.clearTimeout(timeoutId);
      activeRequestControllersRef.current = activeRequestControllersRef.current.filter(
        (currentController) => currentController !== controller
      );
    };

    return {
      signal: controller.signal,
      release,
    };
  }, []);

  const postJson = useCallback(
    async function postJson<T>(
      url: string,
      body: unknown,
      timeoutMs: number,
      parser?: ResponseParser<T>
    ): Promise<T> {
      const { signal, release } = createRequestSignal(timeoutMs);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal,
        });

        if (parser) {
          return parser(response);
        }

        return parseJsonResponse<T>(response);
      } finally {
        release();
      }
    },
    [createRequestSignal]
  );

  const calculateCompositeScore = useCallback(async () => {
    if (!domainResult || !socialResult || !trademarkResult) {
      setCompositeResult(null);
      return;
    }

    const searchId = activeSearchIdRef.current;

    try {
      const data = await postJson<CompositeScoreResult>(
        '/api/composite-score',
        {
          domainResult,
          socialResult,
          trademarkResult,
          selectedTrademarkCategory,
        },
        10000,
        (response) => parseJsonResponse<CompositeScoreResult>(response, 'Failed to calculate composite score')
      );

      if (activeSearchIdRef.current === searchId) {
        setCompositeResult(data);
      }
    } catch (error) {
      if (!isAbortError(error)) {
        console.error('Error calculating composite score:', error);
      }
    }
  }, [domainResult, socialResult, trademarkResult, selectedTrademarkCategory, postJson]);

  // Calculate composite score when core results are available (domain, social, trademark)
  // Brand Kit is NOT part of composite score calculation
  useEffect(() => {
    if (domainResult && socialResult && trademarkResult) {
      calculateCompositeScore();
    } else {
      setCompositeResult(null);
    }
  }, [domainResult, socialResult, trademarkResult, selectedTrademarkCategory, calculateCompositeScore]);

  // OPTIMIZATION: Cache results when composite score is calculated
  useEffect(() => {
    if (compositeResult && query && selectedTrademarkCategory === 'all') {
      const cacheKey = `search_${query.toLowerCase()}`;
      const cacheData = {
        timestamp: Date.now(),
        domain: domainResult,
        brand: brandKit,
        brandError: brandKitError,
        social: socialResult,
        trademark: trademarkResult,
        composite: compositeResult
      };

      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } catch (e) {
        console.warn('Failed to cache results:', e);
      }
    }
  }, [compositeResult, query, selectedTrademarkCategory, domainResult, brandKit, brandKitError, socialResult, trademarkResult]);

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
  };

  const handleSearch = (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;

    cancelActiveRequests();
    const searchId = activeSearchIdRef.current + 1;
    activeSearchIdRef.current = searchId;

    let hasStoppedMainLoading = false;
    const stopMainLoading = () => {
      if (activeSearchIdRef.current !== searchId || hasStoppedMainLoading) {
        return;
      }

      hasStoppedMainLoading = true;
      setIsLoading(false);
    };

    // OPTIMIZATION: Client-side cache check (instant for repeated searches)
    const cacheKey = `search_${trimmedQuery.toLowerCase()}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const cachedData = JSON.parse(cached);
        const cacheAge = Date.now() - cachedData.timestamp;

        // Use cache if < 5 minutes old
        if (cacheAge < 5 * 60 * 1000) {
          setQuery(trimmedQuery);
          setSelectedTrademarkCategory('all');
          setShowResults(true);
          setIsLoading(false);
          setIsDomainLoading(false);
          setIsBrandLoading(false);
          setIsSocialLoading(false);
          setIsTrademarkLoading(false);
          setDomainResult(cachedData.domain || null);
          setBrandKit(isBrandKitResponse(cachedData.brand) ? cachedData.brand : null);
          setBrandKitError(typeof cachedData.brandError === 'string' ? cachedData.brandError : null);
          setSocialResult(cachedData.social || null);
          setTrademarkResult(cachedData.trademark || null);
          setCompositeResult(cachedData.composite || null);
          return; // Skip API calls entirely!
        }
      } catch (e) {
        console.warn('Cache parse error:', e);
      }
    }

    setIsLoading(true);
    setQuery(trimmedQuery);
    setSelectedTrademarkCategory('all');

    // Show results grid immediately (empty skeleton)
    setShowResults(true);

    // Reset all results and set all to loading
    setDomainResult(null);
    setBrandKit(null);
    setBrandKitError(null);
    setSocialResult(null);
    setTrademarkResult(null);
    setCompositeResult(null);

    // Check if it's a domain or idea
    const isDomain = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,}|[a-zA-Z]{2,}\.[a-zA-Z]{2,})$/.test(trimmedQuery);
    const isPotentialDomain = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?$/.test(trimmedQuery) && !trimmedQuery.includes(' ');

    if (isDomain || isPotentialDomain) {
      const domainRoot = trimmedQuery.split('.')[0];

      setIsDomainLoading(true);
      setIsBrandLoading(true);
      setIsSocialLoading(true);
      setIsTrademarkLoading(true);

      void postJson<DomainResult>(
        '/api/domain-check-fast',
        { domain: trimmedQuery },
        5000,
        (response) => parseJsonResponse<DomainResult>(response, 'Failed to check domain availability')
      )
        .then((data) => {
          if (activeSearchIdRef.current !== searchId) return;
          setDomainResult(data);
          setIsDomainLoading(false);
          stopMainLoading();
        })
        .catch((error) => {
          if (activeSearchIdRef.current !== searchId || isAbortError(error)) return;
          console.error('Domain check failed:', error);
          setIsDomainLoading(false);
          stopMainLoading();
        });

      void postJson<BrandKit>(
        '/api/brand-kit',
        {
          idea: `Brand for ${trimmedQuery}`,
          tone: 'modern',
          audience: 'tech professionals',
          domain: trimmedQuery,
        },
        15000,
        parseBrandKitResponse
      )
        .then((data) => {
          if (activeSearchIdRef.current !== searchId) return;
          setBrandKitError(null);
          setBrandKit(data);
          setIsBrandLoading(false);
          stopMainLoading();
        })
        .catch((error) => {
          if (activeSearchIdRef.current !== searchId || isAbortError(error)) return;
          console.error('Brand API failed:', error);
          setBrandKit(null);
          setBrandKitError(error instanceof Error ? error.message : 'Brand kit unavailable right now');
          setIsBrandLoading(false);
          stopMainLoading();
        });

      void postJson<TrademarkSearchResult>(
        '/api/trademark-search',
        { brandName: domainRoot },
        35000,
        (response) => parseJsonResponse<TrademarkSearchResult>(response, 'Failed to perform trademark search')
      )
        .then((data) => {
          if (activeSearchIdRef.current !== searchId) return;
          setTrademarkResult(data);
          setIsTrademarkLoading(false);
          stopMainLoading();
        })
        .catch((error) => {
          if (activeSearchIdRef.current !== searchId || isAbortError(error)) return;
          console.error('Trademark API failed:', error);
          setIsTrademarkLoading(false);
          stopMainLoading();
        });

      void postJson<SocialCheckResult>(
        '/api/social-check',
        { handleBase: domainRoot },
        15000,
        (response) => parseJsonResponse<SocialCheckResult>(response, 'Failed to check social handles')
      )
        .then((data) => {
          if (activeSearchIdRef.current !== searchId) return;
          setSocialResult(data);
          setIsSocialLoading(false);
          stopMainLoading();
        })
        .catch((error) => {
          if (activeSearchIdRef.current !== searchId || isAbortError(error)) return;
          console.error('Social API failed:', error);
          setIsSocialLoading(false);
          stopMainLoading();
        });

      return;
    }

    const handleBase = trimmedQuery.toLowerCase().replace(/\s/g, '');

    setIsDomainLoading(false);
    setIsBrandLoading(true);
    setIsSocialLoading(true);
    setIsTrademarkLoading(true);

    void postJson<BrandKit>(
      '/api/brand-kit',
      {
        idea: trimmedQuery,
        tone: 'modern',
        audience: 'general audience',
      },
      15000,
      parseBrandKitResponse
    )
      .then((data) => {
        if (activeSearchIdRef.current !== searchId) return;
        setBrandKitError(null);
        setBrandKit(data);
        setIsBrandLoading(false);
        stopMainLoading();
      })
      .catch((error) => {
        if (activeSearchIdRef.current !== searchId || isAbortError(error)) return;
        console.error('Brand API failed:', error);
        setBrandKit(null);
        setBrandKitError(error instanceof Error ? error.message : 'Brand kit unavailable right now');
        setIsBrandLoading(false);
        stopMainLoading();
      });

    void postJson<SocialCheckResult>(
      '/api/social-check',
      { handleBase },
      15000,
      (response) => parseJsonResponse<SocialCheckResult>(response, 'Failed to check social handles')
    )
      .then((data) => {
        if (activeSearchIdRef.current !== searchId) return;
        setSocialResult(data);
        setIsSocialLoading(false);
        stopMainLoading();
      })
      .catch((error) => {
        if (activeSearchIdRef.current !== searchId || isAbortError(error)) return;
        console.error('Social API failed:', error);
        setIsSocialLoading(false);
        stopMainLoading();
      });

    void postJson<TrademarkSearchResult>(
      '/api/trademark-search',
      {
        brandName: trimmedQuery,
        classes: [35, 42],
        includeInternational: false,
      },
      35000,
      (response) => parseJsonResponse<TrademarkSearchResult>(response, 'Failed to perform trademark search')
    )
      .then((data) => {
        if (activeSearchIdRef.current !== searchId) return;
        setTrademarkResult(data);
        setIsTrademarkLoading(false);
        stopMainLoading();
      })
      .catch((error) => {
        if (activeSearchIdRef.current !== searchId || isAbortError(error)) return;
        console.error('Trademark API failed:', error);
        setIsTrademarkLoading(false);
        stopMainLoading();
      });
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
                errorMessage={brandKitError}
                onBrandKitChange={setBrandKit}
                isLoading={isBrandLoading}
                searchTerm={query}
              />
            </div>
          </div>
        )}



      </div>
    </div>
  );
}
