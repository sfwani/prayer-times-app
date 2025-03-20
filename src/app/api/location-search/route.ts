import { NextResponse } from 'next/server';

interface NominatimResponse {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
  type: string;
  class: string;
  addresstype: string;
}

interface SearchResult {
  lat: number;
  lon: number;
  display_name: string;
  address: {
    city: string;
    state: string | undefined;
    country: string | undefined;
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const limit = searchParams.get('limit') || '15';

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&addressdetails=1&limit=${limit}&featuretype=city`,
      {
        headers: {
          'User-Agent': 'Prayer Times App'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch location data');
    }

    const data = (await response.json()) as NominatimResponse[];

    // Filter and format results
    const results = data
      .filter(result => {
        // Only include results that are cities, towns, or villages
        return (
          result.addresstype === 'city' ||
          result.addresstype === 'town' ||
          result.addresstype === 'village'
        ) && (
          // And have a valid city name
          result.address.city ||
          result.address.town ||
          result.address.village
        );
      })
      .map(result => {
        const cityName = result.address.city || result.address.town || result.address.village || '';
        const queryLower = query.toLowerCase();
        const cityLower = cityName.toLowerCase();

        // Only include results where the city name starts with the query
        if (!cityLower.startsWith(queryLower)) {
          return null;
        }

        return {
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon),
          display_name: result.display_name,
          address: {
            city: cityName,
            state: result.address.state,
            country: result.address.country
          }
        };
      })
      .filter((result): result is SearchResult => result !== null)
      .slice(0, 5);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Location search error:', error);
    return NextResponse.json(
      { error: 'Failed to search locations' },
      { status: 500 }
    );
  }
} 