import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Bot,
  BookOpen,
  Plus,
  Activity,
  Zap,
  Thermometer,
  Compass,
  RefreshCw,
  Sliders,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

interface ChatMessage {
  role: 'you' | 'analyst';
  text: string;
}

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    role: 'analyst',
    text: 'AetherOS Observatory Analyst online. Telemetry feeds locked to Sun–Earth L2 (1.5 million km). Ready for astrophysical inquiries or live telemetry analysis.',
  },
];

interface TelemetryPoint {
  time: string;
  solarPowerW: number;
  payloadPowerW: number;
  busPowerW: number;
  tempSunshieldHotK: number;
  tempSunshieldColdK: number;
  tempOpticsK: number;
  tempMiriK: number;
  driftXMas: number;
  driftYMas: number;
  driftZMas: number;
}

function generateInitialTelemetry(): TelemetryPoint[] {
  const points: TelemetryPoint[] = [];
  const now = Date.now();
  for (let i = 20; i >= 0; i--) {
    const t = new Date(now - i * 3000);
    const timeStr = t.toTimeString().slice(0, 8);
    const noiseP = (Math.random() - 0.5) * 8;
    const noiseT = (Math.random() - 0.5) * 0.3;

    points.push({
      time: timeStr,
      solarPowerW: Math.round(2045 + noiseP),
      payloadPowerW: Math.round(1120 + noiseP * 0.4),
      busPowerW: Math.round(510 + noiseP * 0.2),
      tempSunshieldHotK: +(358.2 + noiseT * 2).toFixed(1),
      tempSunshieldColdK: +(37.1 + noiseT * 0.2).toFixed(1),
      tempOpticsK: +(39.4 + noiseT * 0.1).toFixed(1),
      tempMiriK: +(6.68 + (Math.random() - 0.5) * 0.02).toFixed(2),
      driftXMas: +((Math.random() - 0.5) * 0.6).toFixed(2),
      driftYMas: +((Math.random() - 0.5) * 0.5).toFixed(2),
      driftZMas: +((Math.random() - 0.5) * 0.7).toFixed(2),
    });
  }
  return points;
}

