import { NextResponse } from 'next/server';

interface IPLocationResponse {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
}

export async function GET(request: Request) {
  try {
    // Try multiple IP geolocation services in case one fails
    const services = [
      'https://ipapi.co/json/',
      'https://ip-api.com/json/',
      'https://ipwho.is/'
    ];

    let error = null;
    for (const service of services) {
      try {
        const response = await fetch(service, {
          headers: {
            'User-Agent': 'Prayer Times App'
          }
        });
        
        if (!response.ok) continue;
        
        const data = await response.json();
        
        // Handle different API response formats
        const location: IPLocationResponse = {
          latitude: data.latitude || data.lat,
          longitude: data.longitude || data.lon,
          city: data.city,
          state: data.region_name || data.region || data.state
        };

        // Validate data
        if (
          typeof location.latitude === 'number' && 
          typeof location.longitude === 'number' &&
          typeof location.city === 'string' &&
          typeof location.state === 'string'
        ) {
          return NextResponse.json(location);
        }
      } catch (e) {
        error = e;
        continue;
      }
    }

    throw error || new Error('Failed to get location from any service');
  } catch (error) {
    console.error('IP Geolocation error:', error);
    return NextResponse.json(
      { error: 'Failed to determine location from IP' },
      { status: 500 }
    );
  }
} 