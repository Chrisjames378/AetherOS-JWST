import React, { useState, useRef, useEffect } from 'react';
import { Sliders, Eye } from 'lucide-react';

const RED_OPTIONS = ['F444W', 'F1500W', 'F356W'];
const GREEN_OPTIONS = ['F200W', 'F770W', 'F277W'];
const BLUE_OPTIONS = ['F150W', 'F1130W', 'F090W'];

export const SpectraTool: React.FC = () => {
  const [redFilter, setRedFilter] = useState<string>('F444W');
  const [greenFilter, setGreenFilter] = useState<string>('F200W');
  const [blueFilter, setBlueFilter] = useState<string>('F150W');
  const [gain, setGain] = useState<number>(1.2);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const hasCO2Band = redFilter === 'F444W' || redFilter === 'F1500W';
  const co2BandDepth = Math.min(98, (hasCO2Band ? 64 : 26) * gain);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let t = 0;

    const render = () => {
      t += 0.02;
      const w = (canvas.width = canvas.clientWidth * window.devicePixelRatio || 500);
      const h = (canvas.height = canvas.clientHeight * window.devicePixelRatio || 280);

      ctx.fillStyle = '#07090e';
      ctx.fillRect(0, 0, w, h);

      // Spectrum curve across infrared wavelength: 0.6 µm to 20 µm
      const padLeft = 40;
      const padRight = 20;
      const padTop = 30;
      const padBottom = 40;
      const plotW = w - padLeft - padRight;
      const plotH = h - padTop - padBottom;

      // Axis lines & grid
      ctx.strokeStyle = 'rgba(42, 53, 72, 0.4)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = padTop + (i / 4) * plotH;
        ctx.beginPath();
        ctx.moveTo(padLeft, y);
        ctx.lineTo(padLeft + plotW, y);
        ctx.stroke();
      }

      // Wavelength labels
      ctx.fillStyle = '#93a0b4';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText('1.0 µm', padLeft, h - 14);
      ctx.fillText('4.3 µm (CO₂)', padLeft + plotW * 0.35 - 20, h - 14);
      ctx.fillText('10 µm', padLeft + plotW * 0.65, h - 14);
      ctx.fillText('20 µm', padLeft + plotW - 25, h - 14);

      // Transmission curves for Red, Green, Blue filters
      const drawFilterEnvelope = (centerNorm: number, widthNorm: number, color: string) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(padLeft + (centerNorm - widthNorm) * plotW, padTop + plotH);
        for (let i = 0; i <= 30; i++) {
          const frac = i / 30;
          const x = padLeft + (centerNorm - widthNorm + frac * 2 * widthNorm) * plotW;
          const bell = Math.exp(-((frac - 0.5) ** 2) * 16);
          const y = padTop + plotH - bell * plotH * 0.75 * gain;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(padLeft + (centerNorm + widthNorm) * plotW, padTop + plotH);
        ctx.closePath();
        ctx.fill();
      };

      // Draw active filter bands
      drawFilterEnvelope(0.38, 0.08, 'rgba(232, 93, 106, 0.18)'); // Red band
      drawFilterEnvelope(0.22, 0.07, 'rgba(47, 219, 196, 0.18)'); // Green band
      drawFilterEnvelope(0.12, 0.06, 'rgba(110, 168, 254, 0.18)'); // Blue band

      // Continuum radiation + molecular absorption lines
      ctx.strokeStyle = '#e3a23b';
      ctx.lineWidth = 2.2;
      ctx.beginPath();

      const numPoints = 180;
      for (let i = 0; i <= numPoints; i++) {
        const xNorm = i / numPoints;
        const px = padLeft + xNorm * plotW;

        // Blackbody continuum peak in near-IR with dips for CO2, H2O, CH4
        let flux = 0.55 + 0.35 * Math.sin(xNorm * Math.PI * 0.85);

        // CO2 dip at 4.3 µm (xNorm ~ 0.36)
        if (Math.abs(xNorm - 0.36) < 0.07) {
          const dipDepth = (hasCO2Band ? 0.42 : 0.15) * gain;
          flux -= dipDepth * (1 - Math.abs(xNorm - 0.36) / 0.07);
        }

        // H2O dip at 1.4 µm (xNorm ~ 0.15)
        if (Math.abs(xNorm - 0.15) < 0.05) {
          flux -= 0.18 * gain * (1 - Math.abs(xNorm - 0.15) / 0.05);
        }

        // CO2 dip at 15 µm (xNorm ~ 0.82)
        if (Math.abs(xNorm - 0.82) < 0.06) {
          const dipDepth = (hasCO2Band ? 0.35 : 0.12) * gain;
          flux -= dipDepth * (1 - Math.abs(xNorm - 0.82) / 0.06);
        }

        // Slight observational jitter
        flux += (Math.sin(i * 3.7 + t) * 0.015);

        const py = padTop + plotH * (1 - Math.max(0.05, Math.min(0.95, flux)));
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Atmospheric Line Identifiers
      ctx.fillStyle = '#e8eef6';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText('H₂O (1.4µm)', padLeft + plotW * 0.14 - 15, padTop + 14);
      ctx.fillText('CO₂ (4.3µm)', padLeft + plotW * 0.36 - 15, padTop + 14);
      ctx.fillText('CO₂ (15µm)', padLeft + plotW * 0.82 - 15, padTop + 14);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [redFilter, greenFilter, blueFilter, gain, hasCO2Band]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-fg flex items-center gap-2">
          <Eye className="w-5 h-5 text-flare" />
          Multi-band spectroscopy
        </h2>
        <p className="mt-1 text-sm text-pretty text-muted">
          Synthesize composite infrared channels from NIRCam and MIRI. CO₂ absorption bands at 4.3 µm and 15 µm deepen when F444W or F1500W is routed to the red channel.
        </p>
      </div>

      <div className="h-56 sm:h-64 w-full border border-line bg-black overflow-hidden relative rounded">
        <canvas ref={canvasRef} className="h-full w-full block" />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {/* RED CHANNEL */}
        <div className="border border-line bg-surface p-3 rounded space-y-2">
          <span className="font-mono text-xs tracking-widest text-danger font-semibold block">RED CHANNEL</span>
          <div className="flex flex-wrap gap-1.5">
            {RED_OPTIONS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setRedFilter(f)}
                className={`min-h-8 px-2.5 font-mono text-xs rounded transition-colors ${
                  redFilter === f ? 'bg-danger text-danger-ink font-bold' : 'border border-line bg-bg text-fg hover:bg-raised'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* GREEN CHANNEL */}
        <div className="border border-line bg-surface p-3 rounded space-y-2">
          <span className="font-mono text-xs tracking-widest text-signal font-semibold block">GREEN CHANNEL</span>
          <div className="flex flex-wrap gap-1.5">
            {GREEN_OPTIONS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setGreenFilter(f)}
                className={`min-h-8 px-2.5 font-mono text-xs rounded transition-colors ${
                  greenFilter === f ? 'bg-signal text-signal-ink font-bold' : 'border border-line bg-bg text-fg hover:bg-raised'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* BLUE CHANNEL */}
        <div className="border border-line bg-surface p-3 rounded space-y-2">
          <span className="font-mono text-xs tracking-widest text-[#6ea8fe] font-semibold block">BLUE CHANNEL</span>
          <div className="flex flex-wrap gap-1.5">
            {BLUE_OPTIONS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setBlueFilter(f)}
                className={`min-h-8 px-2.5 font-mono text-xs rounded transition-colors ${
                  blueFilter === f ? 'bg-[#6ea8fe] text-[#06182c] font-bold' : 'border border-line bg-bg text-fg hover:bg-raised'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between font-mono text-xs">
          <span className="text-muted">Spectroscopic contrast gain</span>
          <span className="text-flare font-semibold">{gain.toFixed(2)}x</span>
        </div>
        <input
          type="range"
          min="0.4"
          max="2.4"
          step="0.05"
          value={gain}
          onChange={(e) => setGain(parseFloat(e.target.value))}
          className="w-full h-2 bg-raised rounded appearance-none cursor-pointer accent-flare"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line">
        <div className="border border-line bg-surface p-2.5 rounded">
          <p className="font-mono text-[10px] text-muted tracking-wider">COMPOSITE FILTER STACK</p>
          <p className="text-sm sm:text-base font-mono font-semibold text-fg mt-0.5 truncate">{redFilter} · {greenFilter} · {blueFilter}</p>
        </div>
        <div className="border border-line bg-surface p-2.5 rounded">
          <p className="font-mono text-[10px] text-muted tracking-wider">CO₂ ABSORPTION DEPTH</p>
          <p className={`text-base sm:text-lg font-mono font-semibold mt-0.5 ${hasCO2Band ? 'text-flare' : 'text-fg'}`}>
            {co2BandDepth.toFixed(0)}%
          </p>
        </div>
      </div>
    </div>
  );
};
