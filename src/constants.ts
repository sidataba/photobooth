/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ColorGrade {
  shadows: { r: number; g: number; b: number; intensity: number };
  midtones: { r: number; g: number; b: number; intensity: number };
  highlights: { r: number; g: number; b: number; intensity: number };
  saturation: number;
  contrast: number;
  brightness: number;
}

export const KOREAN_SCENES: Record<string, ColorGrade> = {
  "Seoul Night": {
    shadows: { r: 0, g: 20, b: 40, intensity: 0.4 },
    midtones: { r: 10, g: 0, b: 10, intensity: 0.1 },
    highlights: { r: 50, g: 40, b: 20, intensity: 0.3 },
    saturation: 0.8,
    contrast: 1.1,
    brightness: 0.95,
  },
  "Autumn Memories": {
    shadows: { r: 20, g: 10, b: 0, intensity: 0.2 },
    midtones: { r: 30, g: 15, b: 5, intensity: 0.3 },
    highlights: { r: 60, g: 50, b: 30, intensity: 0.4 },
    saturation: 0.9,
    contrast: 1.05,
    brightness: 1.0,
  },
  "Teal & Orange": {
    shadows: { r: 0, g: 40, b: 60, intensity: 0.5 },
    midtones: { r: 20, g: 10, b: 0, intensity: 0.2 },
    highlights: { r: 60, g: 40, b: 0, intensity: 0.4 },
    saturation: 1.2,
    contrast: 1.2,
    brightness: 1.0,
  },
  "Noir Cinema": {
    shadows: { r: 0, g: 0, b: 0, intensity: 0 },
    midtones: { r: 0, g: 0, b: 0, intensity: 0 },
    highlights: { r: 0, g: 0, b: 0, intensity: 0 },
    saturation: 0,
    contrast: 1.4,
    brightness: 0.9,
  },
  "Natural Wedding": {
    shadows: { r: 10, g: 5, b: 5, intensity: 0.1 },
    midtones: { r: 5, g: 5, b: 10, intensity: 0.1 },
    highlights: { r: 20, g: 20, b: 15, intensity: 0.2 },
    saturation: 1.05,
    contrast: 0.95,
    brightness: 1.1,
  },
  "Cyberpunk": {
    shadows: { r: 40, g: 0, b: 60, intensity: 0.6 },
    midtones: { r: 0, g: 40, b: 40, intensity: 0.4 },
    highlights: { r: 60, g: 0, b: 40, intensity: 0.5 },
    saturation: 1.5,
    contrast: 1.3,
    brightness: 0.9,
  }
};

export const PHOTOBOOTH_LAYOUTS = [
  { id: '1x1', name: 'Single', slots: 1, cols: 1 },
  { id: '2x1', name: 'Duo Vertical', slots: 2, cols: 1 },
  { id: '2x2', name: 'Classic 4', slots: 4, cols: 2 },
  { id: '3x2', name: 'Strip 6', slots: 6, cols: 2 },
];

export const BACKGROUND_PATTERNS = [
  { id: 'white', color: '#FFFFFF', name: 'Pure White' },
  { id: 'black', color: '#121212', name: 'Onyx Black' },
  { id: 'pink', color: '#FFD1DC', name: 'Sakura Pink' },
  { id: 'blue', color: '#B0E0E6', name: 'Powder Blue' },
  { id: 'gradient-1', color: 'linear-gradient(45deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)', name: 'Sunset' },
];
