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
  "Blue Hour": {
    shadows: { r: 0, g: 30, b: 60, intensity: 0.5 },
    midtones: { r: 0, g: 10, b: 30, intensity: 0.2 },
    highlights: { r: 40, g: 40, b: 50, intensity: 0.2 },
    saturation: 0.7,
    contrast: 1.2,
    brightness: 0.9,
  },
  "Vintage Cinema": {
    shadows: { r: 15, g: 15, b: 10, intensity: 0.3 },
    midtones: { r: 0, g: 0, b: 0, intensity: 0 },
    highlights: { r: 45, g: 40, b: 25, intensity: 0.4 },
    saturation: 0.6,
    contrast: 1.15,
    brightness: 1.05,
  }
};
