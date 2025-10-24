'use client';

import { useState, useEffect } from 'react';
import { DomainResult } from '@/lib/models/DomainResult';
import StandardContainer from './StandardContainer';

interface DomainRailProps {
  domainResult: DomainResult | null;
  isLoading: boolean;
  onAffiliateClick?: (partner: string, offer: string, url: string) => void;
  onRefresh?: () => void;
}

export default function DomainRail({ domainResult, isLoading, onAffiliateClick, onRefresh }: DomainRailProps) {
  const [showWhoisModal, setShowWhoisModal] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('DomainRail received:', { domainResult, isLoading });
  }, [domainResult, isLoading]);

  const handleAffiliateClick = (partner: string, offer: string, domain: string) => {
    console.log('Affiliate click:', { partner, offer, domain });

    // For Namecheap, try using subpath format with Impact redirect
    if (partner === 'namecheap') {
      // Try encoding the destination path in the Impact URL
      // Format: https://namecheap.pxf.io/raYKqR/domains/registration/results/?domain=example.com
      const affiliateUrl = `https://namecheap.pxf.io/raYKqR/domains/registration/results/?domain=${encodeURIComponent(domain)}`;
      console.log('Opening affiliate URL:', affiliateUrl);
      window.open(affiliateUrl, '_blank');
      return;
    }

    // For other partners, use the API route if provided
    if (onAffiliateClick) {
      onAffiliateClick(partner, offer, domain);
    } else {
      console.warn('No affiliate handler configured for partner:', partner);
    }
  };

  const handleMakeOffer = (domain: string) => {
    // Link to Namecheap broker service
    const brokerUrl = `https://www.namecheap.com/domains/marketplace/buy-domains/?aff=${process.env.NEXT_PUBLIC_NAMECHEAP_AFFILIATE_ID || ''}&domain=${encodeURIComponent(domain)}`;
    window.open(brokerUrl, '_blank');
  };

  const domainIcon = (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
    </svg>
  );

  // Status indicator component
  const StatusIndicator = ({ status }: { status: 'available' | 'taken' }) => (
    <span className={`inline-block w-2 h-2 rounded-full ${
      status === 'available' ? 'bg-green-400' : 'bg-red-400'
    }`} />
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

  const domainScore = domainResult.status === 'available' ? 'Available' : 'Taken';
  const scoreColor = domainResult.status === 'available' ? 'green' : 'red';

  return (
    <>
      <StandardContainer
        icon={domainIcon}
        title="Domain Verify"
        score={domainScore}
        scoreColor={scoreColor}
        color="blue"
      >
        {/* Primary CTA - Above domain name */}
        <div className="mb-6">
          {/* Dynamic CTAs based on status */}
          <div className="flex gap-2 mb-4">
            {domainResult.status === 'available' ? (
              // Available: Single green "Continue" button
              <button
                onClick={() => handleAffiliateClick('namecheap', 'domain', domainResult.query)}
                className="flex-1 px-6 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                Continue
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              // Taken: "Lookup" + "Make Offer"
              <>
                <button
                  onClick={() => handleMakeOffer(domainResult.query)}
                  className="flex-1 px-6 py-3 bg-gray-700 text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                >
                  Make Offer
                </button>
                <button
                  onClick={() => setShowWhoisModal(true)}
                  className="flex-1 px-6 py-3 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  Lookup
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Domain name display */}
          <div className="flex items-center gap-3">
            <StatusIndicator status={domainResult.status} />
            <span className="text-lg font-semibold text-white">{domainResult.query}</span>
          </div>
        </div>

        {/* Pricing Info (for available domains) */}
        {domainResult.status === 'available' && domainResult.pricing && (
          <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div className="text-xs text-gray-400 mb-1">Namecheap Pricing</div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-semibold text-white">
                ${domainResult.pricing.registration}
              </span>
              <span className="text-xs text-gray-400">
                / year (renews at ${domainResult.pricing.renewal})
              </span>
            </div>
          </div>
        )}

        {/* WHOIS Info (for taken domains) */}
        {domainResult.status === 'taken' && (domainResult.registrar || domainResult.expirationDate) && (
          <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div className="text-xs text-gray-400 mb-2">Registration Info</div>
            <div className="space-y-1 text-sm text-gray-300">
              {domainResult.registrar && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Registrar:</span>
                  <span>{domainResult.registrar}</span>
                </div>
              )}
              {domainResult.expirationDate && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Expires:</span>
                  <span>{new Date(domainResult.expirationDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Alternative Domains */}
        {domainResult.alternates && domainResult.alternates.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-700">
            <h3 className="font-semibold mb-3 text-white text-sm">Alternative Domains</h3>
            <div className="space-y-2">
              {domainResult.alternates.slice(0, 5).map((alt, index) => {
                const altStatus = alt.status || (alt.available !== undefined ? (alt.available ? 'available' : 'taken') : 'available');

                return (
                  <div
                    key={index}
                    className="flex flex-col gap-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-gray-600 hover:bg-gray-800 transition-all"
                  >
                    {/* Domain name and status */}
                    <div className="flex items-center gap-2">
                      <StatusIndicator status={altStatus} />
                      <span className="text-sm font-medium text-white break-all">{alt.domain}</span>
                    </div>

                    {/* Status badge and CTA button */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium whitespace-nowrap ${
                        altStatus === 'available'
                          ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                          : 'bg-red-600/20 text-red-400 border border-red-600/30'
                      }`}>
                        {altStatus === 'available' ? 'Available' : 'Taken'}
                      </span>

                      {/* Dynamic CTA based on status */}
                      {altStatus === 'available' ? (
                        <button
                          onClick={() => handleAffiliateClick('namecheap', 'domain', alt.domain)}
                          className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors flex items-center gap-1 whitespace-nowrap"
                        >
                          Continue
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowWhoisModal(true)}
                          className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition-colors flex items-center gap-1 whitespace-nowrap"
                        >
                          Lookup
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </StandardContainer>

      {/* WHOIS Modal */}
      {showWhoisModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowWhoisModal(false)}>
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6 border border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Domain Lookup: {domainResult.query}</h2>
              <button
                onClick={() => setShowWhoisModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 text-sm">
              {domainResult.registrar && (
                <div className="flex justify-between py-2 border-b border-gray-700">
                  <span className="text-gray-400">Registrar:</span>
                  <span className="text-white font-medium">{domainResult.registrar}</span>
                </div>
              )}
              {domainResult.registrationDate && (
                <div className="flex justify-between py-2 border-b border-gray-700">
                  <span className="text-gray-400">Registered:</span>
                  <span className="text-white">{new Date(domainResult.registrationDate).toLocaleDateString()}</span>
                </div>
              )}
              {domainResult.expirationDate && (
                <div className="flex justify-between py-2 border-b border-gray-700">
                  <span className="text-gray-400">Expires:</span>
                  <span className="text-white">{new Date(domainResult.expirationDate).toLocaleDateString()}</span>
                </div>
              )}

              <div className="mt-6 p-4 bg-gray-900 rounded-lg">
                <p className="text-gray-300 text-xs leading-relaxed">
                  This domain is currently registered. You can try making an offer to the current owner through Namecheap's domain marketplace.
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleMakeOffer(domainResult.query)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Make an Offer
                </button>
                <button
                  onClick={() => setShowWhoisModal(false)}
                  className="px-4 py-2 bg-gray-700 text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
