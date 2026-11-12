import React, { useState } from 'react';
import {
  X,
  Navigation,
  Compass,
  FileText,
  Globe,
  Flame,
  Footprints,
  Car,
  Plane,
  Volume2,
  Ruler,
  Clock,
  Sparkles,
  Info,
  Cpu,
} from 'lucide-react';
import { CelestialSpec, CATEGORY_BADGES } from '../data/celestialCatalog';
import { getFullTravelMetrics } from '../utils/distanceCalculator';

interface ObjectDrawerProps {
  object: CelestialSpec;
  currentTimeMs: number;
  isFollowing: boolean;
  onToggleFollow: () => void;
  onOpenTool: (tool: 'flare' | 'transit' | 'spectra' | 'lens' | 'fits') => void;
  onOpenViewfinder?: () => void;
  onOpenJWSTControl?: () => void;
  onClose: () => void;
}

export const ObjectDrawer: React.FC<ObjectDrawerProps> = ({
  object,
  currentTimeMs,
  isFollowing,
  onToggleFollow,
  onOpenTool,
  onOpenViewfinder,
  onOpenJWSTControl,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'distances' | 'travel'>('distances');

  const badgeLabel = CATEGORY_BADGES[object.category] || object.category.toUpperCase();
  const metrics = getFullTravelMetrics(object.id, currentTimeMs);

  return (
    <aside className="pointer-events-auto w-full max-w-lg self-end sm:self-center border border-line bg-surface/95 p-4 backdrop-blur-md shadow-2xl rounded-lg max-h-[85vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-line pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] tracking-widest text-flare font-bold uppercase block bg-flare/10 px-2 py-0.5 rounded border border-flare/30">
              {badgeLabel}
            </span>
            {metrics.isRealtimeDynamic && (
              <span className="font-mono text-[9px] tracking-wider text-signal font-medium uppercase flex items-center gap-1 bg-signal/10 px-1.5 py-0.5 rounded border border-signal/20">
                <span className="w-1.5 h-1.5 rounded-full bg-signal animate-ping" />
                Live Orbit Ephemeris
              </span>
            )}
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-fg mt-1">{object.name}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-9 px-2 text-sm text-muted hover:text-fg hover:bg-raised transition-colors rounded"
          aria-label="Close drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Description */}
      <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-muted">{object.blurb}</p>

      {/* Reference Frame Notice */}
      <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-muted bg-bg/60 px-2.5 py-1 rounded border border-line/60">
        <span className="flex items-center gap-1 text-fg/80">
          <Info className="w-3 h-3 text-signal" />
          {metrics.referenceFrame}
        </span>
        <span className="text-[10px] text-muted">{new Date(currentTimeMs).toISOString().slice(0, 19).replace('T', ' ')} UTC</span>
      </div>

      {/* Metric Tabs */}
      <div className="mt-3 bg-bg/80 border border-line p-1 rounded-lg">
        <div className="grid grid-cols-2 gap-1 mb-2">
          <button
            type="button"
            onClick={() => setActiveTab('distances')}
            className={`py-1.5 text-xs font-mono font-semibold rounded flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'distances'
                ? 'bg-raised text-fg border border-line shadow-sm'
                : 'text-muted hover:text-fg'
            }`}
          >
            <Ruler className="w-3.5 h-3.5 text-flare" />
            Distances
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('travel')}
            className={`py-1.5 text-xs font-mono font-semibold rounded flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'travel'
                ? 'bg-raised text-fg border border-line shadow-sm'
                : 'text-muted hover:text-fg'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-signal" />
            Travel Times
          </button>
        </div>

        {/* Tab 1: Distances in km, miles, light years, sound */}
        {activeTab === 'distances' && (
          <div className="grid grid-cols-2 gap-2 p-1 font-mono text-xs">
            <div className="bg-surface/80 border border-line/80 p-2 rounded flex flex-col justify-between">
              <span className="text-[10px] text-muted uppercase font-semibold flex items-center gap-1">
                Kilometers
              </span>
              <span className="text-sm font-bold text-fg mt-1">{metrics.kmFormatted}</span>
              <span className="text-[9px] text-muted/70 mt-0.5">SI Base Metric</span>
            </div>

            <div className="bg-surface/80 border border-line/80 p-2 rounded flex flex-col justify-between">
              <span className="text-[10px] text-muted uppercase font-semibold flex items-center gap-1">
                Miles
              </span>
              <span className="text-sm font-bold text-fg mt-1">{metrics.milesFormatted}</span>
              <span className="text-[9px] text-muted/70 mt-0.5">Imperial Scale</span>
            </div>

            <div className="bg-surface/80 border border-line/80 p-2 rounded flex flex-col justify-between">
              <span className="text-[10px] text-muted uppercase font-semibold flex items-center gap-1">
                Light Travel
              </span>
              <span className="text-sm font-bold text-flare mt-1">{metrics.lightYearsFormatted}</span>
              <span className="text-[10px] text-signal font-semibold mt-0.5">{metrics.lightTimeFormatted}</span>
            </div>

            <div className="bg-surface/80 border border-line/80 p-2 rounded flex flex-col justify-between">
              <span className="text-[10px] text-muted uppercase font-semibold flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-signal" />
                Sound Travel
              </span>
              <span className="text-sm font-bold text-signal mt-1">{metrics.soundFormatted}</span>
              <span className="text-[9px] text-muted/70 mt-0.5">At 343 m/s (1,235 km/h)</span>
            </div>
          </div>
        )}

        {/* Tab 2: Travel Times by walking, driving, flying, sound */}
        {activeTab === 'travel' && (
          <div className="space-y-2 p-1 font-mono text-xs">
            <div className="text-[10px] text-muted uppercase font-semibold tracking-wider px-1">
              Estimated Duration to Destination:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Walking */}
              <div className="bg-surface/80 border border-line/80 p-2 rounded flex items-center gap-2.5">
                <div className="p-2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                  <Footprints className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-muted uppercase font-semibold">
                    Walking (5 km/h)
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-fg mt-0.5">{metrics.walkingFormatted}</div>
                </div>
              </div>

              {/* Driving */}
              <div className="bg-surface/80 border border-line/80 p-2 rounded flex items-center gap-2.5">
                <div className="p-2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-muted uppercase font-semibold">
                    Driving (100 km/h)
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-fg mt-0.5">{metrics.drivingFormatted}</div>
                </div>
              </div>

              {/* Flying */}
              <div className="bg-surface/80 border border-line/80 p-2 rounded flex items-center gap-2.5">
                <div className="p-2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  <Plane className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-muted uppercase font-semibold">
                    Flying (900 km/h)
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-fg mt-0.5">{metrics.flyingFormatted}</div>
                </div>
              </div>

              {/* Sound */}
              <div className="bg-surface/80 border border-line/80 p-2 rounded flex items-center gap-2.5">
                <div className="p-2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-muted uppercase font-semibold">
                    Sound Speed (343 m/s)
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-purple-300 mt-0.5">{metrics.soundFormatted}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-3.5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onToggleFollow}
          className={`min-h-10 px-4 text-xs font-mono font-semibold rounded transition-colors flex items-center gap-1.5 ${
            isFollowing
              ? 'bg-signal text-signal-ink font-bold shadow-md'
              : 'bg-fg text-bg hover:bg-fg/90'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          {isFollowing ? 'Following trajectory' : 'Fly to object'}
        </button>

        {object.id === 'sun' && (
          <button
            type="button"
            onClick={() => onOpenTool('flare')}
            className="min-h-10 border border-flare/60 bg-flare/20 hover:bg-flare/30 text-flare font-bold px-3.5 text-xs font-mono rounded transition-colors flex items-center gap-1.5"
          >
            <Flame className="w-3.5 h-3.5 animate-pulse" />
            Simulate Solar Flare CME Burst
          </button>
        )}

        {object.id === 'earth' && (
          <a
            href="https://earth.google.com/web/@20.0,0.0,20000000a,35d,0y,0h,0t,0r"
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-10 border border-signal/60 bg-signal/10 hover:bg-signal/20 text-signal font-bold px-3.5 text-xs font-mono rounded transition-colors flex items-center gap-1.5"
          >
            <Globe className="w-3.5 h-3.5" />
            Explore in Google Earth 3D
          </a>
        )}

        {object.id === 'jwst' && (
          <div className="w-full space-y-2.5">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/40 text-xs space-y-1">
              <span className="font-bold text-amber-300 block uppercase text-[11px]">
                🔭 Sun-Earth L2 Lagrange Observatory
              </span>
              <div className="text-[11px] text-muted space-y-0.5">
                <div className="flex justify-between"><span>Location:</span><span className="text-fg font-bold">1.51M km from Earth</span></div>
                <div className="flex justify-between"><span>Telemetry Link:</span><span className="text-signal font-bold">Ka-Band 28.0 Mbps</span></div>
                <div className="flex justify-between"><span>Primary Mirror:</span><span className="text-cyan-300 font-bold">40.1 K (-233°C)</span></div>
                <div className="flex justify-between"><span>MIRI Cryocooler:</span><span className="text-purple-300 font-bold">6.7 K</span></div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 w-full">
              {onOpenJWSTControl && (
                <button
                  type="button"
                  onClick={onOpenJWSTControl}
                  className="min-h-10 w-full border border-amber-500/60 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold px-3.5 text-xs font-mono rounded transition-colors flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                >
                  <Cpu className="w-4 h-4 text-amber-400" />
                  JWST Mission Control
                </button>
              )}
              {onOpenViewfinder && (
                <button
                  type="button"
                  onClick={onOpenViewfinder}
                  className="min-h-10 w-full border border-flare/60 bg-flare/10 hover:bg-flare/20 text-flare font-bold px-3.5 text-xs font-mono rounded transition-colors flex items-center justify-center gap-2"
                >
                  <Compass className="w-3.5 h-3.5" />
                  Live Optics Viewfinder
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenTool('fits')}
                className="min-h-10 w-full border border-line bg-surface hover:bg-raised text-fg px-3.5 text-xs font-mono rounded transition-colors flex items-center justify-center gap-2"
              >
                <FileText className="w-3.5 h-3.5 text-signal" />
                FITS Science Export
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
