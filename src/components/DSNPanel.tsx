import React, { useState, useEffect } from 'react';
import {
  Radio,
  X,
  ExternalLink,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Zap,
  Globe,
  Activity,
} from 'lucide-react';
import {
  DSNFeedData,
  fetchLiveDSNData,
  countTotalSignals,
  formatCraftName,
  craftToSkyId,
  formatDataRate,
} from '../utils/dsnTelemetry';
import { JWSTRealtimeLink } from './JWSTRealtimeLink';

interface DSNPanelProps {
  onClose: () => void;
  onFly: (skyId: string) => void;
  onOpenViewfinder?: () => void;
}

export const DSNPanel: React.FC<DSNPanelProps> = ({ onClose, onFly, onOpenViewfinder }) => {
  const [activeTab, setActiveTab] = useState<'realtime-link' | 'antennas'>('realtime-link');
  const [data, setData] = useState<DSNFeedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const feed = await fetchLiveDSNData();
        if (mounted) {
          setData(feed);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'DSN feed currently unreachable');
          setLoading(false);
        }
      }
    };

    loadData();
    const interval = setInterval(loadData, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const totalSignals = data ? countTotalSignals(data) : 0;
  const updateTimestamp = data?.stations.find((s) => s.updatedMs > 0)?.updatedMs;
  const timeFormatted = updateTimestamp
    ? new Date(updateTimestamp).toISOString().slice(11, 19) + ' UTC'
    : 'Live stream';

  return (
    <aside className="pointer-events-auto mb-3 flex max-h-[68vh] sm:max-h-[75vh] w-full max-w-lg flex-col self-start border border-line bg-surface/95 backdrop-blur-md shadow-2xl rounded overflow-hidden">
      {/* 1. HEADER */}
      <div className="flex items-center justify-between gap-3 px-4 pt-3.5 pb-2 border-b border-line bg-bg/50">
        <div className="flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-signal animate-pulse" />
          <h2 className="font-mono text-xs tracking-widest text-flare font-bold uppercase">
            DEEP SPACE NETWORK · TELEMETRY
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-8 px-2 text-sm text-muted hover:text-fg hover:bg-raised transition-colors rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. SUB-TABS */}
      <div className="flex border-b border-line bg-bg/40 px-3 pt-2 gap-2 text-xs font-mono">
        <button
          type="button"
          onClick={() => setActiveTab('realtime-link')}
          className={`pb-2 px-2.5 flex items-center gap-1.5 transition-colors border-b-2 font-semibold ${
            activeTab === 'realtime-link'
              ? 'border-signal text-signal'
              : 'border-transparent text-muted hover:text-fg'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          JWST Real-Time Link
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('antennas')}
          className={`pb-2 px-2.5 flex items-center gap-1.5 transition-colors border-b-2 font-semibold ${
            activeTab === 'antennas'
              ? 'border-flare text-flare'
              : 'border-transparent text-muted hover:text-fg'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          DSN Ground Dishes ({totalSignals})
        </button>
      </div>

      {/* 3. SUB-BAR INFO */}
      <div className="px-4 py-1.5 border-b border-line bg-bg/20 text-[11px] text-muted flex items-center justify-between font-mono">
        <span>
          {activeTab === 'realtime-link'
            ? 'Sun-Earth L2 link · Ka-Band 28 Mb/s · Carrier locked'
            : loading
            ? 'Querying NASA eyes.nasa.gov...'
            : `${totalSignals} active carriers · ${timeFormatted} · 15s poll`}
        </span>
        {loading && <RefreshCw className="w-3 h-3 animate-spin text-flare" />}
      </div>

      {error && activeTab === 'antennas' && (
        <div className="px-4 py-2 text-xs text-danger bg-danger/10 border-b border-danger/20 font-mono">
          {error}. Using last verified tracking telemetry.
        </div>
      )}

      {/* 4. MAIN CONTENT AREA */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
        {activeTab === 'realtime-link' ? (
          <JWSTRealtimeLink onOpenViewfinder={onOpenViewfinder} />
        ) : (
          data?.stations.map((station) => (
            <section key={station.code} className="space-y-2">
              <h3 className="text-xs font-mono font-semibold text-fg tracking-wide uppercase border-b border-line pb-1 flex items-center justify-between">
                <span>{station.name}</span>
                <a
                  href={
                    station.code === 'goldstone'
                      ? 'https://earth.google.com/web/@35.4267,-116.8900,1000a,35d,0y,0h,0t,0r'
                      : station.code === 'canberra'
                      ? 'https://earth.google.com/web/@-35.4014,148.9817,1000a,35d,0y,0h,0t,0r'
                      : 'https://earth.google.com/web/@40.4272,-4.2497,1000a,35d,0y,0h,0t,0r'
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-signal hover:underline flex items-center gap-1 font-normal"
                >
                  <Globe className="w-3 h-3" />
                  Google Earth 3D Dish View
                </a>
              </h3>

              <div className="space-y-2.5">
                {station.dishes.map((dish) => (
                  <div key={dish.name} className="border border-line/60 bg-bg/60 p-2.5 rounded">
                    <div className="flex items-center justify-between text-xs font-mono text-fg">
                      <span className="font-semibold text-flare">{dish.name}</span>
                      <span className="text-muted text-[11px]">
                        {dish.azimuth !== undefined ? `az ${dish.azimuth.toFixed(0)}°` : ''}
                        {dish.elevation !== undefined ? ` · el ${dish.elevation.toFixed(0)}°` : ''}
                        {dish.wind !== undefined ? ` · wind ${dish.wind} km/h` : ''}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted mt-0.5 truncate">{dish.activity}</p>

                    {dish.signals.length === 0 ? (
                      <p className="text-[10px] text-muted/80 font-mono mt-1">
                        Standby · No active signal
                      </p>
                    ) : (
                      <div className="mt-1.5 space-y-1">
                        {dish.signals.map((sig, idx) => {
                          const skyId = craftToSkyId(sig.craft);
                          const craftLabel = formatCraftName(sig.craft);
                          const rateLabel = formatDataRate(sig.rate);
                          const isUp = sig.dir === 'up';

                          return skyId ? (
                            <button
                              key={`${dish.name}-${idx}`}
                              type="button"
                              onClick={() => onFly(skyId)}
                              className="w-full flex items-center justify-between text-left text-xs bg-raised/70 hover:bg-raised p-1.5 rounded transition-colors text-fg group"
                            >
                              <span className="flex items-center gap-1 font-mono">
                                {isUp ? (
                                  <ArrowUpRight className="w-3.5 h-3.5 text-signal" />
                                ) : (
                                  <ArrowDownLeft className="w-3.5 h-3.5 text-flare" />
                                )}
                                <span className="font-semibold group-hover:text-flare transition-colors">
                                  {craftLabel}
                                </span>
                                <span className="text-muted text-[10px]">({sig.band}-band)</span>
                              </span>
                              <span className="flex items-center gap-1 font-mono text-muted text-[11px]">
                                <span>{rateLabel}</span>
                                <ExternalLink className="w-3 h-3 text-flare opacity-70 group-hover:opacity-100" />
                              </span>
                            </button>
                          ) : (
                            <div
                              key={`${dish.name}-${idx}`}
                              className="flex items-center justify-between text-xs text-muted font-mono p-1 bg-surface/50 rounded"
                            >
                              <span className="flex items-center gap-1">
                                {isUp ? (
                                  <ArrowUpRight className="w-3 h-3 text-signal" />
                                ) : (
                                  <ArrowDownLeft className="w-3 h-3 text-flare" />
                                )}
                                <span>{craftLabel}</span>
                                <span className="text-[10px]">({sig.band}-band)</span>
                              </span>
                              <span className="text-[11px]">{rateLabel}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {/* 5. FOOTNOTE */}
      <p className="border-t border-line px-4 py-2 text-[10px] text-muted text-pretty bg-bg/50 font-mono">
        {activeTab === 'realtime-link'
          ? 'Live demodulated packet stream from Sun–Earth L2 via DSN Ka-band high-gain downlink.'
          : 'Live antenna tracker from eyes.nasa.gov. Tap any active craft to fly to it in 3D.'}
      </p>
    </aside>
  );
};
