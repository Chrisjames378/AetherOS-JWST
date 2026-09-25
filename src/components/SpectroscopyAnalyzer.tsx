import React, { useRef, useEffect, useState } from 'react';
import { Sliders, Eye, Sparkles, AlertCircle, Database, Check } from 'lucide-react';
import { MolecularAbsorbLine } from '../types';

export const SpectroscopyAnalyzer: React.FC = () => {
  const spectrumCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [redChannel, setRedChannel] = useState<string>('F444W');
  const [greenChannel, setGreenChannel] = useState<string>('F200W');
  const [blueChannel, setBlueChannel] = useState<string>('F150W');
  const [contrastBoost, setContrastBoost] = useState<number>(1.25);
  const [hoveredLine, setHoveredLine] = useState<MolecularAbsorbLine | null>(null);

  const lines: MolecularAbsorbLine[] = [
    { id: '1', molecule: 'Ly-α (Hydrogen Lyman-Alpha)', wavelengthMicrons: 0.1216, strength: 0.95, color: '#38bdf8', description: 'Primordial hydrogen ionization line from early cosmic reionization epoch (z > 10).' },
    { id: '2', molecule: 'H-β (Balmer Beta)', wavelengthMicrons: 0.4861, strength: 0.88, color: '#34d399', description: 'Optical hydrogen recombination line tracing active stellar nurseries and starburst clusters.' },
    { id: '3', molecule: '[O III] (Doubly Ionized Oxygen)', wavelengthMicrons: 0.5007, strength: 0.92, color: '#a78bfa', description: 'Forbidden nebular line signature of extreme ultraviolet radiation fields.' },
    { id: '4', molecule: 'H₂O (Atmospheric Water Vapor)', wavelengthMicrons: 1.4, strength: 0.75, color: '#60a5fa', description: 'Near-infrared vibrational absorption band indicating exoplanet atmospheric water vapor.' },
    { id: '5', molecule: 'CO₂ (Carbon Dioxide Asymmetric Stretch)', wavelengthMicrons: 4.3, strength: 0.98, color: '#f43f5e', description: 'Key JWST NIRSpec/MIRI molecular absorption signature detected in WASP-96b, Mars, and Venus.' },
    { id: '6', molecule: 'CO₂ (Bending Mode)', wavelengthMicrons: 15.0, strength: 0.85, color: '#fb7185', description: 'Mid-infrared MIRI fundamental absorption band for dense terrestrial greenhouse atmospheres.' },
  ];

  useEffect(() => {
    const canvas = spectrumCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = canvas.parentElement?.clientWidth || 700);
    const height = (canvas.height = canvas.parentElement?.clientHeight || 320);

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    // Wavelength spectrum rainbow background strip (0.6µm to 28.0µm logarithmic scale)
    const rainbowGrad = ctx.createLinearGradient(40, 0, width - 40, 0);
    rainbowGrad.addColorStop(0.0, '#3b82f6'); // NIRCam 0.6µm
    rainbowGrad.addColorStop(0.25, '#10b981'); // 2.0µm
    rainbowGrad.addColorStop(0.5, '#eab308');  // 4.3µm CO2
    rainbowGrad.addColorStop(0.75, '#f97316'); // MIRI 10µm
    rainbowGrad.addColorStop(1.0, '#ef4444');  // 28µm

    ctx.fillStyle = rainbowGrad;
    ctx.globalAlpha = 0.25;
    ctx.fillRect(40, 40, width - 80, height - 100);
    ctx.globalAlpha = 1.0;

    // Draw Synthetic Continuous Continuum Spectrum Curve with Absorption Valleys
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    const startX = 40;
    const endX = width - 40;

    for (let x = startX; x <= endX; x += 2) {
      const normX = (x - startX) / (endX - startX); // 0 to 1
      const wave = 0.6 + normX * 27.4; // 0.6um to 28um

      // Base Blackbody Planck Curve continuum approximation
      let flux = Math.sin(normX * Math.PI) * 120 + 60;

      // Subtract absorption line dips
      lines.forEach(line => {
        const lineNormX = (line.wavelengthMicrons - 0.6) / 27.4;
        const dist = Math.abs(normX - lineNormX);
        if (dist < 0.03) {
          const dip = (1 - dist / 0.03) * 75 * line.strength;
          flux -= dip;
        }
      });

      const py = height - 60 - flux * (contrastBoost * 0.7);

      if (x === startX) ctx.moveTo(x, py);
      else ctx.lineTo(x, py);
    }
    ctx.stroke();

    // Render Spectral Line Marker Flags
    lines.forEach(line => {
      const lineNormX = (line.wavelengthMicrons - 0.6) / 27.4;
      const lx = startX + lineNormX * (endX - startX);

      ctx.strokeStyle = line.color;
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(lx, 40);
      ctx.lineTo(lx, height - 60);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label
      ctx.fillStyle = line.color;
      ctx.font = 'bold 10px monospace';
      ctx.fillText(line.molecule.split(' ')[0], lx - 15, 32);
    });

    // Axis Labels
    ctx.fillStyle = '#64748b';
    ctx.font = '11px monospace';
    ctx.fillText('0.6 µm (NIRCam)', startX, height - 25);
    ctx.fillText('4.3 µm (CO₂ Band)', startX + (width - 80) * 0.13, height - 25);
    ctx.fillText('28.0 µm (MIRI)', endX - 90, height - 25);
  }, [contrastBoost]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-rose-400 to-indigo-300 bg-clip-text text-transparent flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-rose-400 animate-pulse" />
            <span>Multi-Band Composite Spectroscopy & $CO_2$ Analysis</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            NIRCam, NIRSpec, and MIRI composite RGB filter mixing with hoverable atomic & molecular emission/absorption line tags.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Channel Mixers */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
          <h3 className="font-bold text-slate-200 text-md flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-rose-400" />
            <span>Composite RGB Filter Mixers</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-rose-400 uppercase mb-1">Red Channel ($CO_2$ & MIRI Band)</label>
            <select
              value={redChannel}
              onChange={(e) => setRedChannel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200"
            >
              <option value="F444W">F444W (4.4µm - NIRCam CO₂)</option>
              <option value="F770W">F770W (7.7µm - MIRI Polycyclic Aromatic Hydrocarbons)</option>
              <option value="F1500W">F1500W (15.0µm - MIRI CO₂ Bending Mode)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-emerald-400 uppercase mb-1">Green Channel (Continuum)</label>
            <select
              value={greenChannel}
              onChange={(e) => setGreenChannel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200"
            >
              <option value="F200W">F200W (2.0µm - NIRCam Primary)</option>
              <option value="F277W">F277W (2.8µm - Water Ice Band)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cyan-400 uppercase mb-1">Blue Channel (Shortwave)</label>
            <select
              value={blueChannel}
              onChange={(e) => setBlueChannel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200"
            >
              <option value="F150W">F150W (1.5µm - NIRCam Shortwave)</option>
              <option value="F090W">F090W (0.9µm - Lyman-Alpha)</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1">
              <span>Contrast & Emission Gain</span>
              <span className="text-rose-400 font-bold">{contrastBoost.toFixed(2)}x</span>
            </div>
            <input
              type="range" min="0.8" max="2.5" step="0.05"
              value={contrastBoost}
              onChange={(e) => setContrastBoost(Number(e.target.value))}
              className="w-full accent-rose-500 bg-slate-950"
            />
          </div>

          <div className="bg-slate-950 border border-rose-950 p-4 rounded-2xl text-xs space-y-2">
            <span className="font-bold text-rose-400 block">🧪 Carbon Dioxide ($CO_2$) Signature</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              JWST's NIRSpec prism captures the iconic 4.3µm CO₂ absorption feature with high signal-to-noise ratio.
            </p>
          </div>
        </div>

        {/* Interactive Wavelength Canvas */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative h-[340px]">
            <canvas ref={spectrumCanvasRef} className="w-full h-full" />
          </div>

          {/* Line Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lines.map((line) => (
              <div
                key={line.id}
                onMouseEnter={() => setHoveredLine(line)}
                onMouseLeave={() => setHoveredLine(null)}
                className={`p-4 rounded-2xl border transition cursor-pointer ${
                  hoveredLine?.id === line.id
                    ? 'bg-slate-900 border-rose-500 shadow-xl'
                    : 'bg-slate-950/80 border-slate-900 hover:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs" style={{ color: line.color }}>{line.molecule}</span>
                  <span className="text-[10px] font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-400">{line.wavelengthMicrons} µm</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{line.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
