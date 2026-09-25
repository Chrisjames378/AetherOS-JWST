import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>NATIVE PWA</span>
      </div>
    );
  }

  if (isInstallable) {
    return (
      <button
        id="btn-pwa-install"
        onClick={install}
        className="flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-all shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
        title="Install AetherOS JWST onto desktop or mobile"
      >
        <Download className="w-3.5 h-3.5" />
        <span>INSTALL APP</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          id="btn-pwa-install-ios"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 px-3 py-1.5 text-xs font-mono hover:bg-amber-500/20 transition cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>INSTALL ON IOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
            <div className="w-full max-w-sm rounded-xl bg-slate-900 border border-amber-500/30 p-6 shadow-2xl relative">
              <button 
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-bold text-amber-400 font-mono flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Install AetherOS on iOS
              </h3>
              <p className="mt-3 text-xs text-slate-300 leading-relaxed font-sans">
                To run AetherOS as a full-screen, low-latency PWA on iPhone or iPad:
              </p>
              <ol className="mt-3 space-y-2 text-xs text-slate-300 font-mono bg-slate-950 p-3 rounded-lg border border-slate-800">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">1.</span>
                  <span>Tap the <strong>Share</strong> button in Safari toolbar.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">2.</span>
                  <span>Scroll down & select <strong>Add to Home Screen</strong>.</span>
                </li>
              </ol>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-lg bg-amber-500 text-slate-950 py-2 text-xs font-bold font-mono hover:bg-amber-400 transition"
              >
                GOT IT
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <button
      id="btn-pwa-direct"
      onClick={install}
      className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 px-3 py-1.5 text-xs font-mono hover:border-amber-500/40 hover:text-amber-300 transition cursor-pointer"
      title="Install AetherOS Web App"
    >
      <Download className="w-3.5 h-3.5 text-amber-400" />
      <span>PWA READY</span>
    </button>
  );
};
