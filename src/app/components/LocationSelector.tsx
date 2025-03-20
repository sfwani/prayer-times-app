import React, { useState } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { Location } from '../types';

interface LocationSelectorProps {
  onLocationChange: (location: Location) => void;
}

export default function LocationSelector({ onLocationChange }: LocationSelectorProps) {
  const [isLoading, setIsLoading] = useState(false);

  const getCurrentLocation = () => {
    setIsLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          onLocationChange(location);
          setIsLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLoading(false);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={getCurrentLocation}
      disabled={isLoading}
      className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
    >
      <MapPinIcon className="h-5 w-5" />
      <span>{isLoading ? 'Getting location...' : 'Use Current Location'}</span>
    </button>
  );
} 