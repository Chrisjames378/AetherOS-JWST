/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Radio, Cpu, Bot, Volume2, VolumeX, Camera, Sparkles } from 'lucide-react';
import { CosmicCanvas } from './components/CosmicCanvas';
import { FooterControls } from './components/FooterControls';
import { ObjectDrawer } from './components/ObjectDrawer';
import { DSNPanel } from './components/DSNPanel';
import { OrbitBenchPanel } from './components/OrbitBenchPanel';
import { AnalystPanel } from './components/AnalystPanel';
import { JWSTLiveViewfinder } from './components/JWSTLiveViewfinder';
import { JWSTMissionControl } from './components/JWSTMissionControl';
import { AetherosPortalModal } from './components/AetherosPortalModal';
import { CommercialSuiteModal } from './components/CommercialSuiteModal';
import { ModalWrapper } from './components/tools/ModalWrapper';
import { FlareTool } from './components/tools/FlareTool';
import { TransitTool } from './components/tools/TransitTool';
import { SpectraTool } from './components/tools/SpectraTool';
import { LensTool } from './components/tools/LensTool';
import { FITSTool } from './components/tools/FITSTool';
import { soundscape } from './utils/soundSynthesizer';
import {
  CelestialCategory,
  CATEGORY_LIST,
  CELESTIAL_MAP,
} from './data/celestialCatalog';

