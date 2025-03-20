import { Location, PrayerTimesResponse } from '../types';

interface PrayerTimesParams {
  latitude: number;
  longitude: number;
  method: number;
  school: 0 | 1;
}

export async function getPrayerTimes(params: PrayerTimesParams): Promise<PrayerTimesResponse> {
  const { latitude, longitude, method, school } = params;
  const response = await fetch(
    `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=${method}&school=${school}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch prayer times');
  }

  const data = await response.json();
  return data.data;
} 