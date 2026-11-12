import React, { useState, useEffect } from 'react';
import {
  X,
  Radio,
  Compass,
  Cpu,
  Thermometer,
  Zap,
  Target,
  Sliders,
  Layers,
  FileText,
  Activity,
  Maximize2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCw,
  Eye,
  Camera,
} from 'lucide-react';

export interface JWSTTarget {
  id: string;
  name: string;
  catalogId?: string;
  type: string;
  instrument: 'NIRCam' | 'NIRSpec' | 'MIRI' | 'NIRISS';
  filter: string;
  ra: string;
  dec: string;
  distance: string;
  expTotalSec: number;
  snr: number;
  absorbers: string[];
  description: string;
}

export const JWST_TARGET_CATALOG: JWSTTarget[] = [
  {
    id: 'lhs475b',
    name: 'LHS 475 b',
    catalogId: 'lhs475b',
    type: 'Terrestrial Rocky Exoplanet (0.99 R⊕)',
    instrument: 'NIRSpec',
    filter: 'PRISM 0.6-5.3µm',
    ra: '19h 20m 54s',
    dec: '-82° 33′ 16″',
    distance: '40.7 light-years',
    expTotalSec: 2400,
    snr: 42.8,
    absorbers: ['CO₂ (Flat Spectrum)', 'Methane Upper Limit'],
    description: 'First exoplanet confirmed by JWST. High-precision transmission spectroscopy confirms a rocky, Earth-sized world orbiting red dwarf LHS 475.',
  },
  {
    id: 'k218b',
    name: 'K2-18 b',
    catalogId: 'k218b',
    type: 'Hycean Sub-Neptune (8.63 M⊕ Ocean World)',
    instrument: 'NIRSpec',
    filter: 'G395H / F290LP',
    ra: '11h 18m 24s',
    dec: '+07° 59′ 16″',
    distance: '124 light-years',
    expTotalSec: 3600,
    snr: 58.4,
    absorbers: ['CH₄ (Methane 3.3µm)', 'CO₂ (Carbon Dioxide 4.3µm)', 'Potential DMS Trace'],
    description: 'Groundbreaking atmospheric discovery showing abundant carbon-bearing molecules (CH₄ & CO₂) and absence of ammonia, pointing to a global liquid water ocean.',
  },
  {
    id: 'trappist1e',
    name: 'TRAPPIST-1 e',
    catalogId: 'trappist1e',
    type: 'Habitable Zone Earth-Sized Planet',
    instrument: 'NIRSpec',
    filter: 'PRISM 0.6-5.3µm',
    ra: '23h 06m 29s',
    dec: '-05° 02′ 29″',
    distance: '40.0 light-years',
    expTotalSec: 5400,
    snr: 34.6,
    absorbers: ['H₂O Vapour Band', 'Secondary Atmosphere Test'],
    description: 'Probing the secondary atmosphere of the most Earth-like habitable-zone world known in the ultra-cool dwarf system TRAPPIST-1.',
  },
  {
    id: 'm42',
    name: 'Great Orion Nebula (M42)',
    catalogId: 'm42',
    type: 'Stellar Nursery & Protoplanetary Disks',
    instrument: 'MIRI',
    filter: 'F770W + F1130W (PAH)',
    ra: '05h 35m 17s',
    dec: '-05° 23′ 28″',
    distance: '1,344 light-years',
    expTotalSec: 1800,
    snr: 120.5,
    absorbers: ['Polycyclic Aromatic Hydrocarbons', 'Warm Silicate Grains', 'Shocked H₂'],
    description: 'Piercing dense interstellar molecular clouds in Orion’s Sword to resolve protoplanetary proplyds, infant protostars, and free-floating planetary-mass objects (JuMBOs).',
  },
  {
    id: 'smacs0723',
    name: 'SMACS 0723 Deep Field',
    catalogId: 'deepspace',
    type: 'Massive Galaxy Cluster Gravitational Lens',
    instrument: 'NIRCam',
    filter: 'F090W + F200W + F444W',
    ra: '07h 23m 20s',
    dec: '-73° 27′ 15″',
    distance: '4.6 Billion light-years (z = 0.39)',
    expTotalSec: 7200,
    snr: 88.2,
    absorbers: ['Gravitational Arc Magnification', 'Primitive Pop III Stellar Clusters'],
    description: 'Historic First Deep Field revealing gravitational lensing arcs of early galaxies dating back to over 13.1 billion years ago (just hundreds of millions of years after Big Bang).',
  },
  {
    id: 'carina',
    name: 'Cosmic Cliffs (Carina NGC 3372)',
    catalogId: 'milkyway',
    type: 'Giant Molecular Cloud Ionization Cavity',
    instrument: 'NIRCam',
    filter: 'F187N + F470N (H₂ + Pa-α)',
    ra: '10h 43m 48s',
    dec: '-59° 52′ 00″',
    distance: '7,600 light-years',
    expTotalSec: 2700,
    snr: 96.0,
    absorbers: ['Ionized Hydrogen Cavity', 'Stellar Wind Shocks'],
    description: 'Dramatic edge of a giant gaseous cavity carved out by blistering ultraviolet radiation and fierce stellar winds from colossal, hot, young stars.',
  },
];

