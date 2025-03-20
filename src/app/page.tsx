'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import PrayerCard from './components/PrayerCard';
import CalculationMethodSelector from './components/CalculationMethodSelector';
import { 
  PrayerTimes, 
  PrayerName, 
  CalculationMethod,
  CalculationMethodKey,
  CalculationMethodConfig,
  CALCULATION_METHODS,
  CALCULATION_METHOD_CONFIGS,
  AsrMethod,
  AsrMethodKey,
  AsrMethodConfig,
  ASR_METHODS,
  ASR_METHOD_CONFIGS,
  CALCULATION_METHOD_VALUES,
  ASR_METHOD_VALUES,
  LocationInfo,
  CombinedApiResponse,
  ApiError
} from './types';

// Move constants outside component
const PRAYER_NAMES: Record<string, PrayerName> = {
  fajr: { latin: 'fajr', arabic: 'الفجر' },
  sunrise: { latin: 'sunrise', arabic: 'الشروق' },
  dhuhr: { latin: 'dhuhr', arabic: 'الظهر' },
  asr: { latin: 'asr', arabic: 'العصر' },
  maghrib: { latin: 'maghrib', arabic: 'المغرب' },
  isha: { latin: 'isha', arabic: 'العشاء' }
};

interface AppState {
  showSettings: boolean;
  calculationMethod: CalculationMethod;
  asrMethod: AsrMethod;
  error: ApiError | null;
  location: { latitude: number; longitude: number } | null;
  prayerTimes: PrayerTimes | null;
  hijriDate: string | null;
  cityInfo: Pick<LocationInfo, 'city' | 'state'> | null;
}

const initialState: AppState = {
  showSettings: false,
  calculationMethod: CALCULATION_METHODS.ISNA,
  asrMethod: ASR_METHODS.standard,
  error: null,
  location: null,
  prayerTimes: null,
  hijriDate: null,
  cityInfo: null
};

export default function Home() {
  const [state, setState] = useState<AppState>(initialState);

  const fetchPrayerTimes = useCallback(async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `/api/prayer-times?lat=${latitude}&lng=${longitude}&method=${CALCULATION_METHOD_VALUES[state.calculationMethod as CalculationMethodKey]}&school=${ASR_METHOD_VALUES[state.asrMethod as AsrMethodKey]}`
      );
      
      const data: CombinedApiResponse | ApiError = await response.json();
      
      if (!response.ok) {
        const error = data as ApiError;
        setState(prev => ({
          ...prev,
          error: {
            message: error.message,
            code: error.code,
            status: error.status
          }
        }));
        return;
      }

      const apiResponse = data as CombinedApiResponse;
      
      setState(prev => ({
        ...prev,
        error: null,
        prayerTimes: {
          fajr: apiResponse.prayerTimes.timings.Fajr,
          sunrise: apiResponse.prayerTimes.timings.Sunrise,
          dhuhr: apiResponse.prayerTimes.timings.Dhuhr,
          asr: apiResponse.prayerTimes.timings.Asr,
          maghrib: apiResponse.prayerTimes.timings.Maghrib,
          isha: apiResponse.prayerTimes.timings.Isha
        },
        hijriDate: apiResponse.prayerTimes.date.hijri 
          ? `${apiResponse.prayerTimes.date.hijri.month.en} ${apiResponse.prayerTimes.date.hijri.day}, ${apiResponse.prayerTimes.date.hijri.year} AH`
          : null,
        cityInfo: {
          city: apiResponse.location.city,
          state: apiResponse.location.state
        }
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: {
          message: err instanceof Error ? err.message : 'Failed to fetch prayer times',
          code: 'FETCH_ERROR',
          status: 500
        }
      }));
    }
  }, [state.calculationMethod, state.asrMethod]);

  useEffect(() => {
    if (state.location) {
      fetchPrayerTimes(state.location.latitude, state.location.longitude);
    }
  }, [state.location, fetchPrayerTimes]);

  const handleUseCurrentLocation = async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      
      setState(prev => ({
        ...prev,
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        },
        error: null
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: {
          message: 'Error getting location. Please enable location services.',
          code: 'GEOLOCATION_ERROR',
          status: 400
        }
      }));
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1117] text-white p-8">
      <div className="max-w-2xl mx-auto flex flex-col items-center space-y-8">
        {/* Prayer Times Display */}
        <div className="w-full bg-[#1C2128] rounded-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-4">Today's Prayer Times</h1>
          
          {state.error ? (
            <p className="text-red-400 text-center">{state.error.message}</p>
          ) : !state.location ? (
            <p className="text-gray-400 text-center">Please select your location to view prayer times</p>
          ) : (
            <>
              <div className="text-center text-gray-400 mb-4">
                <p className="mb-2">
                  {format(new Date(), 'EEEE, MMMM d, yyyy')} | {format(new Date(), 'h:mm a')} {state.hijriDate && `| ${state.hijriDate}`}
                </p>
                <p className="mb-4">
                  {state.location && state.cityInfo && (
                    <>
                      {state.cityInfo.city}{state.cityInfo.state ? `, ${state.cityInfo.state}` : ''} | {state.location.latitude.toFixed(4)}°, {state.location.longitude.toFixed(4)}°
                    </>
                  )}
                </p>
              </div>
              {state.prayerTimes && (
                <div className="space-y-6">
                  {Object.entries(state.prayerTimes).map(([prayer, time]) => (
                    <div key={prayer} className="grid grid-cols-3 items-center">
                      <span className="text-xl text-gray-200">{PRAYER_NAMES[prayer.toLowerCase()]?.latin}</span>
                      <span className="text-xl text-gray-400 text-center">{time}</span>
                      <span className="text-xl text-gray-200 text-right font-arabic">{PRAYER_NAMES[prayer.toLowerCase()]?.arabic}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Settings Section */}
        <div className="w-full space-y-4">
          <button 
            onClick={handleUseCurrentLocation}
            className="w-full bg-[#1A6ED8] text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors text-lg"
          >
            Use Current Location
          </button>

          <button
            onClick={() => setState(prev => ({ ...prev, showSettings: !prev.showSettings }))}
            className="text-blue-400 hover:text-blue-300 text-center w-full text-sm"
          >
            change from {CALCULATION_METHOD_CONFIGS[state.calculationMethod as CalculationMethodKey].name} ({ASR_METHOD_CONFIGS[state.asrMethod as AsrMethodKey].name})
          </button>

          {state.showSettings && (
            <CalculationMethodSelector
              selectedMethod={state.calculationMethod}
              selectedAsrMethod={state.asrMethod}
              onMethodChange={(method) => setState(prev => ({ ...prev, calculationMethod: method }))}
              onAsrMethodChange={(method) => setState(prev => ({ ...prev, asrMethod: method }))}
            />
          )}
        </div>
      </div>
    </div>
  );
}
