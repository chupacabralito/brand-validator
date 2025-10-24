'use client';

import { useState } from 'react';

interface SearchBoxProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export default function SearchBox({ onSearch, isLoading }: SearchBoxProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('SearchBox form submitted with query:', query);
    console.log('onSearch function:', typeof onSearch);
    if (query.trim()) {
      console.log('Calling onSearch with:', query.trim());
      try {
        onSearch(query.trim());
        console.log('onSearch called successfully');
      } catch (error) {
        console.error('Error calling onSearch:', error);
      }
    } else {
      console.log('Query is empty, not calling onSearch');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter domain here"
          className="w-full px-6 py-5 pr-24 sm:pr-32 text-lg sm:text-xl bg-gray-900 border-2 border-gray-700 text-white placeholder-gray-400 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white text-sm sm:text-base font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white sm:mr-2"></div>
              <span className="hidden sm:inline ml-2">Searching...</span>
            </div>
          ) : (
            'Search'
          )}
        </button>
      </div>
    </form>
  );
}
