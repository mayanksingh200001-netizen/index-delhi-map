/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MonumentData, Hotspot } from '../types';
import { X, Award, MapPin, Compass, Landmark, Sparkles, Volume2 } from 'lucide-react';
import { audioSynth } from '../scene/audioSynthesizer';

interface MonumentDetailModalProps {
  monument: MonumentData;
  activeHotspot: Hotspot | null;
  onClose: () => void;
  onSelectHotspot: (hotspot: Hotspot) => void;
}

export const MonumentDetailModal: React.FC<MonumentDetailModalProps> = ({
  monument,
  activeHotspot,
  onClose,
  onSelectHotspot,
}) => {
  const handleHotspotClick = (h: Hotspot) => {
    audioSynth.playBellChime(640);
    onSelectHotspot(h);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl bg-[#141820] text-zinc-100 border border-zinc-700/80 shadow-2xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs uppercase tracking-widest font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Architectural Spec
              </span>
              {monument.unesco && (
                <span className="flex items-center gap-1 text-xs uppercase tracking-widest font-medium px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  <Award className="w-3.5 h-3.5" /> UNESCO Heritage
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wide">
              {monument.name}
            </h2>
            <p className="text-amber-300/80 text-sm font-medium mt-0.5">{monument.hindiName}</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Spec Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
          <div className="bg-[#1c222e] p-3 rounded-xl border border-zinc-800">
            <span className="text-xs text-zinc-400 flex items-center gap-1"><Landmark className="w-3.5 h-3.5 text-amber-400" /> Epoch</span>
            <p className="text-sm font-semibold text-zinc-200 mt-1">{monument.epoch}</p>
          </div>
          <div className="bg-[#1c222e] p-3 rounded-xl border border-zinc-800">
            <span className="text-xs text-zinc-400 flex items-center gap-1"><Compass className="w-3.5 h-3.5 text-amber-400" /> Height / Scale</span>
            <p className="text-sm font-semibold text-zinc-200 mt-1">{monument.height}</p>
          </div>
          <div className="bg-[#1c222e] p-3 rounded-xl border border-zinc-800">
            <span className="text-xs text-zinc-400 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-amber-400" /> Material</span>
            <p className="text-xs font-semibold text-zinc-200 mt-1 line-clamp-2">{monument.material}</p>
          </div>
          <div className="bg-[#1c222e] p-3 rounded-xl border border-zinc-800">
            <span className="text-xs text-zinc-400 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-amber-400" /> Master Architect</span>
            <p className="text-xs font-semibold text-zinc-200 mt-1 line-clamp-2">{monument.architect}</p>
          </div>
        </div>

        {/* Significance */}
        <div className="space-y-4 text-zinc-300 text-sm leading-relaxed">
          <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5">Architectural Heritage</h4>
            <p>{monument.significance}</p>
          </div>

          <div className="bg-amber-950/20 border border-amber-800/40 p-4 rounded-xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Architectural Discovery & Historical Fact
            </h4>
            <p className="text-zinc-300 text-xs sm:text-sm">{monument.funFact}</p>
          </div>
        </div>

        {/* Hotspots Section */}
        <div className="mt-6 pt-5 border-t border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" /> 3D Architectural Hotspots (Click to Fly Camera)
            </h4>
            <span className="text-[11px] text-zinc-500">{monument.hotspots.length} features marked</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {monument.hotspots.map((h) => {
              const isSelected = activeHotspot?.id === h.id;
              return (
                <button
                  key={h.id}
                  onClick={() => handleHotspotClick(h)}
                  className={`text-left p-3 rounded-xl transition-all border ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500/60 text-white'
                      : 'bg-[#181e29] border-zinc-800/90 hover:border-zinc-700 text-zinc-300 hover:bg-[#1f2635]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-amber-200">{h.title}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      {h.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{h.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
          <p className="text-xs text-zinc-500">Press Esc or click close to return to 3D scene</p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold tracking-wide transition-colors"
          >
            Explore 3D View
          </button>
        </div>
      </div>
    </div>
  );
};
