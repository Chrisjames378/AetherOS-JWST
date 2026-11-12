import * as Astronomy from 'astronomy-engine';
import { CelestialSpec, CELESTIAL_MAP } from '../data/celestialCatalog';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface KeplerResiduals {
  q: number;
  qTarget: number;
  qError: number;
  closure: number;
  halleyResidual: number;
  edgeResidual: number;
  solvesPerSec: number;
  elapsedMs: number;
  sink: number;
}

const TWO_PI = Math.PI * 2;
const DEG_TO_RAD = Math.PI / 180;
const OBLIQUITY = 23.4392911 * DEG_TO_RAD;
const SIN_OBLIQ = Math.sin(OBLIQUITY);
const COS_OBLIQ = Math.cos(OBLIQUITY);
const AU_KM = 149597870.7;
const L2_AU = 1500000 / AU_KM;

// Compression exponent so both inner & outer system are visible
const DISTANCE_POWER = 0.55;
export function compressDistance(au: number): number {
  return 12 * Math.max(au, 1e-8) ** DISTANCE_POWER;
}

export function normalizeAngle(a: number): number {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

// Robust Mikkola / Newton-Raphson Kepler solver for high eccentricity (e up to 0.999+)
export function solveKepler(meanAnomaly: number, eccentricity: number): number {
  const m = normalizeAngle(meanAnomaly);
  let eAnom = m + eccentricity * Math.sin(m) * (1 + eccentricity * Math.cos(m));
  if (eccentricity > 0.8) {
    eAnom = m < 0 ? -Math.PI : Math.PI;
  }
  for (let iter = 0; iter < 16; iter++) {
    const s = Math.sin(eAnom);
    const c = Math.cos(eAnom);
    const f = eAnom - eccentricity * s - m;
    const fPrime = 1 - eccentricity * c;
    const fDoublePrime = eccentricity * s;
    const denom = 16 * fPrime * fPrime - 20 * f * fDoublePrime;
    const sqrtDenom = Math.sqrt(Math.abs(denom));
    const u1 = fPrime + sqrtDenom;
    const u2 = fPrime - sqrtDenom;
    const chosen = Math.abs(u1) > Math.abs(u2) ? u1 : u2;
    const delta = (5 * f) / (chosen || 1e-12);
    eAnom -= delta;
    if (Math.abs(delta) < 1e-12) break;
  }
  return eAnom;
}

export function keplerResidual(eAnom: number, eccentricity: number, m: number): number {
  return eAnom - eccentricity * Math.sin(eAnom) - normalizeAngle(m);
}

export interface OrbitalElements {
  a: number; // AU
  e: number;
  i: number; // deg
  om: number; // deg (longitude of ascending node)
  w: number; // deg (argument of perihelion)
  ma: number; // deg (mean anomaly at epoch)
  n: number; // deg/day (mean daily motion)
  epoch: number; // JD
}

const EPOCH_M = 2461309.5;
const EPOCH_H = 2461200.5;

export const ASTEROID_COMET_ELEMENTS: Record<string, OrbitalElements> = {
  ceres: { a: 2.76555, e: 0.07969, i: 10.588, om: 80.249, w: 73.294, ma: 274.419, n: 0.214304, epoch: EPOCH_H },
  vesta: { a: 2.36137, e: 0.09020, i: 7.1439, om: 103.701, w: 151.469, ma: 81.190, n: 0.271618, epoch: EPOCH_H },
  eros: { a: 1.45824, e: 0.22288, i: 10.8285, om: 304.268, w: 178.918, ma: 62.511, n: 0.559705, epoch: EPOCH_H },
  bennu: { a: 1.12592, e: 0.20368, i: 6.0330, om: 1.9665, w: 66.401, ma: 162.386, n: 0.824984, epoch: EPOCH_M },
  apophis: { a: 0.92236, e: 0.19115, i: 3.3410, om: 203.894, w: 126.680, ma: 175.330, n: 1.112638, epoch: EPOCH_H },
  ryugu: { a: 1.19092, e: 0.19107, i: 5.8664, om: 251.290, w: 211.609, ma: 62.341, n: 0.758369, epoch: EPOCH_H },
  halley: { a: 41.8151, e: 0.26818, i: 17.4737, om: 110.594, w: 123.809, ma: 43.587, n: 0.003645, epoch: EPOCH_M },
  halebopp: { a: 181.112, e: 0.99489, i: 89.7357, om: 281.806, w: 130.726, ma: 4.356, n: 0.000404, epoch: EPOCH_M },
  neowise: { a: 408.482, e: 0.99929, i: 128.975, om: 60.997, w: 37.232, ma: 0.2714, n: 0.000119, epoch: EPOCH_M },
  parker: { a: 0.38843, e: 0.88203, i: 3.3911, om: 76.483, w: 68.639, ma: 87.096, n: 4.07125, epoch: EPOCH_M },
};

// Moons around planets
export const MOON_ELEMENTS: Record<string, { parent: string; a: number; e: number; i: number; om: number; w: number; ma: number; n: number; epoch: number }> = {
  titan: { parent: 'saturn', a: 0.008168, e: 0.02875, i: 27.706, om: 169.081, w: 178.262, ma: 282.615, n: 22.574, epoch: EPOCH_M },
  triton: { parent: 'neptune', a: 0.002371, e: 0.00011, i: 129.128, om: 222.855, w: 112.674, ma: 154.071, n: 61.255, epoch: EPOCH_M },
  juno: { parent: 'jupiter', a: 0.01971, e: 0.9730, i: 100.318, om: 292.815, w: 103.999, ma: 184.265, n: 11.0085, epoch: EPOCH_M },
};

// Interstellar probes coasting states (AU and AU/day)
export const COASTING_PROBES: Record<string, { x: number; y: number; z: number; vx: number; vy: number; vz: number }> = {
  voyager1: { x: -32.157, y: -164.865, z: 36.390, vx: -0.0011955, vy: -0.0094713, vz: 0.0020829 },
  voyager2: { x: 39.878, y: -61.068, z: -124.212, vx: 0.0024277, vy: -0.0023495, vz: -0.0081425 },
  newhorizons: { x: 20.832, y: -58.014, z: -22.657, vx: 0.0030656, vy: -0.0067312, vz: -0.0026089 },
};

// Deep sky objects: Right Ascension (deg), Declination (deg), Shell distance in 3D scene
export const DEEP_SKY_COORDS: Record<string, { ra: number; dec: number; shell: number }> = {
  milkyway: { ra: 266.4168, dec: -29.0078, shell: 420 },
  sgr: { ra: 266.4168, dec: -29.0078, shell: 380 },
  cygx1: { ra: 299.5903, dec: 35.2016, shell: 260 },
  v404: { ra: 306.0160, dec: 33.8673, shell: 280 },
  crab: { ra: 83.6331, dec: 22.0145, shell: 240 },
  casa: { ra: 350.8500, dec: 58.8150, shell: 250 },
  tycho: { ra: 6.3396, dec: 64.1408, shell: 245 },
  wasp: { ra: 1.0464, dec: -47.3606, shell: 320 },

  // Satellite Dwarf Galaxies
  lmc: { ra: 80.8938, dec: -69.7561, shell: 680 },
  sn1987a: { ra: 83.8668, dec: -69.2699, shell: 690 },

  // Local Group Galaxies
  andromeda: { ra: 10.6847, dec: 41.2691, shell: 1250 },
  triangulum: { ra: 23.4621, dec: 30.6600, shell: 1380 },

  // Deep Intergalactic Galaxies & Quasars
  whirlpool: { ra: 202.4696, dec: 47.1953, shell: 1850 },
  sombrero: { ra: 189.9975, dec: -11.6231, shell: 1950 },
  m87: { ra: 187.7059, dec: 12.3911, shell: 2200 },
  ton618: { ra: 187.1040, dec: 31.4771, shell: 2550 },

  // ==========================================
  // CONSTELLATIONS & CELESTIAL VAULT STARS
  // ==========================================
  // 1. Orion (The Hunter) & Orion's Belt
  alnitak: { ra: 85.19, dec: -1.94, shell: 175 },
  alnilam: { ra: 84.05, dec: -1.20, shell: 175 },
  mintaka: { ra: 83.00, dec: -0.30, shell: 175 },
  betelgeuse: { ra: 88.79, dec: 7.41, shell: 175 },
  rigel: { ra: 78.63, dec: -8.20, shell: 175 },
  bellatrix: { ra: 81.28, dec: 6.35, shell: 175 },
  saiph: { ra: 86.94, dec: -9.67, shell: 175 },
  meissa: { ra: 83.78, dec: 9.93, shell: 175 },
  m42: { ra: 83.82, dec: -5.39, shell: 175 },

  // 2. Canis Major
  sirius: { ra: 101.29, dec: -16.72, shell: 175 },

  // 3. Ursa Major (Big Dipper)
  dubhe: { ra: 165.93, dec: 61.75, shell: 175 },
  merak: { ra: 165.46, dec: 56.38, shell: 175 },
  alioth: { ra: 193.51, dec: 55.96, shell: 175 },
  mizar: { ra: 200.98, dec: 54.92, shell: 175 },

  // 4. Ursa Minor (North Star)
  polaris: { ra: 37.95, dec: 89.26, shell: 175 },

  // 5. Cassiopeia
  schedar: { ra: 10.13, dec: 56.54, shell: 175 },
  gammacas: { ra: 14.18, dec: 60.72, shell: 175 },

  // 6. Cygnus (Northern Cross)
  deneb: { ra: 310.36, dec: 45.28, shell: 175 },
  albireo: { ra: 292.68, dec: 27.96, shell: 175 },

  // 7. Taurus & Pleiades
  aldebaran: { ra: 68.98, dec: 16.51, shell: 175 },
  pleiades: { ra: 56.87, dec: 24.11, shell: 175 },

  // 8. Scorpius
  antares: { ra: 247.35, dec: -26.43, shell: 175 },

  // 9. Lyra
  vega: { ra: 279.23, dec: 38.78, shell: 175 },

  // 10. Crux (Southern Cross)
  acrux: { ra: 186.65, dec: -63.10, shell: 175 },
};

export const ASTRONOMY_BODIES: Record<string, Astronomy.Body> = {
  mercury: Astronomy.Body.Mercury,
  venus: Astronomy.Body.Venus,
  earth: Astronomy.Body.Earth,
  mars: Astronomy.Body.Mars,
  jupiter: Astronomy.Body.Jupiter,
  saturn: Astronomy.Body.Saturn,
  uranus: Astronomy.Body.Uranus,
  neptune: Astronomy.Body.Neptune,
};

export const JUPITER_MOONS_MAP: Record<string, 'io' | 'europa' | 'ganymede' | 'callisto'> = {
  io: 'io',
  europa: 'europa',
  ganymede: 'ganymede',
  callisto: 'callisto',
};

export function toJulianDate(timeMs: number): number {
  return timeMs / 86400000 + 2440587.5;
}

// Rotate from Ecliptic to Equatorial frame
export function eclipticToEquatorial(v: Vector3D, out: Vector3D): Vector3D {
  out.x = v.x;
  out.y = v.y * COS_OBLIQ - v.z * SIN_OBLIQ;
  out.z = v.y * SIN_OBLIQ + v.z * COS_OBLIQ;
  return out;
}

// Compress distance and map into Three.js coordinates (Y is up, Z is depth)
export function toSceneCoords(v: Vector3D, out: Vector3D): Vector3D {
  const len = Math.hypot(v.x, v.y, v.z);
  const factor = len < 1e-12 ? 0 : compressDistance(len) / len;
  out.x = v.x * factor;
  out.y = v.z * factor;
  out.z = -v.y * factor;
  return out;
}

// Convert RA/Dec coordinates to sphere XYZ
export function raDecToScene(raDeg: number, decDeg: number, shellRadius: number, out: Vector3D): Vector3D {
  const raRad = raDeg * DEG_TO_RAD;
  const decRad = decDeg * DEG_TO_RAD;
  const cosDec = Math.cos(decRad);
  out.x = cosDec * Math.cos(raRad) * shellRadius;
  out.y = Math.sin(decRad) * shellRadius;
  out.z = -cosDec * Math.sin(raRad) * shellRadius;
  return out;
}

// Keplerian orbit position solver
export function solveKeplerOrbit(el: OrbitalElements, deltaDays: number, out: Vector3D): Vector3D {
  const meanAnomalyRad = (el.ma + el.n * deltaDays) * DEG_TO_RAD;
  const eAnom = solveKepler(meanAnomalyRad, el.e);
  const a = el.a;
  const e = el.e;
  const xPrime = a * (Math.cos(eAnom) - e);
  const yPrime = a * Math.sqrt(Math.max(0, 1 - e * e)) * Math.sin(eAnom);

  const inc = el.i * DEG_TO_RAD;
  const node = el.om * DEG_TO_RAD;
  const peri = el.w * DEG_TO_RAD;

  const cosP = Math.cos(peri);
  const sinP = Math.sin(peri);
  const p1 = xPrime * cosP - yPrime * sinP;
  const p2 = xPrime * sinP + yPrime * cosP;

  const cosN = Math.cos(node);
  const sinN = Math.sin(node);
  const cosI = Math.cos(inc);
  const sinI = Math.sin(inc);

  out.x = p1 * cosN - p2 * sinN * cosI;
  out.y = p1 * sinN + p2 * cosN * cosI;
  out.z = p2 * sinI;
  return out;
}

// Main compute function for any celestial object at timeMs
const tempVec1: Vector3D = { x: 0, y: 0, z: 0 };
const tempVec2: Vector3D = { x: 0, y: 0, z: 0 };
const tempVec3: Vector3D = { x: 0, y: 0, z: 0 };

export function computeCelestialPosition(id: string, timeMs: number, out: Vector3D): boolean {
  if (id === 'sun') {
    out.x = 0;
    out.y = 0;
    out.z = 0;
    return true;
  }

  const astroBody = ASTRONOMY_BODIES[id];
  const date = new Date(timeMs);

  // 1. Primary planets
  if (astroBody) {
    try {
      const astroTime = Astronomy.MakeTime(date);
      const helio = Astronomy.HelioVector(astroBody, astroTime);
      tempVec1.x = helio.x;
      tempVec1.y = helio.y;
      tempVec1.z = helio.z;
      toSceneCoords(tempVec1, out);
      return true;
    } catch {
      return false;
    }
  }

  // 2. Earth's Moon
  if (id === 'moon') {
    try {
      const astroTime = Astronomy.MakeTime(date);
      const earthHelio = Astronomy.HelioVector(Astronomy.Body.Earth, astroTime);
      const geoMoon = Astronomy.GeoMoon(astroTime);
      
      toSceneCoords({ x: earthHelio.x, y: earthHelio.y, z: earthHelio.z }, tempVec2);
      
      // Expand lunar offset so it is visible beside Earth
      const moonDist = Math.hypot(geoMoon.x, geoMoon.y, geoMoon.z);
      const offsetScale = 1.35 + 24 * Math.sqrt(Math.max(moonDist, 1e-8));
      
      out.x = tempVec2.x + (geoMoon.x / (moonDist || 1)) * offsetScale;
      out.y = tempVec2.y + (geoMoon.z / (moonDist || 1)) * offsetScale;
      out.z = tempVec2.z - (geoMoon.y / (moonDist || 1)) * offsetScale;
      return true;
    } catch {
      return false;
    }
  }

  // 3. Jupiter Moons
  const jupMoonKey = JUPITER_MOONS_MAP[id];
  if (jupMoonKey) {
    try {
      const astroTime = Astronomy.MakeTime(date);
      const jupHelio = Astronomy.HelioVector(Astronomy.Body.Jupiter, astroTime);
      const jupMoons = Astronomy.JupiterMoons(astroTime);
      const moonPos = jupMoons[jupMoonKey];

      toSceneCoords({ x: jupHelio.x, y: jupHelio.y, z: jupHelio.z }, tempVec2);

      const offsetScale = 1.6 + 32 * Math.sqrt(Math.max(Math.hypot(moonPos.x, moonPos.y, moonPos.z), 1e-8));
      out.x = tempVec2.x + moonPos.x * offsetScale;
      out.y = tempVec2.y + moonPos.z * offsetScale;
      out.z = tempVec2.z - moonPos.y * offsetScale;
      return true;
    } catch {
      return false;
    }
  }

  // 4. Moons of other planets (Titan, Triton, Juno)
  const moonEl = MOON_ELEMENTS[id];
  if (moonEl) {
    const parentPos = { x: 0, y: 0, z: 0 };
    if (computeCelestialPosition(moonEl.parent, timeMs, parentPos)) {
      const jd = toJulianDate(timeMs);
      solveKeplerOrbit(moonEl, jd - moonEl.epoch, tempVec1);
      eclipticToEquatorial(tempVec1, tempVec2);
      const offsetScale = 1.8;
      out.x = parentPos.x + tempVec2.x * offsetScale;
      out.y = parentPos.y + tempVec2.z * offsetScale;
      out.z = parentPos.z - tempVec2.y * offsetScale;
      return true;
    }
  }

  // 5. JWST at Sun-Earth L2 (1.5 million km outward from Earth with Halo Lissajous loop)
  if (id === 'jwst') {
    try {
      const astroTime = Astronomy.MakeTime(date);
      const earthHelio = Astronomy.HelioVector(Astronomy.Body.Earth, astroTime);
      const earthLen = Math.hypot(earthHelio.x, earthHelio.y, earthHelio.z) || 1;
      const ratio = 1 + L2_AU / earthLen;
      
      const haloPhase = ((toJulianDate(timeMs) - EPOCH_M) / 180) * TWO_PI;
      const haloRadius = 0.0035;

      tempVec1.x = earthHelio.x * ratio;
      tempVec1.y = earthHelio.y * ratio + haloRadius * Math.cos(haloPhase);
      tempVec1.z = earthHelio.z * ratio + haloRadius * Math.sin(haloPhase);
      toSceneCoords(tempVec1, out);
      return true;
    } catch {
      return false;
    }
  }

  // 6. Perseverance on Mars
  if (id === 'perseverance') {
    if (computeCelestialPosition('mars', timeMs, out)) {
      out.y += 0.55;
      return true;
    }
    return false;
  }

  // 7. Asteroids & Comets (Kepler elements)
  const kepEl = ASTEROID_COMET_ELEMENTS[id];
  if (kepEl) {
    const jd = toJulianDate(timeMs);
    solveKeplerOrbit(kepEl, jd - kepEl.epoch, tempVec1);
    eclipticToEquatorial(tempVec1, tempVec2);
    toSceneCoords(tempVec2, out);
    return true;
  }

  // 8. Coasting deep space probes (Voyager 1, 2, New Horizons)
  const coast = COASTING_PROBES[id];
  if (coast) {
    const deltaDays = toJulianDate(timeMs) - EPOCH_M;
    tempVec1.x = coast.x + coast.vx * deltaDays;
    tempVec1.y = coast.y + coast.vy * deltaDays;
    tempVec1.z = coast.z + coast.vz * deltaDays;
    toSceneCoords(tempVec1, out);
    return true;
  }

  // 9. Satellites in Earth Orbit (ISS, Hubble, TESS, Chandra, Landsat 9)
  const satSpec = CELESTIAL_MAP.get(id);
  if (satSpec && satSpec.category === 'satellite') {
    const earthPos = { x: 0, y: 0, z: 0 };
    if (computeCelestialPosition('earth', timeMs, earthPos)) {
      const angle = (satSpec.phase + satSpec.speed * (timeMs / 86400000) * TWO_PI) % TWO_PI;
      const r = satSpec.radius;
      out.x = earthPos.x + Math.cos(angle) * r;
      out.y = earthPos.y + satSpec.y;
      out.z = earthPos.z + Math.sin(angle) * r;
      return true;
    }
  }

  // 10. Deep sky objects (Galaxies, Black holes, Supernovae, Exoplanets)
  const deepSky = DEEP_SKY_COORDS[id];
  if (deepSky) {
    raDecToScene(deepSky.ra, deepSky.dec, deepSky.shell, out);
    return true;
  }

  // Fallback parametric placement
  if (satSpec) {
    out.x = Math.cos(satSpec.phase) * satSpec.radius;
    out.y = satSpec.y;
    out.z = Math.sin(satSpec.phase) * satSpec.radius;
    return true;
  }

  return false;
}

// Generate points for orbital path rendering in 3D
export function generateOrbitPath(id: string, timeMs: number): [number, number, number][] | null {
  const kepEl = ASTEROID_COMET_ELEMENTS[id];
  const astroBody = ASTRONOMY_BODIES[id];

  if (astroBody) {
    const points: [number, number, number][] = [];
    const periods: Record<string, number> = {
      mercury: 87.97,
      venus: 224.7,
      earth: 365.25,
      mars: 686.98,
      jupiter: 4332.59,
      saturn: 10759.2,
      uranus: 30688.5,
      neptune: 60182.0,
    };
    const periodDays = periods[id] || 365;
    const steps = 96;
    for (let i = 0; i <= steps; i++) {
      const stepTime = timeMs + (i / steps) * periodDays * 86400000;
      const pos: Vector3D = { x: 0, y: 0, z: 0 };
      if (computeCelestialPosition(id, stepTime, pos)) {
        points.push([pos.x, pos.y, pos.z]);
      }
    }
    return points.length > 3 ? points : null;
  }

  if (kepEl) {
    const periodDays = Math.abs(360 / kepEl.n);
    if (periodDays > 200000) return null; // Avoid drawing infinite hyperbolic arcs
    const steps = 120;
    const points: [number, number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const stepDeltaDays = (i / steps) * periodDays;
      solveKeplerOrbit(kepEl, stepDeltaDays, tempVec1);
      eclipticToEquatorial(tempVec1, tempVec2);
      toSceneCoords(tempVec2, tempVec3);
      points.push([tempVec3.x, tempVec3.y, tempVec3.z]);
    }
    return points.length > 3 ? points : null;
  }

  return null;
}

// Dynamic distance and telemetry metric string formatter
export function formatDistanceMetric(id: string, timeMs: number): string {
  const astroBody = ASTRONOMY_BODIES[id];
  if (astroBody) {
    try {
      const astroTime = Astronomy.MakeTime(new Date(timeMs));
      const helio = Astronomy.HelioVector(astroBody, astroTime);
      const distAu = Math.hypot(helio.x, helio.y, helio.z);
      return `${distAu.toFixed(distAu < 10 ? 3 : 2)} AU from the Sun · VSOP87`;
    } catch {
      // fallback
    }
  }

  if (id === 'moon') {
    try {
      const astroTime = Astronomy.MakeTime(new Date(timeMs));
      const geoMoon = Astronomy.GeoMoon(astroTime);
      const km = Math.hypot(geoMoon.x, geoMoon.y, geoMoon.z) * AU_KM;
      return `${Math.round(km).toLocaleString()} km from Earth · ELP-2000`;
    } catch {
      return '384,400 km from Earth';
    }
  }

  if (id === 'jwst') {
    return 'Sun–Earth L2, 1.5 million km. Halo Lissajous orbit locked to Earth.';
  }

  if (id === 'perseverance') {
    return 'On Mars at Jezero Crater (18.38°N 77.58°E). Surface rover.';
  }

  if (id === 'voyager1') {
    const deltaDays = toJulianDate(timeMs) - EPOCH_M;
    const c = COASTING_PROBES.voyager1;
    const distAu = Math.hypot(c.x + c.vx * deltaDays, c.y + c.vy * deltaDays, c.z + c.vz * deltaDays);
    return `${distAu.toFixed(2)} AU from Sun · Interstellar space`;
  }

  if (id === 'voyager2') {
    const deltaDays = toJulianDate(timeMs) - EPOCH_M;
    const c = COASTING_PROBES.voyager2;
    const distAu = Math.hypot(c.x + c.vx * deltaDays, c.y + c.vy * deltaDays, c.z + c.vz * deltaDays);
    return `${distAu.toFixed(2)} AU from Sun · Interstellar space`;
  }

  const spec = CELESTIAL_MAP.get(id);
  return spec?.metric || '';
}

// Kepler benchmark for Orbit Bench modal
export function runKeplerBenchmark(): KeplerResiduals {
  const el: OrbitalElements = {
    a: 0.387098,
    e: 0.20563,
    i: 7.005,
    om: 48.331,
    w: 29.124,
    ma: 0,
    n: 360 / 87.969,
    epoch: 0,
  };
  const p0 = { x: 0, y: 0, z: 0 };
  solveKeplerOrbit(el, 0, p0);
  const qReal = Math.hypot(p0.x, p0.y, p0.z);
  const qTarget = el.a * (1 - el.e);

  const pClose = { x: 0, y: 0, z: 0 };
  solveKeplerOrbit(el, 87.969, pClose);
  const closure = Math.hypot(pClose.x - p0.x, pClose.y - p0.y, pClose.z - p0.z);

  let halleyResidual = 0;
  for (let i = 0; i < 24; i++) {
    const m = (i / 24) * TWO_PI - Math.PI;
    const sol = solveKepler(m, 0.967142);
    halleyResidual = Math.max(halleyResidual, Math.abs(keplerResidual(sol, 0.967142, m)));
  }

  const edgeSol = solveKepler(0.05, 0.999);
  const edgeResidual = Math.abs(keplerResidual(edgeSol, 0.999, 0.05));

  const totalRuns = 200000;
  const tStart = performance.now();
  let sink = 0;
  for (let i = 0; i < totalRuns; i++) {
    solveKeplerOrbit(el, (i % 360) * 0.05, tempVec1);
    sink += tempVec1.x;
  }
  const elapsed = performance.now() - tStart;
  const solvesPerSec = totalRuns / (elapsed / 1000);

  return {
    q: qReal,
    qTarget,
    qError: Math.abs(qReal - qTarget),
    closure,
    halleyResidual,
    edgeResidual,
    solvesPerSec,
    elapsedMs: elapsed,
    sink,
  };
}

/**
 * Real-Time Solar Galactic Orbit & Milky Way Kinematics
 * R_0 = 8.178 kpc (~26,670 ly)
 * V_0 = 230 km/s (~828,000 km/h)
 * Galactic Orbital Period = ~230 Million Years (1 Galactic / Cosmic Year)
 * Vertical harmonic oscillation period = ~64 Million Years
 * Solar Apex: RA 18h 28m, Dec +30° (toward constellation Hercules / Vega)
 */
export interface SolarGalacticState {
  worldPosition: Vector3D;
  diskPosition: Vector3D;
  velocityDirection: Vector3D;
  distanceLy: number;
  distanceKpc: number;
  speedKmS: number;
  speedKmH: number;
  galacticYearProgress: number; // 0.0 to 1.0 of current 230 Myr orbit
  galacticRevolutionsTotal: number;
  verticalHeightLy: number;
  galacticLongitudeDeg: number;
  solarApexConstellation: string;
  spiralArm: string;
}

export function computeSolarGalacticState(currentTimeMs: number): SolarGalacticState {
  const J2000_MS = 946728000000;
  const MS_PER_YEAR = 365.25 * 86400 * 1000;
  const deltaYears = (currentTimeMs - J2000_MS) / MS_PER_YEAR;

  const GALACTIC_YEAR_YEARS = 230000000; // 230 Million Years
  const R_0_UNITS = 108.8; // ~26,670 ly in canvas scale
  const R_0_LY = 26670;
  const R_0_KPC = 8.178;

  // Base phase in Orion spur arm between Perseus and Sagittarius arms
  const baseAngle = -0.275; // radians (~-15.8°)
  const orbitAngle = baseAngle + (TWO_PI * deltaYears) / GALACTIC_YEAR_YEARS;
  const normalizedPhase = ((orbitAngle % TWO_PI) + TWO_PI) % TWO_PI;
  const galacticYearProgress = normalizedPhase / TWO_PI;

  // Vertical harmonic oscillation: 64 Myr period
  const Z_OSC_PERIOD_YEARS = 64000000;
  // Currently +65 ly above midplane, moving northward
  const verticalPhase = (TWO_PI * (deltaYears + 4800000)) / Z_OSC_PERIOD_YEARS;
  const verticalHeightLy = 65 + 160 * Math.sin(verticalPhase);
  const verticalHeightUnits = verticalHeightLy / 245;

  const xDisk = R_0_UNITS * Math.cos(orbitAngle);
  const zDisk = R_0_UNITS * Math.sin(orbitAngle);
  const yDisk = verticalHeightUnits;

  // Transform disk position into world position using Milky Way orientation
  // group.rotation.x = Math.PI / 6, group.rotation.z = Math.PI / 12
  const cosRx = Math.cos(Math.PI / 6);
  const sinRx = Math.sin(Math.PI / 6);
  const cosRz = Math.cos(Math.PI / 12);
  const sinRz = Math.sin(Math.PI / 12);

  // Rx
  const x1 = xDisk;
  const y1 = yDisk * cosRx - zDisk * sinRx;
  const z1 = yDisk * sinRx + zDisk * cosRx;

  // Rz
  const xWorld = x1 * cosRz - y1 * sinRz;
  const yWorld = x1 * sinRz + y1 * cosRz;
  const zWorld = z1;

  // Tangent velocity vector in disk
  const vxDisk = -Math.sin(orbitAngle);
  const vzDisk = Math.cos(orbitAngle);
  const vyDisk = 0.035 * Math.cos(verticalPhase);

  const vx1 = vxDisk;
  const vy1 = vyDisk * cosRx - vzDisk * sinRx;
  const vz1 = vyDisk * sinRx + vzDisk * cosRx;

  const vxWorld = vx1 * cosRz - vy1 * sinRz;
  const vyWorld = vx1 * sinRz + vy1 * cosRz;
  const vzWorld = vz1;
  const vLen = Math.hypot(vxWorld, vyWorld, vzWorld) || 1;

  // Solar age ~4.57 Gyr -> ~19.87 cosmic orbits
  const totalRevolutions = 4570000000 / GALACTIC_YEAR_YEARS + deltaYears / GALACTIC_YEAR_YEARS;

  return {
    worldPosition: { x: xWorld, y: yWorld, z: zWorld },
    diskPosition: { x: xDisk, y: yDisk, z: zDisk },
    velocityDirection: { x: vxWorld / vLen, y: vyWorld / vLen, z: vzWorld / vLen },
    distanceLy: R_0_LY,
    distanceKpc: R_0_KPC,
    speedKmS: 230,
    speedKmH: 828000,
    galacticYearProgress,
    galacticRevolutionsTotal: totalRevolutions,
    verticalHeightLy,
    galacticLongitudeDeg: ((orbitAngle * 180) / Math.PI + 360) % 360,
    solarApexConstellation: 'Hercules / Vega (Apex of Sun\'s Way)',
    spiralArm: 'Orion-Cygnus Spur (Local Arm)',
  };
}
