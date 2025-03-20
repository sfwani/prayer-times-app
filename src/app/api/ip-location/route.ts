import { NextResponse } from 'next/server';

interface IPLocationResponse {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
}

export async function GET() {
  try {
    // Use ipinfo.io which is more reliable
    const response = await fetch('https://ipinfo.io/json', {
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    // Check if the API returned an error
    if (data.error) {
      console.error('IP Geolocation error:', data.error);
      return NextResponse.json(
        { error: 'Failed to get location from IP' },
        { status: 500 }
      );
    }

    // Parse location from the loc field which is in format "latitude,longitude"
    const [lat, lon] = (data.loc || '').split(',').map(Number);

    // Map the response to our interface
    const locationData: IPLocationResponse = {
      latitude: lat || 0,
      longitude: lon || 0,
      city: data.city || 'Unknown City',
      state: data.region || ''
    };

    // Validate coordinates
    if (!locationData.latitude || !locationData.longitude) {
      console.error('Invalid coordinates from IP Geolocation');
      return NextResponse.json(
        { error: 'Failed to get valid coordinates' },
        { status: 500 }
      );
    }

    return NextResponse.json(locationData);
  } catch (error) {
    console.error('IP location error:', error);
    return NextResponse.json(
      { error: 'Failed to get location from IP' },
      { status: 500 }
    );
  }
} 