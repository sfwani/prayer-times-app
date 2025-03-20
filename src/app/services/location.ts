import { Location } from '../types';

interface IPLocationResponse {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
}

export async function getLocationFromIP(): Promise<IPLocationResponse | null> {
  try {
    const response = await fetch('/api/ip-location');
    const data = await response.json();
    
    if (data.error) {
      console.error('IP Geolocation error:', data.error);
      return null;
    }

    return {
      latitude: data.latitude,
      longitude: data.longitude,
      city: data.city,
      state: data.state
    };
  } catch (error) {
    console.error('IP Geolocation failed:', error);
    return null;
  }
}

export async function searchLocation(query: string): Promise<Location | null> {
  try {
    // Using OpenStreetMap's Nominatim service for geocoding
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'Prayer Times App'
        }
      }
    );
    
    const data = await response.json();
    
    if (!data.length) {
      return null;
    }

    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon)
    };
  } catch (error) {
    console.error('Location search failed:', error);
    return null;
  }
} 