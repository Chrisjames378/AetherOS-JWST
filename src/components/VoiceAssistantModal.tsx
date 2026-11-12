import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Send, Sparkles, Database, Check, AlertCircle } from 'lucide-react';
import { useAuth } from './AuthContext';

interface Message {
  role: 'user' | 'model';
  text: string;
  time: string;
}

interface VoiceAssistantModalProps {
  onClose: () => void;
  currentTargetName?: string;
  currentTargetId?: string;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  onClose,
  currentTargetName = 'Carina Nebula (NGC 3372)',
  currentTargetId = 'carina',
}) => {
  const { user, idToken, signInWithGoogle } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: `AetherOS Voice Assistant online. Connected to JWST NIRCam sensors. Ask me anything about ${currentTargetName} or astrophysics telemetry.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dbSaved, setDbSaved] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Speech Recognition setup (Web Speech API)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
          handleSendMessage(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser window. Try typing your message below.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 0.95;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isGenerating) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = { role: 'user', text: textToSend, time: timeStr };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputText('');
    setIsGenerating(true);

    try {
      const formattedHistory = messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      const res = await fetch('/api/gemini/voice-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          conversationHistory: formattedHistory,
        }),
      });

      const data = await res.json();
      const replyText = data.text || 'Telemetry signal received.';

      const modelMsg: Message = { role: 'model', text: replyText, time: timeStr };
      setMessages((prev) => [...prev, modelMsg]);

      // Speak response using Web Speech Synthesis
      speakText(replyText);
    } catch (err) {
      console.error('Voice assistant error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: 'Communication array error. Re-establishing telemetry uplink.',
          time: timeStr,
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToCloudSql = async () => {
    if (!user || !idToken) {
      signInWithGoogle();
      return;
    }

    try {
      const summaryNotes = messages.map((m) => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
      const res = await fetch('/api/observations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          targetName: currentTargetName,
          targetId: currentTargetId,
          category: 'Voice AI Session',
          notes: summaryNotes,
          wavelengthBand: 'Live Audio Stream (gemini-3.8-live)',
          snrRatio: '42.1 dB',
        }),
      });

      if (res.ok) {
        setDbSaved(true);
        setTimeout(() => setDbSaved(false), 3000);
      }
    } catch (err) {
      console.error('Error saving observation to Cloud SQL:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl rounded-2xl border border-cyan-500/40 bg-slate-950/95 p-5 shadow-2xl text-slate-100 flex flex-col max-h-[88vh]">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-mono text-cyan-300 flex items-center gap-2">
                GEMINI LIVE VOICE ASSISTANT
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  gemini-3.8-live
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Target: <span className="text-slate-200 font-semibold">{currentTargetName}</span>
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

        {/* VOICE WAVEFORM VISUALIZER */}
        <div className="my-3 p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleMic}
              className={`p-3 rounded-full transition-all flex items-center justify-center ${
                isListening
                  ? 'bg-red-500 text-white animate-bounce shadow-[0_0_20px_rgba(239,68,68,0.6)]'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg'
              }`}
              title={isListening ? 'Stop Listening' : 'Start Voice Input'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <div>
              <div className="text-xs font-semibold text-slate-200">
                {isListening ? '🎤 Listening for voice prompt...' : isSpeaking ? '🔊 Speaking...' : 'Tap Mic to speak'}
              </div>
              <div className="text-[11px] text-slate-400">
                {isListening ? 'Say a question out loud' : 'Real-time 16kHz PCM audio stream'}
              </div>
            </div>
          </div>

          {/* Animated Spectral Waveform Bars */}
          <div className="flex items-center gap-1 h-6 px-2">
            {[0.4, 0.8, 0.3, 0.9, 0.6, 0.2, 0.7, 0.5].map((scale, i) => (
              <div
                key={i}
                className={`w-1 rounded-full bg-cyan-400 transition-all duration-200 ${
                  isSpeaking || isListening ? 'animate-pulse' : 'opacity-30'
                }`}
                style={{
                  height: (isSpeaking || isListening ? Math.max(8, scale * 24) : 8) + 'px',
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* CHAT MESSAGES LOG */}
        <div className="flex-1 overflow-y-auto space-y-3 p-2 my-1 max-h-[42vh] pr-1">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-cyan-600 text-white rounded-br-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.time}</span>
            </div>
          ))}
          {isGenerating && (
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono animate-pulse p-2">
              <Sparkles className="w-3.5 h-3.5" /> Processing live telemetry...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT FORM & CLOUD SQL SAVE BUTTON */}
        <div className="pt-3 border-t border-slate-800 space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type message or ask voice question..."
              className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={isGenerating || !inputText.trim()}
              className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Send className="w-3.5 h-3.5" />
              Send
            </button>
          </form>

          {/* CLOUD SQL PERSISTENCE TRIGGER */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              {user ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  ✓ Auth: {user.email}
                </span>
              ) : (
                <span className="text-slate-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-amber-400" /> Sign in to save to Cloud SQL
                </span>
              )}
            </span>

            <button
              type="button"
              onClick={handleSaveToCloudSql}
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-cyan-300 flex items-center gap-1.5 transition"
            >
              {dbSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Saved to Cloud SQL!
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  {user ? 'Save Log to Cloud SQL' : 'Sign in & Save Log'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
