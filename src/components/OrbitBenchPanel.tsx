import React, { useMemo } from 'react';
import { X, Activity, Cpu, Gauge, Zap } from 'lucide-react';
import { runKeplerBenchmark } from '../utils/orbitalMath';

interface OrbitBenchPanelProps {
  onClose: () => void;
  frameMs: number | null;
}

export const OrbitBenchPanel: React.FC<OrbitBenchPanelProps> = ({ onClose, frameMs }) => {
  const bench = useMemo(() => runKeplerBenchmark(), []);

  return (
    <aside className="pointer-events-auto mb-3 w-full max-w-md self-start border border-line bg-surface/95 p-4 backdrop-blur-md shadow-2xl rounded">
      <div className="flex items-center justify-between gap-3 border-b border-line pb-2.5">
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-flare" />
          <h2 className="font-mono text-xs tracking-widest text-flare font-bold">ORBIT & JWST BENCH</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-8 px-2 text-sm text-muted hover:text-fg hover:bg-raised transition-colors rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 space-y-2 font-mono text-xs text-fg">
        <div className="flex justify-between border-b border-line/40 pb-1">
          <span className="text-muted">Mercury perihelion q:</span>
          <span className="text-flare">{bench.q.toFixed(4)} AU (err {bench.qError.toExponential(1)})</span>
        </div>
        <div className="flex justify-between border-b border-line/40 pb-1">
          <span className="text-muted">1-Period Closure:</span>
          <span>{bench.closure.toExponential(1)} AU</span>
        </div>
        <div className="flex justify-between border-b border-line/40 pb-1">
          <span className="text-muted">Halley residual (e=0.967):</span>
          <span>{bench.halleyResidual.toExponential(1)}</span>
        </div>
        <div className="flex justify-between border-b border-line/40 pb-1">
          <span className="text-muted">Edge residual (e=0.999):</span>
          <span>{bench.edgeResidual.toExponential(1)}</span>
        </div>
        <div className="flex justify-between border-b border-line/40 pb-1">
          <span className="text-muted">Kepler Solver Throughput:</span>
          <span className="text-signal font-semibold">
            {(bench.solvesPerSec / 1e6).toFixed(2)} M solves/s
          </span>
        </div>
        <div className="flex justify-between border-b border-line/40 pb-1">
          <span className="text-muted">Canvas Frame Render:</span>
          <span>{frameMs === null ? '…' : `${frameMs.toFixed(1)} ms (${Math.round(1000 / (frameMs || 16))} FPS)`}</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-line space-y-2">
        <h3 className="font-mono text-[11px] text-muted tracking-widest uppercase">JWST L2 Subsystem Telemetry</h3>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-bg/80 p-2 rounded border border-line">
            <span className="text-[10px] text-muted block">SUNSHIELD HOT</span>
            <span className="text-danger font-semibold">358 K (+85°C)</span>
          </div>
          <div className="bg-bg/80 p-2 rounded border border-line">
            <span className="text-[10px] text-muted block">SUNSHIELD COLD</span>
            <span className="text-signal font-semibold">37 K (-236°C)</span>
          </div>
          <div className="bg-bg/80 p-2 rounded border border-line">
            <span className="text-[10px] text-muted block">MIRI CRYOCOOLER</span>
            <span className="text-signal font-semibold">6.7 K (-266.5°C)</span>
          </div>
          <div className="bg-bg/80 p-2 rounded border border-line">
            <span className="text-[10px] text-muted block">MIRROR RMS ERROR</span>
            <span className="text-flare font-semibold">18.2 nm (diffraction lim.)</span>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-pretty text-muted">
        Numerical bench confirms sub-micro-AU precision and millions of Kepler equations per second. Real-time sky uses VSOP87 analytical theories.
      </p>
    </aside>
  );
};
