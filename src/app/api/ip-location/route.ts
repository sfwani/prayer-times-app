import { NextResponse } from 'next/server';

interface IPLocationResponse {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
}

export async function GET(request: Request) {
  try {
    // Get the client's IP address from request headers
    const forwardedFor = request.headers.get('x-forwarded-for') || '';
    const realIP = request.headers.get('x-real-ip') || '';
    const host = request.headers.get('host') || '';
    
    // Log headers for debugging
    console.log('Request headers:', {
      'x-forwarded-for': forwardedFor,
      'x-real-ip': realIP,
      'host': host
    });

    // For localhost development, return a default location for testing
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      console.log('Development environment, using default test location');
      return NextResponse.json({
        latitude: 37.7749,
        longitude: -122.4194,
        city: 'San Francisco',
        state: 'California'
      });
    }

    // Use the first IP from x-forwarded-for, or x-real-ip
    const clientIP = forwardedFor ? forwardedFor.split(',')[0].trim() : realIP.trim();

    if (!clientIP) {
      console.error('No client IP found in headers');
      return NextResponse.json(
        { error: 'Could not determine client IP' },
        { status: 400 }
      );
    }

    // Query ipinfo.io with the client's IP
    const response = await fetch(`https://ipinfo.io/${clientIP}/json`);
    const data = await response.json();

    // Log the ipinfo.io response for debugging
    console.log('ipinfo.io response:', data);

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