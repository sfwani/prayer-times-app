// Prayer Times Types
export interface PrayerName {
  latin: string;
  arabic: string;
}

export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

// Location Types
export interface LocationInfo {
  city: string;
  state: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

// API Response Types
export interface PrayerTimesResponse {
  timings: {
    [key: string]: string;
    Fajr: string;
    Sunrise: string;
    Dhuhr: string;
    Asr: string;
    Sunset: string;
    Maghrib: string;
    Isha: string;
    Imsak: string;
    Midnight: string;
    Firstthird: string;
    Lastthird: string;
  };
  date: {
    readable: string;
    timestamp: string;
    gregorian: {
      date: string;
      format: string;
      day: string;
      weekday: { en: string };
      month: { number: number; en: string };
      year: string;
      designation: { abbreviated: string; expanded: string };
    };
    hijri: {
      date: string;
      format: string;
      day: string;
      weekday: { en: string; ar: string };
      month: { number: number; en: string; ar: string };
      year: string;
      designation: { abbreviated: string; expanded: string };
    };
  };
  meta: {
    latitude: number;
    longitude: number;
    timezone: string;
    method: {
      id: number;
      name: string;
      params: { [key: string]: number };
    };
    latitudeAdjustmentMethod: string;
    midnightMode: string;
    school: string;
    offset: { [key: string]: number };
  };
}

export interface CombinedApiResponse {
  prayerTimes: PrayerTimesResponse;
  location: LocationInfo;
}

// Cache Types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Error Types
export interface ApiError {
  message: string;
  code: string;
  status: number;
}

// Settings Types
export const CALCULATION_METHODS = {
  ISNA: 'ISNA',
  MWL: 'MWL',
  Karachi: 'Karachi',
  Makkah: 'Makkah',
  Egypt: 'Egypt'
} as const;

export type CalculationMethodKey = keyof typeof CALCULATION_METHODS;
export type CalculationMethod = (typeof CALCULATION_METHODS)[CalculationMethodKey];

export interface CalculationMethodConfig {
  id: number;
  name: string;
  params: {
    Fajr?: number;
    Isha?: number | string;
    Maghrib?: number | string;
    Midnight?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
}

export const CALCULATION_METHOD_CONFIGS: { [K in CalculationMethodKey]: CalculationMethodConfig } = {
  ISNA: {
    id: 2,
    name: "Islamic Society of North America (ISNA)",
    params: {
      Fajr: 15,
      Isha: 15
    },
    location: {
      latitude: 39.70421229999999,
      longitude: -86.39943869999999
    }
  },
  MWL: {
    id: 3,
    name: "Muslim World League",
    params: {
      Fajr: 18,
      Isha: 17
    },
    location: {
      latitude: 51.5194682,
      longitude: -0.1360365
    }
  },
  Egypt: {
    id: 5,
    name: "Egyptian General Authority of Survey",
    params: {
      Fajr: 19.5,
      Isha: 17.5
    },
    location: {
      latitude: 30.0444196,
      longitude: 31.2357116
    }
  },
  Makkah: {
    id: 4,
    name: "Umm Al-Qura University, Makkah",
    params: {
      Fajr: 18.5,
      Isha: "90 min"
    },
    location: {
      latitude: 21.3890824,
      longitude: 39.8579118
    }
  },
  Karachi: {
    id: 1,
    name: "University of Islamic Sciences, Karachi",
    params: {
      Fajr: 18,
      Isha: 18
    },
    location: {
      latitude: 24.8614622,
      longitude: 67.0099388
    }
  }
};

export const ASR_METHODS = {
  standard: 'standard',
  hanafi: 'hanafi'
} as const;

export type AsrMethodKey = keyof typeof ASR_METHODS;
export type AsrMethod = (typeof ASR_METHODS)[AsrMethodKey];

export interface AsrMethodConfig {
  id: 0 | 1;
  name: string;
  description: string;
}

export const ASR_METHOD_CONFIGS: { [K in AsrMethodKey]: AsrMethodConfig } = {
  standard: {
    id: 0,
    name: "Standard (Shafi, Maliki, Hanbali)",
    description: "Asr time starts when an object's shadow equals its height"
  },
  hanafi: {
    id: 1,
    name: "Hanafi",
    description: "Asr time starts when an object's shadow equals twice its height"
  }
};

export const CALCULATION_METHOD_VALUES: { [K in CalculationMethodKey]: number } = {
  ISNA: 2,
  MWL: 3,
  Karachi: 1,
  Makkah: 4,
  Egypt: 5
};

export const ASR_METHOD_VALUES: { [K in AsrMethodKey]: number } = {
  standard: 0,
  hanafi: 1
};

// Geocoding Types
export interface GeocodingAddress {
  city?: string;
  town?: string;
  village?: string;
  suburb?: string;
  municipality?: string;
  residential?: string;
  county?: string;
  state?: string;
  country?: string;
} 