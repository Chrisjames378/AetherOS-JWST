import React, { useState, useRef, useEffect } from 'react';
import { Orbit, Compass } from 'lucide-react';

export const LensTool: React.FC = () => {
  const [massBillionSuns, setMassBillionSuns] = useState<number>(6.5); // 6.5 x 10^9 M_Sun for M87*
  const [impactParamKpc, setImpactParamKpc] = useState<number>(12.5); // kpc
  const [showRays, setShowRays] = useState<boolean>(true);
  const [showEinsteinRing, setShowEinsteinRing] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Einstein radius in arcseconds: theta_E proportional to sqrt(M)
  const einsteinRadiusArcsec = Math.sqrt(Math.max(massBillionSuns, 0.1)) * 16.5;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let t = 0;

    const render = () => {
      t += 0.015;
      const w = (canvas.width = canvas.clientWidth * window.devicePixelRatio || 500);
      const h = (canvas.height = canvas.clientHeight * window.devicePixelRatio || 280);

      ctx.fillStyle = '#07090e';
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;

      // Spacetime curvature coordinate grid warped by mass
      ctx.strokeStyle = 'rgba(42, 53, 72, 0.35)';
      ctx.lineWidth = 1;
      const gridSize = 16;
      const warpScale = (massBillionSuns / 6.5) * 45;

      for (let x = -8; x <= 8; x++) {
        ctx.beginPath();
        for (let y = -8; y <= 8; y++) {
          const rawX = cx + x * gridSize * 2.2;
          const rawY = cy + y * gridSize * 1.5;
          const dist = Math.hypot(rawX - cx, rawY - cy) || 1;
          const defl = Math.min(warpScale, (warpScale * 30) / dist);
          const px = rawX - ((rawX - cx) / dist) * defl;
          const py = rawY - ((rawY - cy) / dist) * defl;

          if (y === -8) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      // Einstein Ring / Arc calculation
      if (showEinsteinRing) {
        const ringRadius = (einsteinRadiusArcsec / 40) * (w * 0.22);
        const sourceOffsetX = (impactParamKpc - 12.5) * 3;

        // Distorted double image / Einstein arc
        ctx.strokeStyle = '#e3a23b';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#e3a23b';
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.arc(cx - sourceOffsetX * 0.3, cy, ringRadius, 0.2, Math.PI * 1.8);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 235, 180, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx + sourceOffsetX * 0.5, cy, ringRadius * 0.92, Math.PI * 0.7, Math.PI * 1.3);
        ctx.stroke();

        ctx.shadowBlur = 0;
      }

      // Deflected light photon geodesics
      if (showRays) {
        ctx.strokeStyle = 'rgba(47, 219, 196, 0.65)';
        ctx.lineWidth = 1.5;

        const rayCount = 9;
        for (let i = 0; i < rayCount; i++) {
          const startY = cy - 80 + i * 20;
          ctx.beginPath();
          ctx.moveTo(30, startY);

          for (let step = 0; step <= 40; step++) {
            const rx = 30 + (step / 40) * (w - 60);
            const dist = Math.hypot(rx - cx, startY - cy) || 1;
            const bend = ((massBillionSuns * 420) / (dist * dist + 400)) * (startY < cy ? -1 : 1);
            const ry = startY + bend * (step / 40);
            ctx.lineTo(rx, ry);
          }
          ctx.stroke();
        }
      }

      // Central Supermassive Black Hole Event Horizon
      const bhRadius = Math.max(6, Math.sqrt(massBillionSuns) * 5);
      
      // Accretion disk glow
      const diskGrad = ctx.createRadialGradient(cx, cy, bhRadius, cx, cy, bhRadius * 2.8);
      diskGrad.addColorStop(0, '#f97316');
      diskGrad.addColorStop(0.5, '#ea580c');
      diskGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = diskGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, bhRadius * 2.8, bhRadius * 0.9, 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Black Hole shadow
      ctx.fillStyle = '#05070a';
      ctx.beginPath();
      ctx.arc(cx, cy, bhRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, bhRadius, 0, Math.PI * 2);
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [massBillionSuns, impactParamKpc, showRays, showEinsteinRing, einsteinRadiusArcsec]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-fg flex items-center gap-2">
          <Orbit className="w-5 h-5 text-flare" />
          Gravitational lens & spacetime deflection
        </h2>
        <p className="mt-1 text-sm text-pretty text-muted">
          Einstein radius scales with the square root of black hole mass. Impact parameter offsets the background source off the optic axis.
        </p>
      </div>

      <div className="h-56 sm:h-64 w-full border border-line bg-black overflow-hidden relative rounded">
        <canvas ref={canvasRef} className="h-full w-full block" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <div className="flex justify-between font-mono text-xs">
            <span className="text-muted">Black hole mass (M)</span>
            <span className="text-flare font-semibold">{massBillionSuns.toFixed(1)} × 10⁹ M☉</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="20.0"
            step="0.1"
            value={massBillionSuns}
            onChange={(e) => setMassBillionSuns(parseFloat(e.target.value))}
            className="w-full h-2 bg-raised rounded appearance-none cursor-pointer accent-flare"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between font-mono text-xs">
            <span className="text-muted">Impact parameter (b)</span>
            <span className="text-flare font-semibold">{impactParamKpc.toFixed(1)} kpc</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="40.0"
            step="0.5"
            value={impactParamKpc}
            onChange={(e) => setImpactParamKpc(parseFloat(e.target.value))}
            className="w-full h-2 bg-raised rounded appearance-none cursor-pointer accent-flare"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={() => setShowRays(!showRays)}
          className={`min-h-9 px-3 font-mono text-xs rounded transition-colors ${
            showRays ? 'bg-signal text-signal-ink font-semibold' : 'border border-line bg-surface text-fg hover:bg-raised'
          }`}
        >
          {showRays ? 'Photon paths: ON' : 'Photon paths: OFF'}
        </button>
        <button
          type="button"
          onClick={() => setShowEinsteinRing(!showEinsteinRing)}
          className={`min-h-9 px-3 font-mono text-xs rounded transition-colors ${
            showEinsteinRing ? 'bg-flare text-flare-ink font-semibold' : 'border border-line bg-surface text-fg hover:bg-raised'
          }`}
        >
          {showEinsteinRing ? 'Einstein ring: ON' : 'Einstein ring: OFF'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line">
        <div className="border border-line bg-surface p-2.5 rounded">
          <p className="font-mono text-[10px] text-muted tracking-wider">EINSTEIN RADIUS (θ_E)</p>
          <p className="text-base sm:text-lg font-mono font-semibold text-flare mt-0.5">{einsteinRadiusArcsec.toFixed(1)} arcsec</p>
        </div>
        <div className="border border-line bg-surface p-2.5 rounded">
          <p className="font-mono text-[10px] text-muted tracking-wider">PHOTON SPHERE RADIUS</p>
          <p className="text-base sm:text-lg font-mono font-semibold text-fg mt-0.5">1.50 × rs</p>
        </div>
      </div>
    </div>
  );
};
