import React, { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  orderBy,
} from 'firebase/firestore';
import {
  BookOpen,
  Camera,
  Trash2,
  ExternalLink,
  Sparkles,
  Database,
  Compass,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { toJulianDate } from '../utils/orbitalMath';

export interface MissionLogEntry {
  id?: string;
  userId: string;
  targetName: string;
  targetId: string;
  timestampMs: number;
  julianDate: string;
  telemetry: {
    pitchDeg: number;
    yawDeg: number;
    rollDeg: number;
    distanceAuOrKm: string;
    orbitSpeedKmS: string;
    cryoTempK: string;
  };
  notes: string;
  createdAt: string;
}

interface MissionLogbookModalProps {
  onClose: () => void;
  currentTargetName: string;
  currentTargetId: string;
  currentTimeMs: number;
  onFlyToTarget?: (targetId: string) => void;
}

export const MissionLogbookModal: React.FC<MissionLogbookModalProps> = ({
  onClose,
  currentTargetName,
  currentTargetId,
  currentTimeMs,
  onFlyToTarget,
}) => {
  const { user, signInWithGoogle } = useAuth();
  const [logs, setLogs] = useState<MissionLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(true);
  const [notesInput, setNotesInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const julianDateVal = toJulianDate(currentTimeMs).toFixed(4);

  // Load Firestore Mission Logs in real-time
  useEffect(() => {
    if (!user) {
      setLogs([]);
      setLoadingLogs(false);
      return;
    }

    setLoadingLogs(true);
    try {
      const q = query(
        collection(db, 'mission_logs'),
        where('userId', '==', user.uid)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetched: MissionLogEntry[] = [];
          snapshot.forEach((docSnap) => {
            fetched.push({
              id: docSnap.id,
              ...(docSnap.data() as Omit<MissionLogEntry, 'id'>),
            });
          });
          // Sort descending by timestamp
          fetched.sort((a, b) => b.timestampMs - a.timestampMs);
          setLogs(fetched);
          setLoadingLogs(false);
        },
        (err) => {
          console.error('Firestore onSnapshot error:', err);
          setErrorMessage('Firestore permissions error. Please check authentication.');
          setLoadingLogs(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Failed to subscribe to mission logs:', err);
      setLoadingLogs(false);
    }
  }, [user]);

  const handleSaveSnapshot = async () => {
    if (!user) {
      signInWithGoogle();
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    // Simulated 3D attitude telemetry relative to Ecliptic plane
    const simulatedPitch = Number((Math.sin(currentTimeMs / 10000) * 24.5).toFixed(2));
    const simulatedYaw = Number(((currentTimeMs / 86400) % 360).toFixed(2));
    const simulatedRoll = Number((Math.cos(currentTimeMs / 12000) * 12.8).toFixed(2));

    const newEntry: Omit<MissionLogEntry, 'id'> = {
      userId: user.uid,
      targetName: currentTargetName || 'JWST Solar-Earth L2 Orbit',
      targetId: currentTargetId || 'jwst',
      timestampMs: currentTimeMs,
      julianDate: `JD ${julianDateVal}`,
      telemetry: {
        pitchDeg: simulatedPitch,
        yawDeg: simulatedYaw,
        rollDeg: simulatedRoll,
        distanceAuOrKm: '1.5 Million km (Sun-Earth L2)',
        orbitSpeedKmS: '0.23 km/s (Lissajous Halo)',
        cryoTempK: '6.7 K (MIRI Detector)',
      },
      notes: notesInput.trim() || `Observatory snapshot recorded at ${new Date(currentTimeMs).toUTCString()}`,
      createdAt: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, 'mission_logs'), newEntry);
      setIsSaving(false);
      setSaveSuccess(true);
      setNotesInput('');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving mission log to Firestore:', err);
      setErrorMessage(err.message || 'Failed to save log snapshot to Firestore.');
      setIsSaving(false);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    try {
      await deleteDoc(doc(db, 'mission_logs', logId));
    } catch (err) {
      console.error('Error deleting mission log from Firestore:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-3xl rounded-2xl border border-cyan-500/40 bg-slate-950/95 p-5 shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-mono tracking-tight bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
                MISSION LOGBOOK
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  FIRESTORE PERSISTENT
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Telescope Telemetry Snapshots, Ecliptic Orientation &amp; Observatory Research Logs
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

        {/* SNAPSHOT CAPTURE BOX */}
        <div className="my-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
              <Camera className="w-4 h-4 text-cyan-400" />
              <span className="font-bold">CURRENT SIMULATION STATE</span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              {new Date(currentTimeMs).toUTCString()} (JD {julianDateVal})
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Target Object</span>
              <span className="font-bold text-amber-300 truncate block">{currentTargetName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Orbit Location</span>
              <span className="font-semibold text-slate-200 block">Sun-Earth L2</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Ecliptic Attitude</span>
              <span className="font-mono text-cyan-300 block">P: +14.2° | Y: 182°</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Detector Cryo</span>
              <span className="font-semibold text-emerald-400 block">6.7 K (MIRI)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <input
              type="text"
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="Add scientific notes, observations, or exoplanet transit remarks..."
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
            />
            <button
              type="button"
              onClick={handleSaveSnapshot}
              disabled={isSaving}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg transition"
            >
              {isSaving ? (
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Database className="w-3.5 h-3.5" />
              )}
              {user ? 'Save Snapshot to Firestore' : 'Sign in & Save Snapshot'}
            </button>
          </div>

          {saveSuccess && (
            <div className="p-2 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs rounded-lg flex items-center gap-2 font-mono">
              ✓ Telemetry snapshot saved to Firestore mission logbook!
            </div>
          )}

          {errorMessage && (
            <div className="p-2 bg-red-950/60 border border-red-500/40 text-red-300 text-xs rounded-lg flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 text-red-400" />
              {errorMessage}
            </div>
          )}
        </div>

        {/* LOGBOOK ENTRIES LIST */}
        <div className="flex-1 overflow-y-auto space-y-3 my-1 pr-1">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span>SAVED FIRESTORE MISSION LOGS ({logs.length})</span>
            {!user && <span className="text-amber-400 text-[11px]">Google Sign-in required</span>}
          </h3>

          {loadingLogs ? (
            <div className="text-center py-8 text-xs text-slate-500 font-mono animate-pulse">
              Querying Firestore mission_logs collection...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 font-mono bg-slate-900/30 rounded-xl border border-slate-800/40 p-6">
              No saved mission logs yet. Click "Save Snapshot to Firestore" above to record current telescope telemetry.
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl hover:border-cyan-500/40 transition group"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-800/60 pb-2">
                  <div>
                    <span className="font-bold text-cyan-300 text-sm font-mono block">
                      {log.targetName}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(log.timestampMs).toUTCString()} ({log.julianDate})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {onFlyToTarget && (
                      <button
                        type="button"
                        onClick={() => {
                          onFlyToTarget(log.targetId);
                          onClose();
                        }}
                        className="px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/30 rounded-lg text-[11px] font-mono flex items-center gap-1 transition"
                        title="Fly camera to this target"
                      >
                        <ExternalLink className="w-3 h-3" /> Fly View
                      </button>
                    )}
                    {log.id && (
                      <button
                        type="button"
                        onClick={() => handleDeleteLog(log.id!)}
                        className="p-1 text-slate-500 hover:text-red-400 transition"
                        title="Delete entry from Firestore"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300 my-2 font-sans bg-slate-950/40 p-2 rounded border border-slate-800/40">
                  {log.notes}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono text-slate-400 pt-1">
                  <div>
                    <span className="text-slate-500">Attitude:</span> Pitch {log.telemetry.pitchDeg}° | Yaw {log.telemetry.yawDeg}°
                  </div>
                  <div>
                    <span className="text-slate-500">Orbit Velocity:</span> {log.telemetry.orbitSpeedKmS}
                  </div>
                  <div>
                    <span className="text-slate-500">Detector Cryo:</span> {log.telemetry.cryoTempK}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
