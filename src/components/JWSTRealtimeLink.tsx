import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Wifi,
  WifiOff,
  Database,
  ShieldCheck,
  Zap,
  ArrowDownCircle,
  Clock,
  Radio,
  RefreshCw,
  Terminal,
  Eye,
  Camera,
} from 'lucide-react';

interface PacketLog {
  id: string;
  time: string;
  channel: 'VC0' | 'VC1' | 'VC2' | 'VC3' | 'DSN';
  level: 'info' | 'success' | 'warn';
  message: string;
}

const INITIAL_LOGS: PacketLog[] = [
  {
    id: 'log-1',
    time: '14:36:50.120',
    channel: 'DSN',
    level: 'success',
    message: 'DSS-14 (Goldstone 70m) carrier acquisition locked on Ka-band 25.9 GHz.',
  },
  {
    id: 'log-2',
    time: '14:36:50.840',
    channel: 'VC0',
    level: 'info',
    message: 'Spacecraft bus housekeeping: Sunshield Hot 358.1K, Cold 37.0K, Power 2040W.',
  },
  {
    id: 'log-3',
    time: '14:36:51.310',
    channel: 'VC1',
    level: 'info',
    message: 'NIRCam raw frame #81920 packet chunk (F444W, 2048x2048 float16 CDS).',
  },
  {
    id: 'log-4',
    time: '14:36:51.780',
    channel: 'VC3',
    level: 'success',
    message: 'FGS fine guidance tracking lock confirmed: centroid jitter 0.0007 arcsec.',
  },
  {
    id: 'log-5',
    time: '14:36:52.250',
    channel: 'VC2',
    level: 'info',
    message: 'MIRI cryocooler pulse-tube temperature stable at 6.68K.',
  },
];

