/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MonumentId, LightingPreset, RenderStyle, CameraPreset } from '../types';
import {
  Sun,
  Sunset,
  Moon,
  Flag,
  RotateCw,
  Camera,
  Layers,
  Eye,
  Info,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  Compass,
  Sparkles,
} from 'lucide-react';

interface ControlDockProps {
  activeMonument: MonumentId;
  onSelectMonument: (id: MonumentId) => void;
  lighting: LightingPreset;
  onChangeLighting: (preset: LightingPreset) => void;
  renderStyle: RenderStyle;
  onChangeRenderStyle: (style: RenderStyle) => void;
  cameraPreset: CameraPreset;
  onChangeCameraPreset: (preset: CameraPreset) => void;
  explodedAmount: number;
  onChangeExploded: (val: number) => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
  onCaptureSnapshot: () => void;
  onOpenInfo: () => void;
}

export const ControlDock: React.FC<ControlDockProps> = ({
  activeMonument,
  onSelectMonument,
  lighting,
  onChangeLighting,
  renderStyle,
  onChangeRenderStyle,
  cameraPreset,
  onChangeCameraPreset,
  explodedAmount,
  onChangeExploded,
  autoRotate,
  onToggleAutoRotate,
  isAudioMuted,
  onToggleAudio,
  onCaptureSnapshot,
  onOpenInfo,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'monuments' | 'lighting' | 'styles' | 'camera'>('monuments');

  const monumentsList: { id: MonumentId; label: string; icon: string }[] = [
    { id: 'delhi-diorama', label: 'Delhi Diorama', icon: '🏛️' },
    { id: 'india-gate', label: 'India Gate', icon: '🎖️' },
    { id: 'qutub-minar', label: 'Qutub Minar', icon: '🗼' },
    { id: 'lotus-temple', label: 'Lotus Temple', icon: '🪷' },
    { id: 'red-fort', label: 'Red Fort', icon: '🏰' },
  ];

  const lightingPresets: { id: LightingPreset; label: string; icon: React.ReactNode }[] = [
    { id: 'golden-hour', label: 'Golden Hour', icon: <Sunset className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'noon', label: 'High Noon', icon: <Sun className="w-3.5 h-3.5 text-yellow-300" /> },
    { id: 'republic-day', label: 'Republic Day', icon: <Flag className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: 'night', label: 'Starry Night', icon: <Moon className="w-3.5 h-3.5 text-indigo-300" /> },
  ];

  const renderStylesList: { id: RenderStyle; label: string }[] = [
    { id: 'pbr-realistic', label: 'Realistic PBR' },
    { id: 'architectural-clay', label: 'Sandstone Clay' },
    { id: 'blueprint', label: 'Cyan Blueprint' },
    { id: 'wireframe', label: 'Wireframe' },
  ];

  const cameraList: { id: CameraPreset; label: string }[] = [
    { id: 'perspective', label: 'Orbit' },
    { id: 'drone', label: 'Drone Top' },
    { id: 'ground', label: 'Eye Level' },
    { id: 'front', label: 'Frontal' },
  ];

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl px-3 transition-transform duration-300 ${
        isCollapsed ? 'translate-y-[calc(100%-40px)]' : 'translate-y-0'
      }`}
      style={{ maxWidth: 'min(960px, 95vw)' }}
    >
      {/* Collapse / Expand Tab Toggle */}
      <div className="flex justify-center mb-1">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 px-4 py-1 rounded-t-xl bg-[#171b24] text-zinc-300 hover:text-white border-t border-x border-zinc-700/80 text-xs font-semibold shadow-lg transition-colors cursor-pointer"
          title="Toggle controls visibility (HotKey: H)"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
              <span>Show Controls</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
              <span>Hide Controls (Zen View)</span>
            </>
          )}
        </button>
      </div>

      {/* Main Solid Dock Surface */}
      <div className="rounded-2xl bg-[#12161f] border border-zinc-800 shadow-2xl p-3 sm:p-4 text-zinc-200">
        {/* Navigation & Monument Selectors */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
            {monumentsList.map((m) => {
              const active = activeMonument === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => onSelectMonument(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                      : 'bg-[#1b212d] text-zinc-300 hover:bg-[#252c3c] hover:text-white border border-zinc-800'
                  }`}
                >
                  <span>{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Utility Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenInfo}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#1b212d] hover:bg-[#252c3c] text-amber-400 text-xs font-medium border border-zinc-800 transition-colors"
              title="Monument History & Architecture Specs"
            >
              <Info className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Specs</span>
            </button>

            <button
              onClick={onToggleAutoRotate}
              className={`p-1.5 rounded-xl text-xs border transition-colors ${
                autoRotate
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-[#1b212d] text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
              title="Toggle Auto-Orbit"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              onClick={onToggleAudio}
              className={`p-1.5 rounded-xl text-xs border transition-colors ${
                !isAudioMuted
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-[#1b212d] text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
              title="Toggle Procedural Audio Soundscape"
            >
              {!isAudioMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={onCaptureSnapshot}
              className="p-1.5 rounded-xl bg-[#1b212d] hover:bg-[#252c3c] text-zinc-300 hover:text-white border border-zinc-800 transition-colors"
              title="Capture High-Res Photo"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Secondary Sub-Controls Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 items-center">
          {/* Exploded View Slider (if not whole diorama) */}
          <div className="md:col-span-5 flex items-center gap-3 bg-[#191f2c] px-3 py-2 rounded-xl border border-zinc-800/80">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 whitespace-nowrap">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Exploded X-Ray:</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={explodedAmount}
              onChange={(e) => onChangeExploded(parseFloat(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-zinc-700 rounded-lg cursor-pointer"
            />
            <span className="text-[11px] font-mono text-amber-400 w-9 text-right font-medium">
              {Math.round(explodedAmount * 100)}%
            </span>
          </div>

          {/* Lighting Presets */}
          <div className="md:col-span-4 flex items-center gap-1 bg-[#191f2c] p-1 rounded-xl border border-zinc-800/80 overflow-x-auto no-scrollbar">
            {lightingPresets.map((lp) => {
              const active = lighting === lp.id;
              return (
                <button
                  key={lp.id}
                  onClick={() => onChangeLighting(lp.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    active
                      ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {lp.icon}
                  <span className="hidden sm:inline">{lp.label}</span>
                </button>
              );
            })}
          </div>

          {/* Render Finish / Camera Selector Tabs */}
          <div className="md:col-span-3 flex items-center justify-end gap-1.5">
            <select
              value={renderStyle}
              onChange={(e) => onChangeRenderStyle(e.target.value as RenderStyle)}
              className="bg-[#191f2c] text-zinc-300 hover:text-white border border-zinc-800 text-xs rounded-xl px-2.5 py-1.5 outline-none font-medium cursor-pointer"
            >
              {renderStylesList.map((st) => (
                <option key={st.id} value={st.id} className="bg-zinc-900 text-white">
                  {st.label}
                </option>
              ))}
            </select>

            <select
              value={cameraPreset}
              onChange={(e) => onChangeCameraPreset(e.target.value as CameraPreset)}
              className="bg-[#191f2c] text-zinc-300 hover:text-white border border-zinc-800 text-xs rounded-xl px-2.5 py-1.5 outline-none font-medium cursor-pointer"
            >
              {cameraList.map((cp) => (
                <option key={cp.id} value={cp.id} className="bg-zinc-900 text-white">
                  {cp.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
