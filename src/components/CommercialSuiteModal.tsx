import React, { useState } from 'react';

interface CommercialSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnableKioskMode: () => void;
  onEnableLabMode: () => void;
}

export const CommercialSuiteModal: React.FC<CommercialSuiteModalProps> = ({
  isOpen,
  onClose,
  onEnableKioskMode,
  onEnableLabMode,
}) => {
  const [activeTab, setActiveTab] = useState<'museums' | 'academia' | 'pro'>('museums');
  const [pilotSubmitted, setPilotSubmitted] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-4xl rounded-2xl border border-cyan-500/30 bg-slate-950/90 p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              AetherOS Enterprise &amp; Educational Editions
            </h2>
            <p className="text-xs text-slate-400">
              Interactive 3D Astrophysics Software for Planetariums, Universities &amp; Creators
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Audience Selector Tabs */}
        <div className="mt-6 flex border-b border-slate-800 space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('museums')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition ${
              activeTab === 'museums'
                ? 'bg-cyan-950/50 text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🏛️ Museum &amp; Planetarium Kiosk
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('academia')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition ${
              activeTab === 'academia'
                ? 'bg-cyan-950/50 text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🎓 Higher Education &amp; Labs
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pro')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition ${
              activeTab === 'pro'
                ? 'bg-cyan-950/50 text-cyan-400 border-b-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🔭 Pro &amp; Steam Retail
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-6 space-y-6">
          {activeTab === 'museums' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-cyan-900/40 bg-cyan-950/20 p-4">
                <h3 className="font-semibold text-cyan-300 text-lg">Interactive Touch-Table Exhibit Mode</h3>
                <p className="text-sm text-slate-300 mt-1">
                  Replaces static plaques with interactive 4K/8K visual displays. Includes continuous 3D attract loops, screen lock, and idle auto-reset.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      onEnableKioskMode();
                      onClose();
                    }}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-semibold text-white shadow-lg transition"
                  >
                    ▶ Launch Kiosk Mode Test Drive
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                  <span className="font-bold text-cyan-400 block mb-1">Full-Spectrum Hardware</span>
                  Supports multi-touch gestures, ultra-wide touch tables, and high-framerate WebGL renders.
                </div>
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                  <span className="font-bold text-cyan-400 block mb-1">NASA Live Ground Link</span>
                  Live DSN telemetry from Goldstone, Madrid, and Canberra stations.
                </div>
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                  <span className="font-bold text-cyan-400 block mb-1">Custom Branding</span>
                  Integrate your institution’s branding and custom exhibit narration.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'academia' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-indigo-900/40 bg-indigo-950/20 p-4">
                <h3 className="font-semibold text-indigo-300 text-lg">Astrophysics Curriculum Suite</h3>
                <p className="text-sm text-slate-300 mt-1">
                  Ready-to-use digital lab worksheets covering Mandel-Agol exoplanet transits, Keplerian orbit dynamics, and JWST spectroscopy analysis.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      onEnableLabMode();
                      onClose();
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold text-white shadow-lg transition"
                  >
                    ▶ Load Academic Lab Suite
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                  <span className="font-bold text-indigo-400 block mb-1">FITS &amp; CSV Data Export</span>
                  Students can download synthetic raw observation data for Python/Jupyter notebook processing.
                </div>
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                  <span className="font-bold text-indigo-400 block mb-1">Department Seat Licenses</span>
                  Unlimited campus access for undergraduate and graduate astrophysics courses.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pro' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-purple-900/40 bg-purple-950/20 p-4">
                <h3 className="font-semibold text-purple-300 text-lg">Consumer Pro &amp; Creator Edition</h3>
                <p className="text-sm text-slate-300 mt-1">
                  Designed for amateur astronomers, science communicators, and space enthusiasts.
                </p>
                <div className="mt-4">
                  <span className="inline-block px-3 py-1 bg-purple-900/60 text-purple-300 text-xs font-semibold rounded-full">
                    Coming Soon to Steam &amp; Mac App Store ($49.99)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lead Capture Form for Exhibit Directors */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <h4 className="text-sm font-semibold text-slate-200">Request a 30-Day Institution Trial or Proposal</h4>
          {pilotSubmitted ? (
            <div className="mt-3 p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs rounded-lg">
              ✓ Pilot request received. Our team will contact you within 24 hours with your custom exhibit preview link.
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setPilotSubmitted(true);
              }}
              className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3"
            >
              <input
                type="email"
                required
                placeholder="Institutional Email (e.g., name@museum.org)"
                className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <input
                type="text"
                required
                placeholder="Institution Name"
                className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 font-semibold text-xs text-white rounded-lg transition"
              >
                Submit Pilot Request
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
