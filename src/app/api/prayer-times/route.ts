import { NextResponse } from 'next/server';
import { LocationInfo, PrayerTimesResponse, GeocodingAddress } from '../../types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Cache for geocoding data
const geocodingCache = new Map<string, CacheEntry<LocationInfo>>();
const prayerTimesCache = new Map<string, PrayerTimesResponse>();

const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

function cleanupCache() {
  const now = Date.now();
  for (const [key, entry] of geocodingCache.entries()) {
    if (now - entry.timestamp > CACHE_DURATION) {
      geocodingCache.delete(key);
    }
  }
}

async function getGeocodingData(latitude: number, longitude: number): Promise<LocationInfo> {
  const cacheKey = `${latitude},${longitude}`;
  
  const cachedEntry = geocodingCache.get(cacheKey);
  if (cachedEntry && (Date.now() - cachedEntry.timestamp) < CACHE_DURATION) {
    return cachedEntry.data;
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
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
    const address: GeocodingAddress = data.address;

    const locationInfo: LocationInfo = {
      city: address.city || address.town || address.village || address.suburb || address.residential || address.municipality || 'Unknown',
      state: address.state || address.county || 'Unknown',
      coordinates: {
        latitude,
        longitude
      }
    };

    geocodingCache.set(cacheKey, {
      data: locationInfo,
      timestamp: Date.now()
    });

    cleanupCache();
    return locationInfo;
  } catch (error) {
    console.error('Error fetching geocoding data:', error);
    throw new Error('Failed to get location information');
  }
}

async function getPrayerTimes(latitude: number, longitude: number, date: string): Promise<PrayerTimesResponse> {
  const cacheKey = `${latitude},${longitude},${date}`;
  
  if (prayerTimesCache.has(cacheKey)) {
    return prayerTimesCache.get(cacheKey)!;
  }

  try {
    const response = await fetch(
      `http://api.aladhan.com/v1/timings/${date}?latitude=${latitude}&longitude=${longitude}&method=2`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch prayer times');
    }

    const data = await response.json();
    const prayerTimes: PrayerTimesResponse = data.data;

    prayerTimesCache.set(cacheKey, prayerTimes);
    return prayerTimes;
  } catch (error) {
    console.error('Error fetching prayer times:', error);
    throw new Error('Failed to get prayer times');
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latitude = parseFloat(searchParams.get('latitude') || '');
  const longitude = parseFloat(searchParams.get('longitude') || '');
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  if (isNaN(latitude) || isNaN(longitude)) {
    return NextResponse.json(
      { error: 'Invalid latitude or longitude' },
      { status: 400 }
    );
  }

  try {
    const [locationInfo, prayerTimes] = await Promise.all([
      getGeocodingData(latitude, longitude),
      getPrayerTimes(latitude, longitude, date)
    ]);

    return NextResponse.json({
      prayerTimes,
      location: locationInfo
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
} 