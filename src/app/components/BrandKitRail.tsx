'use client';

import { useState } from 'react';
import { BrandKit, BrandTone } from '@/lib/models/DomainResult';
import StandardContainer from './StandardContainer';
import { InfoBox } from './design-system';

interface BrandKitRailProps {
  brandKit: BrandKit | null;
  isLoading: boolean;
  onCheckDomain?: (domain: string) => void;
  searchTerm?: string;
}

export default function BrandKitRail({ brandKit, isLoading, onCheckDomain, searchTerm }: BrandKitRailProps) {
  const [selectedTone, setSelectedTone] = useState<BrandTone>('modern');
  const [generatingTone, setGeneratingTone] = useState<BrandTone | null>(null);

  const brandKitIcon = (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
    </svg>
  );

  // Handle tone change (lazy load if needed)
  const handleToneChange = async (tone: BrandTone) => {
    if (!brandKit) return;

    setSelectedTone(tone);

    // If this tone hasn't been loaded yet, fetch it
    if (!brandKit.tones[tone]) {
      setGeneratingTone(tone);

      try {
        const response = await fetch('/api/brand-kit/voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brandName: brandKit.brandName,
            tone,
            searchTerm: searchTerm || brandKit.brandName,
            audience: 'general audience'
          })
        });

        if (!response.ok) {
          throw new Error('Failed to generate tone content');
        }

        const data = await response.json();

        // Update brand kit with new tone data
        brandKit.tones[tone] = {
          tagline: data.tagline,
          logoPrompt: data.logoPrompt,
          colors: data.colors,
          typography: data.typography
        };

      } catch (error) {
        console.error(`Failed to load ${tone} tone:`, error);
      } finally {
        setGeneratingTone(null);
      }
    }
  };

  // State for tracking which section is regenerating
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);

  // Handle regenerating specific section
  const handleRegenerateSection = async (section: 'tagline' | 'logoPrompt' | 'colors' | 'typography') => {
    if (!brandKit || !currentTone) return;

    setRegeneratingSection(section);

    try {
      const response = await fetch('/api/brand-kit/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brandKit.brandName,
          tone: selectedTone,
          searchTerm: searchTerm || brandKit.brandName,
          audience: 'general audience',
          regenerate: true,
          regenerateOnly: section  // Request regeneration of specific section only
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to regenerate ${section}`);
      }

      const data = await response.json();

      // Update only the regenerated section
      brandKit.tones[selectedTone] = {
        ...currentTone,
        [section]: data[section]
      };

    } catch (error) {
      console.error(`Failed to regenerate ${section}:`, error);
    } finally {
      setRegeneratingSection(null);
    }
  };

  // Handle "Generate Again" - regenerates all sections
  const handleGenerateAgain = async () => {
    if (!brandKit) return;

    setGeneratingTone(selectedTone);

    try {
      const response = await fetch('/api/brand-kit/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brandKit.brandName,
          tone: selectedTone,
          searchTerm: searchTerm || brandKit.brandName,
          audience: 'general audience',
          regenerate: true  // Request new variation
        })
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate content');
      }

      const data = await response.json();

      // Update with new content
      brandKit.tones[selectedTone] = {
        tagline: data.tagline,
        logoPrompt: data.logoPrompt,
        colors: data.colors,
        typography: data.typography
      };

    } catch (error) {
      console.error('Failed to regenerate:', error);
    } finally {
      setGeneratingTone(null);
    }
  };

  // Handle Zoviz affiliate click
  const handleCreateLogo = () => {
    if (!brandKit) return;

    const currentTone = brandKit.tones[selectedTone];
    if (!currentTone) return;

    fetch('/api/affiliate/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partner: 'zoviz',
        offer: 'logo',
        url: brandKit.brandName,  // Fallback
        brandName: brandKit.brandName,
        tagline: currentTone.tagline,
        logoPrompt: currentTone.logoPrompt
      })
    }).then(response => response.json())
      .then(data => {
        if (data.success && data.affiliateUrl) {
          window.open(data.affiliateUrl, '_blank');
        }
      }).catch(error => {
        console.error('Affiliate click error:', error);
      });
  };

  if (isLoading) {
    return (
      <StandardContainer
        icon={brandKitIcon}
        title="Brand Kit"
        color="orange"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
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

  const currentTone = brandKit.tones[selectedTone];
  const isLoaded = currentTone !== null;
  const isGenerating = generatingTone === selectedTone;

  return (
    <StandardContainer
      icon={brandKitIcon}
      title="Brand Kit"
      score={brandKit.brandName}
      scoreColor="blue"
      color="orange"
    >
      {/* PRIMARY CTA - Create Logo */}
      <div className="mb-6">
        <button
          onClick={handleCreateLogo}
          disabled={!isLoaded || isGenerating}
          className="w-full px-6 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Logo
        </button>
      </div>

      {/* Tone Selector */}
      <div className="mb-4">
        <div className="flex gap-2">
          {(['modern', 'playful', 'formal'] as BrandTone[]).map((tone) => (
            <button
              key={tone}
              onClick={() => handleToneChange(tone)}
              disabled={generatingTone !== null}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded transition-colors capitalize ${
                selectedTone === tone
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
              } ${generatingTone !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {generatingTone === tone && (
                <svg className="inline-block animate-spin h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {tone}
            </button>
          ))}
        </div>
      </div>

      {/* Tone Content */}
      {isLoaded && currentTone ? (
        <div className="space-y-4">
          {/* Tagline */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-white text-sm">Tagline</h3>
              <button
                onClick={() => handleRegenerateSection('tagline')}
                disabled={regeneratingSection !== null}
                className="p-1 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Regenerate tagline"
              >
                <svg className={`w-4 h-4 ${regeneratingSection === 'tagline' ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-300 italic">"{currentTone.tagline}"</p>
          </div>

          {/* Logo Concept */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-white text-sm">Logo Concept</h3>
              <button
                onClick={() => handleRegenerateSection('logoPrompt')}
                disabled={regeneratingSection !== null}
                className="p-1 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Regenerate logo concept"
              >
                <svg className={`w-4 h-4 ${regeneratingSection === 'logoPrompt' ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <InfoBox variant="neutral">
              <p className="text-xs text-gray-300">
                {currentTone.logoPrompt}
              </p>
            </InfoBox>
          </div>

          {/* Colors */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-white text-sm">Colors</h3>
              <button
                onClick={() => handleRegenerateSection('colors')}
                disabled={regeneratingSection !== null}
                className="p-1 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Regenerate colors"
              >
                <svg className={`w-4 h-4 ${regeneratingSection === 'colors' ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <div
                  className="w-full h-10 rounded border border-gray-600"
                  style={{ backgroundColor: currentTone.colors.primary }}
                ></div>
                <p className="text-xs text-gray-400 mt-1 text-center">{currentTone.colors.primary}</p>
              </div>
              <div className="flex-1">
                <div
                  className="w-full h-10 rounded border border-gray-600"
                  style={{ backgroundColor: currentTone.colors.secondary }}
                ></div>
                <p className="text-xs text-gray-400 mt-1 text-center">{currentTone.colors.secondary}</p>
              </div>
              {currentTone.colors.accent && (
                <div className="flex-1">
                  <div
                    className="w-full h-10 rounded border border-gray-600"
                    style={{ backgroundColor: currentTone.colors.accent }}
                  ></div>
                  <p className="text-xs text-gray-400 mt-1 text-center">{currentTone.colors.accent}</p>
                </div>
              )}
            </div>
          </div>

          {/* Typography */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-white text-sm">Typography</h3>
              <button
                onClick={() => handleRegenerateSection('typography')}
                disabled={regeneratingSection !== null}
                className="p-1 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Regenerate typography"
              >
                <svg className={`w-4 h-4 ${regeneratingSection === 'typography' ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <div className="space-y-1 text-xs text-gray-300">
              <div><span className="text-gray-500">Heading:</span> {currentTone.typography.heading}</div>
              <div><span className="text-gray-500">Body:</span> {currentTone.typography.body}</div>
            </div>
          </div>

          {/* Generate Again Button */}
          <div className="pt-4 border-t border-gray-700">
            <button
              onClick={handleGenerateAgain}
              disabled={isGenerating}
              className="w-full px-4 py-2 bg-gray-700 text-white text-xs font-medium rounded hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isGenerating ? 'Generating...' : 'Generate Again'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}

    </StandardContainer>
  );
}
