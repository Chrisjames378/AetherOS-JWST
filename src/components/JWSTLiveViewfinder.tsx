import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Eye,
  Camera,
  Layers,
  Compass,
  Zap,
  Target,
  Maximize2,
  ExternalLink,
  RefreshCw,
  Sliders,
  Check,
  RotateCw,
  Footprints,
  Car,
  Plane,
  Volume2,
  Ruler,
} from 'lucide-react';
import { getFullTravelMetrics } from '../utils/distanceCalculator';

export interface ScienceObservationTarget {
  id: string;
  name: string;
  catalogId?: string;
  type: string;
  instrument: 'NIRCam' | 'MIRI' | 'NIRSpec' | 'NIRISS';
  filters: string[];
  ra: string;
  dec: string;
  distance: string;
  expTotalSec: number;
  expCurrentSec: number;
  description: string;
  visualTheme: 'nebula' | 'galaxy' | 'planet' | 'cluster' | 'jet';
}

export const OBSERVATION_SCHEDULE: ScienceObservationTarget[] = [
  {
    id: 'lhs475b_target',
    name: 'LHS 475 b (JWST Discovered Rocky World)',
    catalogId: 'lhs475b',
    type: 'Terrestrial Rocky Exoplanet (99% Earth Radius)',
    instrument: 'NIRSpec',
    filters: ['PRISM 0.6-5.3µm', 'G395H / F290LP'],
    ra: '19h 20m 54.4s',
    dec: '-82° 33′ 16″',
    distance: '40.7 light years',
    expTotalSec: 2100,
    expCurrentSec: 1680,
    description: 'NIRSpec prism transmission spectrum confirming a rocky, Earth-sized world orbiting red dwarf LHS 475.',
    visualTheme: 'planet',
  },
  {
    id: 'k218b_target',
    name: 'K2-18 b (Hycean Ocean World CO₂ / CH₄)',
    catalogId: 'k218b',
    type: 'Hycean Sub-Neptune (8.63 M⊕ Ocean World)',
    instrument: 'NIRSpec',
    filters: ['PRISM 0.6-5.3µm', 'G235H / F170LP'],
    ra: '11h 18m 23.8s',
    dec: '+07° 59′ 16″',
    distance: '124 light years',
    expTotalSec: 2700,
    expCurrentSec: 2150,
    description: 'Detection of methane (CH₄) and carbon dioxide (CO₂) with absence of ammonia, indicating a liquid ocean under a H₂ atmosphere.',
    visualTheme: 'planet',
  },
  {
    id: 'trappist1e_target',
    name: 'TRAPPIST-1 e Habitable Zone Search',
    catalogId: 'trappist1e',
    type: 'Habitable Zone Earth-Sized Planet',
    instrument: 'NIRSpec',
    filters: ['PRISM 0.6-5.3µm', 'F290LP'],
    ra: '23h 06m 29.3s',
    dec: '-05° 02′ 29″',
    distance: '40 light years',
    expTotalSec: 3600,
    expCurrentSec: 2940,
    description: 'Transmission spectroscopy probing for CO₂ / N₂ atmospheric biosignature gas absorbers in the habitable zone.',
    visualTheme: 'planet',
  },
  {
    id: 'gliese12b_target',
    name: 'Gliese 12 b (2024 Temperate World Discovery)',
    catalogId: 'gliese12b',
    type: 'Temperate Earth-Sized World (~315 K)',
    instrument: 'NIRSpec',
    filters: ['PRISM 0.6-5.3µm', 'F170LP'],
    ra: '00h 15m 49.2s',
    dec: '+13° 33′ 22″',
    distance: '39.7 light years',
    expTotalSec: 2400,
    expCurrentSec: 1820,
    description: 'TESS/CHEOPS 2024 discovery follow-up measuring transmission spectra for temperate secondary atmosphere.',
    visualTheme: 'planet',
  },
  {
    id: 'wasp39b_target',
    name: 'WASP-39 b (Photochemical SO₂ Atmosphere)',
    catalogId: 'wasp39b',
    type: 'Puffy Hot Saturn Exoplanet',
    instrument: 'NIRSpec',
    filters: ['PRISM 0.6-5.3µm', 'NIRISS SOSS', 'MIRI LRS'],
    ra: '14h 29m 18.4s',
    dec: '-03° 26′ 40″',
    distance: '700 light years',
    expTotalSec: 1800,
    expCurrentSec: 1510,
    description: 'First definitive photochemistry detection in an exoplanet atmosphere, showing SO₂ produced by stellar UV light.',
    visualTheme: 'planet',
  },
  {
    id: 'wasp96b',
    name: 'WASP-96b Atmospheric Transit',
    catalogId: 'wasp',
    type: 'Hot Saturn Exoplanet (H₂O Spectral Survey)',
    instrument: 'NIRSpec',
    filters: ['PRISM 0.6-5.3µm', 'F290LP', 'F170LP'],
    ra: '00h 02m 14.8s',
    dec: '-42° 18′ 22″',
    distance: '1,150 light years',
    expTotalSec: 1800,
    expCurrentSec: 1240,
    description: 'Transmission spectroscopy measuring water vapor absorption dips during stellar occultation.',
    visualTheme: 'planet',
  },
  {
    id: 'carina',
    name: 'Carina Nebula (Cosmic Cliffs - NGC 3372)',
    catalogId: 'wasp',
    type: 'Star-Forming Region / H II Region',
    instrument: 'NIRCam',
    filters: ['F090W (0.9µm)', 'F200W (2.0µm)', 'F444W (4.4µm)'],
    ra: '10h 45m 08.5s',
    dec: '-59° 52′ 04″',
    distance: '7,600 light years',
    expTotalSec: 3600,
    expCurrentSec: 2890,
    description: 'Deep infrared imaging exposing protostellar jets emerging from dense dust clouds.',
    visualTheme: 'nebula',
  },
  {
    id: 'smacs0723',
    name: 'SMACS 0723 Deep Field',
    catalogId: 'm87',
    type: 'Gravitational Lensing Galaxy Cluster',
    instrument: 'NIRCam',
    filters: ['F090W', 'F150W', 'F200W', 'F356W', 'F444W'],
    ra: '07h 23m 19.5s',
    dec: '-73° 27′ 15″',
    distance: '4.6 billion light years',
    expTotalSec: 7200,
    expCurrentSec: 5120,
    description: 'Massive cluster lensing thousands of high-redshift z > 10 primitive early galaxies.',
    visualTheme: 'cluster',
  },
  {
    id: 'pillars',
    name: 'Pillars of Creation (Messier 16)',
    catalogId: 'wasp',
    type: 'Interstellar Gas & Dust Columns',
    instrument: 'MIRI',
    filters: ['F770W (7.7µm)', 'F1130W (11.3µm)', 'F1500W (15µm)'],
    ra: '18h 18m 48.0s',
    dec: '-13° 49′ 00″',
    distance: '6,500 light years',
    expTotalSec: 2400,
    expCurrentSec: 1980,
    description: 'Mid-infrared mapping of cold polycyclic aromatic hydrocarbon (PAH) dust pillars.',
    visualTheme: 'nebula',
  },
  {
    id: 'm87jet',
    name: 'M87* Relativistic Jet Core',
    catalogId: 'm87',
    type: 'Active Galactic Nucleus / Supermassive BH',
    instrument: 'MIRI',
    filters: ['F560W (5.6µm)', 'F1000W (10.0µm)'],
    ra: '12h 30m 49.4s',
    dec: '+12° 23′ 28″',
    distance: '53.5 million light years',
    expTotalSec: 1200,
    expCurrentSec: 890,
    description: 'Synchrotron radiation from 5,000-light-year relativistic plasma jet launched by 6.5B M☉ black hole.',
    visualTheme: 'jet',
  },
  {
    id: 'jupiter_aurora',
    name: 'Jupiter Polar Auroras & Rings',
    catalogId: 'jupiter',
    type: 'Gas Giant Planetary System',
    instrument: 'NIRCam',
    filters: ['F212N (2.12µm H₂)', 'F323N (3.23µm CH₄)'],
    ra: '02h 14m 10.2s',
    dec: '+12° 04′ 18″',
    distance: '42 light minutes (4.2 AU)',
    expTotalSec: 900,
    expCurrentSec: 640,
    description: 'Narrowband methane absorption imaging revealing high-altitude polar ionospheric auroral ovals.',
    visualTheme: 'planet',
  },
];

