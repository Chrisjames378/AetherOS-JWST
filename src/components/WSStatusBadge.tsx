import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface WSStatus {
  readyState: number;
  label: string;
}

declare global {
  interface Window {
    __wsState?: WSStatus;
  }
}

export const WSStatusBadge: React.FC = () => {
  const [status, setStatus] = useState<WSStatus>(
    () => window.__wsState || { readyState: 1, label: 'CONNECTED' }
  );

  useEffect(() => {
    const handleStateChange = (e: Event) => {
      const customEvt = e as CustomEvent<WSStatus>;
      if (customEvt.detail) {
        setStatus(customEvt.detail);
      }
    };

    window.addEventListener('ws-status-change', handleStateChange);
    return () => {
      window.removeEventListener('ws-status-change', handleStateChange);
    };
  }, []);

  const isConnected = status.readyState === 1;

  return (
    <div
      className={`min-h-10 px-3 py-1.5 text-xs font-mono rounded border transition-colors flex items-center gap-2 shadow-lg ${
        isConnected
          ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
          : 'border-amber-500/40 bg-amber-950/40 text-amber-300 animate-pulse'
      }`}
      title={`WebSocket Connection State: ${status.label} (readyState: ${status.readyState})`}
    >
      <span className="relative flex h-2 w-2">
        {isConnected ? (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </>
        ) : (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </>
        )}
      </span>

      {isConnected ? (
        <Wifi className="w-3.5 h-3.5 text-emerald-400" />
      ) : (
        <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      )}
      <span className="font-bold uppercase tracking-wider text-[11px]">
        {isConnected ? 'WS CONNECTED' : 'WS RECONNECTING'}
      </span>
    </div>
  );
};
