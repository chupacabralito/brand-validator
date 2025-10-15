'use client';

import { SocialCheckResult } from '@/lib/models/DomainResult';
import StandardContainer from './StandardContainer';

interface SocialHandlesRailProps {
  socialResult: SocialCheckResult | null;
  isLoading: boolean;
}

export default function SocialHandlesRail({ socialResult, isLoading }: SocialHandlesRailProps) {
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        );
      case 'tiktok':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
          </svg>
        );
      case 'twitter':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
          </svg>
        );
      case 'youtube':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        );
      case 'linkedin':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        );
      case 'facebook':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        );
      case 'snapchat':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.748-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
          </svg>
        );
      case 'pinterest':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.748-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
          </svg>
        );
      case 'discord':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z"/>
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        );
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return 'text-pink-400';
      case 'tiktok':
        return 'text-white';
      case 'twitter':
        return 'text-blue-400';
      case 'youtube':
        return 'text-red-400';
      case 'linkedin':
        return 'text-blue-400';
      case 'facebook':
        return 'text-blue-500';
      case 'snapchat':
        return 'text-yellow-400';
      case 'pinterest':
        return 'text-red-500';
      case 'discord':
        return 'text-indigo-400';
      default:
        return 'text-gray-400';
    }
  };

  const generateHandleSuggestions = (baseHandle: string, platform: string) => {
    const suggestions = [];
    const cleanHandle = baseHandle.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    
    // Generate variations
    suggestions.push(`${cleanHandle}official`);
    suggestions.push(`the${cleanHandle}`);
    suggestions.push(`${cleanHandle}app`);
    suggestions.push(`${cleanHandle}co`);
    suggestions.push(`${cleanHandle}inc`);
    suggestions.push(`${cleanHandle}2024`);
    suggestions.push(`${cleanHandle}official`);
    suggestions.push(`${cleanHandle}brand`);
    
    // Platform-specific suggestions
    if (platform === 'instagram') {
      suggestions.push(`${cleanHandle}_official`);
      suggestions.push(`${cleanHandle}.official`);
    } else if (platform === 'twitter') {
      suggestions.push(`${cleanHandle}HQ`);
      suggestions.push(`${cleanHandle}Official`);
    }
    
    return suggestions.slice(0, 3); // Return top 3 suggestions
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const getPlatformUrl = (platform: string, handle: string) => {
    // Remove @ symbol if present and clean the handle
    const cleanHandle = handle.replace('@', '').trim();
    
    // Platform-specific registration URLs with username pre-filling
    const normalizedPlatform = platform.toLowerCase();
    
    switch (normalizedPlatform) {
      case 'instagram':
        return `https://www.instagram.com/accounts/emailsignup/?username=${cleanHandle}`;
      case 'tiktok':
        return `https://www.tiktok.com/signup?username=${cleanHandle}`;
      case 'twitter':
        return `https://twitter.com/i/flow/signup?username=${cleanHandle}`;
      case 'youtube':
        return `https://accounts.google.com/signup?username=${cleanHandle}`;
      case 'linkedin':
        return `https://www.linkedin.com/signup?username=${cleanHandle}`;
      case 'facebook':
        return `https://www.facebook.com/r.php?username=${cleanHandle}`;
      case 'snapchat':
        return `https://accounts.snapchat.com/accounts/signup?username=${cleanHandle}`;
      case 'pinterest':
        return `https://www.pinterest.com/join/?username=${cleanHandle}`;
      case 'discord':
        return `https://discord.com/register?username=${cleanHandle}`;
      default:
        console.warn(`Unknown platform: ${platform}`);
        return '#';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-800 p-6">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-pink-600/20 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Social Handles</h2>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!socialResult) {
    return (
      <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-800 p-6">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-pink-600/20 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Social Handles</h2>
        </div>
        <p className="text-gray-400">Enter a search to check social handle availability</p>
      </div>
    );
  }

  const socialIcon = (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );

  const availableCount = socialResult.platforms.filter(p => p.available).length;
  const totalCount = socialResult.platforms.length;
  const availabilityScore = `${availableCount}/${totalCount} available`;

  return (
    <StandardContainer
      icon={socialIcon}
      title="Social Handles"
      score={availabilityScore}
      scoreColor={availableCount >= totalCount * 0.7 ? 'green' : availableCount >= totalCount * 0.4 ? 'yellow' : 'red'}
      color="green"
    >

      {/* Social Platform Details */}
      <div className="mb-4">
        <h3 className="font-semibold mb-3 text-white text-sm">Social Platform Details</h3>

        {/* Platform Grid - Enhanced */}
        <div className="space-y-3">
          {socialResult.platforms.map((platform, index) => {
            const suggestions = !platform.available ? generateHandleSuggestions(platform.handle, platform.platform) : [];
            
            return (
              <div key={index} className="space-y-2">
                {/* Unified Platform Card with Suggestions */}
                <div
                  className={`p-3 rounded-lg border transition-all duration-200 ${
                    platform.available
                      ? 'border-green-600/30 bg-green-600/10'
                      : 'border-red-600/30 bg-red-600/10'
                  }`}
                >
                  {/* Main Platform Info */}
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getPlatformColor(platform.platform)}`}>
                      {getPlatformIcon(platform.platform)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white capitalize text-sm">{platform.platform}</span>
                        <span className="text-xs text-gray-400">{platform.handle.startsWith('@') ? platform.handle : `@${platform.handle}`}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          platform.available
                            ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                            : 'bg-red-600/20 text-red-300 border border-red-600/30'
                        }`}>
                          {platform.available ? 'Available' : 'Taken'}
                        </span>
                        {!platform.available && (
                          <button
                            onClick={() => {
                              // For taken handles, link to the actual profile
                              const cleanHandle = platform.handle.replace('@', '').trim();
                              const profileUrls = {
                                instagram: `https://www.instagram.com/${cleanHandle}`,
                                tiktok: `https://www.tiktok.com/@${cleanHandle}`,
                                twitter: `https://twitter.com/${cleanHandle}`,
                                youtube: `https://www.youtube.com/@${cleanHandle}`,
                                linkedin: `https://www.linkedin.com/in/${cleanHandle}`,
                                facebook: `https://www.facebook.com/${cleanHandle}`,
                                snapchat: `https://www.snapchat.com/add/${cleanHandle}`,
                                pinterest: `https://www.pinterest.com/${cleanHandle}`,
                                discord: `https://discord.com/users/${cleanHandle}`
                              };
                              const url = profileUrls[platform.platform.toLowerCase() as keyof typeof profileUrls] || '#';
                              console.log(`Opening taken profile: ${url}`);
                              window.open(url, '_blank', 'noopener,noreferrer');
                            }}
                            className="px-2 py-1 bg-gray-600/20 text-gray-300 border border-gray-600/30 rounded text-xs font-medium hover:bg-gray-600/30 transition-colors"
                            title="View existing profile"
                          >
                            View
                          </button>
                        )}
                        {platform.available && (
                          <>
                            <button
                              onClick={() => copyToClipboard(platform.handle)}
                              className="px-2 py-1 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded text-xs font-medium hover:bg-blue-600/30 transition-colors"
                            >
                              Copy
                            </button>
                            <button
                              onClick={() => {
                                const url = getPlatformUrl(platform.platform, platform.handle);
                                console.log(`Opening registration for available handle: ${url}`);
                                // Copy handle to clipboard as backup
                                copyToClipboard(platform.handle);
                                window.open(url, '_blank', 'noopener,noreferrer');
                              }}
                              className="px-2 py-1 bg-green-600/20 text-green-400 border border-green-600/30 rounded text-xs font-medium hover:bg-green-600/30 transition-colors"
                              title="Register this available handle (also copied to clipboard)"
                            >
                              Register
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Alternative Suggestions - Now Inside Same Container */}
                  {!platform.available && suggestions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-600/30">
                      <div className="text-xs text-gray-400 font-medium text-left mb-2">Alternative suggestions:</div>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.map((suggestion, suggestionIndex) => (
                          <div key={suggestionIndex} className="flex gap-1">
                            <button
                              onClick={() => copyToClipboard(suggestion)}
                              className="px-2 py-1 bg-gray-700/50 text-gray-300 border border-gray-600/30 rounded-l text-xs hover:bg-gray-600/50 transition-colors"
                            >
                              @{suggestion}
                            </button>
                            <button
                              onClick={() => {
                                const url = getPlatformUrl(platform.platform, suggestion);
                                console.log(`Opening suggestion registration: ${url}`);
                                // Copy handle to clipboard as backup
                                copyToClipboard(suggestion);
                                window.open(url, '_blank', 'noopener,noreferrer');
                              }}
                              className="px-2 py-1 bg-gray-600/20 text-gray-300 border border-gray-600/30 rounded-r text-xs hover:bg-gray-600/30 transition-colors"
                              title="Register this handle (also copied to clipboard)"
                            >
                              📝
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Enhanced Summary */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-white text-sm">Platform Coverage</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              socialResult.overallScore >= 80 
                ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                : socialResult.overallScore >= 60
                ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30'
                : 'bg-red-600/20 text-red-400 border border-red-600/30'
            }`}>
              {socialResult.overallScore >= 80 ? 'Excellent' : 
               socialResult.overallScore >= 60 ? 'Good' : 'Poor'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-800/50 rounded-lg">
              <div className="text-2xl font-bold text-green-400">
                {socialResult.platforms.filter(p => p.available).length}
              </div>
              <div className="text-xs text-gray-400">Available</div>
            </div>
            <div className="text-center p-3 bg-gray-800/50 rounded-lg">
              <div className="text-2xl font-bold text-red-400">
                {socialResult.platforms.filter(p => !p.available).length}
              </div>
              <div className="text-xs text-gray-400">Taken</div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-2">Platform Coverage</div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(socialResult.platforms.filter(p => p.available).length / socialResult.platforms.length) * 100}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {Math.round((socialResult.platforms.filter(p => p.available).length / socialResult.platforms.length) * 100)}% coverage
            </div>
          </div>
        </div>
      </div>
    </StandardContainer>
  );
}
