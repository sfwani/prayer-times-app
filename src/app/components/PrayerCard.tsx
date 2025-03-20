import React, { useState } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { PrayerTime } from '../types';

interface PrayerCardProps {
  prayer: PrayerTime;
}

export default function PrayerCard({ prayer }: PrayerCardProps) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="max-w-md mx-auto">
      <div className={`p-6 rounded-lg shadow-md ${prayer.isNext ? 'bg-green-50 border-2 border-green-500' : 'bg-white'}`}>
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-3">
            <ClockIcon className="h-6 w-6 text-gray-500" />
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900">{prayer.name}</h3>
              <p className="text-gray-600 text-lg">{prayer.time}</p>
            </div>
          </div>
          {prayer.isNext && (
            <span className="px-3 py-1 text-sm text-green-700 bg-green-100 rounded-full">
              Next Prayer
            </span>
          )}
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-blue-600 hover:text-blue-800 text-sm flex items-center justify-center space-x-1 mx-auto"
        >
          <span>Change</span>
          <ChevronDownIcon className={`w-4 h-4 transform transition-transform ${showSettings ? 'rotate-180' : ''}`} />
        </button>
        
        {showSettings && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-2">Calculation Method</h4>
            <select className="w-full p-2 border rounded-md bg-white">
              <option value="ISNA">Islamic Society of North America</option>
              <option value="MWL">Muslim World League</option>
              <option value="Karachi">University of Islamic Sciences, Karachi</option>
              <option value="Makkah">Umm al-Qura, Makkah</option>
              <option value="Egypt">Egyptian General Authority of Survey</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
} 