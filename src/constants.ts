export interface ColorGrade {
  shadows: { r: number; g: number; b: number; intensity: number };
  midtones: { r: number; g: number; b: number; intensity: number };
  highlights: { r: number; g: number; b: number; intensity: number };
  saturation: number;
  contrast: number;
  brightness: number;
}

// ===== PROFESSIONAL PRESETS =====
// Organized by category. Each preset is calibrated to industry-standard
// color science used by professional photographers and cinematographers.

export const KOREAN_SCENES: Record<string, ColorGrade> = {

  // ─── WEDDING & BRIDAL ────────────────────────────────────
  // Industry favorites: Fuji 400H emulation, bright & airy, warm romantic

  "Bright & Airy": {
    shadows: { r: 8, g: 8, b: 15, intensity: 0.08 }, midtones: { r: 5, g: 3, b: 0, intensity: 0.05 },
    highlights: { r: 15, g: 12, b: 8, intensity: 0.12 }, saturation: 0.92, contrast: 0.88, brightness: 1.18,
  },
  "Fuji 400H": {
    shadows: { r: 5, g: 12, b: 18, intensity: 0.12 }, midtones: { r: 0, g: 8, b: 5, intensity: 0.08 },
    highlights: { r: 12, g: 15, b: 10, intensity: 0.15 }, saturation: 0.85, contrast: 0.92, brightness: 1.1,
  },
  "Portra 400": {
    shadows: { r: 12, g: 8, b: 5, intensity: 0.1 }, midtones: { r: 8, g: 5, b: 2, intensity: 0.08 },
    highlights: { r: 18, g: 15, b: 10, intensity: 0.15 }, saturation: 0.9, contrast: 0.95, brightness: 1.08,
  },
  "Portra 800": {
    shadows: { r: 15, g: 10, b: 8, intensity: 0.15 }, midtones: { r: 10, g: 6, b: 3, intensity: 0.1 },
    highlights: { r: 22, g: 18, b: 12, intensity: 0.18 }, saturation: 0.88, contrast: 1.02, brightness: 1.05,
  },
  "Bridal Glow": {
    shadows: { r: 8, g: 5, b: 10, intensity: 0.06 }, midtones: { r: 10, g: 8, b: 5, intensity: 0.08 },
    highlights: { r: 20, g: 18, b: 15, intensity: 0.2 }, saturation: 0.88, contrast: 0.85, brightness: 1.2,
  },
  "Classic Wedding": {
    shadows: { r: 5, g: 5, b: 8, intensity: 0.08 }, midtones: { r: 5, g: 3, b: 0, intensity: 0.05 },
    highlights: { r: 15, g: 12, b: 8, intensity: 0.1 }, saturation: 0.95, contrast: 0.92, brightness: 1.12,
  },
  "Dark & Moody Wedding": {
    shadows: { r: 0, g: 5, b: 12, intensity: 0.2 }, midtones: { r: 5, g: 3, b: 8, intensity: 0.12 },
    highlights: { r: 15, g: 12, b: 8, intensity: 0.15 }, saturation: 0.82, contrast: 1.15, brightness: 0.88,
  },

  // ─── GOLDEN HOUR & NATURAL LIGHT ─────────────────────────

  "Golden Hour": {
    shadows: { r: 15, g: 8, b: 0, intensity: 0.12 }, midtones: { r: 25, g: 15, b: 3, intensity: 0.18 },
    highlights: { r: 40, g: 30, b: 10, intensity: 0.25 }, saturation: 1.08, contrast: 1.0, brightness: 1.08,
  },
  "Sunset Warmth": {
    shadows: { r: 20, g: 8, b: 0, intensity: 0.15 }, midtones: { r: 30, g: 18, b: 5, intensity: 0.2 },
    highlights: { r: 50, g: 35, b: 10, intensity: 0.3 }, saturation: 1.15, contrast: 1.05, brightness: 1.02,
  },
  "Blue Hour": {
    shadows: { r: 0, g: 8, b: 25, intensity: 0.2 }, midtones: { r: 0, g: 5, b: 15, intensity: 0.12 },
    highlights: { r: 5, g: 10, b: 20, intensity: 0.15 }, saturation: 0.85, contrast: 1.1, brightness: 0.92,
  },
  "Natural Light": {
    shadows: { r: 3, g: 3, b: 5, intensity: 0.05 }, midtones: { r: 2, g: 2, b: 0, intensity: 0.03 },
    highlights: { r: 5, g: 5, b: 3, intensity: 0.05 }, saturation: 1.0, contrast: 0.98, brightness: 1.05,
  },

  // ─── CINEMA & FILM ───────────────────────────────────────
  // Hollywood-standard color grading techniques

  "Orange & Teal": {
    shadows: { r: 0, g: 25, b: 45, intensity: 0.35 }, midtones: { r: 15, g: 8, b: 0, intensity: 0.15 },
    highlights: { r: 40, g: 28, b: 0, intensity: 0.3 }, saturation: 1.15, contrast: 1.18, brightness: 0.98,
  },
  "Bleach Bypass": {
    shadows: { r: 0, g: 0, b: 5, intensity: 0.05 }, midtones: { r: 0, g: 0, b: 0, intensity: 0 },
    highlights: { r: 5, g: 5, b: 0, intensity: 0.05 }, saturation: 0.4, contrast: 1.4, brightness: 0.92,
  },
  "Film Noir": {
    shadows: { r: 0, g: 0, b: 0, intensity: 0 }, midtones: { r: 0, g: 0, b: 0, intensity: 0 },
    highlights: { r: 0, g: 0, b: 0, intensity: 0 }, saturation: 0, contrast: 1.5, brightness: 0.88,
  },
  "Blockbuster": {
    shadows: { r: 0, g: 15, b: 30, intensity: 0.3 }, midtones: { r: 10, g: 5, b: 0, intensity: 0.1 },
    highlights: { r: 30, g: 22, b: 8, intensity: 0.25 }, saturation: 1.1, contrast: 1.25, brightness: 0.95,
  },
  "Vintage Cinema": {
    shadows: { r: 12, g: 8, b: 5, intensity: 0.15 }, midtones: { r: 8, g: 5, b: 0, intensity: 0.1 },
    highlights: { r: 20, g: 18, b: 12, intensity: 0.12 }, saturation: 0.75, contrast: 1.05, brightness: 1.02,
  },
  "Indie Film": {
    shadows: { r: 5, g: 10, b: 15, intensity: 0.12 }, midtones: { r: 8, g: 5, b: 3, intensity: 0.08 },
    highlights: { r: 15, g: 12, b: 8, intensity: 0.1 }, saturation: 0.82, contrast: 1.08, brightness: 1.0,
  },
  "Sci-Fi Cold": {
    shadows: { r: 0, g: 10, b: 30, intensity: 0.35 }, midtones: { r: 0, g: 15, b: 20, intensity: 0.2 },
    highlights: { r: 10, g: 20, b: 30, intensity: 0.25 }, saturation: 0.7, contrast: 1.3, brightness: 0.9,
  },

  // ─── FASHION & EDITORIAL ─────────────────────────────────

  "High Fashion": {
    shadows: { r: 0, g: 0, b: 10, intensity: 0.15 }, midtones: { r: 0, g: 0, b: 5, intensity: 0.05 },
    highlights: { r: 10, g: 8, b: 5, intensity: 0.1 }, saturation: 1.1, contrast: 1.35, brightness: 0.95,
  },
  "Vogue": {
    shadows: { r: 5, g: 3, b: 10, intensity: 0.12 }, midtones: { r: 3, g: 0, b: 5, intensity: 0.08 },
    highlights: { r: 15, g: 12, b: 8, intensity: 0.15 }, saturation: 0.95, contrast: 1.2, brightness: 1.02,
  },
  "Matte Editorial": {
    shadows: { r: 8, g: 8, b: 10, intensity: 0.2 }, midtones: { r: 5, g: 5, b: 5, intensity: 0.08 },
    highlights: { r: 10, g: 10, b: 8, intensity: 0.1 }, saturation: 0.78, contrast: 0.9, brightness: 1.05,
  },
  "Clean Editorial": {
    shadows: { r: 3, g: 3, b: 5, intensity: 0.05 }, midtones: { r: 0, g: 0, b: 0, intensity: 0 },
    highlights: { r: 8, g: 8, b: 5, intensity: 0.08 }, saturation: 1.05, contrast: 1.08, brightness: 1.1,
  },

  // ─── RED CARPET & GLAMOUR ────────────────────────────────

  "Red Carpet Glam": {
    shadows: { r: 8, g: 3, b: 5, intensity: 0.1 }, midtones: { r: 12, g: 8, b: 5, intensity: 0.12 },
    highlights: { r: 25, g: 20, b: 15, intensity: 0.2 }, saturation: 1.05, contrast: 1.12, brightness: 1.05,
  },
  "Glamour Glow": {
    shadows: { r: 10, g: 5, b: 8, intensity: 0.08 }, midtones: { r: 8, g: 5, b: 3, intensity: 0.08 },
    highlights: { r: 20, g: 18, b: 15, intensity: 0.25 }, saturation: 0.95, contrast: 0.9, brightness: 1.15,
  },
  "Stage Light": {
    shadows: { r: 5, g: 0, b: 15, intensity: 0.15 }, midtones: { r: 10, g: 5, b: 0, intensity: 0.1 },
    highlights: { r: 30, g: 25, b: 15, intensity: 0.2 }, saturation: 1.1, contrast: 1.15, brightness: 1.0,
  },

  // ─── EVENTS & PARTY ──────────────────────────────────────

  "Event Bright": {
    shadows: { r: 5, g: 5, b: 8, intensity: 0.08 }, midtones: { r: 5, g: 3, b: 0, intensity: 0.05 },
    highlights: { r: 12, g: 10, b: 8, intensity: 0.1 }, saturation: 1.05, contrast: 1.0, brightness: 1.15,
  },
  "Neon Nights": {
    shadows: { r: 15, g: 0, b: 35, intensity: 0.4 }, midtones: { r: 25, g: 5, b: 20, intensity: 0.25 },
    highlights: { r: 40, g: 15, b: 35, intensity: 0.35 }, saturation: 1.35, contrast: 1.2, brightness: 0.92,
  },
  "Club Vibes": {
    shadows: { r: 10, g: 0, b: 25, intensity: 0.3 }, midtones: { r: 0, g: 15, b: 15, intensity: 0.2 },
    highlights: { r: 20, g: 10, b: 30, intensity: 0.25 }, saturation: 1.25, contrast: 1.15, brightness: 0.95,
  },

  // ─── PORTRAIT & BEAUTY ───────────────────────────────────

  "Soft Portrait": {
    shadows: { r: 5, g: 5, b: 8, intensity: 0.06 }, midtones: { r: 8, g: 5, b: 3, intensity: 0.06 },
    highlights: { r: 15, g: 12, b: 10, intensity: 0.12 }, saturation: 0.9, contrast: 0.88, brightness: 1.12,
  },
  "Porcelain Skin": {
    shadows: { r: 3, g: 3, b: 8, intensity: 0.06 }, midtones: { r: 5, g: 3, b: 5, intensity: 0.05 },
    highlights: { r: 15, g: 15, b: 18, intensity: 0.18 }, saturation: 0.78, contrast: 0.85, brightness: 1.2,
  },
  "Warm Portrait": {
    shadows: { r: 10, g: 5, b: 0, intensity: 0.08 }, midtones: { r: 12, g: 8, b: 3, intensity: 0.1 },
    highlights: { r: 20, g: 15, b: 8, intensity: 0.15 }, saturation: 1.0, contrast: 0.95, brightness: 1.08,
  },
  "Dramatic Portrait": {
    shadows: { r: 0, g: 3, b: 8, intensity: 0.2 }, midtones: { r: 5, g: 3, b: 0, intensity: 0.08 },
    highlights: { r: 15, g: 12, b: 5, intensity: 0.15 }, saturation: 0.88, contrast: 1.3, brightness: 0.9,
  },

  // ─── POSTER & ADVERTISING ────────────────────────────────

  "Vivid Pop": {
    shadows: { r: 5, g: 0, b: 10, intensity: 0.1 }, midtones: { r: 3, g: 3, b: 0, intensity: 0.05 },
    highlights: { r: 10, g: 8, b: 0, intensity: 0.08 }, saturation: 1.4, contrast: 1.2, brightness: 1.05,
  },
  "Clean Product": {
    shadows: { r: 3, g: 3, b: 5, intensity: 0.05 }, midtones: { r: 0, g: 0, b: 0, intensity: 0 },
    highlights: { r: 5, g: 5, b: 5, intensity: 0.05 }, saturation: 1.05, contrast: 1.05, brightness: 1.15,
  },
  "Bold Banner": {
    shadows: { r: 0, g: 5, b: 15, intensity: 0.15 }, midtones: { r: 5, g: 0, b: 5, intensity: 0.08 },
    highlights: { r: 15, g: 10, b: 0, intensity: 0.12 }, saturation: 1.3, contrast: 1.25, brightness: 1.0,
  },
  "Social Media Pop": {
    shadows: { r: 8, g: 5, b: 12, intensity: 0.1 }, midtones: { r: 5, g: 3, b: 5, intensity: 0.08 },
    highlights: { r: 15, g: 12, b: 8, intensity: 0.12 }, saturation: 1.2, contrast: 1.08, brightness: 1.1,
  },

  // ─── VINTAGE & FILM STOCKS ───────────────────────────────

  "70s Retro": {
    shadows: { r: 15, g: 10, b: 0, intensity: 0.18 }, midtones: { r: 20, g: 12, b: 3, intensity: 0.15 },
    highlights: { r: 35, g: 28, b: 15, intensity: 0.2 }, saturation: 0.82, contrast: 1.08, brightness: 1.02,
  },
  "Faded Polaroid": {
    shadows: { r: 12, g: 8, b: 5, intensity: 0.15 }, midtones: { r: 8, g: 5, b: 3, intensity: 0.08 },
    highlights: { r: 20, g: 18, b: 15, intensity: 0.12 }, saturation: 0.65, contrast: 0.85, brightness: 1.1,
  },
  "Cross Process": {
    shadows: { r: 0, g: 20, b: 30, intensity: 0.3 }, midtones: { r: 15, g: 0, b: 8, intensity: 0.15 },
    highlights: { r: 35, g: 30, b: 0, intensity: 0.25 }, saturation: 1.2, contrast: 1.12, brightness: 1.0,
  },
  "Kodachrome": {
    shadows: { r: 8, g: 5, b: 0, intensity: 0.1 }, midtones: { r: 12, g: 5, b: 0, intensity: 0.12 },
    highlights: { r: 20, g: 15, b: 5, intensity: 0.15 }, saturation: 1.15, contrast: 1.15, brightness: 1.0,
  },

  // ─── K-DRAMA & ASIAN CINEMA ──────────────────────────────

  "K-Drama Soft": {
    shadows: { r: 8, g: 8, b: 15, intensity: 0.1 }, midtones: { r: 10, g: 8, b: 3, intensity: 0.08 },
    highlights: { r: 20, g: 18, b: 12, intensity: 0.15 }, saturation: 0.85, contrast: 0.92, brightness: 1.12,
  },
  "Seoul Nights": {
    shadows: { r: 0, g: 15, b: 30, intensity: 0.3 }, midtones: { r: 8, g: 0, b: 8, intensity: 0.1 },
    highlights: { r: 35, g: 28, b: 15, intensity: 0.2 }, saturation: 0.82, contrast: 1.12, brightness: 0.95,
  },
  "Korean Pastel": {
    shadows: { r: 10, g: 8, b: 15, intensity: 0.08 }, midtones: { r: 12, g: 10, b: 15, intensity: 0.1 },
    highlights: { r: 25, g: 22, b: 28, intensity: 0.15 }, saturation: 0.7, contrast: 0.88, brightness: 1.18,
  },
  "Hong Kong Neon": {
    shadows: { r: 8, g: 0, b: 35, intensity: 0.4 }, midtones: { r: 30, g: 5, b: 20, intensity: 0.28 },
    highlights: { r: 45, g: 15, b: 35, intensity: 0.35 }, saturation: 1.25, contrast: 1.2, brightness: 0.9,
  },
  "Wong Kar-Wai": {
    shadows: { r: 3, g: 20, b: 30, intensity: 0.35 }, midtones: { r: 22, g: 8, b: 0, intensity: 0.2 },
    highlights: { r: 38, g: 28, b: 8, intensity: 0.28 }, saturation: 1.08, contrast: 1.12, brightness: 0.93,
  },

  // ─── LANDSCAPE & TRAVEL ──────────────────────────────────

  "Vibrant Travel": {
    shadows: { r: 0, g: 5, b: 10, intensity: 0.08 }, midtones: { r: 5, g: 5, b: 0, intensity: 0.05 },
    highlights: { r: 10, g: 8, b: 3, intensity: 0.08 }, saturation: 1.25, contrast: 1.1, brightness: 1.05,
  },
  "Moody Landscape": {
    shadows: { r: 0, g: 8, b: 15, intensity: 0.18 }, midtones: { r: 3, g: 5, b: 8, intensity: 0.1 },
    highlights: { r: 10, g: 8, b: 5, intensity: 0.08 }, saturation: 0.85, contrast: 1.2, brightness: 0.92,
  },
  "Autumn Warmth": {
    shadows: { r: 15, g: 8, b: 0, intensity: 0.15 }, midtones: { r: 22, g: 12, b: 3, intensity: 0.2 },
    highlights: { r: 40, g: 30, b: 12, intensity: 0.25 }, saturation: 1.1, contrast: 1.05, brightness: 1.0,
  },
};