export default function App() {
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(Date.now());
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [timeSpeed, setTimeSpeed] = useState<number>(1);
  const [showOrbits, setShowOrbits] = useState<boolean>(true);
  const [frameMs, setFrameMs] = useState<number | null>(null);

  // Active modal views
  const [activeModal, setActiveModal] = useState<
    'dsn' | 'bench' | 'analyst' | 'viewfinder' | 'jwst_control' | 'flare' | 'transit' | 'spectra' | 'lens' | 'fits' | 'aetheros_portal' | 'commercial' | null
  >(null);

  // Audio drone state
  const [isAudioActive, setIsAudioActive] = useState<boolean>(false);

  // Selected object in inspector drawer
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Camera following target
  const [followingId, setFollowingId] = useState<string | null>(null);

  // Active category toggles in 3D scene
  const [activeCategories, setActiveCategories] = useState<Record<CelestialCategory, boolean>>({
    planet: true,
    moon: true,
    asteroid: true,
    comet: true,
    probe: true,
    satellite: true,
    galaxy: true,
    bh: true,
    smbh: true,
    sn: true,
    exoplanet: true,
    constellation: true,
    darkmatter: false,
  });

  const speedOptions = [1, 60, 3600, 86400];
  const dateMin = Date.parse('2026-01-01T00:00:00Z');
  const dateMax = Date.parse('2065-12-31T00:00:00Z');

  // Real-time time progression loop
  const timeRef = useRef<number>(currentTimeMs);
  timeRef.current = currentTimeMs;
  const isPausedRef = useRef<boolean>(isPaused);
  isPausedRef.current = isPaused;
  const speedRef = useRef<number>(timeSpeed);
  speedRef.current = timeSpeed;

  useEffect(() => {
    let animId = 0;
    let lastTick = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - lastTick) / 1000, 0.1);
      lastTick = now;

      if (!isPausedRef.current && speedRef.current > 0) {
        timeRef.current += dt * 1000 * speedRef.current;
        setCurrentTimeMs(timeRef.current);
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleTogglePlay = () => {
    setIsPaused((prev) => !prev);
  };

  const handleResetNow = () => {
    const now = Date.now();
    timeRef.current = now;
    setCurrentTimeMs(now);
    setIsPaused(false);
    setTimeSpeed(1);
  };

  const handleCycleSpeed = () => {
    setTimeSpeed((current) => {
      const nextIdx = (speedOptions.indexOf(current) + 1) % speedOptions.length;
      return speedOptions[nextIdx];
    });
  };

  const handleDateChange = (newMs: number) => {
    timeRef.current = newMs;
    setCurrentTimeMs(newMs);
    setIsPaused(true);
  };

  const handleJumpDate = (targetMs: number, targetSkyId?: string) => {
    timeRef.current = targetMs;
    setCurrentTimeMs(targetMs);
    setIsPaused(true);
    if (targetSkyId) {
      setSelectedId(targetSkyId);
      setFollowingId(targetSkyId);
    }
  };

  const handleSelectObject = (id: string) => {
    setSelectedId(id);
    setFollowingId(id);
  };

  const handleToggleCategory = (cat: CelestialCategory) => {
    setActiveCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  const handleToggleSound = () => {
    const active = soundscape.toggle();
    setIsAudioActive(active);
  };

  const selectedSpec = selectedId ? CELESTIAL_MAP.get(selectedId) ?? null : null;

  return (
    <div className="fixed inset-0 bg-bg text-fg overflow-hidden font-sans select-none">
      {/* 1. THREE.JS 3D COSMIC CANVAS */}
      <CosmicCanvas
        currentTimeMs={currentTimeMs}
        showOrbits={showOrbits}
        activeCategories={activeCategories}
        selectedId={selectedId}
        followingId={followingId}
        onPickObject={(id) => {
          setSelectedId(id);
          setFollowingId(id);
        }}
        onSampleFrameMs={(ms) => setFrameMs(ms)}
      />

      {/* 2. OVERLAY UI LAYER */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
        {/* TOP HEADER */}
        <header className="flex items-start justify-between gap-3 p-3 sm:p-4">
          <div className="pointer-events-auto bg-surface/85 backdrop-blur-md px-3.5 py-2 rounded border border-line">
            <h1 className="font-mono text-xs tracking-widest text-flare font-bold">AETHEROS</h1>
            <p className="text-xs text-muted">Drag to look · scroll to zoom</p>
          </div>

          <div className="pointer-events-auto flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setActiveModal(activeModal === 'commercial' ? null : 'commercial')}
              className={`min-h-10 px-3.5 text-xs font-mono rounded transition-colors flex items-center gap-1.5 shadow-lg ${
                activeModal === 'commercial'
                  ? 'bg-cyan-400 text-black font-bold shadow-[0_0_15px_rgba(34,211,238,0.5)]'
                  : 'border border-cyan-500/50 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20'
              }`}
              title="AetherOS Enterprise & Educational Suite"
            >
              🏛️ Enterprise
            </button>

            <button
              type="button"
              onClick={() => setActiveModal(activeModal === 'aetheros_portal' ? null : 'aetheros_portal')}
              className={`min-h-10 px-3.5 text-xs font-mono rounded transition-colors flex items-center gap-1.5 shadow-lg ${
                activeModal === 'aetheros_portal'
                  ? 'bg-flare text-flare-ink font-bold'
                  : 'border border-flare/50 bg-flare/10 text-flare hover:bg-flare/20'
              }`}
              title="AETHEROS Observatory Suite & Portal"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AETHEROS Hub
            </button>

            <button
              type="button"
              onClick={() => setActiveModal(activeModal === 'jwst_control' ? null : 'jwst_control')}
              className={`min-h-10 px-3.5 text-xs font-mono rounded transition-colors flex items-center gap-1.5 shadow-lg ${
                activeModal === 'jwst_control'
                  ? 'bg-amber-400 text-black font-bold shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                  : 'border border-amber-500/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
              }`}
              title="JWST Mission Control, 18-Hex Mirror Phasing, & Science Target Slew"
            >
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              JWST Control
            </button>

            <button
              type="button"
              onClick={() => setActiveModal(activeModal === 'viewfinder' ? null : 'viewfinder')}
              className={`min-h-10 px-3.5 text-xs font-mono rounded transition-colors flex items-center gap-1.5 shadow-lg ${
                activeModal === 'viewfinder'
                  ? 'bg-flare text-flare-ink font-bold'
                  : 'border border-flare/60 bg-flare/10 text-flare hover:bg-flare/20'
              }`}
            >
              <Camera className="w-3.5 h-3.5 animate-pulse" />
              JWST Optics
            </button>

            <button
              type="button"
              onClick={() => setActiveModal(activeModal === 'dsn' ? null : 'dsn')}
              className={`min-h-10 px-3.5 text-xs font-mono rounded transition-colors flex items-center gap-1.5 shadow-lg ${
                activeModal === 'dsn'
                  ? 'bg-fg text-bg font-bold'
                  : 'border border-line bg-surface/90 text-fg hover:bg-raised'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-signal" />
              DSN
            </button>

            <button
              type="button"
              onClick={() => setActiveModal(activeModal === 'bench' ? null : 'bench')}
              className={`min-h-10 px-3.5 text-xs font-mono rounded transition-colors flex items-center gap-1.5 shadow-lg ${
                activeModal === 'bench'
                  ? 'bg-fg text-bg font-bold'
                  : 'border border-line bg-surface/90 text-fg hover:bg-raised'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-flare" />
              Bench
            </button>

            <button
              type="button"
              onClick={() => setActiveModal(activeModal === 'analyst' ? null : 'analyst')}
              className={`min-h-10 px-3.5 text-xs font-mono rounded transition-colors flex items-center gap-1.5 shadow-lg ${
                activeModal === 'analyst'
                  ? 'bg-fg text-bg font-bold'
                  : 'border border-line bg-surface/90 text-fg hover:bg-raised'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-signal" />
              Analyst
            </button>

            <button
              type="button"
              onClick={handleToggleSound}
              className={`min-h-10 px-3.5 text-xs font-mono rounded transition-colors flex items-center gap-1.5 shadow-lg ${
                isAudioActive
                  ? 'bg-flare text-flare-ink font-bold'
                  : 'border border-line bg-surface/90 text-fg hover:bg-raised'
              }`}
            >
              {isAudioActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              {isAudioActive ? 'Sound on' : 'Sound'}
            </button>
          </div>
        </header>

        {/* MIDDLE SECTION: LEFT CATEGORY PICKER & FLOATING PANELS */}
        <div className="flex min-h-0 flex-1 items-end justify-between gap-3 p-3 sm:items-stretch sm:p-4">
          {/* DESKTOP VERTICAL CATEGORY BAR */}
          <div className="pointer-events-auto hidden max-h-[56vh] flex-col gap-1 self-end overflow-y-auto sm:flex border border-line bg-surface/90 backdrop-blur-md p-1.5 rounded shadow-xl">
            {CATEGORY_LIST.map((cat) => {
              const isActive = activeCategories[cat.id];
              const isDarkMatter = cat.id === 'darkmatter';
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleToggleCategory(cat.id)}
                  className={`min-h-9 px-3 text-left text-xs font-mono rounded transition-colors flex items-center justify-between ${
                    isDarkMatter
                      ? isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold shadow-lg shadow-cyan-500/10'
                        : 'text-cyan-400/80 hover:text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/30'
                      : isActive
                      ? 'bg-raised text-fg font-semibold'
                      : 'text-muted/60 hover:text-muted hover:bg-surface'
                  }`}
                >
                  <span>{cat.label}</span>
                  {isDarkMatter && isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping ml-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* DSN PANEL */}
          {activeModal === 'dsn' && (
            <DSNPanel
              onClose={() => setActiveModal(null)}
              onFly={(skyId) => {
                handleSelectObject(skyId);
                setActiveModal(null);
              }}
              onOpenViewfinder={() => setActiveModal('viewfinder')}
            />
          )}

          {/* ORBIT BENCH PANEL */}
          {activeModal === 'bench' && (
            <OrbitBenchPanel
              onClose={() => setActiveModal(null)}
              frameMs={frameMs}
            />
          )}

          {/* ANALYST PANEL */}
          {activeModal === 'analyst' && (
            <AnalystPanel
              onClose={() => setActiveModal(null)}
            />
          )}

          {/* CELESTIAL OBJECT INSPECTOR DRAWER */}
          {selectedSpec && !activeModal && (
            <ObjectDrawer
              object={selectedSpec}
              currentTimeMs={currentTimeMs}
              isFollowing={followingId === selectedSpec.id}
              onToggleFollow={() =>
                setFollowingId(followingId === selectedSpec.id ? null : selectedSpec.id)
              }
              onOpenTool={(tool) => setActiveModal(tool)}
              onOpenViewfinder={() => setActiveModal('viewfinder')}
              onOpenJWSTControl={() => setActiveModal('jwst_control')}
              onClose={() => {
                setSelectedId(null);
                setFollowingId(null);
              }}
            />
          )}
        </div>

        {/* BOTTOM FOOTER CONTROLS */}
        <FooterControls
          isPaused={isPaused}
          onTogglePlay={handleTogglePlay}
          onResetNow={handleResetNow}
          currentTimeMs={currentTimeMs}
          timeSpeed={timeSpeed}
          onCycleSpeed={handleCycleSpeed}
          showOrbits={showOrbits}
          onToggleOrbits={() => setShowOrbits((prev) => !prev)}
          dateMin={dateMin}
          dateMax={dateMax}
          onDateChange={handleDateChange}
          onJumpDate={handleJumpDate}
          onSelectObject={handleSelectObject}
          activeCategories={activeCategories}
          onToggleCategory={handleToggleCategory}
          onOpenAetherosPortal={() => setActiveModal('aetheros_portal')}
        />
      </div>

      {/* 3. MODAL RESEARCH TOOL DIALOGS & AETHEROS */}
      {activeModal === 'aetheros_portal' && (
        <AetherosPortalModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          onOpenBench={() => setActiveModal('bench')}
          onOpenViewfinder={() => setActiveModal('viewfinder')}
        />
      )}

      {activeModal === 'viewfinder' && (
        <JWSTLiveViewfinder
          onClose={() => setActiveModal(null)}
          onFlyToTarget={(skyId) => {
            handleSelectObject(skyId);
            setActiveModal(null);
          }}
        />
      )}

      {activeModal === 'jwst_control' && (
        <JWSTMissionControl
          onClose={() => setActiveModal(null)}
          onFlyToJWST={() => {
            handleSelectObject('jwst');
            setActiveModal(null);
          }}
          onSlewToTarget={(targetId) => {
            handleSelectObject(targetId);
          }}
          onOpenViewfinder={() => setActiveModal('viewfinder')}
          onOpenFits={() => setActiveModal('fits')}
        />
      )}

      {activeModal === 'flare' && (
        <ModalWrapper title="Solar MHD Flare Engine" onClose={() => setActiveModal(null)}>
          <FlareTool />
        </ModalWrapper>
      )}

      {activeModal === 'transit' && (
        <ModalWrapper title="Exoplanet Transit Light Curve" onClose={() => setActiveModal(null)}>
          <TransitTool />
        </ModalWrapper>
      )}

      {activeModal === 'spectra' && (
        <ModalWrapper title="Multi-band Spectroscopy" onClose={() => setActiveModal(null)}>
          <SpectraTool />
        </ModalWrapper>
      )}

      {activeModal === 'lens' && (
        <ModalWrapper title="Gravitational Lens & Einstein Ring" onClose={() => setActiveModal(null)}>
          <LensTool />
        </ModalWrapper>
      )}

      {activeModal === 'fits' && (
        <ModalWrapper title="FITS Science Data Exporter" onClose={() => setActiveModal(null)}>
          <FITSTool />
        </ModalWrapper>
      )}

      {activeModal === 'commercial' && (
        <CommercialSuiteModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          onEnableKioskMode={() => {
            setActiveModal(null);
            // Hide orbits, focus Sun/JWST for continuous display
            setShowOrbits(false);
          }}
          onEnableLabMode={() => {
            setActiveModal(null);
            setActiveModal('transit');
          }}
        />
      )}
    </div>
  );
}
