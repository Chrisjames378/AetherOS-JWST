import * as Astronomy from 'astronomy-engine';
import { CelestialSpec, CELESTIAL_MAP } from '../data/celestialCatalog';
import { computeCelestialPosition } from './orbitalMath';

export const AU_IN_KM = 149597870.7;
export const KM_TO_MILES = 0.621371192237334;
export const LY_IN_KM = 9460730472580.8; // 1 Light Year in km
export const SPEED_OF_SOUND_KMH = 1234.8; // 343 m/s = 1,234.8 km/h
export const WALKING_SPEED_KMH = 5; // 5 km/h
export const DRIVING_SPEED_KMH = 100; // 100 km/h highway speed
export const FLYING_SPEED_KMH = 900; // 900 km/h commercial jet airliner

export const DEEP_SKY_LIGHT_YEARS: Record<string, number> = {
  // Exoplanets
  proxima_b: 4.246,
  lhs475b: 41.0,
  trappist1e: 40.0,
  trappist1b: 40.0,
  gliese12b: 40.0,
  speculoos3b: 55.0,
  '51pegasi_b': 50.0,
  lp791_18d: 86.0,
  toi700d: 101.5,
  toi700e: 101.5,
  k218b: 124.0,
  hr8799e: 133.0,
  hd149026b: 247.0,
  kepler186f: 500.0,
  wasp39b: 700.0,
  wasp121b: 850.0,
  wasp: 1150.0, // WASP-96b
  kepler452b: 1400.0,
  // Galaxies & Deep Sky
  milkyway: 26670,
  andromeda: 2537000,
  triangulum: 2730000,
  whirlpool: 23000000,
  sombrero: 31100000,
  lmc: 158200,
  cygx1: 7300,
  v404: 7800,
  sgr: 26670,
  m87: 53500000,
  ton618: 18200000000,
  crab: 6500,
  casa: 11000,
  sn1987a: 168000,
  tycho: 9800,
  // Constellation stars & Orion's Belt
  alnitak: 1260,
  alnilam: 2000,
  mintaka: 1200,
  betelgeuse: 548,
  rigel: 860,
  bellatrix: 250,
  saiph: 650,
  meissa: 1100,
  m42: 1344,
  sirius: 8.6,
  dubhe: 123,
  merak: 79.7,
  alioth: 82.6,
  mizar: 82.9,
  polaris: 433,
  schedar: 228,
  gammacas: 550,
  deneb: 2615,
  albireo: 430,
  aldebaran: 65.3,
  pleiades: 444,
  antares: 550,
  vega: 25.0,
  acrux: 320,
};

export interface TravelMetrics {
  km: number;
  kmFormatted: string;
  miles: number;
  milesFormatted: string;
  lightYears: number;
  lightYearsFormatted: string;
  lightTimeFormatted: string;
  soundHours: number;
  soundFormatted: string;
  walkingHours: number;
  walkingFormatted: string;
  drivingHours: number;
  drivingFormatted: string;
  flyingHours: number;
  flyingFormatted: string;
  isRealtimeDynamic: boolean;
  referenceFrame: string;
}

/**
 * Format hours into years, days, hours, or large cosmic timeframes.
 */
export function formatTravelDuration(hours: number): string {
  if (hours <= 0 || !isFinite(hours)) return '0 hours';

  if (hours < 1) {
    const mins = Math.max(1, Math.round(hours * 60));
    return `${mins} min${mins === 1 ? '' : 's'}`;
  }

  if (hours < 48) {
    return `${hours.toFixed(1)} hours`;
  }

  const days = hours / 24;
  if (days < 365) {
    return `${days.toFixed(1)} days`;
  }

  const years = days / 365.25;

  if (years < 1000) {
    return `${years.toFixed(1)} years`;
  }

  if (years < 1000000) {
    const kYears = years / 1000;
    return `${kYears.toFixed(kYears < 10 ? 2 : 1)} thousand years`;
  }

  if (years < 1000000000) {
    const mYears = years / 1000000;
    return `${mYears.toFixed(mYears < 10 ? 2 : 1)} million years`;
  }

  if (years < 1000000000000) {
    const bYears = years / 1000000000;
    return `${bYears.toFixed(bYears < 10 ? 2 : 1)} billion years`;
  }

  const tYears = years / 1000000000000;
  return `${tYears.toFixed(2)} trillion years`;
}

