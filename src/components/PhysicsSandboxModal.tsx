import React, { useState, useRef, useEffect } from 'react';
import { Sliders, Zap, RefreshCw, BarChart3, Database, Check, AlertCircle, Play, Pause } from 'lucide-react';
import { useAuth } from './AuthContext';

interface PhysicsSandboxModalProps {
  onClose: () => void;
}

export const PhysicsSandboxModal: React.FC<PhysicsSandboxModalProps> = ({ onClose }) => {
  const { user, idToken } = useAuth();

  // Physics Parameters
  const [gravitationalConstant, setGravitationalConstant] = useState<number>(1.0); // Multiplier G/G_0
  const [stellarMass, setStellarMass] = useState<number>(1.0); // Solar masses M_*
  const [semiMajorAxis, setSemiMajorAxis] = useState<number>(0.05); // AU
  const [planetRadius, setPlanetRadius] = useState<number>(1.1); // R_Jupiter
  const [starRadius, setStarRadius] = useState<number>(1.0); // R_Sun

  // Observational Noise Parameters
  const [noiseLevelPpt, setNoiseLevelPpt] = useState<number>(1.2); // ppt (parts per thousand)
  const [cadencePoints, setCadencePoints] = useState<number>(200); // Number of cadence observations

  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [savedToDb, setSavedToDb] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Derived Keplerian Physics Calculations
  // Kepler's Third Law: T^2 = (4*pi^2 / G*M_*) * a^3
  // Standard period for a=0.05 AU, M_*=1 M_Sun, G=1 is ~4.02 days
  const basePeriodDays = 365.25 * Math.sqrt(Math.pow(semiMajorAxis, 3) / (stellarMass || 1));
  const effectivePeriodDays = basePeriodDays / Math.sqrt(Math.max(0.01, gravitationalConstant));
  const orbitalVelocityKmS = 29.78 * Math.sqrt((gravitationalConstant * stellarMass) / Math.max(0.001, semiMajorAxis));

  // Transit Geometry & Depth
  const radiusRatio = (planetRadius * 0.10045) / Math.max(0.1, starRadius);
  const geometricDepthPercent = radiusRatio * radiusRatio * 100;
  const transitDepthPpt = geometricDepthPercent * 10; // ppt (parts per thousand)

  // Statistical Fit & Signal-to-Noise Ratio (SNR)
  const snrRatio = (transitDepthPpt * Math.sqrt(cadencePoints)) / Math.max(0.05, noiseLevelPpt);
  const reducedChiSquared = Number((1.0 + (noiseLevelPpt / 4.0) * (0.8 + Math.random() * 0.4)).toFixed(2));
  const detectionConfidence = snrRatio > 8.0 ? 'High Confidence (5σ+ Detection)' : snrRatio > 3.0 ? 'Marginal Signal (3σ Candidate)' : 'Below Detection Threshold (Noise Dominated)';

  // Canvas rendering of real-time transit & keplerian orbit
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let timePhase = 0;

    const render = () => {
      const w = (canvas.width = canvas.clientWidth * window.devicePixelRatio || 600);
      const h = (canvas.height = canvas.clientHeight * window.devicePixelRatio || 320);

      ctx.fillStyle = '#05070c';
      ctx.fillRect(0, 0, w, h);

      if (isSimulating) {
        // Orbit speed scales with sqrt(G)
        timePhase = (timePhase + 0.006 * Math.sqrt(gravitationalConstant)) % (Math.PI * 2);
      }

      // UPPER PANEL: 2D Keplerian Orbit & Stellar System
      const topH = h * 0.45;
      const cx = w / 2;
      const cy = topH / 2;

      // Draw Orbit Ellipse
      const orbitRx = Math.min(w * 0.35, 160 * Math.pow(semiMajorAxis / 0.05, 0.4));
      const orbitRy = orbitRx * 0.4;

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, orbitRx, orbitRy, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Host Star
      const starR = Math.max(8, 22 * starRadius);
      const starGrad = ctx.createRadialGradient(cx, cy, starR * 0.2, cx, cy, starR);
      starGrad.addColorStop(0, '#ffffff');
      starGrad.addColorStop(0.5, '#f59e0b');
      starGrad.addColorStop(1, '#d97706');
      ctx.fillStyle = starGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, starR, 0, Math.PI * 2);
      ctx.fill();

      // Transiting Planet Position on Orbit
      const planetX = cx + Math.cos(timePhase) * orbitRx;
      const planetY = cy + Math.sin(timePhase) * orbitRy;
      const planetR = Math.max(3, starR * radiusRatio);

      // Planet shadow
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(planetX, planetY, planetR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Velocity Vector Arrow
      const vx = -Math.sin(timePhase) * (orbitalVelocityKmS / 15);
      const vy = Math.cos(timePhase) * (orbitalVelocityKmS / 30);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(planetX, planetY);
      ctx.lineTo(planetX + vx, planetY + vy);
      ctx.stroke();

      // LOWER PANEL: Photometric Light Curve with Noise
      const botY = topH + 15;
      const botH = h - botY - 25;
      const baselineY = botY + botH * 0.25;
      const dipPx = botH * 0.6;

      // Axis / Grid Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(40, baselineY);
      ctx.lineTo(w - 20, baselineY);
      ctx.moveTo(40, baselineY + dipPx);
      ctx.lineTo(w - 20, baselineY + dipPx);
      ctx.stroke();
      ctx.setLineDash([]);

      // Axis Labels
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText('1.000 F₀', 4, baselineY + 3);
      ctx.fillText(`-${transitDepthPpt.toFixed(1)} ppt`, 4, baselineY + dipPx + 3);

      // Plot Theoretical Analytical Transit Curve
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();

      const transitCenterNorm = 0.5;
      const transitWidthNorm = 0.2;

      for (let i = 0; i <= cadencePoints; i++) {
        const normX = i / cadencePoints;
        const px = 40 + normX * (w - 65);
        const distFromCenter = Math.abs(normX - transitCenterNorm);
        let dipFrac = 0;

        if (distFromCenter < transitWidthNorm) {
          const u = distFromCenter / transitWidthNorm;
          dipFrac = Math.cos(u * Math.PI * 0.5) ** 1.8;
        }

        const py = baselineY + dipFrac * dipPx;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Scatter Observational Cadence Data Points with Noise (sigma = noiseLevelPpt)
      ctx.fillStyle = 'rgba(245, 158, 11, 0.75)';
      for (let i = 0; i < cadencePoints; i++) {
        const normX = i / cadencePoints;
        const px = 40 + normX * (w - 65);
        const distFromCenter = Math.abs(normX - transitCenterNorm);
        let dipFrac = 0;

        if (distFromCenter < transitWidthNorm) {
          const u = distFromCenter / transitWidthNorm;
          dipFrac = Math.cos(u * Math.PI * 0.5) ** 1.8;
        }

        // Gaussian noise simulation
        const randGaussian = (Math.sin(i * 17.1 + timePhase) + Math.cos(i * 43.3) + Math.sin(i * 91.7)) / 1.73;
        const noisePx = randGaussian * (noiseLevelPpt / 10) * (dipPx / 2.5);
        const py = baselineY + dipFrac * dipPx + noisePx;

        ctx.beginPath();
        ctx.arc(px, py, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Current Phase Cursor Line
      const currentXNorm = (timePhase / (Math.PI * 2));
      const cursorX = 40 + currentXNorm * (w - 65);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cursorX, botY);
      ctx.lineTo(cursorX, botY + botH);
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    gravitationalConstant,
    stellarMass,
    semiMajorAxis,
    planetRadius,
    starRadius,
    noiseLevelPpt,
    cadencePoints,
    isSimulating,
    radiusRatio,
    transitDepthPpt,
    orbitalVelocityKmS,
  ]);

  // Preset Physics Experiments
  const applyPreset = (preset: 'super_g' | 'jwst_high_precision' | 'high_noise' | 'micro_g') => {
    if (preset === 'super_g') {
      setGravitationalConstant(3.5);
      setStellarMass(1.8);
      setSemiMajorAxis(0.04);
      setNoiseLevelPpt(0.8);
    } else if (preset === 'jwst_high_precision') {
      setGravitationalConstant(1.0);
      setStellarMass(1.0);
      setSemiMajorAxis(0.05);
      setNoiseLevelPpt(0.08); // Ultra-clean JWST NIRSpec noise
      setCadencePoints(300);
    } else if (preset === 'high_noise') {
      setGravitationalConstant(1.0);
      setStellarMass(1.0);
      setSemiMajorAxis(0.06);
      setNoiseLevelPpt(8.5); // High ground-based atmospheric jitter
    } else if (preset === 'micro_g') {
      setGravitationalConstant(0.2);
      setStellarMass(0.5);
      setSemiMajorAxis(0.12);
      setNoiseLevelPpt(1.5);
    }
  };

  const handleSaveToCloudSql = async () => {
    if (!user || !idToken) return;

    try {
      const res = await fetch('/api/observations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          targetName: `Physics Sandbox: G=${gravitationalConstant}x, σ=${noiseLevelPpt}ppt`,
          targetId: 'physics_sandbox',
          category: 'Physics Sandbox',
          notes: `G Constant: ${gravitationalConstant}x, Period: ${effectivePeriodDays.toFixed(2)}d, Orbit Speed: ${orbitalVelocityKmS.toFixed(1)} km/s, Depth: ${transitDepthPpt.toFixed(2)} ppt, SNR: ${snrRatio.toFixed(1)} (χ²=${reducedChiSquared})`,
          wavelengthBand: 'Simulation Physics Engine',
          snrRatio: `${snrRatio.toFixed(1)} dB`,
        }),
      });

      if (res.ok) {
        setSavedToDb(true);
        setTimeout(() => setSavedToDb(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save sandbox result:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-4xl rounded-2xl border border-cyan-500/40 bg-slate-950/95 p-6 shadow-2xl text-slate-100 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-mono tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent flex items-center gap-2">
                ASTROPHYSICS &amp; GRAVITY SANDBOX
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  REAL-TIME SIMULATOR
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Adjust Gravitational Constant G, Photometric Noise σ, and Stellar Mass to observe Keplerian dynamics in real time
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* PRESET EXPERIMENTS BUTTONS */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-b border-slate-800/80 pb-3">
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            Physics Presets:
          </span>
          <button
            type="button"
            onClick={() => applyPreset('jwst_high_precision')}
            className="px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono rounded-lg transition"
          >
            🔭 JWST Ultra-Clean (σ = 0.08 ppt)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('super_g')}
            className="px-3 py-1.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-300 text-xs font-mono rounded-lg transition"
          >
            ⚡ Super-G Constant (G = 3.5x)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('high_noise')}
            className="px-3 py-1.5 bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-mono rounded-lg transition"
          >
            📊 High Atmospheric Noise (σ = 8.5 ppt)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('micro_g')}
            className="px-3 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 text-xs font-mono rounded-lg transition"
          >
            🌌 Micro-Gravity Orbit (G = 0.2x)
          </button>
          <button
            type="button"
            onClick={() => setIsSimulating(!isSimulating)}
            className={`ml-auto px-3 py-1.5 border rounded-lg text-xs font-mono flex items-center gap-1.5 transition ${
              isSimulating
                ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
            }`}
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isSimulating ? 'Pause Orbit' : 'Resume Orbit'}
          </button>
        </div>

        {/* MAIN CANVAS RENDERER */}
        <div className="mt-4 h-64 sm:h-72 w-full border border-slate-800 bg-slate-950 rounded-xl overflow-hidden relative shadow-inner">
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>

        {/* ANALYTICAL READOUTS HUD */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Kepler Orbital Period</span>
            <span className="text-base font-bold font-mono text-cyan-300 mt-0.5 block">
              {effectivePeriodDays.toFixed(2)} Days
            </span>
            <span className="text-[10px] text-slate-500 block">T ∝ G⁻¹/² M_*⁻¹/²</span>
          </div>

          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Orbital Speed (v)</span>
            <span className="text-base font-bold font-mono text-amber-300 mt-0.5 block">
              {orbitalVelocityKmS.toFixed(1)} km/s
            </span>
            <span className="text-[10px] text-slate-500 block">v = √(G M_* / a)</span>
          </div>

          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Transit Dip Depth</span>
            <span className="text-base font-bold font-mono text-emerald-400 mt-0.5 block">
              {transitDepthPpt.toFixed(2)} ppt ({geometricDepthPercent.toFixed(2)}%)
            </span>
            <span className="text-[10px] text-slate-500 block">ΔF = (R_p / R_*)²</span>
          </div>

          <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Signal-To-Noise (SNR)</span>
            <span className="text-base font-bold font-mono text-cyan-400 mt-0.5 block">
              {snrRatio.toFixed(1)} σ
            </span>
            <span className="text-[10px] text-slate-500 block">χ² / dof = {reducedChiSquared}</span>
          </div>
        </div>

        {/* INTERACTIVE CONTROLS SLIDERS */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/50 p-4 border border-slate-800 rounded-xl">
          {/* Gravitational Constant G Multiplier */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-mono text-xs">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Gravitational Constant (G / G₀)
              </span>
              <span className="text-amber-300 font-bold">{gravitationalConstant.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="5.0"
              step="0.1"
              value={gravitationalConstant}
              onChange={(e) => setGravitationalConstant(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {/* Photometric Noise Level sigma */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-mono text-xs">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                Light Curve Photometric Noise (σ)
              </span>
              <span className="text-cyan-300 font-bold">{noiseLevelPpt.toFixed(2)} ppt</span>
            </div>
            <input
              type="range"
              min="0.02"
              max="10.0"
              step="0.05"
              value={noiseLevelPpt}
              onChange={(e) => setNoiseLevelPpt(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Host Star Mass M_* */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-mono text-xs">
              <span className="text-slate-400">Host Star Mass (M_*)</span>
              <span className="text-slate-200 font-semibold">{stellarMass.toFixed(2)} M☉</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.05"
              value={stellarMass}
              onChange={(e) => setStellarMass(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
            />
          </div>

          {/* Semi-Major Axis a */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-mono text-xs">
              <span className="text-slate-400">Semi-Major Axis (a)</span>
              <span className="text-slate-200 font-semibold">{semiMajorAxis.toFixed(3)} AU</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.25"
              step="0.005"
              value={semiMajorAxis}
              onChange={(e) => setSemiMajorAxis(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
            />
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="font-mono text-slate-400 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${snrRatio > 8 ? 'bg-emerald-400' : snrRatio > 3 ? 'bg-amber-400' : 'bg-red-400'}`} />
            <span>Detection Status: <strong className="text-slate-200">{detectionConfidence}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            {user && (
              <button
                type="button"
                onClick={handleSaveToCloudSql}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-xs rounded-lg transition flex items-center gap-1.5"
              >
                {savedToDb ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Saved Result to Cloud SQL!
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5 text-cyan-400" />
                    Save Physics Benchmark to Cloud SQL
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
