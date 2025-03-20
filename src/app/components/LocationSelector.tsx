import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Location } from '../types';
import { getLocationFromIP, searchLocation } from '../services/location';

interface LocationSelectorProps {
  onLocationChange: (location: Location) => void;
}

export default function LocationSelector({ onLocationChange }: LocationSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [detectedLocation, setDetectedLocation] = useState<{ city: string; state: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasAttemptedIpLocation = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Try to get initial location from IP on component mount
  useEffect(() => {
    const getInitialLocation = async () => {
      if (hasAttemptedIpLocation.current) return;
      hasAttemptedIpLocation.current = true;

      try {
        setIsInitializing(true);
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
  }, [onLocationChange]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const location = await searchLocation(searchQuery);
      if (location) {
        onLocationChange(location);
        setError(null);
      } else {
        setError('Location not found. Please try a different search.');
      }
    } catch (error) {
      setError('Failed to search location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputFocus = () => {
    if (inputRef.current) {
      inputRef.current.select();
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleInputFocus}
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
          disabled={isLoading || isInitializing}
        />
        <button
          type="submit"
          disabled={isLoading || isInitializing}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-white disabled:text-gray-600"
        >
          <MagnifyingGlassIcon className="h-5 w-5" />
        </button>
      </form>
      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
} 