'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { format, parse, isBefore } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import CalculationMethodSelector from './components/CalculationMethodSelector';
import CountdownTimer from './components/CountdownTimer';
import { 
  PrayerTimes, 
  PrayerName, 
  CalculationMethod,
  CalculationMethodKey,
  CALCULATION_METHODS,
  CALCULATION_METHOD_CONFIGS,
  AsrMethod,
  AsrMethodKey,
  ASR_METHODS,
  ASR_METHOD_CONFIGS,
  CALCULATION_METHOD_VALUES,
  ASR_METHOD_VALUES,
  LocationInfo,
  CombinedApiResponse,
  ApiError
} from './types';
import LocationSelector from './components/LocationSelector';

// Move constants outside component
const PRAYER_NAMES: Record<string, PrayerName> = {
  fajr: { latin: 'Fajr', arabic: 'الفجر' },
  sunrise: { latin: 'Sunrise', arabic: 'الشروق' },
  dhuhr: { latin: 'Dhuhr', arabic: 'الظهر' },
  asr: { latin: 'Asr', arabic: 'العصر' },
  maghrib: { latin: 'Maghrib', arabic: 'المغرب' },
  isha: { latin: 'Isha', arabic: 'العشاء' }
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
  timezone: string | null;
  nextPrayer: {
    name: string;
    time: string;
  } | null;
}

const initialState: AppState = {
  showSettings: false,
  calculationMethod: CALCULATION_METHODS.ISNA,
  asrMethod: ASR_METHODS.standard,
  error: null,
  location: null,
  prayerTimes: null,
  hijriDate: null,
  cityInfo: null,
  timezone: null,
  nextPrayer: null
};

const getNextPrayer = (prayerTimes: PrayerTimes, timezone: string): { name: string; time: string } | null => {
  const now = new Date();
  const currentTimeInZone = formatInTimeZone(now, timezone, 'HH:mm');
  
  // Convert all prayer times to comparable format
  const prayers = Object.entries(prayerTimes).map(([name, time]) => {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    
    return {
      name,
      time,
      totalMinutes
    };
  });

  // Sort prayers by time
  prayers.sort((a, b) => a.totalMinutes - b.totalMinutes);

  // Convert current time to minutes for comparison
  const [currentHours, currentMinutes] = currentTimeInZone.split(':').map(Number);
  const currentTotalMinutes = currentHours * 60 + currentMinutes;

  // Find the next prayer
  const nextPrayer = prayers.find(prayer => prayer.totalMinutes > currentTotalMinutes);

  if (nextPrayer) {
    return {
      name: nextPrayer.name,
      time: nextPrayer.time // Return the original time string from the table
    };
  }

  // If no next prayer today, return first prayer of next day
  return {
    name: prayers[0].name,
    time: prayers[0].time // Return the original time string from the table
  };
};

// Helper function to convert 24h to 12h format
const to12HourFormat = (time: string): string => {
  const parsed = parse(time, 'HH:mm', new Date());
  return format(parsed, 'h:mm a');
};

