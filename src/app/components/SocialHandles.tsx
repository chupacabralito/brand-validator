'use client';

import { SocialCheckResult } from '@/lib/models/DomainResult';

interface SocialHandlesProps {
  socialResult: SocialCheckResult;
}

export default function SocialHandles({ socialResult }: SocialHandlesProps) {
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return '📷';
      case 'tiktok':
        return '🎵';
      case 'twitter':
        return '🐦';
      case 'youtube':
        return '📺';
      case 'linkedin':
        return '💼';
      default:
        return '📱';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'tiktok':
        return 'bg-black';
      case 'twitter':
        return 'bg-blue-400';
      case 'youtube':
        return 'bg-red-600';
      case 'linkedin':
        return 'bg-blue-700';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Social Handle Availability</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Overall Score:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            socialResult.overallScore >= 80 
              ? 'bg-green-100 text-green-800'
              : socialResult.overallScore >= 60
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {socialResult.overallScore}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {socialResult.platforms.map((platform, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border-2 transition-colors ${
              platform.available
                ? 'border-green-200 bg-green-50'
                : 'border-red-200 bg-red-50'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${getPlatformColor(platform.platform)}`}>
                {getPlatformIcon(platform.platform)}
              </div>
              <div>
                <div className="font-medium capitalize">{platform.platform}</div>
                <div className="text-sm text-gray-600">{platform.handle}</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${
                platform.available ? 'text-green-700' : 'text-red-700'
              }`}>
                {platform.available ? 'Available' : 'Taken'}
              </span>
              {platform.available && (
                <a
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Claim →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {socialResult.overallScore < 60 && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-medium text-yellow-800 mb-2">Handle Availability Low</h3>
          <p className="text-sm text-yellow-700">
            Consider using variations like adding your industry, location, or a descriptive word to find available handles.
          </p>
        </div>
      )}
    </div>
  );
}