export const AnalystPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'chat' | 'log'>('telemetry');
  const [metricSubTab, setMetricSubTab] = useState<'all' | 'power' | 'thermal' | 'drift'>('all');

  // Telemetry stream state
  const [telemetryData, setTelemetryData] = useState<TelemetryPoint[]>(generateInitialTelemetry);
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);

  // Chat & Log state
  const [messages, setMessages] = useState<ChatMessage[]>(DEFAULT_MESSAGES);
  const [inputVal, setInputVal] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [noteInput, setNoteInput] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([
    'Halo model locked to Sun–Earth L2 reference distance.',
    'NIRCam wavefront alignment validated at 18.2 nm RMS.',
    'WASP-96b transit atmospheric survey initialized in NIRSpec channel.',
  ]);

  // Live telemetry interval generator
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      setTelemetryData((prev) => {
        const last = prev[prev.length - 1];
        const now = new Date();
        const timeStr = now.toTimeString().slice(0, 8);

        const noiseP = (Math.random() - 0.5) * 10;
        const noiseT = (Math.random() - 0.5) * 0.25;

        const newPoint: TelemetryPoint = {
          time: timeStr,
          solarPowerW: Math.round(2045 + noiseP),
          payloadPowerW: Math.round(1120 + noiseP * 0.3),
          busPowerW: Math.round(510 + noiseP * 0.2),
          tempSunshieldHotK: +(358.2 + noiseT * 1.5).toFixed(1),
          tempSunshieldColdK: +(37.1 + noiseT * 0.15).toFixed(1),
          tempOpticsK: +(39.4 + noiseT * 0.08).toFixed(1),
          tempMiriK: +(6.68 + (Math.random() - 0.5) * 0.015).toFixed(2),
          driftXMas: +((Math.random() - 0.5) * 0.65).toFixed(2),
          driftYMas: +((Math.random() - 0.5) * 0.55).toFixed(2),
          driftZMas: +((Math.random() - 0.5) * 0.75).toFixed(2),
        };

        return [...prev.slice(1), newPoint];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isLiveStreaming]);

  const latest = telemetryData[telemetryData.length - 1] || generateInitialTelemetry()[0];

  const generateAnswer = (q: string): string => {
    const lower = q.toLowerCase();
    if (lower.includes('power') || lower.includes('watt') || lower.includes('solar')) {
      return `Current JWST solar array output is ${latest.solarPowerW} W. The payload sub-systems (NIRCam, MIRI, NIRSpec, NIRISS) draw ~${latest.payloadPowerW} W, while the bus and reaction wheels draw ~${latest.busPowerW} W. Total power margin remains optimal with >400 W reserve.`;
    }
    if (lower.includes('temp') || lower.includes('thermal') || lower.includes('kelvin') || lower.includes('miri') || lower.includes('sunshield')) {
      return `The five-layer Kapton sunshield maintains a ~320 K thermal gradient. Sunshield Layer 1 (facing Sun) is at ${latest.tempSunshieldHotK} K, while Cold Layer 5 is at ${latest.tempSunshieldColdK} K. Optical telescope element optics stay at ${latest.tempOpticsK} K, and MIRI active cryocooler sits locked at ${latest.tempMiriK} K.`;
    }
    if (lower.includes('gyro') || lower.includes('drift') || lower.includes('pointing') || lower.includes('fgs')) {
      return `Fine Guidance Sensor (FGS) centroid tracking maintains sub-milliarcsecond pointing precision. Current instantaneous axis drifts: Roll (X) ${latest.driftXMas} mas, Pitch (Y) ${latest.driftYMas} mas, Yaw (Z) ${latest.driftZMas} mas—well within the ±1.0 mas jitter threshold.`;
    }
    if (lower.includes('transit') || lower.includes('shallow') || lower.includes('depth')) {
      return 'The transit depth ΔF is proportional to (Rp / R★)². When inclination drops below 90°, the planet grazes the stellar limb rather than passing through the center, shortening transit duration and reducing depth. Photometric noise also obscures subtle molecular absorption bands.';
    }
    if (lower.includes('flare') || lower.includes('sun') || lower.includes('cme') || lower.includes('mhd')) {
      return 'Solar flare classifications (X1 to X9+) represent logarithmic flux increases in the 0.1–0.8 nm soft X-ray band measured by GOES. Reconnection of twisted magnetic flux ropes accelerates coronal plasma up to several thousand km/s, driving coronal mass ejections.';
    }
    if (lower.includes('spectroscopy') || lower.includes('co2') || lower.includes('water') || lower.includes('filter')) {
      return 'JWST detects atmospheric molecules by measuring wavelength-dependent occultation dips. The 4.3 µm and 15 µm bands are distinctive vibrational modes of carbon dioxide (CO₂), while 1.4 µm and 1.9 µm indicate water vapor (H₂O). F444W isolates the 4.4 µm region.';
    }
    if (lower.includes('lens') || lower.includes('black hole') || lower.includes('m87') || lower.includes('einstein')) {
      return 'Gravitational lensing bends null geodesics around massive spacetime curvature. The Einstein radius θ_E = √(4GM / c² · D_ls / (D_l · D_s)) scales with the square root of the lens mass. For supermassive black holes like M87* (6.5 billion M☉), the deflection creates a prominent Einstein ring.';
    }
    if (lower.includes('l2') || lower.includes('lagrange') || lower.includes('orbit') || lower.includes('jwst')) {
      return 'The L2 Lagrange point lies approximately 1.5 million km directly behind Earth away from the Sun. JWST orbits L2 on a halo / Lissajous trajectory to avoid Earth and Moon shadows, ensuring its five-layer Kapton sunshield continuously cools the optics below 40 K.';
    }
    return `Analysis logged for query: "${q}". Telemetry metrics confirm nominal operating envelopes across thermal, electrical, and attitude control subsystems.`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputVal.trim();
    if (!query || isThinking) return;

    setInputVal('');
    setIsThinking(true);
    setMessages((prev) => [...prev, { role: 'you', text: query }]);

    setTimeout(() => {
      const answer = generateAnswer(query);
      setMessages((prev) => [...prev, { role: 'analyst', text: answer }]);
      setIsThinking(false);
    }, 400);
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    const note = noteInput.trim();
    if (!note) return;
    setLogs((prev) => [note, ...prev].slice(0, 8));
    setNoteInput('');
  };

  // Custom Dark Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg/95 border border-line p-2.5 rounded shadow-xl font-mono text-[11px] space-y-1">
          <p className="text-muted font-bold border-b border-line pb-1">{`TIME: ${label} UTC`}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-bold text-fg">
                {entry.value} {entry.unit || ''}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <aside className="pointer-events-auto mb-3 flex max-h-[82vh] sm:max-h-[85vh] w-full max-w-xl flex-col self-start border border-line bg-surface/95 backdrop-blur-md shadow-2xl rounded overflow-hidden">
      {/* 1. HEADER */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line bg-bg/50">
        <div className="flex items-center space-x-2">
          <Bot className="w-4 h-4 text-flare animate-pulse" />
          <h2 className="font-mono text-xs tracking-widest text-flare font-bold">
            OBSERVATORY ANALYST & TELEMETRY
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

      {/* 2. TOP TABS */}
      <div className="flex border-b border-line bg-bg/40 px-3 pt-2 gap-2 text-xs font-mono">
        <button
          type="button"
          onClick={() => setActiveTab('telemetry')}
          className={`pb-2 px-2.5 flex items-center gap-1.5 transition-colors border-b-2 font-semibold ${
            activeTab === 'telemetry'
              ? 'border-signal text-signal'
              : 'border-transparent text-muted hover:text-fg'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Telemetry Metrics
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`pb-2 px-2.5 flex items-center gap-1.5 transition-colors border-b-2 font-semibold ${
            activeTab === 'chat'
              ? 'border-flare text-flare'
              : 'border-transparent text-muted hover:text-fg'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          Astrophysics AI
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('log')}
          className={`pb-2 px-2.5 flex items-center gap-1.5 transition-colors border-b-2 font-semibold ${
            activeTab === 'log'
              ? 'border-purple-400 text-purple-300'
              : 'border-transparent text-muted hover:text-fg'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Research Log ({logs.length})
        </button>
      </div>

      {/* 3. MAIN CONTENT */}
      <div className="p-3 sm:p-4 overflow-y-auto flex-1 min-h-0 space-y-4">
        {/* TAB 1: TELEMETRY METRICS */}
        {activeTab === 'telemetry' && (
          <div className="space-y-4 font-mono">
            {/* Real-time Summary Header Cards */}
            <div className="flex items-center justify-between border-b border-line/60 pb-2">
              <div className="flex items-center gap-2 text-xs">
                <span
                  className={`h-2 w-2 rounded-full ${
                    isLiveStreaming ? 'bg-signal shadow-[0_0_8px_#2fdbc4] animate-pulse' : 'bg-muted'
                  }`}
                />
                <span className="font-semibold text-fg text-[11px]">
                  JWST LIVE SUBSYSTEM FEED (L2)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsLiveStreaming((p) => !p)}
                  className={`min-h-6 px-2 text-[10px] rounded transition-colors flex items-center gap-1 ${
                    isLiveStreaming
                      ? 'bg-signal/10 border border-signal/40 text-signal'
                      : 'bg-raised text-muted hover:text-fg'
                  }`}
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${isLiveStreaming ? 'animate-spin' : ''}`} />
                  {isLiveStreaming ? 'LIVE TICKING' : 'PAUSED'}
                </button>
              </div>
            </div>

            {/* Subsystem Metric KPI Grid */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="border border-line/60 bg-bg/80 p-2 rounded">
                <div className="flex items-center justify-between text-muted text-[10px]">
                  <span>SOLAR POWER</span>
                  <Zap className="w-3 h-3 text-flare" />
                </div>
                <div className="text-sm font-bold text-flare mt-0.5">
                  {latest.solarPowerW} W
                </div>
                <span className="text-[9px] text-muted block mt-0.5">
                  Payload: {latest.payloadPowerW} W
                </span>
              </div>

              <div className="border border-line/60 bg-bg/80 p-2 rounded">
                <div className="flex items-center justify-between text-muted text-[10px]">
                  <span>MIRI TEMP</span>
                  <Thermometer className="w-3 h-3 text-signal" />
                </div>
                <div className="text-sm font-bold text-signal mt-0.5">
                  {latest.tempMiriK} K
                </div>
                <span className="text-[9px] text-muted block mt-0.5">
                  Sunshield: {latest.tempSunshieldHotK} K
                </span>
              </div>

              <div className="border border-line/60 bg-bg/80 p-2 rounded">
                <div className="flex items-center justify-between text-muted text-[10px]">
                  <span>GYRO JITTER</span>
                  <Compass className="w-3 h-3 text-[#6ea8fe]" />
                </div>
                <div className="text-sm font-bold text-[#6ea8fe] mt-0.5">
                  {Math.abs(latest.driftXMas)} mas
                </div>
                <span className="text-[9px] text-muted block mt-0.5">
                  Lock: &lt;1.0 mas RMS
                </span>
              </div>
            </div>

            {/* Filter buttons for focused chart view */}
            <div className="flex items-center gap-1 text-[10px]">
              <span className="text-muted mr-1">VIEW:</span>
              {(['all', 'power', 'thermal', 'drift'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setMetricSubTab(mode)}
                  className={`px-2 py-0.5 rounded transition-colors capitalize ${
                    metricSubTab === mode
                      ? 'bg-fg text-bg font-bold'
                      : 'bg-surface hover:bg-raised text-muted'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* CHART 1: POWER CONSUMPTION & GENERATION */}
            {(metricSubTab === 'all' || metricSubTab === 'power') && (
              <div className="border border-line bg-bg/90 p-3 rounded space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-fg flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-flare" />
                    POWER GENERATION VS SUBSYSTEM LOAD (WATTS)
                  </span>
                  <span className="text-[10px] text-muted font-normal">
                    Solar Array + Payload Bus
                  </span>
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={telemetryData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#e3a23b" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#e3a23b" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorPayload" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2fdbc4" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#2fdbc4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a3548" opacity={0.5} />
                      <XAxis dataKey="time" stroke="#93a0b4" fontSize={10} tickLine={false} />
                      <YAxis
                        stroke="#93a0b4"
                        fontSize={10}
                        domain={[0, 2400]}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
                      <Area
                        type="monotone"
                        dataKey="solarPowerW"
                        name="Solar Array Generation"
                        unit="W"
                        stroke="#e3a23b"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorSolar)"
                      />
                      <Area
                        type="monotone"
                        dataKey="payloadPowerW"
                        name="Payload Instruments"
                        unit="W"
                        stroke="#2fdbc4"
                        strokeWidth={1.5}
                        fillOpacity={1}
                        fill="url(#colorPayload)"
                      />
                      <Line
                        type="monotone"
                        dataKey="busPowerW"
                        name="Spacecraft Bus / RW"
                        unit="W"
                        stroke="#93a0b4"
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* CHART 2: INTERNAL THERMAL DISTRIBUTION */}
            {(metricSubTab === 'all' || metricSubTab === 'thermal') && (
              <div className="border border-line bg-bg/90 p-3 rounded space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-fg flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-signal" />
                    INTERNAL THERMAL GRADIENTS (KELVIN)
                  </span>
                  <span className="text-[10px] text-muted font-normal">
                    Sunshield vs Cryo MIRI
                  </span>
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={telemetryData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a3548" opacity={0.5} />
                      <XAxis dataKey="time" stroke="#93a0b4" fontSize={10} tickLine={false} />
                      <YAxis
                        stroke="#93a0b4"
                        fontSize={10}
                        domain={[0, 400]}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
                      <Line
                        type="monotone"
                        dataKey="tempSunshieldHotK"
                        name="Sunshield Layer 1 (Hot)"
                        unit="K"
                        stroke="#f87171"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="tempSunshieldColdK"
                        name="Sunshield Layer 5 (Cold)"
                        unit="K"
                        stroke="#6ea8fe"
                        strokeWidth={1.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="tempOpticsK"
                        name="OTE Optics"
                        unit="K"
                        stroke="#2fdbc4"
                        strokeWidth={1.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="tempMiriK"
                        name="MIRI Cryocooler"
                        unit="K"
                        stroke="#a855f7"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* CHART 3: GYROSCOPE ORIENTATION DRIFT */}
            {(metricSubTab === 'all' || metricSubTab === 'drift') && (
              <div className="border border-line bg-bg/90 p-3 rounded space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-fg flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-[#6ea8fe]" />
                    GYROSCOPE & FGS DRIFT (MILLIARCSECONDS)
                  </span>
                  <span className="text-[10px] text-muted font-normal">
                    Point RMS &lt; 0.001&quot;
                  </span>
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={telemetryData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a3548" opacity={0.5} />
                      <XAxis dataKey="time" stroke="#93a0b4" fontSize={10} tickLine={false} />
                      <YAxis
                        stroke="#93a0b4"
                        fontSize={10}
                        domain={[-1.2, 1.2]}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
                      <ReferenceLine y={1.0} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '+1.0 mas jitter limit', fill: '#ef4444', fontSize: 9 }} />
                      <ReferenceLine y={-1.0} stroke="#ef4444" strokeDasharray="3 3" />
                      <Line
                        type="monotone"
                        dataKey="driftXMas"
                        name="Roll Axis (X)"
                        unit="mas"
                        stroke="#2fdbc4"
                        strokeWidth={1.5}
                        dot={{ r: 2 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="driftYMas"
                        name="Pitch Axis (Y)"
                        unit="mas"
                        stroke="#e3a23b"
                        strokeWidth={1.5}
                        dot={{ r: 2 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="driftZMas"
                        name="Yaw Axis (Z)"
                        unit="mas"
                        stroke="#6ea8fe"
                        strokeWidth={1.5}
                        dot={{ r: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ASTROPHYSICS AI CHAT */}
        {activeTab === 'chat' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-fg">Astrophysics Intelligence</h3>
              <p className="text-xs text-muted mt-0.5">
                Query observation physics. Responses use active telemetry and bench state.
              </p>
            </div>

            {/* Chat History */}
            <div className="max-h-64 sm:max-h-72 space-y-3 overflow-y-auto border border-line bg-bg/80 p-3 rounded text-xs leading-relaxed font-sans">
              {messages.map((m, idx) => (
                <div key={idx} className={m.role === 'you' ? 'text-flare' : 'text-fg'}>
                  <span className="font-mono text-[10px] tracking-wider text-muted block uppercase">
                    {m.role === 'you' ? 'YOU · OPERATOR' : 'ANALYST · OBSERVATORY'}
                  </span>
                  <p className="mt-0.5 whitespace-pre-wrap">{m.text}</p>
                </div>
              ))}
              {isThinking && (
                <p className="font-mono text-xs text-muted animate-pulse">Reading telemetry bench...</p>
              )}
            </div>

            {/* Query Input */}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="What is the current solar power & thermal gradient?"
                className="min-h-10 flex-1 border border-line bg-bg px-3 font-mono text-xs text-fg rounded focus:outline-none focus:border-flare"
              />
              <button
                type="submit"
                disabled={isThinking || !inputVal.trim()}
                className="min-h-10 bg-flare hover:bg-flare/90 text-flare-ink px-4 font-mono text-xs font-semibold rounded transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                Ask
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: RESEARCH LOG */}
        {activeTab === 'log' && (
          <div className="border border-line bg-surface p-3 rounded space-y-3">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-purple-300" />
              <span className="font-mono text-[10px] tracking-widest text-purple-300 uppercase font-bold">
                OBSERVING RESEARCH LOG
              </span>
            </div>

            <ul className="space-y-2 text-xs text-fg pl-1">
              {logs.map((log, i) => (
                <li key={i} className="flex items-start gap-2 border-b border-line/40 pb-1.5">
                  <span className="text-flare mt-0.5 font-bold">•</span>
                  <span className="text-muted leading-tight font-mono">{log}</span>
                </li>
              ))}
            </ul>

            <form onSubmit={handleAddLog} className="pt-2 flex gap-2">
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Record observation note"
                className="min-h-9 flex-1 border border-line bg-bg px-2.5 text-xs text-fg font-mono rounded focus:outline-none focus:border-flare"
              />
              <button
                type="submit"
                className="min-h-9 border border-line bg-surface hover:bg-raised text-fg px-3 text-xs font-mono rounded transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
            </form>
          </div>
        )}
      </div>
    </aside>
  );
};
