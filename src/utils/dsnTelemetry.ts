export interface DSNSignal {
  dir: 'up' | 'down';
  craft: string;
  band: string;
  rate: number; // in bps
  powerDbm?: number;
}

export interface DSNDish {
  name: string;
  azimuth?: number;
  elevation?: number;
  wind?: number;
  activity: string;
  signals: DSNSignal[];
}

export interface DSNStation {
  code: string;
  name: string;
  updatedMs: number;
  dishes: DSNDish[];
}

export interface DSNFeedData {
  stations: DSNStation[];
}

// Craft code mapping to celestial sky id
export const CRAFT_NAME_MAP: Record<string, { name: string; sky?: string }> = {
  JWST: { name: 'JWST', sky: 'jwst' },
  '-98': { name: 'JWST', sky: 'jwst' },
  SPP: { name: 'Parker Solar Probe', sky: 'parker' },
  '-96': { name: 'Parker Solar Probe', sky: 'parker' },
  VGR1: { name: 'Voyager 1', sky: 'voyager1' },
  '-31': { name: 'Voyager 1', sky: 'voyager1' },
  VGR2: { name: 'Voyager 2', sky: 'voyager2' },
  '-32': { name: 'Voyager 2', sky: 'voyager2' },
  NHPC: { name: 'New Horizons', sky: 'newhorizons' },
  '-98b': { name: 'New Horizons', sky: 'newhorizons' },
  JNO: { name: 'Juno', sky: 'juno' },
  '-61': { name: 'Juno', sky: 'juno' },
  M20: { name: 'Perseverance', sky: 'perseverance' },
  '-168': { name: 'Perseverance', sky: 'perseverance' },
  CHDR: { name: 'Chandra', sky: 'chandra' },
  '-151': { name: 'Chandra', sky: 'chandra' },
  MRO: { name: 'Mars Reconnaissance Orbiter' },
  M01O: { name: 'Mars Odyssey' },
  TGO: { name: 'Trace Gas Orbiter' },
  SOHO: { name: 'SOHO' },
  ORX: { name: 'OSIRIS-APEX' },
  MMS1: { name: 'MMS-1' },
  TESS: { name: 'TESS', sky: 'tess' },
  HST: { name: 'Hubble', sky: 'hubble' },
};

export function formatCraftName(code: string): string {
  return CRAFT_NAME_MAP[code]?.name ?? code;
}

export function craftToSkyId(code: string): string | null {
  return CRAFT_NAME_MAP[code]?.sky ?? null;
}

export function formatDataRate(bps: number): string {
  if (!Number.isFinite(bps) || bps <= 0) return 'carrier';
  if (bps >= 1e6) {
    const mbps = bps / 1e6;
    return `${mbps >= 10 ? mbps.toFixed(0) : mbps.toFixed(1)} Mb/s`;
  }
  if (bps >= 1e3) {
    return `${Math.round(bps / 1e3)} kb/s`;
  }
  return `${Math.round(bps)} b/s`;
}

export function countTotalSignals(feed: DSNFeedData): number {
  let count = 0;
  for (const st of feed.stations) {
    for (const d of st.dishes) {
      count += d.signals.length;
    }
  }
  return count;
}

