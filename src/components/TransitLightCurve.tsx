import React, { useRef, useEffect, useState } from 'react';
import { Orbit, Activity, TrendingUp, Sliders, CheckCircle, Database } from 'lucide-react';
import { TransitSimConfig } from '../types';

export const TransitLightCurve: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const graphCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [config, setConfig] = useState<TransitSimConfig>({
    planetRadiusJup: 1.2,
    starRadiusSun: 1.0,
    orbitalPeriodDays: 3.4,
    orbitalInclinationDeg: 89.2,
    limbDarkeningU1: 0.45,
    limbDarkeningU2: 0.15,
    noiseLevelPercent: 0.05,
    isAtmospherePresent: true,
    detectedMolecules: ['CO₂ (4.3µm)', 'H₂O (1.4µm)', 'CH₄ (2.3µm)'],
  });

  const [transitDepthPercent, setTransitDepthPercent] = useState<number>(1.44);

  useEffect(() => {
    // Transit Depth = (R_p / R_star)^2 * 100%
    // R_jup ~ 0.1004 R_sun
    const rpInRsun = config.planetRadiusJup * 0.1004;
    const depth = Math.pow(rpInRsun / config.starRadiusSun, 2) * 100;
    setTransitDepthPercent(depth);
  }, [config.planetRadiusJup, config.starRadiusSun]);

  // Render Exoplanet Transit Visualizer Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const render = () => {
      time += 0.015;
      const width = (canvas.width = canvas.parentElement?.clientWidth || 600);
      const height = (canvas.height = canvas.parentElement?.clientHeight || 300);
      const cx = width / 2;
      const cy = height / 2;

      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      // Star Limb Darkened Photosphere
      const starRadiusPx = 90 * config.starRadiusSun;
      const starGrad = ctx.createRadialGradient(cx, cy, starRadiusPx * 0.1, cx, cy, starRadiusPx);
      starGrad.addColorStop(0, '#ffffff');
      starGrad.addColorStop(0.6, '#fef08a');
      starGrad.addColorStop(0.9, '#f59e0b');
      starGrad.addColorStop(1, '#78350f');

      ctx.fillStyle = starGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, starRadiusPx, 0, Math.PI * 2);
      ctx.fill();

      // Planet Orbit Motion
      const planetX = cx + Math.sin(time * 0.8) * (starRadiusPx * 1.6);
      const planetY = cy + Math.cos(time * 0.8) * 12;
      const planetRadiusPx = 90 * (config.planetRadiusJup * 0.1004);

      // Render Planet (Occultation)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(planetX, planetY, planetRadiusPx, 0, Math.PI * 2);
      ctx.fill();

      // Planet Atmosphere Shell
      if (config.isAtmospherePresent) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(planetX, planetY, planetRadiusPx + 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('HOST STAR (WASP-96)', cx - 60, cy - starRadiusPx - 15);

      if (Math.abs(planetX - cx) < starRadiusPx + planetRadiusPx) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('ACTIVE TRANSIT OCCULTATION', cx - 80, cy + starRadiusPx + 25);
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [config]);

  // Render Flux Dip Curve ($F/F_0$) Graph
  useEffect(() => {
    const canvas = graphCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    const height = (canvas.height = canvas.parentElement?.clientHeight || 240);

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let y = 30; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw Light Curve Flux F/F0
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    const dipDepthPx = (transitDepthPercent / 2.5) * 80;

    for (let x = 0; x < width; x += 2) {
      const t = (x / width - 0.5) * 4; // -2 to +2 hours
      let flux = 1.0;
      if (Math.abs(t) < 1.0) {
        const shape = Math.cos((t * Math.PI) / 2);
        flux = 1.0 - (transitDepthPercent / 100) * Math.pow(shape, 0.5);
      }
      const noise = (Math.random() - 0.5) * (config.noiseLevelPercent * 0.02);
      const py = 40 + (1.0 - (flux + noise)) * 3500;

      if (x === 0) ctx.moveTo(x, py);
      else ctx.lineTo(x, py);
    }
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('TRANSIT LIGHT CURVE FLUX (F / F₀)', 20, 24);
    ctx.fillStyle = '#64748b';
    ctx.fillText(`Max Dip: -${transitDepthPercent.toFixed(3)}%`, width - 150, 24);
  }, [config, transitDepthPercent]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-300 bg-clip-text text-transparent flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-emerald-400 animate-pulse" />
            <span>Exoplanet Transit Light Curve Inversion</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Model planetary radius ($R_J$) occultations and derive atmospheric transmission spectra ($CO_2$, $H_2O$) from flux attenuation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
          <h3 className="font-bold text-slate-200 text-md flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Planetary & Stellar Parameters</span>
          </h3>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1">
              <span>Planetary Radius ($R_J$)</span>
              <span className="text-emerald-400 font-bold">{config.planetRadiusJup.toFixed(2)} R_J</span>
            </div>
            <input
              type="range" min="0.4" max="2.2" step="0.05"
              value={config.planetRadiusJup}
              onChange={(e) => setConfig(prev => ({ ...prev, planetRadiusJup: Number(e.target.value) }))}
              className="w-full accent-emerald-500 bg-slate-950"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1">
              <span>Host Star Radius ($R_\odot$)</span>
              <span className="text-amber-400 font-bold">{config.starRadiusSun.toFixed(2)} $R_\odot$</span>
            </div>
            <input
              type="range" min="0.6" max="1.8" step="0.05"
              value={config.starRadiusSun}
              onChange={(e) => setConfig(prev => ({ ...prev, starRadiusSun: Number(e.target.value) }))}
              className="w-full accent-amber-500 bg-slate-950"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1">
              <span>NIRCam Observation Noise</span>
              <span className="text-slate-300">{(config.noiseLevelPercent * 100).toFixed(1)}%</span>
            </div>
            <input
              type="range" min="0.01" max="0.3" step="0.01"
              value={config.noiseLevelPercent}
              onChange={(e) => setConfig(prev => ({ ...prev, noiseLevelPercent: Number(e.target.value) }))}
              className="w-full accent-slate-400 bg-slate-950"
            />
          </div>

          <div className="bg-slate-950 border border-emerald-900/50 p-4 rounded-2xl space-y-3 font-mono text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Transit Depth Dip ($\delta$):</span>
              <span className="text-emerald-400 font-bold">-{transitDepthPercent.toFixed(3)}%</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Detected Atmosphere:</span>
              <span className="text-cyan-400 font-bold">{config.isAtmospherePresent ? 'YES (CO₂ Detected)' : 'NO'}</span>
            </div>
            <div className="pt-2 border-t border-slate-900 space-y-1">
              <span className="text-[11px] text-slate-500 font-sans block font-semibold">Transmission Spectral Features:</span>
              {config.detectedMolecules.map((m, idx) => (
                <div key={idx} className="flex items-center space-x-1.5 text-emerald-400 text-[11px]">
                  <CheckCircle className="w-3 h-3" />
                  <span>{m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Visualizers Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative h-[280px]">
            <canvas ref={canvasRef} className="w-full h-full" />
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative h-[240px]">
            <canvas ref={graphCanvasRef} className="w-full h-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
