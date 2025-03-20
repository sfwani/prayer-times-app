import { NextResponse } from 'next/server';
import { PrayerTimesResponse, LocationInfo } from '@/app/types';

const prayerTimesCache = new Map<string, PrayerTimesResponse>();
const geocodingCache = new Map<string, LocationInfo>();

async function getGeocodingData(latitude: number, longitude: number): Promise<LocationInfo> {
  const cacheKey = `${latitude},${longitude}`;
  
  if (geocodingCache.has(cacheKey)) {
    return geocodingCache.get(cacheKey)!;
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?` +
      new URLSearchParams({
        lat: latitude.toString(),
        lon: longitude.toString(),
        format: 'json',
        'accept-language': 'en'
      }),
      {
        headers: {
          'User-Agent': 'Prayer Times App'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch location data');
    }

    const data = await response.json();
    
    // Get timezone from the browser
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const locationInfo: LocationInfo = {
      city: data.address?.city || data.address?.town || data.address?.village || 'Unknown Location',
      state: data.address?.state || '',
      timezone,
      country: data.address?.country || ''
    };

    geocodingCache.set(cacheKey, locationInfo);
    return locationInfo;
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error('Failed to get location information');
  }
}

async function getPrayerTimes(latitude: number, longitude: number, date: string, timezone: string): Promise<PrayerTimesResponse> {
  const cacheKey = `${latitude},${longitude},${date}`;
  
  if (prayerTimesCache.has(cacheKey)) {
    return prayerTimesCache.get(cacheKey)!;
  }

  try {
    const response = await fetch(
      `http://api.aladhan.com/v1/timings/${date}?` +
      new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        method: '2', // ISNA method
        timezone
      })
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch prayer times');
    }

    const data = await response.json();
    const prayerTimes: PrayerTimesResponse = data.data;

    prayerTimesCache.set(cacheKey, prayerTimes);
    return prayerTimes;
  } catch (error) {
    console.error('Prayer times error:', error);
    throw new Error('Failed to get prayer times');
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latitude = parseFloat(searchParams.get('latitude') || '');
  const longitude = parseFloat(searchParams.get('longitude') || '');
  
  // Get current date in YYYY-MM-DD format
  const today = new Date();
  const date = today.toISOString().split('T')[0];

  if (isNaN(latitude) || isNaN(longitude)) {
    return NextResponse.json(
      { error: 'Invalid latitude or longitude' },
      { status: 400 }
    );
  }

  try {
    // First get the location info to get the timezone
    const locationInfo = await getGeocodingData(latitude, longitude);
    
    // Then get prayer times with the correct timezone
    const prayerTimes = await getPrayerTimes(
      latitude, 
      longitude, 
      date,
      locationInfo.timezone
    );

    return NextResponse.json({
      prayerTimes,
      location: locationInfo
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
} 