// Generate realistic simulated DSN telemetry if NASA connection times out or fails CORS
export function getSimulatedDSNFeed(): DSNFeedData {
  const now = Date.now();
  return {
    stations: [
      {
        code: 'gdscc',
        name: 'Goldstone (California, USA)',
        updatedMs: now,
        dishes: [
          {
            name: 'DSS-14 (70m)',
            azimuth: 142.4,
            elevation: 58.1,
            wind: 14,
            activity: 'Deep Space Telemetry & Science Downlink',
            signals: [
              { dir: 'down', craft: 'JWST', band: 'Ka', rate: 28000000, powerDbm: -112 },
              { dir: 'up', craft: 'JWST', band: 'S', rate: 16000, powerDbm: 20 },
            ],
          },
          {
            name: 'DSS-25 (34m)',
            azimuth: 198.2,
            elevation: 41.5,
            wind: 12,
            activity: 'Planetary Science Pass',
            signals: [
              { dir: 'down', craft: 'M20', band: 'X', rate: 128000, powerDbm: -128 },
            ],
          },
          {
            name: 'DSS-26 (34m)',
            azimuth: 245.0,
            elevation: 22.0,
            wind: 15,
            activity: 'Solar Dynamics Tracking',
            signals: [
              { dir: 'down', craft: 'SPP', band: 'X', rate: 250000, powerDbm: -118 },
            ],
          },
        ],
      },
      {
        code: 'mdscc',
        name: 'Madrid (Spain)',
        updatedMs: now,
        dishes: [
          {
            name: 'DSS-63 (70m)',
            azimuth: 88.5,
            elevation: 64.2,
            wind: 9,
            activity: 'Interstellar Mission Telemetry',
            signals: [
              { dir: 'down', craft: 'VGR1', band: 'S', rate: 160, powerDbm: -154 },
              { dir: 'up', craft: 'VGR1', band: 'S', rate: 16, powerDbm: 40 },
            ],
          },
          {
            name: 'DSS-55 (34m)',
            azimuth: 112.0,
            elevation: 35.8,
            wind: 11,
            activity: 'Astrophysics Orbit Monitoring',
            signals: [
              { dir: 'down', craft: 'CHDR', band: 'S', rate: 1188000, powerDbm: -105 },
            ],
          },
        ],
      },
      {
        code: 'cdscc',
        name: 'Canberra (Australia)',
        updatedMs: now,
        dishes: [
          {
            name: 'DSS-43 (70m)',
            azimuth: 215.3,
            elevation: 52.7,
            wind: 18,
            activity: 'Southern Hemisphere Interstellar Telemetry',
            signals: [
              { dir: 'down', craft: 'VGR2', band: 'S', rate: 160, powerDbm: -152 },
              { dir: 'down', craft: 'NHPC', band: 'X', rate: 2048, powerDbm: -140 },
            ],
          },
          {
            name: 'DSS-35 (34m)',
            azimuth: 310.2,
            elevation: 47.9,
            wind: 16,
            activity: 'Outer Planets Polar Orbit',
            signals: [
              { dir: 'down', craft: 'JNO', band: 'Ka', rate: 1250000, powerDbm: -121 },
            ],
          },
        ],
      },
    ],
  };
}

// Fetch live DSN feed from NASA XML service
export async function fetchLiveDSNData(): Promise<DSNFeedData> {
  const urls = ['/api/dsn', 'https://eyes.nasa.gov/dsn/data/dsn.xml'];
  
  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!res.ok) continue;
      const text = await res.text();
      if (!text || !text.includes('<dsn>')) continue;

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');
      
      const stations: DSNStation[] = [];
      const stationNodes = xmlDoc.querySelectorAll('station');
      
      stationNodes.forEach((stNode) => {
        const code = stNode.getAttribute('name') || '';
        const name = stNode.getAttribute('friendlyName') || code;
        const timeUtc = Number(stNode.getAttribute('timeUTC')) || Date.now();
        const dishes: DSNDish[] = [];

        // All dish siblings before next station
        let nextSibling = stNode.nextElementSibling;
        while (nextSibling && nextSibling.tagName === 'dish') {
          const dishNode = nextSibling;
          const dishName = dishNode.getAttribute('name') || '';
          const azimuth = Number(dishNode.getAttribute('azimuthAngle')) || undefined;
          const elevation = Number(dishNode.getAttribute('elevationAngle')) || undefined;
          const wind = Number(dishNode.getAttribute('windSpeed')) || undefined;
          const activity = dishNode.getAttribute('activity') || 'Spacecraft Telemetry';
          
          const signals: DSNSignal[] = [];
          
          const upNodes = dishNode.querySelectorAll('upSignal');
          upNodes.forEach((u) => {
            const active = u.getAttribute('active') === 'true';
            const craft = u.getAttribute('spacecraft') || '';
            if (active && craft) {
              signals.push({
                dir: 'up',
                craft,
                band: u.getAttribute('band') || 'X',
                rate: Number(u.getAttribute('dataRate')) || 0,
                powerDbm: Number(u.getAttribute('power')) || undefined,
              });
            }
          });

          const downNodes = dishNode.querySelectorAll('downSignal');
          downNodes.forEach((d) => {
            const active = d.getAttribute('active') === 'true';
            const craft = d.getAttribute('spacecraft') || '';
            if (active && craft) {
              signals.push({
                dir: 'down',
                craft,
                band: d.getAttribute('band') || 'Ka',
                rate: Number(d.getAttribute('dataRate')) || 0,
                powerDbm: Number(d.getAttribute('power')) || undefined,
              });
            }
          });

          dishes.push({
            name: dishName,
            azimuth,
            elevation,
            wind,
            activity,
            signals,
          });

          nextSibling = nextSibling.nextElementSibling;
        }

        stations.push({
          code,
          name,
          updatedMs: timeUtc,
          dishes,
        });
      });

      if (stations.length > 0) {
        return { stations };
      }
    } catch {
      // Continue to next URL or fallback
    }
  }

  // Fallback to simulated live telemetry
  return getSimulatedDSNFeed();
}
