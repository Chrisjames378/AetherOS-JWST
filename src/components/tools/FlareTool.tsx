import React, { useState, useRef, useEffect } from 'react';
import { Flame, AlertTriangle, Zap } from 'lucide-react';

const FLARE_CLASSES = ['X1.0', 'X2.5', 'X5.0', 'X9.0'];

export const FlareTool: React.FC = () => {
  const [flareClass, setFlareClass] = useState<string>('X2.5');
  const [fieldStrength, setFieldStrength] = useState<number>(2.4); // Tesla
  const [reconnectionRate, setReconnectionRate] = useState<number>(0.65);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cmeBurstRef = useRef<number>(0);

  const flareNumeric = parseFloat(flareClass.replace(/^X/, '')) || 1.0;
  const tempMk = (8 + flareNumeric * 2.2) * (fieldStrength / 2);
  const velocity = (900 + flareNumeric * 180 * reconnectionRate * 4) * (0.65 + fieldStrength * 0.25);
  const risk = flareNumeric >= 8 || velocity > 2800 ? 'Severe' : flareNumeric >= 3 || velocity > 1600 ? 'Elevated' : 'Watched';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let t = 0;

    const render = () => {
      t += 0.03;
      const w = (canvas.width = canvas.clientWidth * window.devicePixelRatio || 500);
      const h = (canvas.height = canvas.clientHeight * window.devicePixelRatio || 280);

      // Background solar corona dark gradient
      const bgGrad = ctx.createRadialGradient(w / 2, h * 1.1, 10, w / 2, h * 1.1, w * 0.8);
      bgGrad.addColorStop(0, '#3a1805');
      bgGrad.addColorStop(0.5, '#120b08');
      bgGrad.addColorStop(1, '#07090e');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Solar limb horizon
      const sunY = h * 0.88;
      ctx.fillStyle = '#e3a23b';
      ctx.beginPath();
      ctx.arc(w / 2, sunY + w * 1.2, w * 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Atmospheric corona glow
      const glowGrad = ctx.createRadialGradient(w / 2, sunY, 10, w / 2, sunY, w * 0.6);
      glowGrad.addColorStop(0, 'rgba(255, 180, 50, 0.45)');
      glowGrad.addColorStop(0.4, 'rgba(230, 80, 20, 0.18)');
      glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, w, h);

      // Draw magnetic loop arches
      const loops = 7;
      for (let i = 0; i < loops; i++) {
        const loopPhase = t * (0.8 + i * 0.15);
        const span = (w * 0.18 + i * 22) * (fieldStrength / 2);
        const xCenter = w / 2 + Math.sin(t * 0.4 + i) * 30;
        const xStart = xCenter - span;
        const xEnd = xCenter + span;
        const apexY = sunY - (h * 0.35 + i * 16 + Math.sin(loopPhase) * 12) * (fieldStrength / 2.5);

        ctx.strokeStyle = i % 2 === 0 ? 'rgba(255, 220, 140, 0.75)' : 'rgba(240, 110, 40, 0.6)';
        ctx.lineWidth = 2 + (flareNumeric / 4);
        ctx.beginPath();
        ctx.moveTo(xStart, sunY);
        ctx.bezierCurveTo(
          xStart + span * 0.25, apexY,
          xEnd - span * 0.25, apexY,
          xEnd, sunY
        );
        ctx.stroke();

        // Magnetic plasma twist waves
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        const pulseRatio = (Math.sin(loopPhase * 1.5) + 1) / 2;
        const px = xStart + (xEnd - xStart) * pulseRatio;
        const py = apexY + Math.sin(pulseRatio * Math.PI) * 20;
        ctx.beginPath();
        ctx.arc(px, py, 2.5 + flareNumeric * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // CME Burst animation if triggered
      if (cmeBurstRef.current > 0) {
        cmeBurstRef.current -= 0.015;
        const burstProgress = 1 - cmeBurstRef.current;
        const burstRadius = burstProgress * w * 0.75;
        const alpha = Math.max(0, cmeBurstRef.current);

        ctx.strokeStyle = `rgba(255, 80, 20, ${alpha * 0.8})`;
        ctx.lineWidth = 4 + flareNumeric * 1.5;
        ctx.beginPath();
        ctx.arc(w / 2, sunY, burstRadius, Math.PI * 1.05, Math.PI * 1.95);
        ctx.stroke();

        // High-energy shockwave front
        ctx.strokeStyle = `rgba(255, 240, 200, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(w / 2, sunY, burstRadius * 1.06, Math.PI * 1.08, Math.PI * 1.92);
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [flareClass, fieldStrength, reconnectionRate, flareNumeric]);

  const triggerCME = () => {
    cmeBurstRef.current = 1.0;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-fg flex items-center gap-2">
            <Flame className="w-5 h-5 text-flare" />
            Solar MHD flare engine
          </h2>
          <p className="mt-1 text-sm text-pretty text-muted">
            Coronal-loop simulation driven by flare classification, field strength, and reconnection rate.
          </p>
        </div>
        <button
          type="button"
          onClick={triggerCME}
          className="min-h-10 bg-danger hover:bg-danger/90 px-4 py-2 text-sm font-semibold text-danger-ink rounded transition-colors flex items-center gap-1.5"
        >
          <Zap className="w-4 h-4" />
          Trigger CME burst
        </button>
      </div>

      <div className="h-56 sm:h-64 w-full border border-line bg-black overflow-hidden relative rounded">
        <canvas ref={canvasRef} className="h-full w-full block" />
      </div>

      <div className="space-y-2">
        <span className="font-mono text-xs tracking-widest text-muted block">GOES FLARE CLASS</span>
        <div className="flex flex-wrap gap-2">
          {FLARE_CLASSES.map((fc) => (
            <button
              key={fc}
              type="button"
              onClick={() => setFlareClass(fc)}
              className={`min-h-9 px-3 font-mono text-xs transition-colors rounded ${
                flareClass === fc ? 'bg-flare text-flare-ink font-bold' : 'border border-line bg-surface text-fg hover:bg-raised'
              }`}
            >
              {fc}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <div className="flex justify-between font-mono text-xs">
            <span className="text-muted">Magnetic field strength</span>
            <span className="text-flare font-semibold">{fieldStrength.toFixed(1)} kG</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="5.0"
            step="0.1"
            value={fieldStrength}
            onChange={(e) => setFieldStrength(parseFloat(e.target.value))}
            className="w-full h-2 bg-raised rounded appearance-none cursor-pointer accent-flare"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between font-mono text-xs">
            <span className="text-muted">Reconnection rate</span>
            <span className="text-flare font-semibold">{reconnectionRate.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={reconnectionRate}
            onChange={(e) => setReconnectionRate(parseFloat(e.target.value))}
            className="w-full h-2 bg-raised rounded appearance-none cursor-pointer accent-flare"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-line">
        <div className="border border-line bg-surface p-2.5 rounded">
          <p className="font-mono text-[10px] text-muted tracking-wider">PEAK TEMPERATURE</p>
          <p className="text-base sm:text-lg font-mono font-semibold text-fg mt-0.5">{tempMk.toFixed(1)} MK</p>
        </div>
        <div className="border border-line bg-surface p-2.5 rounded">
          <p className="font-mono text-[10px] text-muted tracking-wider">CME VELOCITY</p>
          <p className="text-base sm:text-lg font-mono font-semibold text-fg mt-0.5">{Math.round(velocity)} km/s</p>
        </div>
        <div className="border border-line bg-surface p-2.5 rounded">
          <p className="font-mono text-[10px] text-muted tracking-wider">GEOEFFECTIVE RISK</p>
          <p className={`text-base sm:text-lg font-mono font-semibold mt-0.5 flex items-center gap-1 ${
            risk === 'Severe' ? 'text-danger' : risk === 'Elevated' ? 'text-flare' : 'text-signal'
          }`}>
            {risk}
          </p>
        </div>
      </div>
    </div>
  );
};