/**
 * Format light travel time (seconds, minutes, hours, days, or light years).
 */
export function formatLightTime(lightYears: number): string {
  const lightSeconds = lightYears * 31557600; // 365.25 days in seconds
  if (lightSeconds < 60) {
    return `${lightSeconds.toFixed(2)} light-seconds`;
  }
  const lightMins = lightSeconds / 60;
  if (lightMins < 60) {
    return `${lightMins.toFixed(2)} light-minutes`;
  }
  const lightHours = lightMins / 60;
  if (lightHours < 24) {
    return `${lightHours.toFixed(2)} light-hours`;
  }
  const lightDays = lightHours / 24;
  if (lightDays < 365.25) {
    return `${lightDays.toFixed(1)} light-days`;
  }
  return `${lightYears.toLocaleString(undefined, { maximumFractionDigits: 2 })} light-years`;
}

/**
 * Format large numbers cleanly with commas or scientific notation for cosmic scales.
 */
export function formatCosmicNumber(num: number, unit: string): string {
  if (num < 1000000) {
    return `${Math.round(num).toLocaleString()} ${unit}`;
  }
  if (num < 1000000000) {
    return `${(num / 1000000).toFixed(2)} million ${unit}`;
  }
  if (num < 1000000000000) {
    return `${(num / 1000000000).toFixed(2)} billion ${unit}`;
  }
  return `${num.toExponential(3)} ${unit}`;
}

/**
 * Compute real-time distance in kilometers for any celestial object at timeMs.
 */
