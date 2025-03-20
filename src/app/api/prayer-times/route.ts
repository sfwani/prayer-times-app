import { NextResponse } from 'next/server';
import { 
  CacheEntry, 
  GeocodingAddress, 
  LocationInfo, 
  PrayerTimesData,
  CombinedApiResponse,
  ApiError
} from '../../types';

// Typed cache for geocoding data
const geocodingCache: Map<string, CacheEntry<GeocodingAddress>> = new Map();
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Custom error class for API errors
class ApiRequestError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code: string = 'INTERNAL_SERVER_ERROR'
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

async function getGeocodingData(lat: string, lon: string): Promise<GeocodingAddress | null> {
  try {
    // Input validation
    const latitude = Number(lat);
    const longitude = Number(lon);
    if (isNaN(latitude) || isNaN(longitude)) {
      throw new ApiRequestError('Invalid coordinates', 400, 'INVALID_COORDINATES');
    }

    // Create a cache key from coordinates
    const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    
    // Check cache first
    const cachedData = geocodingCache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
      console.log('Using cached geocoding data');
      return cachedData.data;
    }

    // If not in cache or expired, fetch from OpenStreetMap
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Prayer Times App'
        },
        next: { revalidate: 86400 } // Cache for 24 hours
      }
    );
    
    if (!response.ok) {
      throw new ApiRequestError(
        'Failed to fetch geocoding data',
        response.status,
        'GEOCODING_API_ERROR'
      );
    }

    const data = await response.json();
    
    // Store in cache
    geocodingCache.set(cacheKey, {
      data: data.address,
      timestamp: Date.now()
    });

    // Clean up old cache entries
    cleanupCache();

    return data.address;
  } catch (error) {
    console.error('Geocoding error:', error);
    if (error instanceof ApiRequestError) {
      throw error;
    }
    throw new ApiRequestError(
      'Failed to process geocoding request',
      500,
      'GEOCODING_PROCESSING_ERROR'
    );
  }
}

function cleanupCache(): void {
  const now = Date.now();
  for (const [key, entry] of geocodingCache.entries()) {
    if (now - entry.timestamp > CACHE_DURATION) {
      geocodingCache.delete(key);
    }
  }
}

export async function GET(request: Request): Promise<NextResponse<CombinedApiResponse | ApiError>> {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const method = searchParams.get('method');
    const school = searchParams.get('school');

    if (!lat || !lng) {
      throw new ApiRequestError(
        'Latitude and longitude are required',
        400,
        'MISSING_COORDINATES'
      );
    }

    // Fetch both prayer times and geocoding data in parallel
    const [prayerTimesResponse, geocodingData] = await Promise.all([
      fetch(
        `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=${method}&school=${school}`,
        { next: { revalidate: 3600 } } // Cache for 1 hour
      ),
      getGeocodingData(lat, lng)
    ]);

    if (!prayerTimesResponse.ok) {
      throw new ApiRequestError(
        'Failed to fetch prayer times from external API',
        prayerTimesResponse.status,
        'PRAYER_TIMES_API_ERROR'
      );
    }

    const prayerTimesData: { data: PrayerTimesData } = await prayerTimesResponse.json();

    // Extract city information from geocoding data
    const locationInfo: LocationInfo = {
      city: 'Unknown Location',
      state: '',
      coordinates: { latitude: Number(lat), longitude: Number(lng) }
    };

    if (geocodingData) {
      locationInfo.city = 
        geocodingData.city ||
        geocodingData.town ||
        geocodingData.village ||
        geocodingData.suburb ||
        geocodingData.municipality ||
        geocodingData.residential ||
        (geocodingData.county ? geocodingData.county.replace(' County', '') : 'Unknown Location');
      locationInfo.state = geocodingData.state || '';
    }

    // Combine the data
    const combinedResponse: CombinedApiResponse = {
      prayerTimes: prayerTimesData.data,
      location: locationInfo
    };

    return NextResponse.json(combinedResponse);
  } catch (error) {
    console.error('Prayer times API error:', error);
    
    const apiError: ApiError = {
      message: error instanceof ApiRequestError ? error.message : 'Failed to fetch data',
      code: error instanceof ApiRequestError ? error.code : 'UNKNOWN_ERROR',
      status: error instanceof ApiRequestError ? error.status : 500
    };

    return NextResponse.json(apiError, { status: apiError.status });
  }
} 