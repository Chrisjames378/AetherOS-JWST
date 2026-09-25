/**
 * AetherOS: JWST - Global TypeScript Interfaces & Telemetry Types
 */

export type ModuleMode = 
  | 'flight'
  | 'mhd'
  | 'transit'
  | 'spectroscopy'
  | 'lensing'
  | 'collaboration'
  | 'fits';

export interface SpaceTarget {
  id: string;
  name: string;
  category: 'Exoplanet' | 'Nebula' | 'Galaxy' | 'Black Hole' | 'Solar System';
  ra: string; // Right Ascension e.g. "03h 32m 38s"
  dec: string; // Declination e.g. "-27° 46′ 34″"
  distanceLy: string;
  instrument: 'NIRCam' | 'MIRI' | 'NIRSpec' | 'MIRI/NIRSpec';
  description: string;
  thumbnailColor: string;
  coordinates: { x: number; y: number; z: number };
}

export interface JWSTTelemetry {
  l2DistanceKm: number;
  sunshieldHotTempK: number; // ~358 K
  sunshieldColdTempK: number; // ~37 K
  miriCryoTempK: number; // ~6.7 K
  mirrorRmsErrorNm: number; // ~18.2 nm
  downlinkRateMbps: number; // ~28.0 Mbps
  powerOutputWatts: number; // ~2000 W
  pointingErrorArcsec: number; // ~0.001 arcsec
  yawDeg: number;
  pitchDeg: number;
  rollDeg: number;
  zoom: number;
  currentStation: string;
  activeTarget: SpaceTarget;
}

export interface MHDFlareConfig {
  flareClass: 'X1.0' | 'X2.5' | 'X5.0' | 'X9.9' | 'M5.0' | 'C1.0';
  magneticFieldTesla: number; // 0.1 to 5.0 T
  plasmaDensity: number; // 1e15 to 1e18 m^-3
  loopTension: number; // 0.1 to 1.0
  reconnectionRate: number; // 0.01 to 0.5
  particleCount: number;
  isBurstActive: boolean;
}

export interface TransitSimConfig {
  planetRadiusJup: number; // R_J (0.1 to 2.5)
  starRadiusSun: number; // R_Sun (0.5 to 2.0)
  orbitalPeriodDays: number; // (0.5 to 50)
  orbitalInclinationDeg: number; // (85 to 90)
  limbDarkeningU1: number; // 0.1 to 0.8
  limbDarkeningU2: number; // 0.0 to 0.5
  noiseLevelPercent: number; // 0.01 to 0.5
  isAtmospherePresent: boolean;
  detectedMolecules: string[];
}

export interface SpectroscopyDataPoint {
  wavelengthMicrons: number; // 0.6 to 28.0 um
  fluxJy: number;
  uncertainty: number;
  channel: 'NIRCam' | 'MIRI' | 'NIRSpec';
}

export interface MolecularAbsorbLine {
  id: string;
  molecule: string; // e.g. "CO2", "H2O", "CH4", "O3", "Ly-alpha", "H-beta"
  wavelengthMicrons: number;
  strength: number;
  color: string;
  description: string;
}

export interface GravitationalLensingConfig {
  blackHoleMassSolar: number; // M_sun (1e6 to 1e10)
  impactParameterKpc: number; // kpc (0.5 to 50)
  clusterRedshift: number; // z (0.1 to 2.5)
  deflectionAngleArcsec: number;
  einsteinRadiusArcsec: number;
  showRayPaths: boolean;
  showPhotonRing: boolean;
  backgroundGalaxyShape: 'spiral' | 'elliptical' | 'quasar' | 'field';
}

export interface PeerObserver {
  id: string;
  name: string;
  role: 'Principal Investigator' | 'Instrument Engineer' | 'Data Scientist' | 'Observatory Operator';
  status: 'active' | 'observing' | 'idle';
  latencyMs: number;
  station: string;
  avatarColor: string;
}

export interface ResearchLogEntry {
  id: string;
  timestamp: string;
  author: string;
  category: 'Telemetry' | 'Spectroscopy' | 'Solar MHD' | 'FITS Export' | 'System';
  message: string;
  targetId?: string;
  verified: boolean;
}

export interface FITSExportMeta {
  targetName: string;
  instrument: string;
  exposureTimeSec: number;
  observerName: string;
  observationDate: string;
  filter: string;
  bitpix: number; // -32 for float
  naxis1: number; // image width
  naxis2: number; // image height
}
