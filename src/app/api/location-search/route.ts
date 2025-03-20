import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` + 
      new URLSearchParams({
        q: query,
        format: 'json',
        addressdetails: '1',
        limit: '15',
        'accept-language': 'en'
      }),
      {
        headers: {
          'User-Agent': 'Prayer Times App'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch location suggestions');
    }

    const data = await response.json();
    
    // Clean and prepare the search query
    const searchQuery = query.toLowerCase().trim();
    
    // Filter and score results
    const scoredResults = data
      .map((item: any) => {
        const address = item.address || {};
        
        // Only consider results that have a city field
        const cityName = address.city?.toLowerCase();
        if (!cityName) return { ...item, score: 0, hasMatch: false };
        
        // Only match if the city name starts with the search query
        if (!cityName.startsWith(searchQuery)) {
          return { ...item, score: 0, hasMatch: false };
        }

        // Calculate score based on match type
        let score = 10; // Base score for matching city
        
        // Exact match gets highest score
        if (cityName === searchQuery) {
          score += 5;
        }

        // If it's a state capital or major city, give bonus points
        if (address.state_capital === "yes" || address.capital === "yes") {
          score += 3;
        }

        return {
          ...item,
          score,
          hasMatch: true,
          cityName,
          stateName: address.state || '',
          countryName: address.country || ''
        };
      })
      .filter((item: any) => item.hasMatch)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 5);

    // Format the results to only show relevant information
    const formattedResults = scoredResults.map((item: any) => ({
      display_name: item.stateName 
        ? `${item.cityName.charAt(0).toUpperCase() + item.cityName.slice(1)}, ${item.stateName}`
        : item.cityName.charAt(0).toUpperCase() + item.cityName.slice(1),
      lat: item.lat,
      lon: item.lon,
      address: {
        city: item.cityName.charAt(0).toUpperCase() + item.cityName.slice(1),
        state: item.stateName,
        country: item.countryName
      }
    }));

    return NextResponse.json(formattedResults);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch location suggestions' },
      { status: 500 }
    );
  }
} 