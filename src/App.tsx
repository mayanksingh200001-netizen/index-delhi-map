/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { DelhiSceneManager } from './scene/DelhiSceneManager';
import { MonumentId, LightingPreset, RenderStyle, CameraPreset, Hotspot } from './types';
import { MONUMENTS } from './data/monuments';
import { ControlDock } from './components/ControlDock';
import { HeaderBadge } from './components/HeaderBadge';
import { MonumentDetailModal } from './components/MonumentDetailModal';
import { audioSynth } from './scene/audioSynthesizer';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<DelhiSceneManager | null>(null);

  // Application State
  const [activeMonumentId, setActiveMonumentId] = useState<MonumentId>('delhi-diorama');
  const [lighting, setLighting] = useState<LightingPreset>('golden-hour');
  const [renderStyle, setRenderStyle] = useState<RenderStyle>('pbr-realistic');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('perspective');
  const [explodedAmount, setExplodedAmount] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(true);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Initialize Three.js Scene once in stable ref
  useEffect(() => {
    if (!mountRef.current) return;

    const manager = new DelhiSceneManager(mountRef.current, {
      onHotspotClick: (hotspot) => {
        setActiveHotspot(hotspot);
        audioSynth.playBellChime(580);
      },
      onHotspotHover: (hotspot) => {
        if (hotspot && !activeHotspot) {
          setActiveHotspot(hotspot);
        }
      },
    });

    sceneManagerRef.current = manager;

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') handleSelectMonument('delhi-diorama');
      if (e.key === '2') handleSelectMonument('india-gate');
      if (e.key === '3') handleSelectMonument('qutub-minar');
      if (e.key === '4') handleSelectMonument('lotus-temple');
      if (e.key === '5') handleSelectMonument('red-fort');
      if (e.key === ' ') {
        e.preventDefault();
        setAutoRotate((prev) => {
          const next = !prev;
          manager.setAutoRotate(next);
          return next;
        });
      }
      if (e.key === 'm' || e.key === 'M') {
        toggleAudio();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      manager.dispose();
      sceneManagerRef.current = null;
    };
  }, []);

  const handleSelectMonument = useCallback((id: MonumentId) => {
    setActiveMonumentId(id);
    setActiveHotspot(null);
    setExplodedAmount(0);
    setCameraPreset('perspective');
    sceneManagerRef.current?.setMonument(id);
    sceneManagerRef.current?.setExplodedAmount(0);
    audioSynth.playBellChime(528);
  }, []);

  const handleChangeLighting = useCallback((preset: LightingPreset) => {
    setLighting(preset);
    sceneManagerRef.current?.setLighting(preset);
    if (preset === 'republic-day') {
      audioSynth.playFanfare();
    } else {
      audioSynth.playBellChime(440);
    }
  }, []);

  const handleChangeRenderStyle = useCallback((style: RenderStyle) => {
    setRenderStyle(style);
    sceneManagerRef.current?.setRenderStyle(style);
  }, []);

  const handleChangeCameraPreset = useCallback((preset: CameraPreset) => {
    setCameraPreset(preset);
    sceneManagerRef.current?.setCameraPreset(preset);
  }, []);

  const handleChangeExploded = useCallback((val: number) => {
    setExplodedAmount(val);
    sceneManagerRef.current?.setExplodedAmount(val);
  }, []);

  const handleToggleAutoRotate = useCallback(() => {
    setAutoRotate((prev) => {
      const next = !prev;
      sceneManagerRef.current?.setAutoRotate(next);
      return next;
    });
  }, []);

  const toggleAudio = useCallback(() => {
    const nextMuted = !isAudioMuted;
    setIsAudioMuted(nextMuted);
    audioSynth.setMuted(nextMuted);
    if (!nextMuted) {
      audioSynth.playBellChime(528);
    }
  }, [isAudioMuted]);

  const handleCaptureSnapshot = useCallback(() => {
    if (!sceneManagerRef.current) return;
    const dataUrl = sceneManagerRef.current.captureSnapshot();
    const link = document.createElement('a');
    link.download = `delhi-3d-${activeMonumentId}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    audioSynth.playBellChime(750);
  }, [activeMonumentId]);

  const handleSelectHotspotFromModal = useCallback((h: Hotspot) => {
    setActiveHotspot(h);
    setIsDetailModalOpen(false);
    sceneManagerRef.current?.focusHotspot(h);
  }, []);

  const activeMonumentData = MONUMENTS[activeMonumentId] || MONUMENTS['delhi-diorama'];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0c0f17] select-none font-sans">
      {/* 1. Stable WebGL Canvas Container (Skill Directive 4.1) */}
      <div 
        ref={mountRef} 
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* 2. Top-Left Minimal Header & Active Hotspot Callout */}
      <HeaderBadge
        monument={activeMonumentData}
        activeHotspot={activeHotspot}
        onClearHotspot={() => setActiveHotspot(null)}
        onOpenSpecs={() => setIsDetailModalOpen(true)}
      />

      {/* 3. Collapsible Bottom Control Dock (<= 15% Viewport footprint) */}
      <ControlDock
        activeMonument={activeMonumentId}
        onSelectMonument={handleSelectMonument}
        lighting={lighting}
        onChangeLighting={handleChangeLighting}
        renderStyle={renderStyle}
        onChangeRenderStyle={handleChangeRenderStyle}
        cameraPreset={cameraPreset}
        onChangeCameraPreset={handleChangeCameraPreset}
        explodedAmount={explodedAmount}
        onChangeExploded={handleChangeExploded}
        autoRotate={autoRotate}
        onToggleAutoRotate={handleToggleAutoRotate}
        isAudioMuted={isAudioMuted}
        onToggleAudio={toggleAudio}
        onCaptureSnapshot={handleCaptureSnapshot}
        onOpenInfo={() => setIsDetailModalOpen(true)}
      />

      {/* 4. Architectural Specs & History Detail Modal */}
      {isDetailModalOpen && (
        <MonumentDetailModal
          monument={activeMonumentData}
          activeHotspot={activeHotspot}
          onClose={() => setIsDetailModalOpen(false)}
          onSelectHotspot={handleSelectHotspotFromModal}
        />
      )}
    </div>
  );
}