export const PHOTOBOOTH_LAYOUTS = [
  { id: '1', name: 'Single', slots: 1, cols: 1 },
  { id: '2v', name: '2 Vertical', slots: 2, cols: 1 },
  { id: '2h', name: '2 Horizontal', slots: 2, cols: 2 },
  { id: '3', name: 'Trio', slots: 3, cols: 3 },
  { id: '4', name: 'Classic 4', slots: 4, cols: 2 },
  { id: '6', name: 'Grid 6', slots: 6, cols: 3 },
  { id: '6v', name: 'Strip 6', slots: 6, cols: 2 },
  { id: '8', name: 'Grid 8', slots: 8, cols: 4 },
  { id: '9', name: 'Grid 9', slots: 9, cols: 3 },
  { id: '10', name: 'Grid 10', slots: 10, cols: 5 },
  { id: '12', name: 'Grid 12', slots: 12, cols: 4 },
];

export const ASPECT_RATIOS = [
  { id: 'square', name: 'Square', ratio: 1, label: '1:1' },
  { id: '4:3', name: 'Standard', ratio: 4 / 3, label: '4:3' },
  { id: '3:4', name: 'Portrait', ratio: 3 / 4, label: '3:4' },
  { id: '3:2', name: 'Photo', ratio: 3 / 2, label: '3:2' },
  { id: '2:3', name: 'Tall', ratio: 2 / 3, label: '2:3' },
  { id: '16:9', name: 'Wide', ratio: 16 / 9, label: '16:9' },
  { id: '4:6', name: '4x6 Print', ratio: 4 / 6, label: '4:6' },
  { id: 'circle', name: 'Circle', ratio: 1, label: '○' },
];

export const BACKGROUND_PATTERNS = [
  { id: 'white', color: '#FFFFFF', name: 'Pure White' },
  { id: 'black', color: '#121212', name: 'Onyx Black' },
  { id: 'cream', color: '#FFF8E7', name: 'Cream' },
  { id: 'pink', color: '#FFD1DC', name: 'Sakura Pink' },
  { id: 'blue', color: '#B0E0E6', name: 'Powder Blue' },
  { id: 'mint', color: '#C8E6C9', name: 'Mint Green' },
  { id: 'lavender', color: '#E6D5F5', name: 'Lavender' },
  { id: 'gold', color: '#F5E6CC', name: 'Gold Sand' },
];
