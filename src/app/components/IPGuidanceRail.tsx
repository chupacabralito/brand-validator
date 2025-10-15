'use client';

import { IPGuidance } from '@/lib/models/DomainResult';

interface IPGuidanceRailProps {
  ipGuidance: IPGuidance | null;
  isLoading: boolean;
}

export default function IPGuidanceRail({ ipGuidance, isLoading }: IPGuidanceRailProps) {
  const getNiceClassDescription = (classNum: number): string => {
    const descriptions: Record<number, string> = {
      9: 'Scientific, nautical, surveying, photographic, cinematographic, optical, weighing, measuring, signaling, checking, life-saving and teaching apparatus',
      35: 'Advertising; business management; business administration; office functions',
      42: 'Scientific and technological services and research and design relating thereto; industrial analysis and research services',
      36: 'Insurance; financial affairs; monetary affairs; real estate affairs',
      41: 'Education; providing of training; entertainment; sporting and cultural activities',
      44: 'Medical services; veterinary services; hygienic and beauty care for human beings or animals',
      5: 'Pharmaceuticals, medical and veterinary preparations; sanitary preparations for medical purposes',
      10: 'Surgical, medical, dental and veterinary apparatus and instruments',
      25: 'Clothing, footwear, headgear',
      29: 'Meat, fish, poultry and game; meat extracts; preserved, frozen, dried and cooked fruits and vegetables',
      30: 'Coffee, tea, cocoa, sugar, rice, tapioca, sago, artificial coffee; flour and preparations made from cereals',
      37: 'Building construction; repair; installation services',
      39: 'Transport; packaging and storage of goods; travel arrangement',
      43: 'Services for providing food and drink; temporary accommodation',
      45: 'Legal services; security services for the protection of property and individuals'
    };
    return descriptions[classNum] || 'Goods and services classification';
  };
  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-800 p-6">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Trust & IP</h2>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!ipGuidance) {
    return (
      <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-800 p-6">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Trust & IP</h2>
        </div>
        <p className="text-gray-400">Enter a brand name for IP guidance</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-800 p-8">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center mr-3">
          <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">Trust & IP</h2>
      </div>
      
      {/* Trademark Risk Notes */}
      <div className="mb-6">
        <h3 className="font-medium mb-3 text-white">Trademark Considerations</h3>
        <ul className="space-y-2 text-sm">
          {ipGuidance.tmRiskNotes.map((note, index) => (
            <li key={index} className="flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              <span className="text-gray-300">{note}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Nice Classes */}
      {ipGuidance.classesGuess.length > 0 && (
        <div className="mb-6">
          <h3 className="font-medium mb-3 text-white">Suggested Nice Classes</h3>
          <p className="text-sm text-gray-300 mb-3">
            Nice classes categorize goods and services for trademark registration. 
            You'll need to file in the classes that match your business activities.
          </p>
          <div className="flex flex-wrap gap-2">
            {ipGuidance.classesGuess.map((classNum, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-600/20 text-blue-400 text-sm rounded border border-blue-600/30"
                title={getNiceClassDescription(classNum)}
              >
                Class {classNum}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Hover over classes for descriptions. These are suggestions - verify with an attorney.
          </p>
        </div>
      )}

      {/* Official Search Links */}
      <div className="mb-6">
        <h3 className="font-medium mb-3 text-white">Official Trademark Searches</h3>
        <div className="space-y-2">
          <a
            href={ipGuidance.officialSearchLinks.usptoTESS}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-gray-800 rounded hover:bg-gray-700 transition-colors border border-gray-700"
          >
            <div className="font-medium text-sm text-white">USPTO TESS (US)</div>
            <div className="text-xs text-gray-400">United States Patent and Trademark Office</div>
          </a>
          <a
            href={ipGuidance.officialSearchLinks.euipoEsearch}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-gray-800 rounded hover:bg-gray-700 transition-colors border border-gray-700"
          >
            <div className="font-medium text-sm text-white">EUIPO eSearch (EU)</div>
            <div className="text-xs text-gray-400">European Union Intellectual Property Office</div>
          </a>
          <a
            href={ipGuidance.officialSearchLinks.ukipoSearch}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-gray-800 rounded hover:bg-gray-700 transition-colors border border-gray-700"
          >
            <div className="font-medium text-sm text-white">UKIPO Search (UK)</div>
            <div className="text-xs text-gray-400">UK Intellectual Property Office</div>
          </a>
          <a
            href={ipGuidance.officialSearchLinks.wipoGlobal}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-gray-800 rounded hover:bg-gray-700 transition-colors border border-gray-700"
          >
            <div className="font-medium text-sm text-white">WIPO Global Brand Database</div>
            <div className="text-xs text-gray-400">World Intellectual Property Organization</div>
          </a>
        </div>
      </div>

      {/* Copyright Notes */}
      <div className="mb-6">
        <h3 className="font-medium mb-3 text-white">Copyright Guidance</h3>
        <ul className="space-y-2 text-sm">
          {ipGuidance.copyrightNotes.map((note, index) => (
            <li key={index} className="flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              <span className="text-gray-300">{note}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Next Steps Checklist */}
      <div className="mb-6">
        <h3 className="font-medium mb-3 text-white">Next Steps Checklist</h3>
        <div className="space-y-2">
          {ipGuidance.nextStepsChecklist.map((step, index) => (
            <label key={index} className="flex items-start">
              <input
                type="checkbox"
                className="mt-1 mr-3"
                disabled
              />
              <span className="text-sm text-gray-300">{step}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-gray-700 pt-4">
        <div className="bg-yellow-600/20 border border-yellow-600/30 rounded p-3">
          <p className="text-xs text-yellow-300">
            {ipGuidance.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}
