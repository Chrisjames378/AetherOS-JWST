import React, { useRef, useEffect, useState } from 'react';
import { Orbit, Activity, Sliders, Shield, Zap } from 'lucide-react';
import { GravitationalLensingConfig } from '../types';

export const GravitationalLensing: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [config, setConfig] = useState<GravitationalLensingConfig>({
    blackHoleMassSolar: 6.5e9, // M87* mass
    impactParameterKpc: 12.5,
    clusterRedshift: 0.54,
    deflectionAngleArcsec: 48.2,
    einsteinRadiusArcsec: 42.0,
    showRayPaths: true,
    showPhotonRing: true,
    backgroundGalaxyShape: 'spiral',
  });

  useEffect(() => {
    // Einstein Radius theta_E ~ sqrt(Mass)
    const thetaE = Math.sqrt(config.blackHoleMassSolar / 1e9) * 16.5;
    setConfig(prev => ({ ...prev, einsteinRadiusArcsec: thetaE }));
  }, [config.blackHoleMassSolar]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const render = () => {
      time += 0.015;
      const width = (canvas.width = canvas.parentElement?.clientWidth || 700);
      const height = (canvas.height = canvas.parentElement?.clientHeight || 450);
      const cx = width / 2;
      const cy = height / 2;

      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // Starfield background
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 200; i++) {
        const sx = (i * 97.3) % width;
        const sy = (i * 143.7) % height;
        ctx.fillRect(sx, sy, 1, 1);
      }

      // Einstein Ring Radius (px)
      const ringRadiusPx = config.einsteinRadiusArcsec * 3.5;

      // Accretion Disk & Deflected Photon Ring
      if (config.showPhotonRing) {
        // Outer Lensed Warped Ring (Einstein Ring)
        const ringGrad = ctx.createRadialGradient(cx, cy, ringRadiusPx * 0.85, cx, cy, ringRadiusPx * 1.15);
        ringGrad.addColorStop(0, 'transparent');
        ringGrad.addColorStop(0.5, 'rgba(139, 92, 246, 0.8)');
        ringGrad.addColorStop(0.8, 'rgba(236, 72, 153, 0.6)');
        ringGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = ringGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, ringRadiusPx * 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Inner Accretion Disk Arc
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.ellipse(cx, cy, ringRadiusPx * 0.7, ringRadiusPx * 0.25, time * 0.5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Black Hole Shadow / Event Horizon
      const bhRadiusPx = Math.max(12, ringRadiusPx * 0.35);

      // Gravitational Redshift Photon Ring Rim
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(cx, cy, bhRadiusPx + 4, 0, Math.PI * 2);
      ctx.fill();

      // Pure Black Event Horizon
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(cx, cy, bhRadiusPx, 0, Math.PI * 2);
      ctx.fill();

      // Light Ray Deflection Lines
      if (config.showRayPaths) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.5;

        for (let r = -3; r <= 3; r++) {
          if (r === 0) continue;
          const startY = cy + r * 50;

          ctx.beginPath();
          ctx.moveTo(40, startY);
          // Curved Ray Bending near Event Horizon
          ctx.quadraticCurveTo(cx, cy + (r > 0 ? bhRadiusPx * 1.5 : -bhRadiusPx * 1.5), width - 40, startY);
          ctx.stroke();
        }
      }

      // HUD Text
      ctx.fillStyle = '#a78bfa';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`M87* GRAVITATIONAL LENSING ENGINE`, 24, 36);
      ctx.fillStyle = '#64748b';
      ctx.font = '12px monospace';
      ctx.fillText(`Einstein Ring θ_E = ${config.einsteinRadiusArcsec.toFixed(1)} arcsec | Mass = ${(config.blackHoleMassSolar / 1e9).toFixed(2)}B M_☉`, 24, 56);

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [config]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent flex items-center space-x-2">
            <Orbit className="w-6 h-6 text-purple-400 animate-spin" style={{ animationDuration: '40s' }} />
            <span>Gravitational Lensing & Black Hole Spacetime Deflection</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Simulate Einstein Ring photon deflection around supermassive black hole M87* ($6.5 \times 10^9 M_\odot$).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
          <h3 className="font-bold text-slate-200 text-md flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-purple-400" />
            <span>Spacetime Deflection Parameters</span>
          </h3>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1">
              <span>Black Hole Mass ($M_\odot$)</span>
              <span className="text-purple-400 font-bold">{(config.blackHoleMassSolar / 1e9).toFixed(2)} Billion $M_\odot$</span>
            </div>
            <input
              type="range" min="1.0e9" max="2.0e10" step="0.5e9"
              value={config.blackHoleMassSolar}
              onChange={(e) => setConfig(prev => ({ ...prev, blackHoleMassSolar: Number(e.target.value) }))}
              className="w-full accent-purple-500 bg-slate-950"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1">
              <span>Impact Parameter ($b$)</span>
              <span className="text-indigo-400 font-bold">{config.impactParameterKpc.toFixed(1)} kpc</span>
            </div>
            <input
              type="range" min="1.0" max="50.0" step="1.0"
              value={config.impactParameterKpc}
              onChange={(e) => setConfig(prev => ({ ...prev, impactParameterKpc: Number(e.target.value) }))}
              className="w-full accent-indigo-500 bg-slate-950"
            />
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showRayPaths}
                onChange={(e) => setConfig(prev => ({ ...prev, showRayPaths: e.target.checked }))}
                className="accent-purple-500 rounded"
              />
              <span>Render Photon Trajectory Ray-Tracing Lines</span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showPhotonRing}
                onChange={(e) => setConfig(prev => ({ ...prev, showPhotonRing: e.target.checked }))}
                className="accent-purple-500 rounded"
              />
              <span>Render Accretion & Einstein Ring Glow</span>
            </label>
          </div>

          <div className="bg-slate-950 border border-purple-950 p-4 rounded-2xl text-xs space-y-2 font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Einstein Radius ($\theta_E$):</span>
              <span className="text-purple-400 font-bold">{config.einsteinRadiusArcsec.toFixed(1)}″</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Photon Sphere Radius (r_ph):</span>
              <span className="text-amber-400 font-bold">19.2 µarcsec</span>
            </div>
          </div>
        </div>

        {/* Canvas Display */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative h-[480px]">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
};
