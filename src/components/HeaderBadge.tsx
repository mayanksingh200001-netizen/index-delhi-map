/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MonumentData, Hotspot } from '../types';
import { MapPin, Sparkles, Compass, ShieldCheck } from 'lucide-react';

interface HeaderBadgeProps {
  monument: MonumentData;
  activeHotspot: Hotspot | null;
  onClearHotspot: () => void;
  onOpenSpecs: () => void;
}

export const HeaderBadge: React.FC<HeaderBadgeProps> = ({
  monument,
  activeHotspot,
  onClearHotspot,
  onOpenSpecs,
}) => {
  return (
    <div className="fixed top-4 left-4 z-30 flex flex-col gap-2 pointer-events-none max-w-sm sm:max-w-md">
      {/* Title & Heritage Card */}
      <div className="bg-[#10141d]/90 border border-zinc-800 p-3 sm:p-4 rounded-2xl shadow-xl pointer-events-auto">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 font-bold">
            Delhi 3D Heritage
          </span>
          {monument.unesco && (
            <span className="text-[10px] uppercase tracking-wider text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded-full border border-sky-400/20 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> UNESCO
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <h1 className="text-lg sm:text-xl font-serif font-bold text-white tracking-wide">
            {monument.name}
          </h1>
        </div>
        <p className="text-xs text-amber-300/80 font-medium">{monument.hindiName}</p>

        <div className="flex items-center gap-3 mt-2 text-[11px] text-zinc-400 border-t border-zinc-800/80 pt-2">
          <span className="flex items-center gap-1">
            <Compass className="w-3 h-3 text-amber-400" /> {monument.height}
          </span>
          <span className="text-zinc-600">•</span>
          <span className="truncate">{monument.epoch}</span>
        </div>
      </div>

      {/* Active Hotspot Callout banner if user hovered or selected one */}
      {activeHotspot && (
        <div className="bg-[#181e2b]/95 border border-amber-500/50 p-3 rounded-xl shadow-2xl pointer-events-auto animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>{activeHotspot.title}</span>
            </div>
            <button
              onClick={onClearHotspot}
              className="text-[10px] text-zinc-400 hover:text-white px-1.5 py-0.5 rounded bg-zinc-800"
            >
              Dismiss
            </button>
          </div>
          <p className="text-xs text-zinc-300 mt-1 leading-snug">{activeHotspot.description}</p>
        </div>
      )}
    </div>
  );
};