export default function Home() {
  const [state, setState] = useState<AppState>(initialState);

  // Add a new useEffect to update next prayer periodically
  useEffect(() => {
    if (!state.prayerTimes || !state.timezone) return;

    const updateNextPrayer = () => {
      const nextPrayer = getNextPrayer(state.prayerTimes!, state.timezone!);
      setState(prev => ({
        ...prev,
        nextPrayer
      }));
    };

    // Update immediately
    updateNextPrayer();

    // Then update every minute
    const interval = setInterval(updateNextPrayer, 60000);

    return () => clearInterval(interval);
  }, [state.prayerTimes, state.timezone]); // Re-run when prayer times or timezone changes

  const fetchPrayerTimes = useCallback(async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `/api/prayer-times?latitude=${latitude}&longitude=${longitude}&method=${CALCULATION_METHOD_VALUES[state.calculationMethod as CalculationMethodKey]}&school=${ASR_METHOD_VALUES[state.asrMethod as AsrMethodKey]}`
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
        },
        timezone: apiResponse.prayerTimes.meta.timezone
      }));
    } catch (error) {
      console.error('Failed to fetch prayer times:', error);
      setState(prev => ({
        ...prev,
        error: {
          message: error instanceof Error 
            ? `Failed to fetch prayer times: ${error.message}`
            : 'Failed to fetch prayer times',
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
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            switch (error.code) {
              case error.PERMISSION_DENIED:
                reject(new Error('Location permission denied. Please enable location services in your browser settings.'));
                break;
              case error.POSITION_UNAVAILABLE:
                reject(new Error('Location information is unavailable. Please try again.'));
                break;
              case error.TIMEOUT:
                reject(new Error('Location request timed out. Please try again.'));
                break;
              default:
                reject(new Error('An unknown error occurred while getting location.'));
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      });
      
      setState(prev => ({
        ...prev,
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        },
        error: null
      }));
    } catch (error) {
      console.error('Location error:', error instanceof Error ? error.message : 'Unknown error');
      setState(prev => ({
        ...prev,
        error: {
          message: error instanceof Error 
            ? error.message 
            : 'Error getting location. Please enable location services.',
          code: 'GEOLOCATION_ERROR',
          status: 400
        }
      }));
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1117] text-white p-8" style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}>
      <div className="max-w-2xl mx-auto flex flex-col items-center space-y-8">
        {/* Prayer Times Display */}
        <div className="w-full bg-[#1C2128] rounded-lg p-8">
          {state.error ? (
            <p className="text-red-400 text-center">{state.error.message}</p>
          ) : !state.location ? (
            <p className="text-gray-400 text-center">Please select your location to view prayer times</p>
          ) : (
            <>
              {state.nextPrayer && (
                <div className="mb-8">
                  <CountdownTimer
                    targetTime={state.nextPrayer.time}
                    prayerName={PRAYER_NAMES[state.nextPrayer.name.toLowerCase()]?.latin || state.nextPrayer.name}
                    arabicPrayerName={PRAYER_NAMES[state.nextPrayer.name.toLowerCase()]?.arabic}
                    timezone={state.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
                  />
                </div>
              )}

              {state.prayerTimes && (
                <div className="space-y-3 mb-8">
                  {Object.entries(state.prayerTimes).map(([prayer, time]) => (
                    <div key={prayer} 
                      className={`grid grid-cols-3 items-center p-3 rounded-lg transition-colors ${
                        state.nextPrayer?.name.toLowerCase() === prayer.toLowerCase() 
                          ? 'bg-[#2D333B] shadow-lg' 
                          : 'hover:bg-[#2D333B]'
                      }`}
                    >
                      <span className="text-xl text-gray-200 font-[400] tracking-[0.02em]">{PRAYER_NAMES[prayer.toLowerCase()]?.latin}</span>
                      <span className="text-xl text-gray-400 text-center font-[300] tracking-[0.02em]">{to12HourFormat(time)}</span>
                      <span className="text-xl text-gray-200 text-right font-arabic">{PRAYER_NAMES[prayer.toLowerCase()]?.arabic}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-center pt-4 border-t border-[#2D333B]">
                <div className="text-2xl font-[500] text-white mb-2 tracking-[0.02em]">
                  {state.timezone ? formatInTimeZone(
                    new Date(),
                    state.timezone,
                    'h:mm a'
                  ) : format(new Date(), 'h:mm a')}
                </div>
                <p className="text-sm text-gray-400 tracking-[0.02em] font-[300]">
                  {state.timezone ? formatInTimeZone(
                    new Date(),
                    state.timezone,
                    'EEEE, MMMM d, yyyy'
                  ) : format(new Date(), 'EEEE, MMMM d, yyyy')} {state.hijriDate && `  •  ${state.hijriDate}`}
                </p>
                {state.timezone && (
                  <p className="text-xs text-gray-500 mt-1 tracking-[0.02em] font-[300]">
                    {state.timezone.replace('_', ' ')}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Settings Section */}
        <div className="w-full space-y-4">
          <LocationSelector
            onLocationChange={useCallback((location) => {
              setState(prev => ({
                ...prev,
                location,
                error: null
              }));
            }, [])}
          />

          <button
            onClick={() => setState(prev => ({ ...prev, showSettings: !prev.showSettings }))}
            className="flex items-center justify-center w-full px-4 py-2 text-sm text-[#9AB17D] hover:text-[#B5C99A] transition-colors rounded-lg hover:bg-[#2D333B] font-light tracking-wide"
          >
            {CALCULATION_METHOD_CONFIGS[state.calculationMethod as CalculationMethodKey].name} • {ASR_METHOD_CONFIGS[state.asrMethod as AsrMethodKey].name}
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
