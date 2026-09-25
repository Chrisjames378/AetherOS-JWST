import React, { useRef, useEffect, useState } from 'react';
import { Compass, Move, RotateCcw, Maximize2, Orbit, Navigation, Zap, AlertCircle } from 'lucide-react';
import { JWSTTelemetry } from '../types';

interface FlightEngineProps {
  telemetry: JWSTTelemetry;
  onUpdateTelemetry: (updates: Partial<JWSTTelemetry>) => void;
}

export const FlightEngine: React.FC<FlightEngineProps> = ({ telemetry, onUpdateTelemetry }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [yaw, setYaw] = useState<number>(telemetry.yawDeg || 45);
  const [pitch, setPitch] = useState<number>(telemetry.pitchDeg || 15);
  const [zoom, setZoom] = useState<number>(telemetry.zoom || 1.2);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [flightPathMode, setFlightPathMode] = useState<'l2_halo' | 'earth_l2_transfer' | 'deep_space_target'>('l2_halo');
  const [activeTargetName, setActiveTargetName] = useState<string>('Lagrange Point L2');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const render = () => {
      time += 0.015;
      const width = (canvas.width = canvas.parentElement?.clientWidth || 800);
      const height = (canvas.height = canvas.parentElement?.clientHeight || 550);
      const cx = width / 2;
      const cy = height / 2;

      // Deep space background
      ctx.fillStyle = '#05070d';
      ctx.fillRect(0, 0, width, height);

      // Distant stars grid
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 400; i++) {
        const starX = (i * 137.5 + yaw * 8) % width;
        const starY = (i * 293.1 + pitch * 8) % height;
        const actualX = starX < 0 ? starX + width : starX;
        const actualY = starY < 0 ? starY + height : starY;
        const starSize = ((i % 4) + 0.5) * Math.min(1.5, zoom * 0.8);
        ctx.globalAlpha = ((i % 5 + 1) / 5) * 0.8;
        ctx.fillRect(actualX, actualY, starSize, starSize);
      }
      ctx.globalAlpha = 1.0;

      // Coordinate System Projection
      const yawRad = (yaw * Math.PI) / 180;
      const pitchRad = (pitch * Math.PI) / 180;

      // Project 3D vector to 2D Screen
      const project = (x: number, y: number, z: number) => {
        // Yaw rotation around Y
        const x1 = x * Math.cos(yawRad) - z * Math.sin(yawRad);
        const z1 = x * Math.sin(yawRad) + z * Math.cos(yawRad);
        // Pitch rotation around X
        const y2 = y * Math.cos(pitchRad) - z1 * Math.sin(pitchRad);
        const z2 = y * Math.sin(pitchRad) + z1 * Math.cos(pitchRad);

        const scale = (450 * zoom) / (450 + z2 * 0.5);
        return {
          sx: cx + x1 * scale,
          sy: cy + y2 * scale,
          scale,
          z2,
        };
      };

      // 1. Draw Sun at (-350, 0, -200)
      const sun3D = { x: -380 + Math.sin(time * 0.2) * 10, y: -40, z: -250 };
      const sunProj = project(sun3D.x, sun3D.y, sun3D.z);

      const sunGlow = ctx.createRadialGradient(
        sunProj.sx, sunProj.sy, 5 * sunProj.scale,
        sunProj.sx, sunProj.sy, 110 * sunProj.scale
      );
      sunGlow.addColorStop(0, '#ffffff');
      sunGlow.addColorStop(0.2, '#fef08a');
      sunGlow.addColorStop(0.6, '#f59e0b');
      sunGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunProj.sx, sunProj.sy, 110 * sunProj.scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('SUN (1 AU)', sunProj.sx - 28, sunProj.sy + 45 * sunProj.scale);

      // 2. Draw Earth at (-120, 0, 0)
      const earth3D = { x: -160, y: 0, z: 0 };
      const earthProj = project(earth3D.x, earth3D.y, earth3D.z);

      // Earth atmosphere glow
      const earthGlow = ctx.createRadialGradient(
        earthProj.sx, earthProj.sy, 12 * earthProj.scale,
        earthProj.sx, earthProj.sy, 32 * earthProj.scale
      );
      earthGlow.addColorStop(0, '#38bdf8');
      earthGlow.addColorStop(0.7, '#0284c7');
      earthGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = earthGlow;
      ctx.beginPath();
      ctx.arc(earthProj.sx, earthProj.sy, 32 * earthProj.scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0ea5e9';
      ctx.beginPath();
      ctx.arc(earthProj.sx, earthProj.sy, 16 * earthProj.scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#bae6fd';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('EARTH', earthProj.sx - 18, earthProj.sy + 26 * earthProj.scale);

      // 3. Draw L2 Lagrange Point Orbit Ring
      const l2Center3D = { x: 180, y: 0, z: 0 };
      const l2Proj = project(l2Center3D.x, l2Center3D.y, l2Center3D.z);

      ctx.strokeStyle = 'rgba(234, 179, 8, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2; a += 0.1) {
        const hx = l2Center3D.x + Math.cos(a) * 45;
        const hy = Math.sin(a) * 25;
        const hz = Math.sin(a * 2) * 15;
        const hp = project(hx, hy, hz);
        if (a === 0) ctx.moveTo(hp.sx, hp.sy);
        else ctx.lineTo(hp.sx, hp.sy);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // 4. Draw Trajectory Vector Line from Earth to JWST
      const jwstOrbitalAngle = time * 0.4;
      const jwst3D = {
        x: l2Center3D.x + Math.cos(jwstOrbitalAngle) * 45,
        y: Math.sin(jwstOrbitalAngle) * 25,
        z: Math.sin(jwstOrbitalAngle * 2) * 15,
      };
      const jwstProj = project(jwst3D.x, jwst3D.y, jwst3D.z);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(earthProj.sx, earthProj.sy);
      ctx.lineTo(jwstProj.sx, jwstProj.sy);
      ctx.stroke();

      // Trajectory pulse particle
      const pulseProgress = (time * 0.8) % 1;
      const pulseX = earthProj.sx + (jwstProj.sx - earthProj.sx) * pulseProgress;
      const pulseY = earthProj.sy + (jwstProj.sy - earthProj.sy) * pulseProgress;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(pulseX, pulseY, 4 * zoom, 0, Math.PI * 2);
      ctx.fill();

      // 5. Draw JWST Spacecraft Model
      ctx.save();
      ctx.translate(jwstProj.sx, jwstProj.sy);
      ctx.scale(jwstProj.scale * 0.85, jwstProj.scale * 0.85);

      // Sunshield (Pink/Silver Diamond Base)
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(0, -35);
      ctx.lineTo(55, 12);
      ctx.lineTo(0, 35);
      ctx.lineTo(-55, 12);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Primary Mirror Hexagonal Array (Gold 18 Segments)
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(0, -8, 24, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      // Hex grid lines
      for (let h = 0; h < 6; h++) {
        const ha = (h * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(Math.cos(ha) * 24, -8 + Math.sin(ha) * 24);
        ctx.stroke();
      }

      // Secondary Mirror Boom Struts
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-18, -8);
      ctx.lineTo(0, -42);
      ctx.lineTo(18, -8);
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, -42, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Label JWST at L2
      ctx.fillStyle = '#eab308';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('JWST Observatory @ L2', jwstProj.sx - 70, jwstProj.sy + 45 * jwstProj.scale);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '10px monospace';
      ctx.fillText(`Ka-Band Link: 28.0 Mbps | Dist: 1,500,000 km`, jwstProj.sx - 95, jwstProj.sy + 60 * jwstProj.scale);

      // Crosshair HUD Targeter
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(jwstProj.sx - 50, jwstProj.sy - 50, 100, 100);

      ctx.fillStyle = '#eab308';
      ctx.fillText('LOCKED', jwstProj.sx - 20, jwstProj.sy - 55);

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [yaw, pitch, zoom, flightPathMode]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    const newYaw = (yaw + dx * 0.4) % 360;
    const newPitch = Math.max(-60, Math.min(60, pitch - dy * 0.4));
    setYaw(newYaw);
    setPitch(newPitch);
    setDragStart({ x: e.clientX, y: e.clientY });
    onUpdateTelemetry({ yawDeg: newYaw, pitchDeg: newPitch });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Control HUD */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-300 bg-clip-text text-transparent flex items-center space-x-2">
            <Compass className="w-6 h-6 text-amber-400 animate-spin" style={{ animationDuration: '30s' }} />
            <span>360° Flight & Telemetry Simulator</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Navigate between Earth, L2 Lagrange point, Sun, and deep space celestial targets with real-time vector projections.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFlightPathMode('l2_halo')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition ${flightPathMode === 'l2_halo' ? 'bg-amber-600 text-white shadow-lg' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'}`}
          >
            L2 Halo Orbit
          </button>
          <button
            onClick={() => setFlightPathMode('earth_l2_transfer')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition ${flightPathMode === 'earth_l2_transfer' ? 'bg-amber-600 text-white shadow-lg' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'}`}
          >
            Earth-L2 Vector
          </button>
        </div>
      </div>

      {/* Main Interactive 3D Canvas Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative h-[560px] flex flex-col">
          {/* Top Canvas Telemetry Overlay */}
          <div className="absolute top-4 left-4 z-10 bg-slate-950/90 backdrop-blur border border-slate-800 px-4 py-2.5 rounded-xl text-xs font-mono text-amber-400 flex items-center space-x-4 shadow-xl">
            <span>Yaw: {yaw.toFixed(0)}°</span>
            <span>•</span>
            <span>Pitch: {pitch.toFixed(0)}°</span>
            <span>•</span>
            <span>Zoom: {zoom.toFixed(1)}x</span>
            <span>•</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Ka-Band Downlink Active
            </span>
          </div>

          <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
            <button
              onClick={() => { setZoom(prev => Math.min(3.0, prev + 0.25)); onUpdateTelemetry({ zoom: zoom + 0.25 }); }}
              className="bg-slate-950/80 hover:bg-slate-900 text-amber-400 border border-slate-800 px-3 py-2 rounded-xl text-xs font-bold shadow cursor-pointer"
            >
              Zoom In (+)
            </button>
            <button
              onClick={() => { setZoom(prev => Math.max(0.5, prev - 0.25)); onUpdateTelemetry({ zoom: zoom - 0.25 }); }}
              className="bg-slate-950/80 hover:bg-slate-900 text-amber-400 border border-slate-800 px-3 py-2 rounded-xl text-xs font-bold shadow cursor-pointer"
            >
              Zoom Out (-)
            </button>
            <button
              onClick={() => { setYaw(45); setPitch(15); setZoom(1.2); }}
              className="bg-slate-950/80 hover:bg-slate-900 text-slate-400 border border-slate-800 p-2.5 rounded-xl text-xs font-bold shadow cursor-pointer"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />

          <div className="absolute bottom-4 left-4 right-4 bg-slate-950/90 backdrop-blur border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between text-xs text-slate-300 shadow-2xl">
            <div className="flex items-center space-x-2">
              <Move className="w-4 h-4 text-amber-400" />
              <span>Click and drag mouse inside canvas to pan 360° orbital view. Use buttons or scroll wheel to zoom.</span>
            </div>
            <span className="text-emerald-400 font-mono font-bold">L2 Orbit Locked</span>
          </div>
        </div>

        {/* Telemetry Stats Panel */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold text-slate-200 text-md mb-4 flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Live Telemetry Stream</span>
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div className="bg-slate-950 border border-slate-900 p-3.5 rounded-2xl flex justify-between items-center">
                <span className="text-slate-400">L2 Distance</span>
                <span className="font-bold text-amber-400">1,500,000 km</span>
              </div>
              <div className="bg-slate-950 border border-slate-900 p-3.5 rounded-2xl flex justify-between items-center">
                <span className="text-slate-400">Sunshield Hot Side</span>
                <span className="font-bold text-rose-400">+85°C (358 K)</span>
              </div>
              <div className="bg-slate-950 border border-slate-900 p-3.5 rounded-2xl flex justify-between items-center">
                <span className="text-slate-400">Sunshield Cold Side</span>
                <span className="font-bold text-cyan-400">-233.2°C (37 K)</span>
              </div>
              <div className="bg-slate-950 border border-slate-900 p-3.5 rounded-2xl flex justify-between items-center">
                <span className="text-slate-400">MIRI Cryocooler</span>
                <span className="font-bold text-indigo-400">-266.5°C (6.7 K)</span>
              </div>
              <div className="bg-slate-950 border border-slate-900 p-3.5 rounded-2xl flex justify-between items-center">
                <span className="text-slate-400">Mirror RMS Error</span>
                <span className="font-bold text-emerald-400">18.2 nm (Optimal)</span>
              </div>
              <div className="bg-slate-950 border border-slate-900 p-3.5 rounded-2xl flex justify-between items-center">
                <span className="text-slate-400">Downlink Data Rate</span>
                <span className="font-bold text-amber-400">28.0 Mbps (Ka-band)</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 border border-emerald-900/50 p-4 rounded-2xl text-xs space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Primary Optics Aligned</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              All 18 beryllium primary mirror segments are phased to within 1/20th of a wavelength.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
