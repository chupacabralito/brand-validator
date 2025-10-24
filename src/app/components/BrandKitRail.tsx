'use client';

import { useState, useEffect } from 'react';
import { BrandKit } from '@/lib/models/DomainResult';
import StandardContainer from './StandardContainer';

interface BrandKitRailProps {
  brandKit: BrandKit | null;
  isLoading: boolean;
  onCheckDomain?: (domain: string) => void;
  searchTerm?: string;  // Original search term for context
}

interface VoiceContent {
  taglines: string[];
  logoPrompts: string[];
}

export default function BrandKitRail({ brandKit, isLoading, onCheckDomain, searchTerm }: BrandKitRailProps) {
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>('modern');
  const [voiceCache, setVoiceCache] = useState<Record<string, VoiceContent>>({});
  const [generatingVoice, setGeneratingVoice] = useState<string | null>(null);
  const [showAllLogoConcepts, setShowAllLogoConcepts] = useState<boolean>(false);

  // Initialize cache with default modern content when brandKit loads
  useEffect(() => {
    if (brandKit && !voiceCache.modern) {
      setVoiceCache({
        modern: {
          taglines: brandKit.taglines || [],
          logoPrompts: brandKit.logoPrompts || []
        }
      });
    }
  }, [brandKit]);

  // Handle voice selection
  const handleVoiceChange = async (voice: string) => {
    setSelectedVoice(voice);
    setSelectedName(null); // Reset name selection when voice changes

    // Skip if we already have cached content
    if (voiceCache[voice]) {
      return;
    }

    // Generate voice-specific content
    if (!brandKit || !searchTerm) return;

    const currentName = selectedName || displayNames[0]?.value;
    if (!currentName) return;

    setGeneratingVoice(voice);

    try {
      const response = await fetch('/api/brand-kit/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: currentName,
          voice,
          searchTerm
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate voice-specific content');
      }

      const data = await response.json();

      // Cache the generated content
      setVoiceCache(prev => ({
        ...prev,
        [voice]: {
          taglines: data.taglines || [],
          logoPrompts: data.logoPrompts || []
        }
      }));

    } catch (error) {
      console.error('Voice generation error:', error);
      // Fallback: use original brand kit content
      setVoiceCache(prev => ({
        ...prev,
        [voice]: {
          taglines: brandKit.taglines || [],
          logoPrompts: brandKit.logoPrompts || []
        }
      }));
    } finally {
      setGeneratingVoice(null);
    }
  };

  const handleAffiliateClick = (partner: string, offer: string, brand: string) => {
    console.log('Affiliate click:', { partner, offer, brand });
    
    // Fallback: direct API call
    const requestBody = { partner, offer, url: brand };
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
      const fallbackUrl = `https://${partner}.com/search?q=${encodeURIComponent(brand)}`;
      console.log('Using fallback URL:', fallbackUrl);
      window.open(fallbackUrl, '_blank');
    });
  };

  const brandKitIcon = (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
    </svg>
  );

  if (isLoading) {
    return (
      <StandardContainer
        icon={brandKitIcon}
        title="Brand Kit"
        color="orange"
      >
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-700 rounded"></div>
        </div>
      </StandardContainer>
    );
  }

  if (!brandKit) {
    return (
      <StandardContainer
        icon={brandKitIcon}
        title="Brand Kit"
        color="orange"
      >
        <p className="text-gray-400">Enter an idea to generate brand assets</p>
      </StandardContainer>
    );
  }

  // Filter names based on selected voice
  const filteredNames = brandKit.nameVariants.filter(variant => variant.tone === selectedVoice);
  const displayNames = filteredNames.length > 0 ? filteredNames : brandKit.nameVariants;
  const currentName = selectedName || displayNames[0]?.value;

  // Get voice-specific content from cache or use defaults
  const currentVoiceContent = voiceCache[selectedVoice] || {
    taglines: brandKit.taglines,
    logoPrompts: brandKit.logoPrompts
  };

  const displayTaglines = currentVoiceContent.taglines || [];
  const displayLogoPrompts = currentVoiceContent.logoPrompts || [];

  const brandCount = brandKit.nameVariants.length;

  return (
    <StandardContainer
      icon={brandKitIcon}
      title="Brand Kit"
      score={`${brandCount} names`}
      scoreColor="blue"
      color="orange"
    >
      {/* PRIMARY CTA - Status-driven (always positive for brand kit) */}
      <div className="mb-6">
        <button
          onClick={() => handleAffiliateClick('logoai', 'logo', selectedName || displayNames[0]?.value)}
          className="w-full px-6 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
        >
          Create Logo
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Brand Voice - Filter Control */}
      {brandKit.voice && (
        <div className="mb-4">
          {generatingVoice && (
            <div className="flex items-center justify-end mb-2">
              <span className="text-xs text-blue-400 flex items-center gap-1">
                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </span>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {['modern', 'playful', 'serious'].map((tone) => (
              <button
                key={tone}
                onClick={() => handleVoiceChange(tone)}
                disabled={generatingVoice !== null}
                className={`px-3 py-1 text-xs rounded transition-colors capitalize ${
                  selectedVoice === tone
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                } ${generatingVoice !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {tone}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Brand Names - Fixed Grid */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-white text-sm">Brand Names</h3>
          <span className={`text-xs capitalize ${
            filteredNames.length === 0
              ? 'text-yellow-400'
              : 'text-blue-400'
          }`}>
            {filteredNames.length === 0
              ? `No ${selectedVoice} names - showing all`
              : `${displayNames.length} ${selectedVoice} names`
            }
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {displayNames.slice(0, 4).map((variant, index) => (
            <div
              key={index}
              className={`p-2 rounded cursor-pointer border transition-colors ${
                selectedName === variant.value
                  ? 'border-blue-500 bg-blue-600/20'
                  : 'border-gray-700 hover:border-gray-600 bg-gray-800'
              }`}
              onClick={() => setSelectedName(variant.value)}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-white text-sm break-words flex-1 mr-2">{variant.value}</span>
                <span className={`px-2 py-1 text-xs rounded ${
                  variant.tone === 'modern' ? 'bg-blue-600/20 text-blue-400' :
                  variant.tone === 'playful' ? 'bg-green-600/20 text-green-400' :
                  'bg-gray-600/20 text-gray-400'
                }`}>
                  {variant.tone}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Taglines - Dynamic Based on Voice */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-white text-sm">Taglines</h3>
          {selectedVoice && (
            <span className="text-xs text-blue-400 capitalize">
              {selectedVoice} voice
            </span>
          )}
        </div>
        <div className="space-y-1">
          {displayTaglines.slice(0, 3).map((tagline, index) => (
            <div key={index} className="text-xs text-gray-300 italic break-words">
              "{tagline}"
            </div>
          ))}
          {displayTaglines.length > 3 && (
            <div className="text-xs text-gray-500">
              +{displayTaglines.length - 3} more
            </div>
          )}
          {displayTaglines.length === 0 && (
            <div className="text-xs text-gray-500 italic">
              No taglines available
            </div>
          )}
        </div>
      </div>

      {/* Logo Concepts - Dynamic Based on Voice */}
      {displayLogoPrompts.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-white text-sm">Logo Concepts</h3>
            {selectedVoice && (
              <span className="text-xs text-blue-400 capitalize">
                {selectedVoice} style
              </span>
            )}
          </div>
          <div className="space-y-2">
            {(showAllLogoConcepts ? displayLogoPrompts : displayLogoPrompts.slice(0, 2)).map((prompt, index) => (
              <div key={index} className="text-xs text-gray-300 bg-gray-800/50 rounded p-2 border border-gray-700">
                {prompt}
              </div>
            ))}
            {displayLogoPrompts.length > 2 && (
              <button
                onClick={() => setShowAllLogoConcepts(!showAllLogoConcepts)}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                {showAllLogoConcepts
                  ? 'Show less'
                  : `+${displayLogoPrompts.length - 2} more concepts`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Secondary Actions */}
      {selectedName && onCheckDomain && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          {/* Domain Check */}
          <button
            onClick={() => onCheckDomain(`${selectedName.toLowerCase()}.com`)}
            className="w-full bg-gray-600 text-white py-2 px-3 rounded text-xs hover:bg-gray-700 transition-colors"
          >
            Check Domain: {selectedName.toLowerCase()}.com
          </button>
        </div>
      )}
    </StandardContainer>
  );
}