interface JWSTMissionControlProps {
  onClose: () => void;
  onFlyToJWST: () => void;
  onSlewToTarget?: (targetId: string) => void;
  onOpenViewfinder?: () => void;
  onOpenFits?: () => void;
}

export const JWSTMissionControl: React.FC<JWSTMissionControlProps> = ({
  onClose,
  onFlyToJWST,
  onSlewToTarget,
  onOpenViewfinder,
  onOpenFits,
}) => {
  const [activeTab, setActiveTab] = useState<'targets' | 'optics' | 'instruments' | 'spectra' | 'thermal'>('targets');
  const [activeTarget, setActiveTarget] = useState<JWSTTarget>(JWST_TARGET_CATALOG[0]);
  const [isSlewing, setIsSlewing] = useState<boolean>(false);
  const [slewProgress, setSlewProgress] = useState<number>(100);

  // Optical Segment Phasing State (18 Hexagonal Mirror Segments)
  const [selectedHex, setSelectedHex] = useState<number>(1);
  const [phasingOffsets, setPhasingOffsets] = useState<number[]>(() =>
    Array.from({ length: 18 }, () => Math.round((Math.random() - 0.5) * 8))
  );
  const [isAutophasing, setIsAutophasing] = useState<boolean>(false);

  // Live Telemetry Tick
  const [telemetryTick, setTelemetryTick] = useState<number>(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetryTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSlew = (target: JWSTTarget) => {
    setActiveTarget(target);
    setIsSlewing(true);
    setSlewProgress(0);

    let p = 0;
    const interval = setInterval(() => {
      p += 15;
      if (p >= 100) {
        clearInterval(interval);
        setSlewProgress(100);
        setIsSlewing(false);
      } else {
        setSlewProgress(p);
      }
    }, 180);

    if (onSlewToTarget && target.catalogId) {
      onSlewToTarget(target.catalogId);
    }
  };

  const handleAutoPhase = () => {
    setIsAutophasing(true);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setPhasingOffsets((prev) =>
        prev.map((val) => {
          if (val === 0) return 0;
          return val > 0 ? val - 1 : val + 1;
        })
      );

      if (step >= 8) {
        clearInterval(interval);
        setIsAutophasing(false);
        setPhasingOffsets(Array.from({ length: 18 }, () => 0));
      }
    }, 250);
  };

  const calculateTotalWfeNm = () => {
    const sumSq = phasingOffsets.reduce((acc, v) => acc + v * v, 0);
    return (28.4 + Math.sqrt(sumSq) * 4.2).toFixed(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in font-mono text-fg">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-surface/95 border border-line rounded-xl shadow-2xl overflow-hidden">
        {/* HEADER BAR */}
        <div className="flex items-center justify-between px-4 py-3 bg-raised/80 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 font-extrabold text-sm shadow-[0_0_12px_rgba(245,158,11,0.3)]">
              🔭
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-fg tracking-wide uppercase">
                  NASA / ESA / CSA James Webb Space Telescope
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-signal/20 text-signal border border-signal/40 uppercase">
                  L2 Halo Orbit
                </span>
                {isSlewing ? (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                    SLEWING ({slewProgress}%)
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    SCIENCE EXPOSURE ACTIVE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted">
                Sun-Earth L2 Lagrangian Point · 1,512,420 km from Earth · Ka-Band DSN Uplink (28.0 Mbps)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onFlyToJWST}
              className="px-2.5 py-1.5 text-xs font-bold rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 transition-colors flex items-center gap-1.5"
              title="Fly 3D Camera to JWST at L2"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Fly to JWST
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-muted hover:text-fg hover:bg-surface rounded border border-transparent hover:border-line transition-colors"
              title="Close Mission Control"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* REAL-TIME TELEMETRY STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 px-4 py-2 bg-bg/90 border-b border-line text-[11px]">
          <div>
            <span className="text-muted block text-[10px]">DSN GROUND STATION</span>
            <span className="font-bold text-fg flex items-center gap-1">
              <Radio className="w-3 h-3 text-signal" /> Canberra DSS-43
            </span>
          </div>
          <div>
            <span className="text-muted block text-[10px]">ONE-WAY LIGHT TIME</span>
            <span className="font-bold text-signal">5.044 seconds</span>
          </div>
          <div>
            <span className="text-muted block text-[10px]">SUNSHIELD HOT SIDE</span>
            <span className="font-bold text-flare">+85.2°C (358.4 K)</span>
          </div>
          <div>
            <span className="text-muted block text-[10px]">PRIMARY MIRROR COLD</span>
            <span className="font-bold text-cyan-300">-233.1°C (40.1 K)</span>
          </div>
          <div>
            <span className="text-muted block text-[10px]">MIRI CRYOCOOLER</span>
            <span className="font-bold text-purple-400">6.7 K (-266.5°C)</span>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-1 px-4 py-1.5 bg-surface border-b border-line overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('targets')}
            className={`px-3 py-1.5 text-xs font-bold rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'targets' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' : 'text-muted hover:text-fg'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            Science Targets & Slew
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('optics')}
            className={`px-3 py-1.5 text-xs font-bold rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'optics' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' : 'text-muted hover:text-fg'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            18-Hex Mirror Phasing
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('instruments')}
            className={`px-3 py-1.5 text-xs font-bold rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'instruments' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' : 'text-muted hover:text-fg'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            ISIM Instruments
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('spectra')}
            className={`px-3 py-1.5 text-xs font-bold rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'spectra' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' : 'text-muted hover:text-fg'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Exoplanet Spectra Fit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('thermal')}
            className={`px-3 py-1.5 text-xs font-bold rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'thermal' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' : 'text-muted hover:text-fg'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            Thermal & Sunshield
          </button>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* TAB 1: SCIENCE TARGETS & SLEW */}
          {activeTab === 'targets' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg bg-bg/80 border border-line">
                <div>
                  <span className="text-xs font-bold text-amber-300 uppercase flex items-center gap-1.5">
                    <Target className="w-4 h-4" /> Active Boresight Target: {activeTarget.name}
                  </span>
                  <p className="text-xs text-muted mt-0.5">
                    {activeTarget.type} · Coordinates: RA {activeTarget.ra}, Dec {activeTarget.dec}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSlew(activeTarget)}
                    disabled={isSlewing}
                    className="px-3 py-1.5 text-xs font-bold rounded bg-amber-500 hover:bg-amber-400 text-black transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isSlewing ? 'animate-spin' : ''}`} />
                    {isSlewing ? 'Slewing Spacecraft...' : 'Slew 3D Telescope'}
                  </button>
                  {onOpenViewfinder && (
                    <button
                      type="button"
                      onClick={onOpenViewfinder}
                      className="px-3 py-1.5 text-xs font-bold rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Live Viewfinder
                    </button>
                  )}
                  {onOpenFits && (
                    <button
                      type="button"
                      onClick={onOpenFits}
                      className="px-3 py-1.5 text-xs font-bold rounded bg-surface hover:bg-raised border border-line text-fg transition-colors flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-signal" />
                      FITS Export
                    </button>
                  )}
                </div>
              </div>

              {/* TARGET CATALOG CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {JWST_TARGET_CATALOG.map((target) => {
                  const isCurrent = target.id === activeTarget.id;
                  return (
                    <div
                      key={target.id}
                      onClick={() => handleSlew(target)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isCurrent
                          ? 'bg-amber-500/10 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                          : 'bg-surface/80 border-line hover:border-line/90 hover:bg-raised'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-fg">{target.name}</span>
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-raised border border-line/60 text-amber-300">
                          {target.instrument}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted line-clamp-2 mb-2">{target.description}</p>

                      <div className="space-y-1 text-[10px] text-muted border-t border-line/40 pt-2">
                        <div className="flex justify-between">
                          <span>Filter / Mode:</span>
                          <span className="font-bold text-fg">{target.filter}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Distance:</span>
                          <span className="font-bold text-cyan-300">{target.distance}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Signal-to-Noise:</span>
                          <span className="font-bold text-signal">{target.snr}σ</span>
                        </div>
                      </div>

                      {target.absorbers.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {target.absorbers.map((abs, i) => (
                            <span key={i} className="px-1.5 py-0.5 text-[9px] rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/50">
                              {abs}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: OPTICAL WAVEFRONT & 18-HEX MIRROR PHASING */}
          {activeTab === 'optics' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 uppercase">
                    Primary Mirror Segment Map (6.5m Aperture)
                  </span>
                  <span className="text-xs font-bold text-signal">
                    RMS Wavefront Error: {calculateTotalWfeNm()} nm
                  </span>
                </div>
                <p className="text-xs text-muted">
                  JWST's 18 hexagonal beryllium segments coated with 100 nm of vapor-deposited 24-karat gold. Each segment has 6 hexapod actuators for tip, tilt, piston, and radius-of-curvature.
                </p>

                {/* 18-HEX SEGMENT GRID SELECTOR */}
                <div className="p-4 rounded-xl bg-bg border border-line flex flex-col items-center justify-center min-h-[220px]">
                  <div className="grid grid-cols-6 gap-2 max-w-[280px]">
                    {phasingOffsets.map((offset, idx) => {
                      const hexNum = idx + 1;
                      const isSelected = selectedHex === hexNum;
                      const isPhased = offset === 0;
                      return (
                        <button
                          key={hexNum}
                          type="button"
                          onClick={() => setSelectedHex(hexNum)}
                          className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center font-bold text-xs transition-all relative ${
                            isSelected
                              ? 'ring-2 ring-amber-400 bg-amber-500 text-black shadow-lg scale-105'
                              : isPhased
                              ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
                              : 'bg-red-500/20 border border-red-500/50 text-red-300 hover:bg-red-500/30 animate-pulse'
                          }`}
                        >
                          <span>#{hexNum}</span>
                          <span className="text-[8px] font-mono leading-none">
                            {offset === 0 ? '0' : `${offset > 0 ? '+' : ''}${offset * 7}nm`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-[10px] text-muted mt-3">Click any segment to inspect and tune nanometer actuators</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoPhase}
                    disabled={isAutophasing}
                    className="flex-1 px-3 py-2 text-xs font-bold rounded bg-signal hover:bg-signal/90 text-black transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isAutophasing ? 'animate-spin' : ''}`} />
                    {isAutophasing ? 'Running Wavefront Sensing & Control...' : 'Auto-Phase All 18 Segments'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhasingOffsets(Array.from({ length: 18 }, () => Math.round((Math.random() - 0.5) * 8)))}
                    className="px-3 py-2 text-xs font-bold rounded bg-surface hover:bg-raised border border-line text-muted hover:text-fg transition-colors"
                  >
                    Perturb
                  </button>
                </div>
              </div>

              {/* SEGMENT ACTUATOR CONTROLS */}
              <div className="p-4 rounded-xl bg-surface/80 border border-line space-y-4">
                <span className="text-xs font-bold text-fg uppercase flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  Actuator Adjuster: Hexagon Segment #{selectedHex}
                </span>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted">Piston Displacement (z-axis):</span>
                      <span className="font-bold text-amber-300">
                        {(phasingOffsets[selectedHex - 1] * 7.2).toFixed(1)} nm
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-6"
                      max="6"
                      step="1"
                      value={phasingOffsets[selectedHex - 1] || 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setPhasingOffsets((prev) => {
                          const copy = [...prev];
                          copy[selectedHex - 1] = val;
                          return copy;
                        });
                      }}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </div>

                  <div className="p-3 rounded-lg bg-bg/90 border border-line/60 space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-muted">Actuator Step Size:</span>
                      <span className="font-bold text-fg">7.7 nanometers</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Radius of Curvature (ROC):</span>
                      <span className="font-bold text-signal">Nominal (15,879.7 mm)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Interferometric Alignment:</span>
                      <span className={`font-bold ${phasingOffsets[selectedHex - 1] === 0 ? 'text-signal' : 'text-amber-400'}`}>
                        {phasingOffsets[selectedHex - 1] === 0 ? 'Diffraction-Limited' : 'De-phased'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Beryllium Core Temp:</span>
                      <span className="font-bold text-cyan-300">39.4 Kelvin (-233.8°C)</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200">
                    💡 <strong>Diffraction Physics:</strong> The 18 hexagonal mirrors form a discrete 6-fold symmetric pupil, producing JWST’s signature 6 large diffraction spikes on bright astronomical point sources.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ISIM INSTRUMENTS */}
          {activeTab === 'instruments' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-surface/80 border border-line space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-300 uppercase">NIRCam (Near-Infrared Camera)</span>
                  <span className="px-1.5 py-0.5 text-[10px] rounded bg-signal/20 text-signal border border-signal/40">ONLINE</span>
                </div>
                <p className="text-xs text-muted">
                  JWST's primary imager covering 0.6 to 5.0 microns. Equipped with coronagraphic masks to block parent star glare when imaging exoplanets and circumstellar dust disks.
                </p>
                <div className="text-[11px] space-y-1 border-t border-line/40 pt-2">
                  <div className="flex justify-between text-muted"><span>Wavelength:</span><span className="text-fg font-bold">0.6 – 5.0 µm</span></div>
                  <div className="flex justify-between text-muted"><span>Pixel Scale:</span><span className="text-fg font-bold">0.031" / pix (Short), 0.063" / pix (Long)</span></div>
                  <div className="flex justify-between text-muted"><span>Detector:</span><span className="text-fg font-bold">10 Mercury-Cadmium-Telluride (HgCdTe)</span></div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface/80 border border-line space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-cyan-300 uppercase">NIRSpec (Near-Infrared Spectrograph)</span>
                  <span className="px-1.5 py-0.5 text-[10px] rounded bg-signal/20 text-signal border border-signal/40">ONLINE</span>
                </div>
                <p className="text-xs text-muted">
                  First spectrograph in space capable of observing 100 astronomical targets simultaneously using an innovative array of 250,000 individually addressable microshutters.
                </p>
                <div className="text-[11px] space-y-1 border-t border-line/40 pt-2">
                  <div className="flex justify-between text-muted"><span>Wavelength:</span><span className="text-fg font-bold">0.6 – 5.3 µm</span></div>
                  <div className="flex justify-between text-muted"><span>Microshutters (MOS):</span><span className="text-fg font-bold">250,000 Shutter Grid</span></div>
                  <div className="flex justify-between text-muted"><span>Resolving Power (R):</span><span className="text-fg font-bold">R = 100 (Prism), 1000, 2700</span></div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface/80 border border-line space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-purple-300 uppercase">MIRI (Mid-Infrared Instrument)</span>
                  <span className="px-1.5 py-0.5 text-[10px] rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">CRYO-COOLED (6.7 K)</span>
                </div>
                <p className="text-xs text-muted">
                  Offers imaging and spectroscopy from 4.9 to 28.8 microns. Because longer wavelengths detect heat, MIRI is actively refrigerated by a helium-loop pulse tube cryocooler down to 6.7 K.
                </p>
                <div className="text-[11px] space-y-1 border-t border-line/40 pt-2">
                  <div className="flex justify-between text-muted"><span>Wavelength:</span><span className="text-fg font-bold">4.9 – 28.8 µm</span></div>
                  <div className="flex justify-between text-muted"><span>Cryocooler:</span><span className="text-purple-300 font-bold">Closed-cycle Helium Loop</span></div>
                  <div className="flex justify-between text-muted"><span>Science Target:</span><span className="text-fg font-bold">Cold Dust, PAH, Kuiper Belt</span></div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface/80 border border-line space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-300 uppercase">NIRISS & Fine Guidance Sensor (FGS)</span>
                  <span className="px-1.5 py-0.5 text-[10px] rounded bg-signal/20 text-signal border border-signal/40">ONLINE</span>
                </div>
                <p className="text-xs text-muted">
                  FGS guarantees sub-milliarcsecond pointing precision (pointing at a coin from 50 kilometers away), allowing NIRISS to perform non-redundant aperture masking interferometry.
                </p>
                <div className="text-[11px] space-y-1 border-t border-line/40 pt-2">
                  <div className="flex justify-between text-muted"><span>Pointing Jitter:</span><span className="text-signal font-bold">&lt; 1.0 milliarcsecond</span></div>
                  <div className="flex justify-between text-muted"><span>Aperture Masking:</span><span className="text-fg font-bold">7-hole NRM Interferometer</span></div>
                  <div className="flex justify-between text-muted"><span>Field of View:</span><span className="text-fg font-bold">2.2′ × 2.2′</span></div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EXOPLANET TRANSMISSION SPECTRA FIT */}
          {activeTab === 'spectra' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-amber-300 uppercase">
                    Transmission Spectroscopy: Atmospheric Molecular Dips
                  </span>
                  <p className="text-xs text-muted">
                    When an exoplanet transits its host star, starlight filters through the atmospheric ring, leaving characteristic absorption dips in the transit depth (ΔF/F).
                  </p>
                </div>
                <span className="px-2 py-1 text-xs font-bold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Target: {activeTarget.name}
                </span>
              </div>

              {/* PROCEDURAL SPECTRAL GRAPH */}
              <div className="p-4 rounded-xl bg-bg border border-line space-y-2">
                <div className="flex items-center justify-between text-[11px] text-muted">
                  <span>Wavelength: 0.6 µm (Visible Red)</span>
                  <span className="font-bold text-amber-300">NIRSpec PRISM Transmission Spectrum</span>
                  <span>5.0 µm (Mid-IR)</span>
                </div>

                <div className="h-44 w-full bg-surface/60 rounded-lg border border-line/80 relative overflow-hidden flex items-end p-2">
                  {/* Molecular Band Labels */}
                  <div className="absolute top-2 left-1/4 px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/40 text-[10px] text-blue-300">
                    H₂O (1.4µm)
                  </div>
                  <div className="absolute top-2 left-1/2 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-[10px] text-emerald-300">
                    CH₄ (3.3µm)
                  </div>
                  <div className="absolute top-2 right-12 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-[10px] text-amber-300">
                    CO₂ (4.3µm)
                  </div>

                  {/* Synthetic Spectrum Curve */}
                  <svg className="w-full h-full" viewBox="0 0 600 160" preserveAspectRatio="none">
                    <path
                      d="M 0 100 Q 60 95, 120 105 T 180 65 T 240 100 T 300 45 T 380 95 T 460 30 T 540 85 L 600 90"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2.5"
                    />
                    {/* Measurement Error Points */}
                    {[
                      [40, 98], [80, 102], [140, 85], [180, 65], [220, 95],
                      [260, 80], [300, 45], [340, 68], [380, 95], [420, 60],
                      [460, 30], [500, 65], [540, 85], [580, 92]
                    ].map(([px, py], i) => (
                      <g key={i}>
                        <line x1={px} y1={py - 10} x2={px} y2={py + 10} stroke="#f59e0b" strokeWidth="1.2" opacity="0.6" />
                        <circle cx={px} cy={py} r="3" fill="#f59e0b" />
                      </g>
                    ))}
                  </svg>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                  <div className="p-2 rounded bg-surface border border-line">
                    <span className="text-muted block text-[10px]">WATER VAPOUR (H₂O)</span>
                    <span className="font-bold text-blue-300">99.4% Detection Confidence</span>
                  </div>
                  <div className="p-2 rounded bg-surface border border-line">
                    <span className="text-muted block text-[10px]">METHANE (CH₄)</span>
                    <span className="font-bold text-emerald-300">5.2σ Significance Peak</span>
                  </div>
                  <div className="p-2 rounded bg-surface border border-line">
                    <span className="text-muted block text-[10px]">CARBON DIOXIDE (CO₂)</span>
                    <span className="font-bold text-amber-300">Unambiguous Feature at 4.3µm</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: THERMAL & SUNSHIELD MAP */}
          {activeTab === 'thermal' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-amber-300 uppercase">
                    5-Layer Kapton Sunshield Thermal Gradient
                  </span>
                  <p className="text-xs text-muted">
                    The tennis-court-sized sunshield blocks solar, terrestrial, and lunar heat with an attenuation factor exceeding 1,000,000:1.
                  </p>
                </div>
                <span className="px-2 py-1 text-xs font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Total Heat Dissipation: 99.999%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {[
                  { layer: 'Layer 1 (Sun-Facing)', temp: '+85.2°C (358 K)', mat: '0.05mm Kapton with Silicon coating', color: 'border-red-500/60 bg-red-500/10 text-red-300' },
                  { layer: 'Layer 2', temp: '+27.4°C (300 K)', mat: '0.025mm Kapton / Al coating', color: 'border-orange-500/60 bg-orange-500/10 text-orange-300' },
                  { layer: 'Layer 3', temp: '-65.0°C (208 K)', mat: '0.025mm Kapton / Vacuum gap', color: 'border-amber-500/60 bg-amber-500/10 text-amber-300' },
                  { layer: 'Layer 4', temp: '-180.2°C (93 K)', mat: '0.025mm Kapton / Radiative vent', color: 'border-blue-500/60 bg-blue-500/10 text-blue-300' },
                  { layer: 'Layer 5 (Mirror-Facing)', temp: '-233.1°C (40 K)', mat: '0.025mm High-emissivity Al', color: 'border-cyan-500/60 bg-cyan-500/10 text-cyan-300' },
                ].map((item, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border ${item.color} flex flex-col justify-between`}>
                    <div>
                      <span className="font-bold text-xs block">{item.layer}</span>
                      <span className="text-[10px] text-muted block mt-1">{item.mat}</span>
                    </div>
                    <span className="font-bold text-sm mt-3 block">{item.temp}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-surface border border-line text-xs text-muted leading-relaxed">
                🛡️ <strong>Passive Radiative Cooling:</strong> Without any liquid nitrogen or consumable coolant, JWST's sunshield passively radiates all solar infrared energy outward into deep space, maintaining the 18 golden hexagonal segments and ISIM instruments at cryogenic temperatures for the observatory's projected 20+ year lifetime.
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-raised/80 border-t border-line text-xs">
          <div className="flex items-center gap-2 text-muted">
            <Radio className="w-3.5 h-3.5 text-signal" />
            <span>Ka-Band Carrier: 26.5 GHz · Real-Time Telemetry Link Online</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenViewfinder && (
              <button
                type="button"
                onClick={onOpenViewfinder}
                className="px-3 py-1.5 font-bold rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-colors flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                Live Optics Viewfinder
              </button>
            )}
            {onOpenFits && (
              <button
                type="button"
                onClick={onOpenFits}
                className="px-3 py-1.5 font-bold rounded bg-surface hover:bg-raised border border-line text-fg transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-signal" />
                FITS Exporter
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 font-bold rounded bg-amber-500 hover:bg-amber-400 text-black transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
