'use client';

import { useState, useRef, useEffect } from 'react';

export interface Partner {
  name: string;
  partner: string; // Partner ID for API calls
  color: string; // Tailwind class like 'bg-green-600'
  icon?: string; // Optional icon letter
}

interface AffiliateCTAProps {
  primaryText: string;
  partners: Partner[];
  onAffiliateClick: (partner: string, offer: string, url: string) => void;
  offer: string; // 'domain', 'logo', 'trademark', 'social', etc.
  targetUrl: string; // The item being purchased (domain name, brand name, etc.)
  context?: string; // For analytics tracking
  className?: string;
}

export default function AffiliateCTA({
  primaryText,
  partners,
  onAffiliateClick,
  offer,
  targetUrl,
  context,
  className = ''
}: AffiliateCTAProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handlePrimaryClick = () => {
    // Use first partner as default
    if (partners.length > 0) {
      onAffiliateClick(partners[0].partner, offer, targetUrl);
    }
  };

  const handlePartnerClick = (partner: Partner) => {
    onAffiliateClick(partner.partner, offer, targetUrl);
    setIsDropdownOpen(false);
  };

  if (partners.length === 0) {
    return null;
  }

  return (
    <div className={`mt-6 pt-4 border-t border-gray-700 ${className}`}>
      <div className="relative" ref={dropdownRef}>
        {/* Split Button */}
        <div className="flex">
          {/* Primary Action */}
          <button
            onClick={handlePrimaryClick}
            className="flex-1 px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-l-lg hover:bg-blue-700 transition-colors"
          >
            {primaryText}
          </button>

          {/* Dropdown Toggle */}
          {partners.length > 1 && (
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-r-lg hover:bg-blue-700 transition-colors border-l border-blue-500/30 flex items-center justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* Dropdown Menu */}
        {isDropdownOpen && partners.length > 1 && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
            <div className="p-2">
              <div className="text-xs text-gray-400 mb-2 px-2">Choose Partner</div>
              {partners.map((partner, index) => (
                <button
                  key={index}
                  onClick={() => handlePartnerClick(partner)}
                  className="w-full px-3 py-2 text-left text-sm text-white hover:bg-gray-700 transition-colors flex items-center gap-3 rounded"
                >
                  {/* Partner Icon */}
                  <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white ${partner.color}`}>
                    {partner.icon || partner.name.charAt(0)}
                  </div>

                  {/* Partner Name */}
                  <span className="flex-1">{partner.name}</span>

                  {/* Arrow Icon */}
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
  );
}
