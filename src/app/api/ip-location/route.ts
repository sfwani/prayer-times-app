import { NextResponse } from 'next/server';

interface IPLocationResponse {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
}

export async function GET() {
  try {
    // Use ip-api.com's more detailed endpoint
    const response = await fetch('http://ip-api.com/json/?fields=lat,lon,city,region');
    const data = await response.json();

    // Map the response to our interface
    const locationData: IPLocationResponse = {
      latitude: data.lat,
      longitude: data.lon,
      city: data.city || 'Unknown City',
      state: data.region || ''
    };

    return NextResponse.json(locationData);
  } catch (error) {
    console.error('IP location error:', error);
    return NextResponse.json(
      { error: 'Failed to get location from IP' },
      { status: 500 }
    );
  }
} 