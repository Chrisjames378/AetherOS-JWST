/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sparkles,
  ExternalLink,
  BookOpen,
  Send,
  Layers,
  Cpu,
  CheckCircle2,
  FileText,
  Hexagon,
  Database,
} from 'lucide-react';
import { ModalWrapper } from './tools/ModalWrapper';

interface AetherosPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBench?: () => void;
  onOpenViewfinder?: () => void;
}

export const AetherosPortalModal: React.FC<AetherosPortalModalProps> = ({
  isOpen,
  onClose,
  onOpenBench,
  onOpenViewfinder,
}) => {
  const [emailInput, setEmailInput] = useState<string>('');
  const [selectedSeat, setSelectedSeat] = useState<string>('analyst');
  const [selectedFocus, setSelectedFocus] = useState<string>('spectra');
  const [briefSubmitted, setBriefSubmitted] = useState<boolean>(false);

  const handleSubmitBrief = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    setBriefSubmitted(true);
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="AETHEROS — Observer Suite & Downlink Portal"
      badge="JWST Science Architecture"
      widthClass="max-w-4xl"
    >
      <div className="flex flex-col gap-4 font-mono text-xs text-fg">
        {/* CROSS-PLATFORM NETWORK BANNER */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded bg-surface/90 border border-line">
          <div className="flex items-center gap-2.5">
            <Hexagon className="w-5 h-5 text-flare fill-flare/20" />
            <div>
              <div className="font-bold text-fg text-sm tracking-wide">AETHEROS Observatory Network</div>
              <div className="text-[11px] text-muted">
                Simulated JWST-class space science, exoplanet spectroscopy &amp; precision ephemeris
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://bloom-bird-finch-quiet.grok.me/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded bg-flare/15 hover:bg-flare/25 text-flare border border-flare/40 transition-colors"
            >
              <span>Aetheros Hub (grok.me)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://aetheros-jwst.ai.studio"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded bg-signal/15 hover:bg-signal/25 text-signal border border-signal/40 transition-colors"
            >
              <span>Live Observatory</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* FIELD NOTES SECTION */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] text-muted border-b border-line pb-1">
            <span className="font-bold uppercase tracking-wider text-flare flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Observer Field Notes &amp; Mission Logs
            </span>
            <span>Real science verification</span>
          </div>

          <div className="grid md:grid-cols-3 gap-2.5">
            <div className="p-3 rounded bg-surface/60 border border-line flex flex-col justify-between">
              <blockquote className="text-[11px] text-fg/90 italic leading-relaxed">
                &ldquo;I used the transit bench to walk a seminar through WASP-96 b&apos;s water feature before we opened the NIRISS paper. The depth is (Rp / R★)&sup2;, the way I actually teach it.&rdquo;
              </blockquote>
              <div className="mt-2.5 pt-2 border-t border-line/40 text-[10px] text-muted">
                <span className="font-bold text-fg">Amira Solano</span> &middot; Exoplanet lecturer
              </div>
            </div>

            <div className="p-3 rounded bg-surface/60 border border-line flex flex-col justify-between">
              <blockquote className="text-[11px] text-fg/90 italic leading-relaxed">
                &ldquo;First browser deck that parks Webb at L2 with the sunshield layers in the scene. Students stop asking where the telescope is.&rdquo;
              </blockquote>
              <div className="mt-2.5 pt-2 border-t border-line/40 text-[10px] text-muted">
                <span className="font-bold text-fg">Jonah Park</span> &middot; Planetarium programs
              </div>
            </div>

            <div className="p-3 rounded bg-surface/60 border border-line flex flex-col justify-between">
              <blockquote className="text-[11px] text-fg/90 italic leading-relaxed">
                &ldquo;FITS headers that are actually 2880-byte blocks. I dropped a stamp into a reduction notebook and it opened. That is the bar.&rdquo;
              </blockquote>
              <div className="mt-2.5 pt-2 border-t border-line/40 text-[10px] text-muted">
                <span className="font-bold text-fg">Leila Okonkwo</span> &middot; Data reduction
              </div>
            </div>
          </div>
        </div>

        {/* SCIENCE INSTRUMENT MATRIX */}
        <div className="flex flex-col gap-2">
          <span className="font-bold uppercase tracking-wider text-signal text-[11px] flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" />
            JWST Science Instrument Suite Specs
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="p-2.5 rounded bg-surface/70 border border-line">
              <div className="font-bold text-flare">NIRCam</div>
              <div className="text-[10px] text-muted">0.6 – 5.0 μm</div>
              <div className="mt-1 text-fg">Primary deep space imager &amp; wavefront sensor.</div>
            </div>
            <div className="p-2.5 rounded bg-surface/70 border border-line">
              <div className="font-bold text-signal">NIRSpec</div>
              <div className="text-[10px] text-muted">0.6 – 5.3 μm</div>
              <div className="mt-1 text-fg">Microshutter array, 100 simultaneous galaxy spectra.</div>
            </div>
            <div className="p-2.5 rounded bg-surface/70 border border-line">
              <div className="font-bold text-orange-400">MIRI</div>
              <div className="text-[10px] text-muted">4.9 – 28.8 μm</div>
              <div className="mt-1 text-fg">Cryocooled to 6.7 K for mid-infrared dust &amp; proto-stars.</div>
            </div>
            <div className="p-2.5 rounded bg-surface/70 border border-line">
              <div className="font-bold text-cyan-400">NIRISS</div>
              <div className="text-[10px] text-muted">0.8 – 5.0 μm</div>
              <div className="mt-1 text-fg">Wide-field slitless exoplanet transit spectroscopy.</div>
            </div>
          </div>
        </div>

        {/* OBSERVER BRIEF DISPATCH FORM */}
        <div className="p-3.5 rounded bg-surface/70 border border-line flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <span className="font-bold text-fg flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-flare" />
              Observer Brief &amp; Downlink Dispatch
            </span>
            <span className="text-[10px] text-muted">Stored locally in-browser</span>
          </div>

          {briefSubmitted ? (
            <div className="p-3 rounded bg-signal/15 border border-signal/40 text-signal flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                Downlink note registered for <strong className="text-fg">{emailInput}</strong> ({selectedSeat} tier, {selectedFocus} focus). Your instrument map and 2880-byte FITS contract are active!
              </span>
            </div>
          ) : (
            <form onSubmit={handleSubmitBrief} className="grid sm:grid-cols-3 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-muted uppercase">Observer Email</label>
                <input
                  type="email"
                  required
                  placeholder="you@observatory.edu"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="px-2.5 py-1.5 rounded bg-bg border border-line text-fg focus:border-flare outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-muted uppercase">Seat Tier</label>
                <select
                  value={selectedSeat}
                  onChange={(e) => setSelectedSeat(e.target.value)}
                  className="px-2.5 py-1.5 rounded bg-bg border border-line text-fg focus:border-flare outline-none"
                >
                  <option value="observer">Observer (Flight Deck)</option>
                  <option value="analyst">Analyst (Spectra &amp; FITS)</option>
                  <option value="consortium">Consortium (Full Lab)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-muted uppercase">Focus Area</label>
                <select
                  value={selectedFocus}
                  onChange={(e) => setSelectedFocus(e.target.value)}
                  className="px-2.5 py-1.5 rounded bg-bg border border-line text-fg focus:border-flare outline-none"
                >
                  <option value="spectra">Spectroscopy &amp; Transits</option>
                  <option value="flight">Flight Deck &amp; L2 Halo</option>
                  <option value="teaching">Teaching &amp; Seminars</option>
                  <option value="consortium">Data Reduction Pipeline</option>
                </select>
              </div>

              <div className="sm:col-span-3 flex justify-end gap-2 mt-1">
                {onOpenViewfinder && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenViewfinder();
                    }}
                    className="px-3 py-1.5 rounded bg-raised hover:bg-flare/20 text-flare border border-line font-bold transition-colors"
                  >
                    Open JWST Optics Viewfinder
                  </button>
                )}
                {onOpenBench && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenBench();
                    }}
                    className="px-3 py-1.5 rounded bg-raised hover:bg-signal/20 text-signal border border-line font-bold transition-colors"
                  >
                    Open Orbit Bench
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-flare text-flare-ink font-bold hover:brightness-110 flex items-center gap-1.5 transition-all shadow"
                >
                  <Send className="w-3 h-3" />
                  <span>Send Downlink Brief</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
};
