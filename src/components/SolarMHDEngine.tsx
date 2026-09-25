import React, { useRef, useEffect, useState } from 'react';
import { Flame, Activity, Zap, Shield, Play, RotateCcw } from 'lucide-react';
import { MHDFlareConfig } from '../types';

export const SolarMHDEngine: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [config, setConfig] = useState<MHDFlareConfig>({
    flareClass: 'X5.0',
    magneticFieldTesla: 2.8,
    plasmaDensity: 1.5e17,
    loopTension: 0.75,
    reconnectionRate: 0.25,
    particleCount: 250,
    isBurstActive: false,
  });

  const [plasmaTempMK, setPlasmaTempMK] = useState<number>(24.5); // Million Kelvin
  const [cmeVelocity, setCmeVelocity] = useState<number>(1850); // km/s

  useEffect(() => {
    // Calculate plasma physics readouts
    const baseTemp = config.flareClass.startsWith('X') 
      ? 15 + parseFloat(config.flareClass.substring(1)) * 2.5 
      : 8;
    setPlasmaTempMK(baseTemp * (config.magneticFieldTesla / 2.0));
    setCmeVelocity(1200 + parseFloat(config.flareClass.substring(1) || '1') * 200 * config.reconnectionRate * 4);
  }, [config]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    // MHD Plasma particles
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      size: number;
      color: string;
    }

    const particles: Particle[] = [];
    const colors = ['#fef08a', '#f59e0b', '#ef4444', '#dc2626', '#7c2d12'];

    const spawnParticle = (cx: number, cy: number, radius: number) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = (1 + Math.random() * 3) * (config.isBurstActive ? 3.5 : 1);
      const color = colors[Math.floor(Math.random() * colors.length)];
      particles.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 2,
        vy: Math.sin(angle) * speed - Math.random() * 2,
        life: 0,
        maxLife: 60 + Math.random() * 80,
        size: (2 + Math.random() * 4) * (config.isBurstActive ? 1.8 : 1),
        color,
      });
    };

    const render = () => {
      time += 0.02;
      const width = (canvas.width = canvas.parentElement?.clientWidth || 700);
      const height = (canvas.height = canvas.parentElement?.clientHeight || 450);
      const cx = width / 2;
      const cy = height / 2 + 80; // Sun limb anchored at bottom

      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      // Solar Corona Base Radial Gradient
      const sunRadius = 220;
      const coronaGrad = ctx.createRadialGradient(cx, cy, sunRadius * 0.4, cx, cy, sunRadius * 1.8);
      coronaGrad.addColorStop(0, '#ffffff');
      coronaGrad.addColorStop(0.25, '#fef08a');
      coronaGrad.addColorStop(0.55, '#f59e0b');
      coronaGrad.addColorStop(0.85, '#ef4444');
      coronaGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = coronaGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, sunRadius * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Sun Photosphere Body
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(cx, cy, sunRadius, 0, Math.PI * 2);
      ctx.fill();

      // Magnetohydrodynamic Coronal Loops (Arching Magnetic Lines)
      const numLoops = 7;
      for (let i = 0; i < numLoops; i++) {
        const loopWidth = (i - numLoops / 2) * 45;
        const loopHeight = (120 + i * 18) * config.loopTension * (1 + Math.sin(time * 2 + i) * 0.08);

        ctx.strokeStyle = i % 2 === 0 ? '#ef4444' : '#f59e0b';
        ctx.lineWidth = 3 + (i % 3);
        ctx.globalAlpha = 0.85;

        ctx.beginPath();
        ctx.moveTo(cx + loopWidth - 40, cy - Math.sqrt(Math.max(0, sunRadius * sunRadius - (loopWidth - 40) * (loopWidth - 40))));
        ctx.bezierCurveTo(
          cx + loopWidth - 60, cy - sunRadius - loopHeight,
          cx + loopWidth + 60, cy - sunRadius - loopHeight,
          cx + loopWidth + 40, cy - Math.sqrt(Math.max(0, sunRadius * sunRadius - (loopWidth + 40) * (loopWidth + 40)))
        );
        ctx.stroke();

        // Magnetic Reconnection Flare Core Sparkles
        if (i === 3) {
          const sparkX = cx + loopWidth + Math.sin(time * 5) * 10;
          const sparkY = cy - sunRadius - loopHeight * 0.9;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(sparkX, sparkY, (10 + Math.sin(time * 10) * 5) * (config.isBurstActive ? 2.5 : 1), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1.0;

      // Spawn MHD plasma burst particles
      if (particles.length < (config.isBurstActive ? 500 : 250)) {
        spawnParticle(cx, cy - sunRadius * 0.9, sunRadius * 0.3);
      }

      // Update & Render Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life += 1;

        const progress = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 1 - progress;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - progress * 0.5), 0, Math.PI * 2);
        ctx.fill();

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
        }
      }
      ctx.globalAlpha = 1.0;

      // Flare Classification Overlay HUD
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(`MHD FLARE ENGINE: ${config.flareClass} CLASS`, 24, 36);

      ctx.fillStyle = '#f59e0b';
      ctx.font = '12px monospace';
      ctx.fillText(`Plasma Temp: ${plasmaTempMK.toFixed(1)} Million K | CME Velocity: ${cmeVelocity.toFixed(0)} km/s`, 24, 56);

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [config, plasmaTempMK, cmeVelocity]);

  const handleTriggerBurst = () => {
    setConfig(prev => ({ ...prev, isBurstActive: true }));
    setTimeout(() => {
      setConfig(prev => ({ ...prev, isBurstActive: false }));
    }, 2500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-red-400 bg-clip-text text-transparent flex items-center space-x-2">
            <Flame className="w-6 h-6 text-amber-400 animate-pulse" />
            <span>Solar Corona & X-Class Flare MHD Engine</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Simulate magnetohydrodynamic (MHD) plasma instabilities, coronal loop reconnections, and X1.0 to X9.9 flare shockwaves.
          </p>
        </div>

        <button
          onClick={handleTriggerBurst}
          className="bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-extrabold px-5 py-3 rounded-2xl shadow-xl shadow-orange-500/30 transition flex items-center space-x-2 active:scale-95 cursor-pointer"
        >
          <Zap className="w-5 h-5 fill-current animate-bounce" />
          <span>TRIGGER X-FLARE CME BURST</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
          <h3 className="font-bold text-slate-200 text-md flex items-center space-x-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <span>Flare MHD Physics Parameters</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Flare Classification</label>
            <div className="grid grid-cols-3 gap-2">
              {(['C1.0', 'M5.0', 'X1.0', 'X2.5', 'X5.0', 'X9.9'] as const).map(cls => (
                <button
                  key={cls}
                  onClick={() => setConfig(prev => ({ ...prev, flareClass: cls }))}
                  className={`py-2 px-3 rounded-xl text-xs font-bold uppercase transition ${
                    config.flareClass === cls
                      ? 'bg-gradient-to-r from-amber-500 to-red-600 text-white shadow-lg'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1">
              <span>Magnetic Field Strength ($B$)</span>
              <span className="text-amber-400 font-bold">{config.magneticFieldTesla.toFixed(1)} Tesla</span>
            </div>
            <input
              type="range" min="0.5" max="5.0" step="0.1"
              value={config.magneticFieldTesla}
              onChange={(e) => setConfig(prev => ({ ...prev, magneticFieldTesla: Number(e.target.value) }))}
              className="w-full accent-amber-500 bg-slate-950"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1">
              <span>Magnetic Reconnection Rate</span>
              <span className="text-orange-400 font-bold">{(config.reconnectionRate * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range" min="0.05" max="0.5" step="0.01"
              value={config.reconnectionRate}
              onChange={(e) => setConfig(prev => ({ ...prev, reconnectionRate: Number(e.target.value) }))}
              className="w-full accent-orange-500 bg-slate-950"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1">
              <span>Coronal Loop Tension Ratio</span>
              <span className="text-red-400 font-bold">{config.loopTension.toFixed(2)}</span>
            </div>
            <input
              type="range" min="0.2" max="1.0" step="0.05"
              value={config.loopTension}
              onChange={(e) => setConfig(prev => ({ ...prev, loopTension: Number(e.target.value) }))}
              className="w-full accent-red-500 bg-slate-950"
            />
          </div>

          <div className="bg-slate-950 border border-amber-900/50 p-4 rounded-2xl font-mono text-xs space-y-2">
            <div className="flex justify-between text-slate-400">
              <span>Peak Plasma Temp:</span>
              <span className="text-amber-400 font-bold">{plasmaTempMK.toFixed(1)} MK</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Coronal Ejection Vel:</span>
              <span className="text-red-400 font-bold">{cmeVelocity.toFixed(0)} km/s</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Space Weather Risk:</span>
              <span className="text-emerald-400 font-bold">{config.flareClass.startsWith('X') ? 'HIGH (G4/G5 Storm)' : 'MODERATE'}</span>
            </div>
          </div>
        </div>

        {/* Canvas Display Column */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative h-[540px] flex flex-col">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
};
