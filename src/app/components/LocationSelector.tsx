'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Location } from '../types';
import { getLocationFromIP } from '../services/location';

interface SearchSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    state?: string;
    country?: string;
  };
}

interface LocationSelectorProps {
  onLocationChange: (location: Location) => void;
}

export default function LocationSelector({ onLocationChange }: LocationSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [detectedLocation, setDetectedLocation] = useState<{ city: string; state: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mounted, setMounted] = useState(false);
  const hasAttemptedIpLocation = useRef(false);
  const searchTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle mounting
  useEffect(() => {
    setMounted(true);
    setIsInitializing(true);
  }, []);

  // Handle clicks outside of dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Try to get initial location from IP on component mount
  useEffect(() => {
    if (!mounted) return;

    const getInitialLocation = async () => {
      if (hasAttemptedIpLocation.current) return;
      hasAttemptedIpLocation.current = true;

      try {
        const locationData = await getLocationFromIP();
        if (locationData) {
          onLocationChange({
            latitude: locationData.latitude,
            longitude: locationData.longitude
          });
          setDetectedLocation({
            city: locationData.city,
            state: locationData.state
          });
        }
      } catch (error) {
        console.error('Failed to get initial location:', error);
        setError('Could not determine your location automatically. Please search for your city.');
      } finally {
        setIsInitializing(false);
      }
    };

    getInitialLocation();
  }, [mounted, onLocationChange]);

  const handleSearchInput = async (value: string) => {
    setSearchQuery(value);
    if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Clear any existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Set a new timeout for the search
    searchTimeout.current = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/location-search?q=${encodeURIComponent(value)}`);
        if (!response.ok) throw new Error('Search failed');
        
        const data = await response.json();
        setSuggestions(data);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
        setError('Failed to fetch location suggestions');
      } finally {
        setIsLoading(false);
      }
    }, 1000); // 1 second delay
  };

  const formatLocationName = (suggestion: SearchSuggestion): string => {
    const { address } = suggestion;
    if (!address) return suggestion.display_name;
    
    const city = address.city;
    const state = address.state;
    const country = address.country;

    if (city && state) return `${city}, ${state}`;
    if (city) return city;
    if (state) return state;
    return country || suggestion.display_name;
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    const displayName = formatLocationName(suggestion);
    setSearchQuery(displayName);
    
    // Ensure we're passing valid numbers for coordinates
    const latitude = parseFloat(suggestion.lat);
    const longitude = parseFloat(suggestion.lon);
    
    if (!isNaN(latitude) && !isNaN(longitude)) {
      onLocationChange({
        latitude,
        longitude
      });
    }
    
    setShowSuggestions(false);
  };

  if (!mounted) {
    return (
      <div className="w-full">
        <div className="w-full px-4 py-3 bg-[#2D333B] text-white rounded-lg">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchInput(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          placeholder={
            isInitializing 
              ? "Detecting your location..." 
              : detectedLocation 
                ? `${detectedLocation.city}${detectedLocation.state ? `, ${detectedLocation.state}` : ''}`
                : "Search city, state, or country..."
          }
          className={`w-full px-4 py-3 bg-[#2D333B] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B7E50] placeholder-gray-400 ${
            !searchQuery && detectedLocation ? 'text-gray-400' : 'text-white'
          }`}
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <div className="animate-spin h-5 w-5 border-2 border-gray-400 border-t-white rounded-full" />
          ) : (
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute w-full mt-1 bg-[#2D333B] rounded-lg shadow-lg border border-[#444C56] max-h-60 overflow-y-auto z-50">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-2 hover:bg-[#444C56] text-gray-300 hover:text-white transition-colors"
            >
              {formatLocationName(suggestion)}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
} 