export const JWSTRealtimeLink: React.FC<{ onOpenViewfinder?: () => void }> = ({
  onOpenViewfinder,
}) => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isAcquiring, setIsAcquiring] = useState<boolean>(false);
  const [band, setBand] = useState<'Ka' | 'S'>('Ka');
  const [downlinkMbps, setDownlinkMbps] = useState<number>(27.95);
  const [snrDb, setSnrDb] = useState<number>(16.4);
  const [totalPackets, setTotalPackets] = useState<number>(1428900);
  const [dataDownloadedMb, setDataDownloadedMb] = useState<number>(15240);
  const [logs, setLogs] = useState<PacketLog[]>(INITIAL_LOGS);
  const [activeStation, setActiveStation] = useState<string>('DSS-14 (Goldstone 70m)');

  const logContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll terminal logs to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Downlink telemetry simulation ticks
  useEffect(() => {
    if (!isConnected || isAcquiring) return;

    const interval = setInterval(() => {
      // Small realistic jitter on downlink rate
      const baseRate = band === 'Ka' ? 28.0 : 0.04;
      const jitter = (Math.random() - 0.5) * (band === 'Ka' ? 0.35 : 0.002);
      const currentRate = Math.max(0.01, baseRate + jitter);
      setDownlinkMbps(currentRate);

      // SNR jitter
      setSnrDb((prev) => +(16.2 + (Math.random() - 0.5) * 0.4).toFixed(1));

      // Packets increment
      const packetsDelta = band === 'Ka' ? Math.floor(180 + Math.random() * 40) : 4;
      setTotalPackets((p) => p + packetsDelta);
      setDataDownloadedMb((d) => +(d + (currentRate * 0.125 * 0.6)).toFixed(1));

      // Random telemetry packet log generation
      if (Math.random() > 0.45) {
        const now = new Date();
        const timeStr = `${now.toTimeString().slice(0, 8)}.${String(now.getMilliseconds()).padStart(3, '0')}`;

        const possibleMessages: { channel: PacketLog['channel']; level: PacketLog['level']; message: string }[] = [
          {
            channel: 'VC1',
            level: 'info',
            message: `NIRCam detector readout chunk #${Math.floor(Math.random() * 9000 + 1000)} CRC-32 valid.`,
          },
          {
            channel: 'VC0',
            level: 'info',
            message: `Reaction wheel speed: RW1: 1820 rpm, RW2: -1420 rpm, Momentum unloads: 0.`,
          },
          {
            channel: 'VC2',
            level: 'info',
            message: `MIRI spectrometer integration step complete. Detector temp: 6.69K.`,
          },
          {
            channel: 'VC3',
            level: 'success',
            message: `FGS guide star track active on GuideStar-J2026. Pointing RMS: 0.0009 arcsec.`,
          },
          {
            channel: 'DSN',
            level: 'success',
            message: `Reed-Solomon / LDPC FEC frame sync 100% lock, 0 packet loss.`,
          },
          {
            channel: 'VC0',
            level: 'info',
            message: `Sunshield layer 1 temperature: ${(357.5 + Math.random() * 1.5).toFixed(1)}K, cold side: ${(36.8 + Math.random() * 0.4).toFixed(1)}K.`,
          },
          {
            channel: 'VC1',
            level: 'info',
            message: `NIRSpec multi-object microshutter array telemetry: 248,000 shutters verified.`,
          },
        ];

        const chosen = possibleMessages[Math.floor(Math.random() * possibleMessages.length)];
        const newLog: PacketLog = {
          id: `log-${Date.now()}-${Math.random()}`,
          time: timeStr,
          channel: chosen.channel,
          level: chosen.level,
          message: chosen.message,
        };

        setLogs((prev) => [...prev.slice(-25), newLog]);
      }
    }, 600);

    return () => clearInterval(interval);
  }, [isConnected, isAcquiring, band]);

  const handleToggleConnection = () => {
    if (isConnected) {
      setIsConnected(false);
      setDownlinkMbps(0);
      setLogs((prev) => [
        ...prev,
        {
          id: `log-${Date.now()}`,
          time: new Date().toTimeString().slice(0, 8),
          channel: 'DSN',
          level: 'warn',
          message: 'Telemetry downlink carrier unlocked. Station receiver in carrier search mode.',
        },
      ]);
    } else {
      setIsAcquiring(true);
      setLogs((prev) => [
        ...prev,
        {
          id: `log-${Date.now()}`,
          time: new Date().toTimeString().slice(0, 8),
          channel: 'DSN',
          level: 'info',
          message: `Attempting carrier acquisition with ${activeStation}... Sweeping PLL frequency.`,
        },
      ]);

      setTimeout(() => {
        setIsAcquiring(false);
        setIsConnected(true);
        setLogs((prev) => [
          ...prev,
          {
            id: `log-${Date.now()}`,
            time: new Date().toTimeString().slice(0, 8),
            channel: 'DSN',
            level: 'success',
            message: `Carrier locked on ${band}-band. Frame sync recovered. Demodulating packets.`,
          },
        ]);
      }, 1500);
    }
  };

  const handleSwitchBand = (newBand: 'Ka' | 'S') => {
    if (newBand === band) return;
    setBand(newBand);
    setLogs((prev) => [
      ...prev,
      {
        id: `log-${Date.now()}`,
        time: new Date().toTimeString().slice(0, 8),
        channel: 'DSN',
        level: 'info',
        message: `Switched downlink receiver to ${newBand}-band (${
          newBand === 'Ka' ? '25.9 GHz Science Downlink' : '2.2 GHz Real-time Telemetry'
        }).`,
      },
    ]);
  };

  return (
    <div className="border border-line bg-surface/80 rounded p-3 space-y-3">
      {/* 1. STATUS HEADER */}
      <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              isConnected
                ? 'bg-signal shadow-[0_0_8px_#2fdbc4] animate-pulse'
                : isAcquiring
                ? 'bg-flare shadow-[0_0_8px_#e3a23b] animate-ping'
                : 'bg-danger'
            }`}
          />
          <div>
            <h4 className="font-mono text-xs font-bold text-fg flex items-center gap-1.5">
              <span>JWST REAL-TIME LINK</span>
              <span className="text-[10px] text-muted font-normal">
                (Sun–Earth L2 · 1,500,000 km)
              </span>
            </h4>
            <p className="text-[10px] text-muted font-mono">
              {isConnected
                ? `LOCKED · ${activeStation} · RTLT: 4.98s`
                : isAcquiring
                ? 'SEARCHING FREQUENCY SWEEP...'
                : 'LINK OFFLINE · NO CARRIER'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleConnection}
          disabled={isAcquiring}
          className={`min-h-7 px-2.5 text-[11px] font-mono rounded transition-colors flex items-center gap-1 font-semibold ${
            isConnected
              ? 'border border-danger/40 bg-danger/10 hover:bg-danger/20 text-danger'
              : 'bg-signal text-signal-ink hover:bg-signal/90'
          }`}
        >
          {isAcquiring ? (
            <>
              <RefreshCw className="w-3 h-3 animate-spin" />
              Locking...
            </>
          ) : isConnected ? (
            <>
              <WifiOff className="w-3 h-3" />
              Drop Link
            </>
          ) : (
            <>
              <Wifi className="w-3 h-3" />
              Acquire Link
            </>
          )}
        </button>
      </div>

      {/* LIVE BORESIGHT VIEW BANNER */}
      {onOpenViewfinder && (
        <div className="border border-flare/50 bg-flare/10 p-2.5 rounded flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-mono">
            <Camera className="w-4 h-4 text-flare animate-pulse" />
            <div>
              <span className="font-bold text-fg block text-[11px]">
                LIVE JWST OPTICAL BORESIGHT STREAM
              </span>
              <span className="text-[10px] text-muted block">
                Target: WASP-96b Atmospheric Transit (NIRSpec PRISM)
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenViewfinder}
            className="min-h-7 px-3 text-[11px] font-mono font-bold bg-flare text-flare-ink hover:bg-flare/90 rounded transition-colors flex items-center gap-1 shrink-0"
          >
            <Eye className="w-3.5 h-3.5" />
            Open Viewfinder
          </button>
        </div>
      )}

      {/* 2. REAL-TIME METRICS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
        <div className="border border-line/60 bg-bg/80 p-2 rounded">
          <span className="text-[10px] text-muted block">DOWNLINK RATE</span>
          <span className="text-sm font-bold text-signal flex items-baseline gap-1 mt-0.5">
            {downlinkMbps.toFixed(2)}
            <span className="text-[10px] font-normal text-muted">
              {band === 'Ka' ? 'Mb/s' : 'kb/s'}
            </span>
          </span>
        </div>

        <div className="border border-line/60 bg-bg/80 p-2 rounded">
          <span className="text-[10px] text-muted block">CARRIER SNR</span>
          <span className="text-sm font-bold text-flare flex items-baseline gap-1 mt-0.5">
            {isConnected ? `${snrDb.toFixed(1)} dB` : '0.0 dB'}
            <span className="text-[10px] font-normal text-muted">
              {isConnected ? '(Clean)' : ''}
            </span>
          </span>
        </div>

        <div className="border border-line/60 bg-bg/80 p-2 rounded">
          <span className="text-[10px] text-muted block">PACKETS RECEIVED</span>
          <span className="text-sm font-bold text-fg block mt-0.5">
            {totalPackets.toLocaleString()}
          </span>
        </div>

        <div className="border border-line/60 bg-bg/80 p-2 rounded">
          <span className="text-[10px] text-muted block">SESSION DATA</span>
          <span className="text-sm font-bold text-fg block mt-0.5">
            {(dataDownloadedMb / 1024).toFixed(2)} GB
          </span>
        </div>
      </div>

      {/* 3. VIRTUAL CHANNEL MULTIPLEXING BAR */}
      <div className="space-y-1.5 font-mono text-[11px]">
        <div className="flex items-center justify-between text-muted text-[10px]">
          <span>VIRTUAL CHANNEL MULTIPLEXING</span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => handleSwitchBand('Ka')}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                band === 'Ka'
                  ? 'bg-signal text-signal-ink font-bold'
                  : 'bg-surface hover:bg-raised text-muted'
              }`}
            >
              Ka-Band (28 Mb/s)
            </button>
            <button
              type="button"
              onClick={() => handleSwitchBand('S')}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                band === 'S'
                  ? 'bg-flare text-flare-ink font-bold'
                  : 'bg-surface hover:bg-raised text-muted'
              }`}
            >
              S-Band (40 kb/s)
            </button>
          </div>
        </div>

        {/* Channel Bars */}
        <div className="grid grid-cols-4 gap-1 text-[10px]">
          <div className="border border-line/50 bg-bg/60 p-1.5 rounded">
            <span className="text-muted block">VC0 · Bus HK</span>
            <span className="text-fg font-semibold">16 kb/s</span>
          </div>
          <div className="border border-line/50 bg-bg/60 p-1.5 rounded">
            <span className="text-muted block">VC1 · NIRCam</span>
            <span className="text-signal font-semibold">
              {isConnected && band === 'Ka' ? '18.4 Mb/s' : '0.0 kb/s'}
            </span>
          </div>
          <div className="border border-line/50 bg-bg/60 p-1.5 rounded">
            <span className="text-muted block">VC2 · MIRI</span>
            <span className="text-flare font-semibold">
              {isConnected && band === 'Ka' ? '9.2 Mb/s' : '0.0 kb/s'}
            </span>
          </div>
          <div className="border border-line/50 bg-bg/60 p-1.5 rounded">
            <span className="text-muted block">VC3 · FGS Guide</span>
            <span className="text-[#6ea8fe] font-semibold">
              {isConnected ? '400 kb/s' : '0 kb/s'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. ROLLING TERMINAL LOG STREAM */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] font-mono text-muted">
          <span className="flex items-center gap-1">
            <Terminal className="w-3 h-3 text-flare" />
            LIVE TELEMETRY PACKET LOG
          </span>
          <span className="text-signal animate-pulse">STREAM ACTIVE</span>
        </div>

        <div
          ref={logContainerRef}
          className="h-32 overflow-y-auto border border-line bg-black/85 p-2 rounded font-mono text-[11px] leading-relaxed space-y-1 select-text"
        >
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-1.5">
              <span className="text-muted/60 text-[10px] shrink-0 font-light">
                {log.time}
              </span>
              <span
                className={`text-[9px] px-1 py-0.2 rounded shrink-0 font-bold ${
                  log.channel === 'VC1'
                    ? 'bg-signal/20 text-signal border border-signal/30'
                    : log.channel === 'VC2'
                    ? 'bg-flare/20 text-flare border border-flare/30'
                    : log.channel === 'VC3'
                    ? 'bg-[#6ea8fe]/20 text-[#6ea8fe] border border-[#6ea8fe]/30'
                    : log.channel === 'VC0'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-line text-muted'
                }`}
              >
                {log.channel}
              </span>
              <span
                className={`break-all ${
                  log.level === 'warn'
                    ? 'text-danger'
                    : log.level === 'success'
                    ? 'text-emerald-400'
                    : 'text-fg'
                }`}
              >
                {log.message}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
