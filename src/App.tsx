/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { 
  Telescope, Sparkles, Compass, Flame, TrendingUp, Sliders, 
  Orbit, Database, Users, Volume2, VolumeX, Download, Radio, 
  Activity, ShieldCheck, Zap
} from 'lucide-react';
import { FlightEngine } from './components/FlightEngine';
import { SolarMHDEngine } from './components/SolarMHDEngine';
import { TransitLightCurve } from './components/TransitLightCurve';
import { SpectroscopyAnalyzer } from './components/SpectroscopyAnalyzer';
import { GravitationalLensing } from './components/GravitationalLensing';
import { FITSExporter } from './components/FITSExporter';
import { MultiplayerCollab } from './components/MultiplayerCollab';
import { PWAInstallButton } from './components/pwa/PWAInstallButton';
import { AIAstrophotographer } from './components/AIAstrophotographer';
import { spaceSoundscape } from './components/SoundscapeEngine';
import { JWSTTelemetry, ModuleMode } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<ModuleMode>('flight');
  const [isAudioActive, setIsAudioActive] = useState<boolean>(false);
  const [isAiOpen, setIsAiOpen] = useState<boolean>(false);

  const [telemetry, setTelemetry] = useState<JWSTTelemetry>({
    l2DistanceKm: 1500000,
    sunshieldHotTempK: 358,
    sunshieldColdTempK: 37,
    miriCryoTempK: 6.7,
    mirrorRmsErrorNm: 18.2,
    downlinkRateMbps: 28.0,
    powerOutputWatts: 2000,
    pointingErrorArcsec: 0.001,
    yawDeg: 45,
    pitchDeg: 15,
    rollDeg: 0,
    zoom: 1.2,
    currentStation: 'L2 Lagrange Point',
    activeTarget: {
      id: 'sun',
      name: 'The Sun & Solar Corona',
      category: 'Solar System',
      ra: '00h 00m 00s',
      dec: '+00° 00′ 00″',
      distanceLy: '0.000015 ly (1 AU)',
      instrument: 'NIRCam',
      description: 'Magnetohydrodynamic plasma coronal loops and X-class flare shockwaves.',
      thumbnailColor: '#f59e0b',
      coordinates: { x: -380, y: -40, z: -250 },
    },
  });

  const handleToggleSoundscape = () => {
    const active = spaceSoundscape.toggle();
    setIsAudioActive(active);
  };

  const handleUpdateTelemetry = (updates: Partial<JWSTTelemetry>) => {
    setTelemetry(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* HEADER BAR */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-xl sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-amber-500 via-orange-500 to-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-amber-500/20">
            <Telescope className="w-5 h-5 text-slate-950 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-extrabold text-base tracking-wider bg-gradient-to-r from-amber-400 via-orange-300 to-indigo-300 bg-clip-text text-transparent font-mono">
                AETHER OS: JWST
              </h1>
              <span className="text-[10px] bg-amber-950/80 text-amber-400 px-2 py-0.5 rounded-full border border-amber-800 font-mono font-semibold">
                v5.2 Research PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">NASA James Webb Space Telescope Telemetry & Simulation Platform</p>
          </div>
        </div>

        {/* NAVIGATION TAB STRIP */}
        <nav className="hidden xl:flex items-center space-x-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          {[
            { id: 'flight', label: '360° Flight', icon: Compass },
            { id: 'mhd', label: 'Solar MHD Flares', icon: Flame },
            { id: 'transit', label: 'Exoplanet Transit', icon: TrendingUp },
            { id: 'spectroscopy', label: 'Spectroscopy & CO₂', icon: Sliders },
            { id: 'lensing', label: 'Gravitational Lensing', icon: Orbit },
            { id: 'fits', label: 'FITS Exporter', icon: Database },
            { id: 'collaboration', label: 'Team Collab', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ModuleMode)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 shadow-lg font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* ACTION TOOLS */}
        <div className="flex items-center space-x-3">
          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Soundscape Drone Button */}
          <button
            onClick={handleToggleSoundscape}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border transition cursor-pointer ${
              isAudioActive
                ? 'bg-indigo-950/80 border-indigo-600 text-indigo-300 shadow-lg shadow-indigo-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Web Audio Space Drone Soundscape"
          >
            {isAudioActive ? <Volume2 className="w-4 h-4 text-indigo-400 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">Space Soundscape</span>
          </button>

          {/* AI Assistant Toggle */}
          <button
            onClick={() => setIsAiOpen(prev => !prev)}
            className="bg-cyan-950/80 border border-cyan-800/80 hover:border-cyan-500 text-cyan-300 px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-lg cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '10s' }} />
            <span className="hidden sm:inline">AI Assistant</span>
          </button>
        </div>
      </header>

      {/* MOBILE NAV BAR */}
      <div className="xl:hidden flex items-center justify-around bg-slate-900 border-b border-slate-800 p-2 overflow-x-auto">
        {[
          { id: 'flight', label: '360° Flight' },
          { id: 'mhd', label: 'Solar MHD' },
          { id: 'transit', label: 'Transit' },
          { id: 'spectroscopy', label: 'Spectroscopy' },
          { id: 'lensing', label: 'Lensing' },
          { id: 'fits', label: 'FITS' },
          { id: 'collaboration', label: 'Collab' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ModuleMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === tab.id ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* LIVE TELEMETRY TICKER */}
      <div className="bg-slate-950 border-b border-slate-900 px-6 py-2 overflow-x-auto flex items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center space-x-6 min-w-max">
          <span className="flex items-center space-x-1.5">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="text-slate-300">Station:</span>
            <span className="text-amber-400 font-bold">{telemetry.currentStation}</span>
          </span>
          <span>L2 Dist: <strong className="text-slate-200">1,500,000 km</strong></span>
          <span>Sunshield Hot: <strong className="text-rose-400">358 K (+85°C)</strong></span>
          <span>Sunshield Cold: <strong className="text-cyan-400">37 K (-233°C)</strong></span>
          <span>MIRI Cryo: <strong className="text-indigo-400">6.7 K (-266.5°C)</strong></span>
          <span>Mirror RMS: <strong className="text-emerald-400">18.2 nm</strong></span>
          <span>Ka-Band Downlink: <strong className="text-amber-400">28.0 Mbps</strong></span>
        </div>
        <div className="hidden md:flex items-center space-x-2 text-emerald-400 text-[10px] uppercase font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Telemetry Stream Online</span>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full relative">
        {activeTab === 'flight' && (
          <FlightEngine telemetry={telemetry} onUpdateTelemetry={handleUpdateTelemetry} />
        )}
        {activeTab === 'mhd' && <SolarMHDEngine />}
        {activeTab === 'transit' && <TransitLightCurve />}
        {activeTab === 'spectroscopy' && <SpectroscopyAnalyzer />}
        {activeTab === 'lensing' && <GravitationalLensing />}
        {activeTab === 'fits' && <FITSExporter />}
        {activeTab === 'collaboration' && <MultiplayerCollab />}
      </main>

      {/* AI ASSISTANT DRAWER */}
      <AIAstrophotographer isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        AetherOS: JWST Research-Grade Progressive Web App • NASA James Webb Space Telescope Telemetry & Simulation Engine
      </footer>

      {/* VERCEL WEB ANALYTICS */}
      <Analytics />
    </div>
  );
}