export function getDistanceInKm(objectId: string, timeMs: number): { distanceKm: number; reference: string; isDynamic: boolean } {
  const date = new Date(timeMs);

  // 1. Sun
  if (objectId === 'sun') {
    try {
      const astroTime = Astronomy.MakeTime(date);
      const helioEarth = Astronomy.HelioVector(Astronomy.Body.Earth, astroTime);
      const distAu = Math.hypot(helioEarth.x, helioEarth.y, helioEarth.z);
      return { distanceKm: distAu * AU_IN_KM, reference: 'Distance from Earth', isDynamic: true };
    } catch {
      return { distanceKm: AU_IN_KM, reference: 'Distance from Earth', isDynamic: false };
    }
  }

  // 2. Earth
  if (objectId === 'earth') {
    try {
      const astroTime = Astronomy.MakeTime(date);
      const helioEarth = Astronomy.HelioVector(Astronomy.Body.Earth, astroTime);
      const distAu = Math.hypot(helioEarth.x, helioEarth.y, helioEarth.z);
      return { distanceKm: distAu * AU_IN_KM, reference: 'Orbital Distance from Sun', isDynamic: true };
    } catch {
      return { distanceKm: AU_IN_KM, reference: 'Orbital Distance from Sun', isDynamic: false };
    }
  }

  // 3. Earth's Moon
  if (objectId === 'moon') {
    try {
      const astroTime = Astronomy.MakeTime(date);
      const geoMoon = Astronomy.GeoMoon(astroTime);
      const km = Math.hypot(geoMoon.x, geoMoon.y, geoMoon.z) * AU_IN_KM;
      return { distanceKm: km, reference: 'Real-time Distance from Earth', isDynamic: true };
    } catch {
      return { distanceKm: 384400, reference: 'Distance from Earth', isDynamic: false };
    }
  }

  // 4. JWST at Sun-Earth L2
  if (objectId === 'jwst') {
    return { distanceKm: 1500000, reference: 'Distance from Earth (Sun–Earth L2)', isDynamic: false };
  }

  // 5. Orbital Satellites (ISS, Hubble, TESS, Chandra, Landsat 9)
  const satelliteDistancesKm: Record<string, number> = {
    iss: 408,
    hubble: 535,
    landsat: 705,
    tess: 153000,
    chandra: 133000,
  };
  if (satelliteDistancesKm[objectId]) {
    return { distanceKm: satelliteDistancesKm[objectId], reference: 'Altitude above Earth Surface', isDynamic: false };
  }

  // 6. Primary Solar System Planets
  const planetBody = Astronomy.Body[objectId.charAt(0).toUpperCase() + objectId.slice(1) as keyof typeof Astronomy.Body];
  if (planetBody && objectId !== 'earth') {
    try {
      const astroTime = Astronomy.MakeTime(date);
      const vecObj = Astronomy.HelioVector(planetBody, astroTime);
      const vecEarth = Astronomy.HelioVector(Astronomy.Body.Earth, astroTime);
      const dx = vecObj.x - vecEarth.x;
      const dy = vecObj.y - vecEarth.y;
      const dz = vecObj.z - vecEarth.z;
      const distAu = Math.hypot(dx, dy, dz);
      return { distanceKm: distAu * AU_IN_KM, reference: 'Real-time Distance from Earth', isDynamic: true };
    } catch {
      // Fallback to average heliocentric distance
    }
  }

  // 7. Deep Sky / Exoplanet catalog lookup
  const deepSkyLy = DEEP_SKY_LIGHT_YEARS[objectId];
  if (deepSkyLy !== undefined) {
    return {
      distanceKm: deepSkyLy * LY_IN_KM,
      reference: 'Distance from Earth / Solar System',
      isDynamic: false,
    };
  }

  // 8. Dynamic celestial object position computation fallback
  const posObj = { x: 0, y: 0, z: 0 };
  const posEarth = { x: 0, y: 0, z: 0 };
  if (computeCelestialPosition(objectId, timeMs, posObj) && computeCelestialPosition('earth', timeMs, posEarth)) {
    // Convert 3D scene distance rough scaling or use heliocentric vector
    const dx = posObj.x - posEarth.x;
    const dy = posObj.y - posEarth.y;
    const dz = posObj.z - posEarth.z;
    const sceneDist = Math.hypot(dx, dy, dz);
    const estAu = Math.max(0.1, sceneDist / 12);
    return {
      distanceKm: estAu * AU_IN_KM,
      reference: 'Estimated Distance from Earth',
      isDynamic: true,
    };
  }

  // Generic fallback: 1 AU
  return { distanceKm: AU_IN_KM, reference: 'Distance from Earth', isDynamic: false };
}

/**
 * Compute all requested metrics (km, miles, light years, sound travel time, walking, driving, flying).
 */
export function getFullTravelMetrics(objectId: string, timeMs: number): TravelMetrics {
  const { distanceKm, reference, isDynamic } = getDistanceInKm(objectId, timeMs);

  const miles = distanceKm * KM_TO_MILES;
  const lightYears = distanceKm / LY_IN_KM;

  const soundHours = distanceKm / SPEED_OF_SOUND_KMH;
  const walkingHours = distanceKm / WALKING_SPEED_KMH;
  const drivingHours = distanceKm / DRIVING_SPEED_KMH;
  const flyingHours = distanceKm / FLYING_SPEED_KMH;

  return {
    km: distanceKm,
    kmFormatted: formatCosmicNumber(distanceKm, 'km'),
    miles: miles,
    milesFormatted: formatCosmicNumber(miles, 'miles'),
    lightYears: lightYears,
    lightYearsFormatted: lightYears < 0.0001 ? `${lightYears.toExponential(3)} ly` : `${lightYears.toLocaleString(undefined, { maximumFractionDigits: 2 })} ly`,
    lightTimeFormatted: formatLightTime(lightYears),
    soundHours,
    soundFormatted: formatTravelDuration(soundHours),
    walkingHours,
    walkingFormatted: formatTravelDuration(walkingHours),
    drivingHours,
    drivingFormatted: formatTravelDuration(drivingHours),
    flyingHours,
    flyingFormatted: formatTravelDuration(flyingHours),
    isRealtimeDynamic: isDynamic,
    referenceFrame: reference,
  };
}
