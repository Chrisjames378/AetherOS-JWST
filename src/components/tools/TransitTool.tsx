import React, { useState, useRef, useEffect } from 'react';
import { TrendingDown, Sparkles } from 'lucide-react';

export const TransitTool: React.FC = () => {
  const [planetRadius, setPlanetRadius] = useState<number>(1.2); // R_J
  const [starRadius, setStarRadius] = useState<number>(1.0); // R_Sun
  const [inclination, setInclination] = useState<number>(89.2); // degrees
  const [noisePercent, setNoisePercent] = useState<number>(0.4);
  const [hasAtmosphere, setHasAtmosphere] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Depth is (Rp / R_*)^2 scaled to R_J / R_Sun
  // 1 R_J ≈ 0.10045 R_Sun
  const radiusRatio = (planetRadius * 0.10045) / Math.max(0.2, starRadius);
  const geometricDepthPercent = radiusRatio * radiusRatio * 100;
  // Inclination grazing penalty
  const grazingFactor = Math.min(1, Math.max(0, (inclination - 78) / 12));
  const effectiveDepthPercent = geometricDepthPercent * (0.15 + 0.85 * grazingFactor);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let phase = 0;

    const render = () => {
      phase = (phase + 0.008) % 1;
      const w = (canvas.width = canvas.clientWidth * window.devicePixelRatio || 500);
      const h = (canvas.height = canvas.clientHeight * window.devicePixelRatio || 280);

      ctx.fillStyle = '#07090e';
      ctx.fillRect(0, 0, w, h);

      // Upper half: Star disk and transit geometry
      const topHeight = h * 0.42;
      const starCenterX = w / 2;
      const starCenterY = topHeight * 0.5;
      const starDrawRadius = 36 * starRadius;

      // Limb-darkened star disk
      const starGrad = ctx.createRadialGradient(starCenterX, starCenterY, starDrawRadius * 0.2, starCenterX, starCenterY, starDrawRadius);
      starGrad.addColorStop(0, '#fff4d0');
      starGrad.addColorStop(0.7, '#e6b342');
      starGrad.addColorStop(1, '#a86214');
      ctx.fillStyle = starGrad;
      ctx.beginPath();
      ctx.arc(starCenterX, starCenterY, starDrawRadius, 0, Math.PI * 2);
      ctx.fill();

      // Transiting planet trajectory across star
      const transitX = (phase * (w + 100)) - 50;
      const incRad = inclination * (Math.PI / 180);
      const impactParam = (starDrawRadius * 1.5) * Math.cos(incRad);
      const transitY = starCenterY + impactParam;
      const planetDrawRadius = Math.max(3, starDrawRadius * radiusRatio);

      // Draw transiting planet
      ctx.fillStyle = '#05070a';
      ctx.beginPath();
      ctx.arc(transitX, transitY, planetDrawRadius, 0, Math.PI * 2);
      ctx.fill();

      // Atmospheric halo ring if active
      if (hasAtmosphere && transitX > starCenterX - starDrawRadius && transitX < starCenterX + starDrawRadius) {
        ctx.strokeStyle = '#2fdbc4';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(transitX, transitY, planetDrawRadius + 1.8, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Divider line
      ctx.strokeStyle = '#2a3548';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, topHeight);
      ctx.lineTo(w, topHeight);
      ctx.stroke();

      // Lower half: Photometric flux dip curve
      const plotY = topHeight + 10;
      const plotH = h - plotY - 24;
      const plotBaselineY = plotY + plotH * 0.25;
      const maxDipPx = plotH * 0.65;

      // Grid lines
      ctx.strokeStyle = 'rgba(42, 53, 72, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(30, plotBaselineY);
      ctx.lineTo(w - 20, plotBaselineY);
      ctx.moveTo(30, plotBaselineY + maxDipPx);
      ctx.lineTo(w - 20, plotBaselineY + maxDipPx);
      ctx.stroke();
      ctx.setLineDash([]);

      // Baseline label
      ctx.fillStyle = '#93a0b4';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText('1.000 F₀', 4, plotBaselineY + 3);
      ctx.fillText(`${(1 - effectiveDepthPercent / 100).toFixed(4)}`, 4, plotBaselineY + maxDipPx + 3);

      // Plot smooth transit ingress/egress theoretical curve
      ctx.strokeStyle = '#2fdbc4';
      ctx.lineWidth = 2;
      ctx.beginPath();

      const numPoints = 120;
      const transitCenterNorm = 0.5;
      const transitWidthNorm = 0.22;

      for (let i = 0; i <= numPoints; i++) {
        const xNorm = i / numPoints;
        const px = 30 + xNorm * (w - 55);
        const distFromCenter = Math.abs(xNorm - transitCenterNorm);
        let dipFraction = 0;

        if (distFromCenter < transitWidthNorm) {
          const u = distFromCenter / transitWidthNorm;
          dipFraction = Math.cos(u * Math.PI * 0.5) ** 1.8;
          if (hasAtmosphere) {
            dipFraction *= 1.08;
          }
        }

        const py = plotBaselineY + dipFraction * (effectiveDepthPercent / 2.5) * maxDipPx;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Scatter data points with observational photometric noise
      ctx.fillStyle = 'rgba(232, 238, 246, 0.65)';
      for (let i = 0; i < 90; i++) {
        const xNorm = i / 90;
        const px = 30 + xNorm * (w - 55);
        const distFromCenter = Math.abs(xNorm - transitCenterNorm);
        let dipFraction = 0;
        if (distFromCenter < transitWidthNorm) {
          const u = distFromCenter / transitWidthNorm;
          dipFraction = Math.cos(u * Math.PI * 0.5) ** 1.8;
          if (hasAtmosphere) dipFraction *= 1.08;
        }
        const noise = (Math.sin(i * 12.3 + phase * 4) * 0.5 + Math.cos(i * 45.7) * 0.5) * (noisePercent * 8);
        const py = plotBaselineY + (dipFraction * (effectiveDepthPercent / 2.5) * maxDipPx) + noise;

        ctx.beginPath();
        ctx.arc(px, py, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Current time phase marker
      const markerX = 30 + phase * (w - 55);
      ctx.strokeStyle = '#e3a23b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(markerX, plotY);
      ctx.lineTo(markerX, plotY + plotH);
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [planetRadius, starRadius, inclination, noisePercent, hasAtmosphere, effectiveDepthPercent, radiusRatio]);

  const atmosphericFeatures = hasAtmosphere && noisePercent < 1.5
    ? 'CO₂ 4.3 µm · H₂O 1.4 µm transmission detections'
    : hasAtmosphere
    ? 'Atmospheric absorption bands buried in noise'
    : 'Featureless flat transmission spectrum';

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-fg flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-signal" />
          Exoplanet transit light curve
        </h2>
        <p className="mt-1 text-sm text-pretty text-muted">
          Transit flux dip depth is (Rp / R★)², grazed by inclination. Photometric noise simulates JWST NIRSpec transmission occultation.
        </p>
      </div>

      <div className="h-60 sm:h-72 w-full border border-line bg-black overflow-hidden relative rounded">
        <canvas ref={canvasRef} className="h-full w-full block" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <div className="flex justify-between font-mono text-xs">
            <span className="text-muted">Planet radius (Rp)</span>
            <span className="text-signal font-semibold">{planetRadius.toFixed(2)} Rj</span>
          </div>
          <input
            type="range"
            min="0.3"
            max="2.2"
            step="0.01"
            value={planetRadius}
            onChange={(e) => setPlanetRadius(parseFloat(e.target.value))}
            className="w-full h-2 bg-raised rounded appearance-none cursor-pointer accent-signal"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between font-mono text-xs">
            <span className="text-muted">Host star radius (R★)</span>
            <span className="text-signal font-semibold">{starRadius.toFixed(2)} R☉</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.01"
            value={starRadius}
            onChange={(e) => setStarRadius(parseFloat(e.target.value))}
            className="w-full h-2 bg-raised rounded appearance-none cursor-pointer accent-signal"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between font-mono text-xs">
            <span className="text-muted">Orbital inclination</span>
            <span className="text-signal font-semibold">{inclination.toFixed(1)}°</span>
          </div>
          <input
            type="range"
            min="78"
            max="90"
            step="0.1"
            value={inclination}
            onChange={(e) => setInclination(parseFloat(e.target.value))}
            className="w-full h-2 bg-raised rounded appearance-none cursor-pointer accent-signal"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between font-mono text-xs">
            <span className="text-muted">Photometric noise</span>
            <span className="text-signal font-semibold">{noisePercent.toFixed(2)}%</span>
          </div>
          <input
            type="range"
            min="0.05"
            max="2.5"
            step="0.05"
            value={noisePercent}
            onChange={(e) => setNoisePercent(parseFloat(e.target.value))}
            className="w-full h-2 bg-raised rounded appearance-none cursor-pointer accent-signal"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => setHasAtmosphere(!hasAtmosphere)}
          className={`min-h-10 px-4 font-mono text-xs rounded transition-colors flex items-center gap-1.5 ${
            hasAtmosphere ? 'bg-signal text-signal-ink font-semibold' : 'border border-line bg-surface text-fg hover:bg-raised'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {hasAtmosphere ? 'Atmospheric absorption: ACTIVE' : 'Atmosphere: INACTIVE'}
        </button>
        <span className="font-mono text-xs text-muted truncate max-w-xs">{atmosphericFeatures}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line">
        <div className="border border-line bg-surface p-2.5 rounded">
          <p className="font-mono text-[10px] text-muted tracking-wider">FLUX DIP DEPTH (ΔF)</p>
          <p className="text-base sm:text-lg font-mono font-semibold text-flare mt-0.5">{effectiveDepthPercent.toFixed(2)}%</p>
        </div>
        <div className="border border-line bg-surface p-2.5 rounded">
          <p className="font-mono text-[10px] text-muted tracking-wider">TRANSIT DURATION</p>
          <p className="text-base sm:text-lg font-mono font-semibold text-fg mt-0.5">3.42 hours</p>
        </div>
      </div>
    </div>
  );
};
