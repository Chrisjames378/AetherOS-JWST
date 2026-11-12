import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Search, Orbit, Compass, Clock, Minimize2, Maximize2, ChevronUp } from 'lucide-react';
import { CelestialSpec, CELESTIAL_OBJECTS, CelestialCategory, CATEGORY_LIST } from '../data/celestialCatalog';

interface FooterControlsProps {
  isPaused: boolean;
  onTogglePlay: () => void;
  onResetNow: () => void;
  currentTimeMs: number;
  timeSpeed: number;
  onCycleSpeed: () => void;
  showOrbits: boolean;
  onToggleOrbits: () => void;
  dateMin: number;
  dateMax: number;
  onDateChange: (newDateMs: number) => void;
  onJumpDate: (targetMs: number, targetSkyId?: string) => void;
  onSelectObject: (id: string) => void;
  activeCategories: Record<CelestialCategory, boolean>;
  onToggleCategory: (cat: CelestialCategory) => void;
  onOpenAetherosPortal?: () => void;
}

const SPEED_OPTIONS = [1, 60, 3600, 86400];
const APOPHIS_2029_MS = Date.parse('2029-04-13T21:46:00Z');
const HALLEY_2061_MS = Date.parse('2061-07-28T17:00:00Z');

export const FooterControls: React.FC<FooterControlsProps> = ({
  isPaused,
  onTogglePlay,
  onResetNow,
  currentTimeMs,
  timeSpeed,
  onCycleSpeed,
  showOrbits,
  onToggleOrbits,
  dateMin,
  dateMax,
  onDateChange,
  onJumpDate,
  onSelectObject,
  activeCategories,
  onToggleCategory,
  onOpenAetherosPortal,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const formattedUtc = new Date(currentTimeMs).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  const isLive = !isPaused && timeSpeed === 1 && Math.abs(currentTimeMs - Date.now()) < 5000;

  const filteredObjects = searchQuery.trim()
    ? CELESTIAL_OBJECTS.filter((o) =>
        o.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : [];

  const formatSpeed = (s: number) => {
    if (s === 1) return '1× (realtime)';
    if (s === 60) return '60× (1m/s)';
    if (s === 3600) return '3600× (1h/s)';
    if (s === 86400) return '86400× (1d/s)';
    return `${s}×`;
  };

  if (isMinimized) {
    return (
      <footer className="pointer-events-auto mx-auto mb-3 w-[min(100%-1.5rem,28rem)] border border-line bg-surface/90 backdrop-blur-md shadow-2xl rounded-full p-1.5 flex items-center justify-between gap-2 font-mono text-xs text-fg">
        <button
          type="button"
          onClick={onTogglePlay}
          className="min-h-8 px-2.5 bg-raised hover:bg-raised/80 rounded-full font-semibold flex items-center gap-1 shrink-0"
        >
          {isPaused ? <Play className="w-3 h-3 text-signal" /> : <Pause className="w-3 h-3 text-flare" />}
          <span>{isPaused ? 'PLAY' : 'PAUSE'}</span>
        </button>

        <div className="truncate text-muted text-[11px] text-center flex-1 font-mono">
          {isLive ? (
            <span className="text-signal flex items-center justify-center gap-1 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse" />
              LIVE · {formattedUtc}
            </span>
          ) : (
            <span>{formattedUtc}</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="min-h-8 px-2.5 bg-flare/20 text-flare border border-flare/40 hover:bg-flare/30 rounded-full font-bold flex items-center gap-1 shrink-0 transition-colors"
          title="Expand Controls & Date Search"
        >
          <ChevronUp className="w-3.5 h-3.5" />
          <span>Expand</span>
        </button>
      </footer>
    );
  }

  return (
    <footer className="pointer-events-auto mx-auto mb-3 w-[min(100%-1.5rem,38rem)] border border-line bg-surface/95 backdrop-blur-md shadow-2xl rounded overflow-hidden">
      {/* 1. TIME CONTROL STRIP */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-bg/50">
        <button
          type="button"
          onClick={onTogglePlay}
          className="min-h-9 px-3 text-xs font-mono font-semibold bg-raised hover:bg-raised/80 text-fg rounded transition-colors flex items-center gap-1.5"
          aria-label={isPaused ? 'Play time' : 'Pause time'}
        >
          {isPaused ? <Play className="w-3.5 h-3.5 text-signal" /> : <Pause className="w-3.5 h-3.5 text-flare" />}
          {isPaused ? 'Play' : 'Pause'}
        </button>

        <button
          type="button"
          onClick={onResetNow}
          className="min-h-9 px-2.5 text-xs font-mono border border-line bg-surface hover:bg-raised text-fg rounded transition-colors flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3 text-muted" />
          Now
        </button>

        <div className="min-w-0 flex-1 truncate font-mono text-xs text-muted text-center px-2">
          {isLive ? (
            <span className="text-signal flex items-center justify-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse" />
              Live · {formattedUtc}
            </span>
          ) : (
            <span>{formattedUtc}</span>
          )}
        </div>

        <button
          type="button"
          onClick={onCycleSpeed}
          className="min-h-9 px-2.5 font-mono text-xs border border-line bg-surface hover:bg-raised text-fg rounded transition-colors"
        >
          {formatSpeed(timeSpeed)}
        </button>

        <button
          type="button"
          onClick={onToggleOrbits}
          className={`min-h-9 px-2.5 font-mono text-xs rounded transition-colors flex items-center gap-1 ${
            showOrbits ? 'bg-signal/20 text-signal border border-signal/40' : 'border border-line bg-surface text-muted'
          }`}
        >
          <Orbit className="w-3 h-3" />
          Orbits {showOrbits ? 'on' : 'off'}
        </button>

        {/* MINIMIZE BUTTON */}
        <button
          type="button"
          onClick={() => setIsMinimized(true)}
          className="min-h-9 px-2 border border-line bg-surface hover:bg-raised text-muted hover:text-fg rounded transition-colors"
          title="Minimize Controls & Search"
        >
          <Minimize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. SKY DATE TIMELINE SLIDER */}
      <div className="border-t border-line px-3.5 py-2.5 bg-bg/20 space-y-2">
        <input
          type="range"
          min={Math.min(dateMin, currentTimeMs)}
          max={Math.max(dateMax, currentTimeMs)}
          value={currentTimeMs}
          onChange={(e) => onDateChange(Number(e.target.value))}
          aria-label="Sky date timeline"
          className="w-full h-2 bg-raised rounded appearance-none cursor-pointer accent-flare"
        />

        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={() => onJumpDate(APOPHIS_2029_MS, 'apophis')}
              className="min-h-7 px-2.5 text-[11px] font-mono border border-line bg-surface hover:bg-raised text-fg rounded transition-colors whitespace-nowrap"
            >
              Apophis 2029
            </button>
            <button
              type="button"
              onClick={() => onJumpDate(HALLEY_2061_MS, 'halley')}
              className="min-h-7 px-2.5 text-[11px] font-mono border border-line bg-surface hover:bg-raised text-fg rounded transition-colors whitespace-nowrap"
            >
              Halley 2061
            </button>
            {onOpenAetherosPortal && (
              <button
                type="button"
                onClick={onOpenAetherosPortal}
                className="min-h-7 px-2.5 text-[11px] font-mono border border-flare/40 bg-flare/10 hover:bg-flare/20 text-flare font-bold rounded transition-colors whitespace-nowrap"
              >
                ✨ AETHEROS Hub
              </button>
            )}
          </div>
          <span className="text-[10px] text-muted truncate text-right">
            VSOP87 analytical ephemeris & Kepler states
          </span>
        </div>
      </div>

      {/* 3. SEARCH BAR */}
      <div className="relative border-t border-line">
        <div className="flex items-center px-3">
          <Search className="w-3.5 h-3.5 text-muted shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => setShowSearchDropdown(true)}
            placeholder="Search comets, galaxies, probes, planets…"
            className="min-h-10 w-full bg-transparent px-2.5 text-xs text-fg outline-none font-mono"
            aria-label="Search celestial sky"
          />
        </div>

        {/* Autocomplete Dropdown */}
        {showSearchDropdown && filteredObjects.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 max-h-48 overflow-y-auto border border-line bg-surface shadow-2xl p-1.5 space-y-1 z-30 rounded-t">
            {filteredObjects.slice(0, 8).map((obj) => (
              <button
                key={obj.id}
                type="button"
                onClick={() => {
                  onSelectObject(obj.id);
                  setSearchQuery('');
                  setShowSearchDropdown(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs rounded hover:bg-raised transition-colors flex items-center justify-between text-fg group"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: obj.color }}
                  />
                  <span className="font-semibold group-hover:text-flare transition-colors">
                    {obj.name}
                  </span>
                  <span className="text-[10px] text-muted font-mono uppercase">
                    ({obj.category})
                  </span>
                </div>
                <span className="text-[10px] font-mono text-muted">{obj.metric}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. MOBILE CATEGORY STRIP */}
      <div className="flex gap-1 overflow-x-auto border-t border-line px-2 py-1 sm:hidden">
        {CATEGORY_LIST.map((cat) => {
          const isActive = activeCategories[cat.id];
          const isDarkMatter = cat.id === 'darkmatter';
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onToggleCategory(cat.id)}
              className={`min-h-7 shrink-0 px-2 text-[10px] font-mono rounded transition-colors whitespace-nowrap ${
                isDarkMatter
                  ? isActive
                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 font-bold'
                    : 'text-cyan-400/80 border border-cyan-500/30'
                  : isActive
                  ? 'bg-raised text-fg font-semibold'
                  : 'text-muted/60 hover:text-muted'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </footer>
  );
};
