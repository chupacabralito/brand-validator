'use client';

import { useState, useEffect, useRef } from 'react';
import { DomainResult } from '@/lib/models/DomainResult';
import StandardContainer from './StandardContainer';

interface DomainRailProps {
  domainResult: DomainResult | null;
  isLoading: boolean;
  onAffiliateClick?: (partner: string, offer: string, url: string) => void;
  onRefresh?: () => void;
}

export default function DomainRail({ domainResult, isLoading, onAffiliateClick, onRefresh }: DomainRailProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedRegistrar, setSelectedRegistrar] = useState<string>('godaddy'); // Default registrar for alternatives
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debug logging
  useEffect(() => {
    console.log('DomainRail received:', { domainResult, isLoading });
  }, [domainResult, isLoading]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const domainRegistrars = [
    { name: 'GoDaddy', partner: 'godaddy', color: 'bg-green-600 hover:bg-green-700' },
    { name: 'Namecheap', partner: 'namecheap', color: 'bg-blue-600 hover:bg-blue-700' },
    { name: 'Bluehost', partner: 'bluehost', color: 'bg-indigo-600 hover:bg-indigo-700' },
    { name: 'Domain.com', partner: 'domaincom', color: 'bg-teal-600 hover:bg-teal-700' },
    { name: 'Hostinger', partner: 'hostinger', color: 'bg-orange-600 hover:bg-orange-700' },
    { name: 'Spaceship', partner: 'spaceship', color: 'bg-cyan-600 hover:bg-cyan-700' }
  ];

  const handleAffiliateClick = (partner: string, offer: string, url: string) => {
    console.log('Affiliate click:', { partner, offer, url });
    
    if (onAffiliateClick) {
      onAffiliateClick(partner, offer, url);
    } else {
      // Fallback: direct API call
      const requestBody = { partner, offer, url };
      console.log('Sending request body:', requestBody);
      
      fetch('/api/affiliate/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }).then(response => {
        console.log('Response status:', response.status);
        if (response.ok) {
          return response.json();
        }
        return response.json().then(errorData => {
          console.error('API Error:', errorData);
          throw new Error(errorData.error || 'Failed to get affiliate link');
        });
      }).then(data => {
        console.log('API Response:', data);
        if (data.success && data.affiliateUrl) {
          window.open(data.affiliateUrl, '_blank');
        } else {
          console.error('No affiliate URL returned:', data);
        }
      }).catch(error => {
        console.error('Affiliate click error:', error);
        // Fallback: try to construct a basic affiliate URL
        const fallbackUrl = `https://${partner}.com/search?q=${encodeURIComponent(url)}`;
        console.log('Using fallback URL:', fallbackUrl);
        window.open(fallbackUrl, '_blank');
      });
    }
  };
  const domainIcon = (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
    </svg>
  );

  if (isLoading) {
    return (
      <StandardContainer
        icon={domainIcon}
        title="Domain Verify"
        color="blue"
      >
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-700 rounded"></div>
        </div>
      </StandardContainer>
    );
  }

  if (!domainResult) {
    return (
      <StandardContainer
        icon={domainIcon}
        title="Domain Verify"
        color="blue"
      >
        <p className="text-gray-400">Enter a domain to check availability</p>
      </StandardContainer>
    );
  }

  const cheapestPrice = domainResult.registrarPrices?.reduce((min, current) => 
    current.priceUsd < min.priceUsd ? current : min
  );

  const domainScore = domainResult.available ? 'Available' : 'Taken';
  const scoreColor = domainResult.available ? 'green' : 'red';

  return (
    <StandardContainer
      icon={domainIcon}
      title="Domain Verify"
      score={domainScore}
      scoreColor={scoreColor}
      color="blue"
    >

      {/* PRIMARY CTA SECTION - Always Present, Adaptive Content */}
      <div className="mb-6">
        {domainResult.available ? (
          // Available: Single CTA for main domain
          <div className="relative" ref={dropdownRef}>
            <div className="flex">
              <button
                onClick={() => handleAffiliateClick('godaddy', 'domain', domainResult.query)}
                className="flex-1 px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-l-lg hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-r-lg hover:bg-blue-700 transition-colors border-l border-blue-500/30 flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
                <div className="p-2">
                  <div className="text-xs text-gray-400 mb-2 px-2">Choose Domain Registrar</div>
                  {domainRegistrars.map((registrar, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        handleAffiliateClick(registrar.partner, 'domain', domainResult.query);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-white hover:bg-gray-700 transition-colors flex items-center gap-3 rounded"
                    >
                      <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white ${registrar.color.split(' ')[0]}`}>
                        {registrar.name.charAt(0)}
                      </div>
                      <span className="flex-1">{registrar.name}</span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Taken: Show alternatives if available, otherwise show search CTA
          <div>
            {domainResult.alternates && domainResult.alternates.length > 0 ? (
              <>
                <div className="mb-4">
                  <h3 className="font-semibold mb-3 text-white text-base">Available Alternatives</h3>

                  {/* Global Registrar Selector */}
                  <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                    <label className="block text-xs text-gray-400 mb-2">Preferred Registrar</label>
                    <div className="grid grid-cols-3 gap-2">
                      {domainRegistrars.slice(0, 6).map((registrar) => (
                        <button
                          key={registrar.partner}
                          onClick={() => setSelectedRegistrar(registrar.partner)}
                          className={`px-2 py-2 text-xs font-medium rounded transition-all ${
                            selectedRegistrar === registrar.partner
                              ? 'bg-blue-600 text-white border-2 border-blue-400'
                              : 'bg-gray-700/50 text-gray-300 border border-gray-600 hover:border-gray-500'
                          }`}
                        >
                          {registrar.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Simplified Domain List */}
                <div className="space-y-2">
                  {domainResult.alternates.map((alt, index) => (
                    <div
                      key={index}
                      className="group flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-gray-600 hover:bg-gray-800 transition-all"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-sm font-medium text-white truncate">{alt.domain}</span>
                        {alt.available !== undefined && (
                          <span className={`px-2 py-0.5 text-xs rounded-full font-medium whitespace-nowrap ${
                            alt.available
                              ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                              : 'bg-red-600/20 text-red-400 border border-red-600/30'
                          }`}>
                            {alt.available ? 'Available' : 'Taken'}
                          </span>
                        )}
                      </div>

                      {/* Only show Register button if available or status unknown */}
                      {(alt.available === undefined || alt.available) && (
                        <button
                          onClick={() => handleAffiliateClick(selectedRegistrar, 'domain', alt.domain)}
                          className="px-4 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1"
                        >
                          Register
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              // No alternates available - show search CTA
              <div className="text-center py-4">
                <p className="text-sm text-gray-400 mb-3">This domain is registered</p>
                <div className="relative" ref={dropdownRef}>
                  <div className="flex">
                    <button
                      onClick={() => handleAffiliateClick('godaddy', 'domain', domainResult.query)}
                      className="flex-1 px-6 py-2 bg-gray-600 text-white text-sm font-medium rounded-l-lg hover:bg-gray-700 transition-colors"
                    >
                      Search Registrars
                    </button>
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-r-lg hover:bg-gray-700 transition-colors border-l border-gray-500/30 flex items-center justify-center"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
                      <div className="p-2">
                        <div className="text-xs text-gray-400 mb-2 px-2">Choose Domain Registrar</div>
                        {domainRegistrars.map((registrar, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              handleAffiliateClick(registrar.partner, 'domain', domainResult.query);
                              setIsDropdownOpen(false);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-white hover:bg-gray-700 transition-colors flex items-center gap-3 rounded"
                          >
                            <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white ${registrar.color.split(' ')[0]}`}>
                              {registrar.name.charAt(0)}
                            </div>
                            <span className="flex-1">{registrar.name}</span>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Domain Reference */}
      <div className="mb-4 pb-4 border-b border-gray-700">
        <span className="text-base font-medium text-white">{domainResult.query}</span>
      </div>

      {/* Additional Info Section */}
      <div className="space-y-3">
        {/* Last Checked Timestamp */}
        {domainResult.lastChecked && (
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                {domainResult.fromCache ? 'Cached: ' : 'Checked: '}
                {new Date(domainResult.lastChecked).toLocaleString()}
              </span>
            </div>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="flex items-center gap-1 px-2 py-1 text-blue-400 hover:text-blue-300 hover:bg-gray-700/50 rounded transition-colors"
                title="Force refresh (bypass cache)"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            )}
          </div>
        )}

        {cheapestPrice && (
          <div className="text-sm text-gray-300">
            Cheapest: ${cheapestPrice.priceUsd} at {cheapestPrice.registrar}
            {cheapestPrice.promo && (
              <span className="ml-2 text-green-400">({cheapestPrice.promo})</span>
            )}
          </div>
        )}
      </div>

      {/* Additional Alternatives for Available Domains */}
      {domainResult.available && domainResult.alternates && domainResult.alternates.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="mb-4">
            <h3 className="font-semibold mb-3 text-white text-sm">More Alternatives</h3>

            {/* Global Registrar Selector */}
            <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
              <label className="block text-xs text-gray-400 mb-2">Preferred Registrar</label>
              <div className="grid grid-cols-3 gap-2">
                {domainRegistrars.slice(0, 6).map((registrar) => (
                  <button
                    key={registrar.partner}
                    onClick={() => setSelectedRegistrar(registrar.partner)}
                    className={`px-2 py-2 text-xs font-medium rounded transition-all ${
                      selectedRegistrar === registrar.partner
                        ? 'bg-blue-600 text-white border-2 border-blue-400'
                        : 'bg-gray-700/50 text-gray-300 border border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    {registrar.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Simplified Domain List */}
          <div className="space-y-2">
            {domainResult.alternates.map((alt, index) => (
              <div
                key={index}
                className="group flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-gray-600 hover:bg-gray-800 transition-all"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-sm font-medium text-white truncate">{alt.domain}</span>
                  {alt.available !== undefined && (
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium whitespace-nowrap ${
                      alt.available
                        ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                        : 'bg-red-600/20 text-red-400 border border-red-600/30'
                    }`}>
                      {alt.available ? 'Available' : 'Taken'}
                    </span>
                  )}
                </div>

                {/* Only show Register button if available or status unknown */}
                {(alt.available === undefined || alt.available) && (
                  <button
                    onClick={() => handleAffiliateClick(selectedRegistrar, 'domain', alt.domain)}
                    className="px-4 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1"
                  >
                    Register
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </StandardContainer>
  );
}