interface JWSTLiveViewfinderProps {
  onClose: () => void;
  onFlyToTarget?: (skyId: string) => void;
}

export const JWSTLiveViewfinder: React.FC<JWSTLiveViewfinderProps> = ({
  onClose,
  onFlyToTarget,
}) => {
  const [activeTarget, setActiveTarget] = useState<ScienceObservationTarget>(OBSERVATION_SCHEDULE[0]);
  const [activeFilter, setActiveFilter] = useState<string>(activeTarget.filters[0]);
  const [showMicroshutters, setShowMicroshutters] = useState<boolean>(true);
  const [showGuider, setShowGuider] = useState<boolean>(true);
  const [showSpikes, setShowSpikes] = useState<boolean>(true);
  const [expSec, setExpSec] = useState<number>(activeTarget.expCurrentSec);
  const [jitter, setJitter] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync active filter when target changes
  useEffect(() => {
    setActiveFilter(activeTarget.filters[0]);
    setExpSec(activeTarget.expCurrentSec);
  }, [activeTarget]);

  // Exposure timer & FGS guider jitter loop
  useEffect(() => {
    const interval = setInterval(() => {
      setExpSec((prev) => (prev >= activeTarget.expTotalSec ? 0 : prev + 1));
      setJitter({
        x: (Math.random() - 0.5) * 1.8,
        y: (Math.random() - 0.5) * 1.8,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTarget]);

  // Procedural Canvas Renderer representing JWST's Boresight Infrared Optics
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let frame = 0;

    const render = () => {
      frame++;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      ctx.fillStyle = '#030508';
      ctx.fillRect(0, 0, w, h);

      // Render thematic deep-space optical features depending on target type
      if (activeTarget.visualTheme === 'nebula') {
        const grad1 = ctx.createRadialGradient(cx - 40, cy - 20, 10, cx, cy, 260);
        grad1.addColorStop(0, 'rgba(238, 110, 80, 0.7)');
        grad1.addColorStop(0.4, 'rgba(180, 70, 140, 0.4)');
        grad1.addColorStop(0.8, 'rgba(40, 30, 80, 0.2)');
        grad1.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad1;
        ctx.fillRect(0, 0, w, h);

        // Dust pillar silhouettes
        ctx.fillStyle = 'rgba(15, 12, 22, 0.85)';
        ctx.beginPath();
        ctx.moveTo(w * 0.2, h);
        ctx.lineTo(w * 0.35, h * 0.4);
        ctx.lineTo(w * 0.45, h * 0.5);
        ctx.lineTo(w * 0.52, h * 0.3);
        ctx.lineTo(w * 0.65, h * 0.6);
        ctx.lineTo(w * 0.8, h);
        ctx.fill();
      } else if (activeTarget.visualTheme === 'cluster' || activeTarget.visualTheme === 'galaxy') {
        // Gravitational Einstein arc lensed arcs
        ctx.strokeStyle = 'rgba(227, 162, 59, 0.6)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, cy, 140, 0.2, 1.4);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, 160, 3.2, 4.2);
        ctx.stroke();

        // Background high-z galaxy blobs
        const galaxies = [
          { x: cx - 120, y: cy - 90, r: 12, c: '#2fdbc4' },
          { x: cx + 140, y: cy + 80, r: 18, c: '#e3a23b' },
          { x: cx - 180, y: cy + 110, r: 8, c: '#f43f5e' },
          { x: cx + 90, y: cy - 130, r: 15, c: '#a855f7' },
        ];
        galaxies.forEach((g) => {
          const grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r * 2);
          grad.addColorStop(0, g.c);
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(g.x, g.y, g.r * 2, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (activeTarget.visualTheme === 'planet') {
        // Exoplanet or Jupiter disc
        const planetR = activeTarget.id === 'jupiter_aurora' ? 120 : 75;
        const pGrad = ctx.createRadialGradient(cx - planetR * 0.3, cy - planetR * 0.3, 10, cx, cy, planetR);
        pGrad.addColorStop(0, activeTarget.id === 'jupiter_aurora' ? '#f0e2c0' : '#4ade80');
        pGrad.addColorStop(0.7, activeTarget.id === 'jupiter_aurora' ? '#a35a28' : '#0f766e');
        pGrad.addColorStop(1, '#042f2e');
        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, planetR, 0, Math.PI * 2);
        ctx.fill();

        // Jupiter Auroral Ring
        if (activeTarget.id === 'jupiter_aurora') {
          ctx.strokeStyle = 'rgba(47, 219, 196, 0.85)';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.ellipse(cx, cy - planetR * 0.7, planetR * 0.5, planetR * 0.15, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (activeTarget.visualTheme === 'jet') {
        // Relativistic Jet beam
        const jetGrad = ctx.createLinearGradient(cx, cy, cx + 220, cy - 180);
        jetGrad.addColorStop(0, '#ffffff');
        jetGrad.addColorStop(0.2, '#38bdf8');
        jetGrad.addColorStop(0.6, '#a855f7');
        jetGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.strokeStyle = jetGrad;
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + 220, cy - 180);
        ctx.stroke();
      }

      // Star Field with 6-Spike JWST Diffraction Pattern
      const stars = [
        { x: cx, y: cy, size: 4.5, mag: 1 },
        { x: cx - 180, y: cy - 110, size: 2.2, mag: 2 },
        { x: cx + 210, y: cy - 70, size: 2.8, mag: 1.5 },
        { x: cx - 130, y: cy + 150, size: 1.8, mag: 3 },
        { x: cx + 170, y: cy + 130, size: 3.2, mag: 1.2 },
        { x: cx + 40, y: cy - 170, size: 1.5, mag: 3.5 },
        { x: cx - 220, y: cy + 20, size: 2.0, mag: 2.5 },
      ];

      stars.forEach((star) => {
        // Core point
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        // JWST 6-spike hexagonal diffraction pattern
        if (showSpikes) {
          ctx.strokeStyle = 'rgba(227, 162, 59, 0.75)';
          ctx.lineWidth = 1.2;
          const spikeLen = star.size * 28;

          // 3 axes (6 spikes) at 0°, 60°, 120°
          const angles = [0, Math.PI / 3, (2 * Math.PI) / 3];
          angles.forEach((a) => {
            ctx.beginPath();
            ctx.moveTo(star.x - Math.cos(a) * spikeLen, star.y - Math.sin(a) * spikeLen);
            ctx.lineTo(star.x + Math.cos(a) * spikeLen, star.y + Math.sin(a) * spikeLen);
            ctx.stroke();
          });
        }
      });

      // Microshutter Array Grid Pattern Overlay (NIRSpec 248,000 shutters)
      if (showMicroshutters) {
        ctx.strokeStyle = 'rgba(42, 53, 72, 0.4)';
        ctx.lineWidth = 0.8;
        const step = 24;
        for (let x = 0; x < w; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = 0; y < h; y += step) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
      }

      // Fine Guidance Sensor (FGS) Centroid Tracking Lock Box
      if (showGuider) {
        const lockX = cx + jitter.x * 4;
        const lockY = cy + jitter.y * 4;
        const boxSize = 36;

        ctx.strokeStyle = '#2fdbc4';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(lockX - boxSize / 2, lockY - boxSize / 2, boxSize, boxSize);

        // Crosshairs
        ctx.beginPath();
        ctx.moveTo(lockX - boxSize, lockY);
        ctx.lineTo(lockX + boxSize, lockY);
        ctx.moveTo(lockX, lockY - boxSize);
        ctx.lineTo(lockX, lockY + boxSize);
        ctx.stroke();

        ctx.fillStyle = '#2fdbc4';
        ctx.font = '9px monospace';
        ctx.fillText(
          `FGS LOCK · 0.0008" RMS (${jitter.x >= 0 ? '+' : ''}${jitter.x.toFixed(2)}, ${jitter.y >= 0 ? '+' : ''}${jitter.y.toFixed(2)})`,
          lockX - 70,
          lockY - boxSize / 2 - 6
        );
      }

      // Detector Correlated Double Sampling (CDS) Noise Grain
      const noiseOpacity = 0.04 + Math.random() * 0.02;
      ctx.fillStyle = `rgba(255,255,255,${noiseOpacity})`;
      for (let i = 0; i < 180; i++) {
        ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [activeTarget, activeFilter, showMicroshutters, showGuider, showSpikes, jitter]);

  const expPct = Math.min(100, (expSec / activeTarget.expTotalSec) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] border border-line bg-surface/95 rounded shadow-2xl overflow-hidden font-mono">
        {/* 1. HEADER */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line bg-bg/80">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-signal animate-pulse shadow-[0_0_8px_#2fdbc4]" />
            <div>
              <h2 className="text-xs font-bold text-flare tracking-widest uppercase flex items-center gap-2">
                <span>JWST REAL-TIME OPTICAL VIEWFINDER</span>
                <span className="text-[10px] text-muted font-normal bg-raised px-2 py-0.5 rounded">
                  BORESIGHT LOCK
                </span>
              </h2>
              <p className="text-[10px] text-muted">
                Direct primary golden mirror line-of-sight detector stream from Sun–Earth L2
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeTarget.catalogId && onFlyToTarget && (
              <button
                type="button"
                onClick={() => {
                  onFlyToTarget(activeTarget.catalogId!);
                  onClose();
                }}
                className="min-h-8 px-3 text-xs bg-signal text-signal-ink font-bold rounded hover:bg-signal/90 transition-colors flex items-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5" />
                Point 3D Camera To Target
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="min-h-8 px-2 text-muted hover:text-fg hover:bg-raised transition-colors rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. TARGET SELECTION BAR */}
        <div className="px-4 py-2 bg-bg/60 border-b border-line flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[260px]">
            <Target className="w-4 h-4 text-flare shrink-0" />
            <span className="text-muted text-[11px] shrink-0">OBSERVATION TARGET:</span>
            <select
              value={activeTarget.id}
              onChange={(e) => {
                const found = OBSERVATION_SCHEDULE.find((t) => t.id === e.target.value);
                if (found) setActiveTarget(found);
              }}
              className="bg-raised border border-line text-fg px-2.5 py-1 text-xs rounded focus:outline-none focus:border-flare font-bold flex-1"
            >
              {OBSERVATION_SCHEDULE.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.instrument})
                </option>
              ))}
            </select>
          </div>

          {/* Instrument Filter Band Selector */}
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-muted mr-1">FILTER:</span>
            {activeTarget.filters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setActiveFilter(f)}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                  activeFilter === f
                    ? 'bg-flare text-flare-ink font-bold'
                    : 'bg-surface hover:bg-raised text-muted'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* 3. MAIN DETECTOR VIEWPORT CANVAS */}
        <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={800}
            height={460}
            className="w-full h-full max-h-[50vh] sm:max-h-[58vh] object-contain"
          />

          {/* HUD OVERLAY CORNERS */}
          <div className="pointer-events-none absolute top-3 left-3 bg-bg/80 backdrop-blur-md border border-line/70 p-2 rounded text-[11px] space-y-1">
            <div className="text-flare font-bold flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" />
              <span>{activeTarget.instrument.toUpperCase()} DETECTOR READOUT</span>
            </div>
            <div className="text-muted text-[10px]">
              <span>RA: {activeTarget.ra}</span> · <span>DEC: {activeTarget.dec}</span>
            </div>
            <div className="text-fg text-[10px]">
              <span>DIST: {activeTarget.distance}</span>
            </div>
          </div>

          <div className="pointer-events-none absolute top-3 right-3 bg-bg/80 backdrop-blur-md border border-line/70 p-2 rounded text-[11px] text-right space-y-1">
            <div className="text-signal font-bold">
              <span>FILTER: {activeFilter}</span>
            </div>
            <div className="text-muted text-[10px]">
              <span>EXPOSURE: {expSec}s / {activeTarget.expTotalSec}s</span>
            </div>
            <div className="w-28 bg-line h-1.5 rounded-full overflow-hidden ml-auto">
              <div
                className="bg-signal h-full transition-all duration-300"
                style={{ width: `${expPct}%` }}
              />
            </div>
          </div>

          {/* OVERLAY TOGGLE BUTTONS */}
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5 text-[10px]">
            <button
              type="button"
              onClick={() => setShowMicroshutters((p) => !p)}
              className={`px-2 py-1 rounded border transition-colors ${
                showMicroshutters
                  ? 'border-signal bg-signal/20 text-signal font-bold'
                  : 'border-line bg-bg/80 text-muted'
              }`}
            >
              Microshutter Grid
            </button>
            <button
              type="button"
              onClick={() => setShowGuider((p) => !p)}
              className={`px-2 py-1 rounded border transition-colors ${
                showGuider
                  ? 'border-signal bg-signal/20 text-signal font-bold'
                  : 'border-line bg-bg/80 text-muted'
              }`}
            >
              FGS Fine Guider
            </button>
            <button
              type="button"
              onClick={() => setShowSpikes((p) => !p)}
              className={`px-2 py-1 rounded border transition-colors ${
                showSpikes
                  ? 'border-flare bg-flare/20 text-flare font-bold'
                  : 'border-line bg-bg/80 text-muted'
              }`}
            >
              JWST 6-Spike Optics
            </button>
          </div>
        </div>

        {/* 4. FOOTER SCIENCE METRICS & TRAVEL CALCULATIONS */}
        <div className="px-4 py-3 bg-bg/80 border-t border-line text-xs space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="font-bold text-fg text-xs flex items-center gap-1.5">
                <span>{activeTarget.name}</span>
                <span className="text-[10px] text-muted font-normal">({activeTarget.type})</span>
              </h4>
              <p className="text-[11px] text-muted mt-0.5 max-w-2xl leading-relaxed">
                {activeTarget.description}
              </p>
            </div>

            <div className="text-right shrink-0 font-mono text-[11px]">
              <div className="text-emerald-400 font-bold">WAVEFRONT: 18.2 nm RMS</div>
              <div className="text-muted text-[10px]">MIRROR SEGMENTS: 18/18 PHASED</div>
            </div>
          </div>

          {/* DISTANCE & TRAVEL TIME BREAKDOWN */}
          {activeTarget.catalogId && (() => {
            const m = getFullTravelMetrics(activeTarget.catalogId, Date.now());
            return (
              <div className="pt-2 border-t border-line/60 font-mono text-[11px]">
                <div className="text-[10px] text-flare uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                  <Ruler className="w-3 h-3" />
                  Distance & Travel Time Calculations:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-fg bg-surface/60 border border-line p-2 rounded">
                  <div>
                    <span className="text-muted text-[9px] block">DISTANCES</span>
                    <span className="font-bold text-flare block text-xs">{m.kmFormatted}</span>
                    <span className="text-[9px] text-muted">{m.milesFormatted}</span>
                  </div>
                  <div>
                    <span className="text-muted text-[9px] block">WALKING (5 km/h)</span>
                    <span className="font-bold text-amber-300 block text-xs flex items-center gap-1">
                      <Footprints className="w-3 h-3 text-amber-400" />
                      {m.walkingFormatted}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted text-[9px] block">DRIVING / FLYING</span>
                    <span className="font-bold text-blue-300 block text-xs flex items-center gap-1">
                      <Car className="w-3 h-3 text-blue-400" />
                      Drive: {m.drivingFormatted}
                    </span>
                    <span className="text-[9px] text-emerald-300 flex items-center gap-1 mt-0.5">
                      <Plane className="w-2.5 h-2.5 text-emerald-400" />
                      Fly: {m.flyingFormatted}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted text-[9px] block">SOUND TRAVEL (343 m/s)</span>
                    <span className="font-bold text-purple-300 block text-xs flex items-center gap-1">
                      <Volume2 className="w-3 h-3 text-purple-400" />
                      {m.soundFormatted}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
