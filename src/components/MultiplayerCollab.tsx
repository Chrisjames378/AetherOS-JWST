import React, { useState } from 'react';
import { Users, Wifi, Send, FileText, Share2, CheckCircle2, Copy, Plus } from 'lucide-react';
import { PeerObserver, ResearchLogEntry } from '../types';

export const MultiplayerCollab: React.FC = () => {
  const [roomCode, setRoomCode] = useState<string>('JWST-OMEGA-9');
  const [peers, setPeers] = useState<PeerObserver[]>([
    { id: '1', name: 'Dr. Katherine Vance', role: 'Principal Investigator', status: 'observing', latencyMs: 38, station: 'STScI Baltimore', avatarColor: '#38bdf8' },
    { id: '2', name: 'Commander Alex Mercer', role: 'Instrument Engineer', status: 'active', latencyMs: 64, station: 'NASA Goddard', avatarColor: '#eab308' },
    { id: '3', name: 'Dr. Tiera Sterling', role: 'Data Scientist', status: 'active', latencyMs: 29, station: 'ESA Darmstadt', avatarColor: '#a78bfa' },
    { id: '4', name: 'Prof. Hiroshi Tanaka', role: 'Observatory Operator', status: 'idle', latencyMs: 110, station: 'JAXA Tokyo', avatarColor: '#34d399' },
  ]);

  const [logs, setLogs] = useState<ResearchLogEntry[]>([
    { id: 'l1', timestamp: '03:15:20 UTC', author: 'Dr. Vance', category: 'Solar MHD', message: 'X-Class solar flare coronal loop reconnection confirmed at X5.0 intensity.', verified: true },
    { id: 'l2', timestamp: '03:18:04 UTC', author: 'Dr. Sterling', category: 'Spectroscopy', message: 'CO₂ absorption dip detected at 4.3µm in WASP-96b exoplanet transmission spectrum.', verified: true },
    { id: 'l3', timestamp: '03:22:15 UTC', author: 'Alex Mercer', category: 'Telemetry', message: 'Primary mirror phasing verified at 18.2 nm RMS error. Ka-band downlink stable.', verified: true },
  ]);

  const [newLogMessage, setNewLogMessage] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopyRoom = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogMessage.trim()) return;

    setLogs(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString() + ' UTC',
        author: 'Lead Investigator (You)',
        category: 'Spectroscopy',
        message: newLogMessage,
        verified: true,
      },
    ]);
    setNewLogMessage('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-300 bg-clip-text text-transparent flex items-center space-x-2">
            <Users className="w-6 h-6 text-indigo-400 animate-pulse" />
            <span>Multiplayer Collaborative Observing Room</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Real-time peer synchronization, live observation telemetry streaming, and broadcastable research logs.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-slate-950 border border-indigo-900 px-4 py-2 rounded-2xl text-xs font-mono text-indigo-400 flex items-center space-x-2">
            <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Room Code: {roomCode}</span>
          </div>

          <button
            onClick={handleCopyRoom}
            className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-2xl transition cursor-pointer"
            title="Copy Room Code"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Peers List */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          <h3 className="font-bold text-slate-200 text-md flex items-center space-x-2">
            <Wifi className="w-4 h-4 text-emerald-400" />
            <span>Active Peer Observers ({peers.length})</span>
          </h3>

          <div className="space-y-3">
            {peers.map((peer) => (
              <div key={peer.id} className="bg-slate-950 border border-slate-900 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
                  <div>
                    <p className="font-bold text-xs text-slate-200">{peer.name}</p>
                    <p className="text-[11px] text-slate-400">{peer.role} • {peer.station}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded border border-indigo-900 font-mono block">
                    {peer.latencyMs}ms
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold">{peer.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Research Log Broadcast Stream */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold text-slate-200 text-md mb-4 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Broadcast Observatory Research Logs</span>
            </h3>

            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-2">
              {logs.map((log) => (
                <div key={log.id} className="bg-slate-950 border border-slate-900 p-4 rounded-2xl space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-indigo-400">{log.author}</span>
                    <div className="flex items-center space-x-2 font-mono text-[11px]">
                      <span className="text-amber-500">{log.timestamp}</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 font-mono">{log.message}</p>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleAddLog} className="flex items-center space-x-2 pt-3 border-t border-slate-800">
            <input
              type="text"
              placeholder="Broadcast observation research log entry to peers..."
              value={newLogMessage}
              onChange={(e) => setNewLogMessage(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-lg transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
