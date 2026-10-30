/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MonumentId = 
  | 'delhi-diorama'
  | 'india-gate'
  | 'qutub-minar'
  | 'lotus-temple'
  | 'red-fort';

export type LightingPreset = 
  | 'golden-hour'
  | 'noon'
  | 'republic-day'
  | 'night';

export type RenderStyle = 
  | 'pbr-realistic'
  | 'architectural-clay'
  | 'blueprint'
  | 'wireframe';

export type CameraPreset = 
  | 'perspective'
  | 'drone'
  | 'ground'
  | 'front';

export interface Hotspot {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  position: [number, number, number];
  category: 'architecture' | 'history' | 'material' | 'symbolism';
}

export interface MonumentData {
  id: MonumentId;
  name: string;
  hindiName: string;
  epoch: string;
  architect: string;
  height: string;
  material: string;
  unesco: boolean;
  significance: string;
  funFact: string;
  initialCamera: {
    position: [number, number, number];
    target: [number, number, number];
    fov: number;
  };
  hotspots: Hotspot[];
}
