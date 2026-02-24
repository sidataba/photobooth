import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Upload, Download, RefreshCcw, Image as ImageIcon, Sliders, Play, Layers, X, Plus, FolderOpen, ChevronDown, ChevronRight, ZoomIn, ZoomOut, Eye, Move, Undo2, Redo2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { KOREAN_SCENES, PHOTOBOOTH_LAYOUTS, BACKGROUND_PATTERNS, ASPECT_RATIOS } from './constants';

interface HistoryEntry {
  selectedScene: string; intensity: number; skinRetouch: number; grain: number;
  vignette: number; temperature: number; tint: number; distortion: number;
  letterbox: number; sharpen: number; flipH: boolean; flipV: boolean; zoom: number;
}

const SCENE_KEYS = Object.keys(KOREAN_SCENES);

const CollapsibleSection = React.memo(({ title, children, icon }: {
  title: string; children: React.ReactNode; icon?: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <section>
      <div className="k-section-header" onClick={() => setIsOpen(o => !o)}>
        <div className="flex items-center gap-2">
          {icon}
          <label className="k-input-label mb-0 cursor-pointer">{title}</label>
        </div>
        {isOpen ? <ChevronDown className="w-3 h-3 text-zinc-500" /> : <ChevronRight className="w-3 h-3 text-zinc-500" />}
      </div>
      {isOpen && <div className="mt-2">{children}</div>}
    </section>
  );
});

const Slider = React.memo(({ label, value, min, max, step, onChange, display }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; display?: string;
}) => (
  <div className="space-y-1">
    <div className="flex justify-between text-[10px] text-zinc-500 uppercase font-bold">
      <span>{label}</span><span className="font-mono text-zinc-400">{display ?? value}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))} className="k-slider" />
  </div>
));

export default function App() {
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [originalImageDataList, setOriginalImageDataList] = useState<ImageData[]>([]);
  const [gallery, setGallery] = useState<{ img: HTMLImageElement; thumbUrl: string }[]>([]);
  const [pendingSlot, setPendingSlot] = useState<number | null>(null);
  const [selectedScene, setSelectedScene] = useState("Bright & Airy");
  const [intensity, setIntensity] = useState(1.0);
  const [skinRetouch, setSkinRetouch] = useState(0.5);
  const [grain, setGrain] = useState(0.05);
  const [vignette, setVignette] = useState(0.3);
  const [temperature, setTemperature] = useState(0);
  const [tint, setTint] = useState(0);
  const [distortion, setDistortion] = useState(0);
  const [letterbox, setLetterbox] = useState(0);
  const [sharpen, setSharpen] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [zoom, setZoom] = useState(1.0);
  const [exportFormat, setExportFormat] = useState<'image/png' | 'image/jpeg'>('image/png');
  const [exportQuality, setExportQuality] = useState(0.9);
  const [exportScale, setExportScale] = useState(1.0);
  const [tonalDistribution, setTonalDistribution] = useState([33, 33, 34]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [splitView, setSplitView] = useState(false);
  const [splitPos, setSplitPos] = useState(50);
  const [previewScale, setPreviewScale] = useState(1.0);
  const [selectedLayout, setSelectedLayout] = useState(PHOTOBOOTH_LAYOUTS[0]);
  const [selectedBackground, setSelectedBackground] = useState(BACKGROUND_PATTERNS[0]);
  const [selectedAspect, setSelectedAspect] = useState(ASPECT_RATIOS[0]);
  const [mode, setMode] = useState<'editor' | 'photobooth'>('editor');
  const [customBgImage, setCustomBgImage] = useState<HTMLImageElement | null>(null);
  const [customBgUrl, setCustomBgUrl] = useState<string | null>(null);
  const [bgOffset, setBgOffset] = useState({ x: 0, y: 0 });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editorImage, setEditorImage] = useState<HTMLImageElement | null>(null);
  const [slotPadding, setSlotPadding] = useState(20);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [stickerImages, setStickerImages] = useState<{ img: HTMLImageElement; url: string; x: number; y: number; scale: number }[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const stickerInputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getCurrentParams = useCallback((): HistoryEntry => ({
    selectedScene, intensity, skinRetouch, grain, vignette, temperature, tint,
    distortion, letterbox, sharpen, flipH, flipV, zoom,
  }), [selectedScene, intensity, skinRetouch, grain, vignette, temperature, tint, distortion, letterbox, sharpen, flipH, flipV, zoom]);

  const pushHistory = useCallback(() => {
    const entry = getCurrentParams();
    setHistory(prev => [...prev.slice(0, historyIndex + 1), entry]);
    setHistoryIndex(prev => prev + 1);
  }, [getCurrentParams, historyIndex]);

  const applyHistoryEntry = (entry: HistoryEntry) => {
    setSelectedScene(entry.selectedScene); setIntensity(entry.intensity);
    setSkinRetouch(entry.skinRetouch); setGrain(entry.grain); setVignette(entry.vignette);
    setTemperature(entry.temperature); setTint(entry.tint); setDistortion(entry.distortion);
    setLetterbox(entry.letterbox); setSharpen(entry.sharpen); setFlipH(entry.flipH);
    setFlipV(entry.flipV); setZoom(entry.zoom);
  };

  const undo = () => { if (historyIndex > 0) { applyHistoryEntry(history[historyIndex - 1]); setHistoryIndex(p => p - 1); } };
  const redo = () => { if (historyIndex < history.length - 1) { applyHistoryEntry(history[historyIndex + 1]); setHistoryIndex(p => p + 1); } };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const resetToOriginal = () => {
    setSelectedScene("Bright & Airy"); setIntensity(1.0); setSkinRetouch(0.5);
    setGrain(0.05); setVignette(0.3); setTemperature(0); setTint(0);
    setDistortion(0); setLetterbox(0); setSharpen(0); setFlipH(false);
    setFlipV(false); setZoom(1.0);
  };

  const loadFileToGallery = (file: File, cb?: (img: HTMLImageElement) => void) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      const img = new Image();
      img.onload = () => { setGallery(prev => [...prev, { img, thumbUrl: url }]); cb?.(img); };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    loadFileToGallery(file, (img) => {
      if (mode === 'photobooth' && pendingSlot !== null) {
        setImages(prev => { const u = [...prev]; u[pendingSlot] = img; return u; });
        setPendingSlot(null);
      } else if (mode === 'editor') {
        setEditorImage(img); setImages([img]); setOriginalImageDataList([]);
      }
    });
    e.target.value = '';
  };

  const handleGalleryMultiUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((f) => loadFileToGallery(f as File));
    e.target.value = '';
  };

  const assignGalleryItem = (gi: number, slot?: number) => {
    const item = gallery[gi];
    if (!item) return;
    if (mode === 'editor') {
      setEditorImage(item.img); setImages([item.img]); setOriginalImageDataList([]);
    } else if (slot !== undefined) {
      setImages(prev => { const u = [...prev]; u[slot] = item.img; return u; });
    }
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string; const img = new Image();
      img.onload = () => { setCustomBgImage(img); setCustomBgUrl(url); setBgOffset({ x: 0, y: 0 }); setSelectedBackground({ id: 'custom', color: 'transparent', name: 'Custom' }); };
      img.src = url;
    };
    reader.readAsDataURL(file); e.target.value = '';
  };

  const handleStickerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string; const img = new Image();
      img.onload = () => { setStickerImages(prev => [...prev, { img, url, x: 50, y: 50, scale: 0.2 }]); };
      img.src = url;
    };
    reader.readAsDataURL(file); e.target.value = '';
  };

  useEffect(() => {
    if (mode === 'editor' && images.length > 0 && images[0] && canvasRef.current && originalImageDataList.length === 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      const image = images[0];
      const maxDim = 1280;
      const scale = Math.min(1.0, maxDim / Math.max(image.width, image.height));
      setPreviewScale(scale);
      canvas.width = image.width * scale;
      canvas.height = image.height * scale;
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setOriginalImageDataList([data]);
      const pixels = data.data;
      let s = 0, m = 0, h = 0;
      for (let i = 0; i < pixels.length; i += 40) {
        const lum = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
        if (lum < 85) s++; else if (lum < 170) m++; else h++;
      }
      const total = s + m + h;
      setTonalDistribution([(s / total) * 100, (m / total) * 100, (h / total) * 100]);
      pushHistory();
    }
  }, [images, originalImageDataList, mode]);

  const applyFilter = useCallback(() => {
    if (originalImageDataList.length === 0 || !canvasRef.current) return;
    setIsProcessing(true);
    requestAnimationFrame(() => {
      const canvas = canvasRef.current; if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true }); if (!ctx) return;
      const grade = KOREAN_SCENES[selectedScene];
      if (!grade) { setIsProcessing(false); return; }
      const { width, height } = canvas;
      const newImageData = ctx.createImageData(width, height);
      const data = newImageData.data;
      const originalData = originalImageDataList[0].data;
      const centerX = width / 2, centerY = height / 2;
      const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
      for (let i = 0; i < originalData.length; i += 4) {
        let r = originalData[i], g = originalData[i + 1], b = originalData[i + 2];
        const a = originalData[i + 3];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const zone = Math.min(8, Math.floor(lum / 28.33));
        let tg, im = 1;
        if (zone < 3) { tg = grade.shadows; im = 1.2 - zone * 0.2; }
        else if (zone < 6) { tg = grade.midtones; im = zone === 4 ? 0.5 : 0.8; }
        else { tg = grade.highlights; im = 0.5 + (zone - 6) * 0.25; }
        r += tg.r * tg.intensity * im * intensity;
        g += tg.g * tg.intensity * im * intensity;
        b += tg.b * tg.intensity * im * intensity;
        const avg = (r + g + b) / 3, sat = 1 + (grade.saturation - 1) * intensity;
        r = avg + (r - avg) * sat; g = avg + (g - avg) * sat; b = avg + (b - avg) * sat;
        const cont = 1 + (grade.contrast - 1) * intensity, bright = 1 + (grade.brightness - 1) * intensity;
        r = (r - 128) * cont + 128 * bright; g = (g - 128) * cont + 128 * bright; b = (b - 128) * cont + 128 * bright;
        if (temperature !== 0) { r += temperature * 20; b -= temperature * 20; }
        if (tint !== 0) { g += tint * 20; r += tint * 10; b += tint * 10; }
        if (vignette > 0) {
          const x = (i / 4) % width, y = Math.floor((i / 4) / width);
          const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          const vF = 1 - (dist / maxDist) * vignette; r *= vF; g *= vF; b *= vF;
        }
        if (grain > 0) { const n = (Math.random() - 0.5) * grain * 80; r += n; g += n; b += n; }
        data[i] = Math.min(255, Math.max(0, r)); data[i + 1] = Math.min(255, Math.max(0, g));
        data[i + 2] = Math.min(255, Math.max(0, b)); data[i + 3] = a;
      }
      if (sharpen !== 0) {
        const td = new Uint8ClampedArray(data); const amt = sharpen * 0.5;
        for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
          const i = (y * width + x) * 4;
          const res = data[i] * 5 - (data[i - 4] + data[i + 4] + data[i - width * 4] + data[i + width * 4]);
          td[i] = Math.min(255, Math.max(0, data[i] + res * amt));
          td[i + 1] = Math.min(255, Math.max(0, data[i + 1] + res * amt));
          td[i + 2] = Math.min(255, Math.max(0, data[i + 2] + res * amt));
        }
        data.set(td);
      }
      ctx.putImageData(newImageData, 0, 0);
      if (letterbox > 0 || distortion !== 0) {
        const tc = document.createElement('canvas'); tc.width = width; tc.height = height;
        const tctx = tc.getContext('2d'); if (tctx) {
          tctx.drawImage(canvas, 0, 0); ctx.clearRect(0, 0, width, height);
          if (distortion !== 0) { const d = 1 + distortion * 0.1; ctx.drawImage(tc, width * (1 - d) / 2, height * (1 - d) / 2, width * d, height * d); }
          else ctx.drawImage(tc, 0, 0);
          if (letterbox > 0) { const lh = (height * letterbox) / 2; ctx.fillStyle = 'black'; ctx.fillRect(0, 0, width, lh); ctx.fillRect(0, height - lh, width, lh); }
        }
      }
      setIsProcessing(false);
    });
  }, [originalImageDataList, selectedScene, intensity, skinRetouch, grain, vignette, temperature, tint, distortion, letterbox, sharpen]);

  useEffect(() => {
    if (originalImageDataList.length > 0 && mode === 'editor') {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => applyFilter(), 16);
    }
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [selectedScene, intensity, skinRetouch, grain, vignette, temperature, tint, distortion, letterbox, sharpen, originalImageDataList, applyFilter, mode]);

  const generateBoothCanvas = useCallback(() => {
    const ec = document.createElement('canvas');
    const pad = slotPadding * exportScale;
    const baseW = 300 * exportScale;
    const slotW = baseW;
    const slotH = selectedAspect.id === 'circle' ? slotW : slotW / selectedAspect.ratio;
    const cols = selectedLayout.cols;
    const rows = Math.ceil(selectedLayout.slots / cols);
    ec.width = (slotW + pad) * cols + pad;
    ec.height = (slotH + pad) * rows + pad;
    const ctx = ec.getContext('2d'); if (!ctx) return null;
    if (selectedBackground.id === 'custom' && customBgImage) {
      const cw = ec.width, ch = ec.height;
      const ir = customBgImage.width / customBgImage.height, cr = cw / ch;
      let sx = 0, sy = 0, sw = customBgImage.width, sh = customBgImage.height;
      if (ir > cr) { sw = customBgImage.height * cr; sx = (customBgImage.width - sw) / 2 + bgOffset.x; }
      else { sh = customBgImage.width / cr; sy = (customBgImage.height - sh) / 2 + bgOffset.y; }
      ctx.drawImage(customBgImage, sx, sy, sw, sh, 0, 0, cw, ch);
    } else { ctx.fillStyle = selectedBackground.color; ctx.fillRect(0, 0, ec.width, ec.height); }
    for (let i = 0; i < selectedLayout.slots; i++) {
      const col = i % cols, row = Math.floor(i / cols);
      const x = pad + col * (slotW + pad), y = pad + row * (slotH + pad);
      if (selectedAspect.id === 'circle') {
        ctx.save();
        ctx.beginPath(); ctx.arc(x + slotW / 2, y + slotH / 2, slotW / 2, 0, Math.PI * 2); ctx.clip();
        if (images[i]) ctx.drawImage(images[i], x, y, slotW, slotH);
        else { ctx.fillStyle = '#333'; ctx.fillRect(x, y, slotW, slotH); }
        ctx.restore();
        ctx.beginPath(); ctx.arc(x + slotW / 2, y + slotH / 2, slotW / 2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 2; ctx.stroke();
      } else {
        if (images[i]) ctx.drawImage(images[i], x, y, slotW, slotH);
        else { ctx.fillStyle = '#333'; ctx.fillRect(x, y, slotW, slotH); }
      }
    }
    return ec;
  }, [images, selectedLayout, selectedAspect, selectedBackground, customBgImage, bgOffset, slotPadding, exportScale]);

  const downloadImage = () => {
    if (mode === 'editor') {
      if (!images[0]) return;
      const image = images[0];
      const ec = document.createElement('canvas');
      const ew = image.width * exportScale, eh = image.height * exportScale;
      ec.width = ew; ec.height = eh;
      const ectx = ec.getContext('2d', { willReadFrequently: true }); if (!ectx) return;
      ectx.drawImage(image, 0, 0, ew, eh);
      const frd = ectx.getImageData(0, 0, ew, eh);
      const grade = KOREAN_SCENES[selectedScene]; if (!grade) return;
      const data = frd.data;
      const cx = ew / 2, cy = eh / 2, md = Math.sqrt(cx * cx + cy * cy);
      for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const zone = Math.min(8, Math.floor(lum / 28.33));
        let tg, im = 1;
        if (zone < 3) { tg = grade.shadows; im = 1.2 - zone * 0.2; } else if (zone < 6) { tg = grade.midtones; im = zone === 4 ? 0.5 : 0.8; } else { tg = grade.highlights; im = 0.5 + (zone - 6) * 0.25; }
        r += tg.r * tg.intensity * im * intensity; g += tg.g * tg.intensity * im * intensity; b += tg.b * tg.intensity * im * intensity;
        const avg = (r + g + b) / 3, sat = 1 + (grade.saturation - 1) * intensity;
        r = avg + (r - avg) * sat; g = avg + (g - avg) * sat; b = avg + (b - avg) * sat;
        const cont = 1 + (grade.contrast - 1) * intensity, bright = 1 + (grade.brightness - 1) * intensity;
        r = (r - 128) * cont + 128 * bright; g = (g - 128) * cont + 128 * bright; b = (b - 128) * cont + 128 * bright;
        if (temperature !== 0) { r += temperature * 20; b -= temperature * 20; }
        if (tint !== 0) { g += tint * 20; r += tint * 10; b += tint * 10; }
        if (vignette > 0) { const px = (i / 4) % ew, py = Math.floor((i / 4) / ew), d = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2); const vF = 1 - (d / md) * vignette; r *= vF; g *= vF; b *= vF; }
        if (grain > 0) { const n = (Math.random() - 0.5) * grain * 80; r += n; g += n; b += n; }
        data[i] = Math.min(255, Math.max(0, r)); data[i + 1] = Math.min(255, Math.max(0, g)); data[i + 2] = Math.min(255, Math.max(0, b));
      }
      ectx.putImageData(frd, 0, 0);
      const fc = document.createElement('canvas'); fc.width = ew; fc.height = eh;
      const fctx = fc.getContext('2d'); if (!fctx) return;
      fctx.save(); fctx.translate(ew / 2, eh / 2); fctx.scale(flipH ? -1 : 1, flipV ? -1 : 1); fctx.scale(zoom, zoom); fctx.translate(-ew / 2, -eh / 2);
      if (distortion !== 0) { const d = 1 + distortion * 0.1; fctx.drawImage(ec, ew * (1 - d) / 2, eh * (1 - d) / 2, ew * d, eh * d); } else fctx.drawImage(ec, 0, 0);
      fctx.restore();
      if (letterbox > 0) { const lh = (eh * letterbox) / 2; fctx.fillStyle = 'black'; fctx.fillRect(0, 0, ew, lh); fctx.fillRect(0, eh - lh, ew, lh); }
      const ext = exportFormat === 'image/png' ? 'png' : 'jpg';
      const link = document.createElement('a');
      link.download = `k-cinema-${selectedScene.toLowerCase().replace(/\s+/g, '-')}.${ext}`;
      link.href = fc.toDataURL(exportFormat, exportQuality);
      link.click();
    } else {
      const ec = generateBoothCanvas(); if (!ec) return;
      const ext = exportFormat === 'image/png' ? 'png' : 'jpg';
      const link = document.createElement('a');
      link.download = `photobooth-${selectedLayout.id}.${ext}`;
      link.href = ec.toDataURL(exportFormat, exportQuality);
      link.click();
    }
  };

  const showPreview = () => {
    if (mode === 'photobooth') {
      const ec = generateBoothCanvas(); if (!ec) return;
      setPreviewUrl(ec.toDataURL(exportFormat, exportQuality));
    } else if (canvasRef.current) {
      setPreviewUrl(canvasRef.current.toDataURL(exportFormat, exportQuality));
    }
  };

  // CollapsibleSection manages its own collapsed state via internal useState

  const GalleryPanel = ({ forSlot }: { forSlot?: boolean }) => (
    <CollapsibleSection id="gallery" title="Image Gallery" icon={<FolderOpen className="w-3.5 h-3.5 text-zinc-500" />}>
      <div className="flex gap-2 mb-2">
        <button onClick={() => galleryInputRef.current?.click()} className="flex-1 p-2 rounded-lg border border-dashed border-zinc-700 hover:border-zinc-500 text-zinc-500 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 transition-colors">
          <Plus className="w-3 h-3" /> Add Multiple
        </button>
      </div>
      {gallery.length === 0 ? (
        <p className="text-[10px] text-zinc-600 text-center py-4">No images yet. Upload some!</p>
      ) : (
        <div className="grid grid-cols-4 gap-1.5">
          {gallery.map((item, gi) => (
            <div key={gi} className="relative group aspect-square rounded-md overflow-hidden border border-white/5 hover:border-white/20 transition-all cursor-pointer">
              <img src={item.thumbUrl} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-0.5">
                {forSlot ? (
                  <div className="flex flex-wrap gap-0.5 justify-center px-0.5">
                    {Array.from({ length: selectedLayout.slots }).map((_, si) => (
                      <button key={si} onClick={() => assignGalleryItem(gi, si)} className="px-1 py-0.5 text-[7px] font-bold bg-white/20 hover:bg-white/50 rounded text-white">S{si + 1}</button>
                    ))}
                  </div>
                ) : (
                  <button onClick={() => assignGalleryItem(gi)} className="px-2 py-1 text-[8px] font-bold bg-white/20 hover:bg-white/50 rounded text-white">Use</button>
                )}
                <button onClick={() => setGallery(p => p.filter((_, i) => i !== gi))} className="p-0.5 bg-red-500/60 hover:bg-red-500 rounded-full mt-0.5"><X className="w-2 h-2 text-white" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </CollapsibleSection>
  );

  return (
    <div className="h-screen flex flex-col font-sans">
      <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 k-glass shrink-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-zinc-100 rounded-full flex items-center justify-center"><Play className="w-3 h-3 text-zinc-900 fill-current" /></div>
          <h1 className="font-serif italic text-lg">K-Cinema <span className="text-zinc-500 font-sans not-italic text-[10px] font-medium ml-1 uppercase tracking-widest">Filter Lab</span></h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-900/50 p-0.5 rounded-lg border border-white/5 mr-2">
            <button onClick={() => { setMode('editor'); if (editorImage) { setImages([editorImage]); setOriginalImageDataList([]); } else setImages([]); }}
              className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${mode === 'editor' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:text-zinc-300'}`}>Editor</button>
            <button onClick={() => setMode('photobooth')}
              className={`px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${mode === 'photobooth' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:text-zinc-300'}`}>Photobooth</button>
          </div>
          <button onClick={() => fileInputRef.current?.click()} className="k-button text-sm flex items-center gap-1.5"><Upload className="w-3.5 h-3.5" /> Upload</button>
          {mode === 'editor' && (
            <div className="flex items-center gap-1">
              <button onClick={undo} disabled={historyIndex <= 0} className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 text-zinc-400" title="Undo (Ctrl+Z)"><Undo2 className="w-3.5 h-3.5" /></button>
              <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 text-zinc-400" title="Redo (Ctrl+Y)"><Redo2 className="w-3.5 h-3.5" /></button>
              <button onClick={resetToOriginal} className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-zinc-400" title="Reset to Original"><RefreshCcw className="w-3.5 h-3.5" /></button>
            </div>
          )}
          {(images.length > 0 || (mode === 'photobooth' && images.some(Boolean))) && (
            <div className="flex items-center gap-1">
              {mode === 'editor' && (
                <>
                  <button onClick={() => setSplitView(!splitView)} className={`px-3 py-1.5 rounded-lg border text-[9px] font-bold uppercase ${splitView ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'border-white/10 text-zinc-400'}`}>Split</button>
                  <button onMouseDown={() => !splitView && setShowOriginal(true)} onMouseUp={() => setShowOriginal(false)} onMouseLeave={() => setShowOriginal(false)}
                    className={`px-3 py-1.5 rounded-lg border text-[9px] font-bold uppercase select-none ${showOriginal ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'border-white/10 text-zinc-400'}`}>
                    {showOriginal ? 'Original' : 'Compare'}
                  </button>
                </>
              )}
              <button onClick={showPreview} className="px-3 py-1.5 rounded-lg border border-white/10 text-[9px] font-bold uppercase text-zinc-400 hover:bg-white/5"><Eye className="w-3 h-3 inline mr-1" />Preview</button>
              <button onClick={downloadImage} className="k-button text-sm flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> {mode === 'editor' ? 'Export' : 'Print'}</button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_340px] overflow-hidden">
        <div className="relative bg-black flex items-center justify-center overflow-hidden">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
          <input type="file" ref={galleryInputRef} onChange={handleGalleryMultiUpload} className="hidden" accept="image/*" multiple />
          <input type="file" ref={bgInputRef} onChange={handleBgUpload} className="hidden" accept="image/*" />
          <input type="file" ref={stickerInputRef} onChange={handleStickerUpload} className="hidden" accept="image/*" />

          {(!images.length || (mode === 'editor' && !images[0])) ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-xl aspect-video border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-zinc-600 transition-colors group">
              <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center group-hover:scale-110 transition-transform"><ImageIcon className="w-7 h-7 text-zinc-500" /></div>
              <div className="text-center"><p className="text-zinc-300 font-medium">Drop your cinematic vision here</p><p className="text-zinc-500 text-sm mt-1">JPG, PNG, WEBP</p></div>
            </motion.div>
          ) : mode === 'editor' ? (
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <div style={{ transform: `scale(${zoom}) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`, transition: 'transform 0.2s ease-out' }} className="relative">
                <canvas ref={canvasRef} className="block shadow-2xl rounded-lg" style={{
                  maxWidth: '100%', maxHeight: 'calc(100vh - 7rem)', objectFit: 'contain',
                  opacity: showOriginal ? 0 : 1,
                  ...(splitView ? { clipPath: `inset(0 ${100 - splitPos}% 0 0)` } : {}),
                }} />
                {(showOriginal || splitView) && images[0] && (
                  <img src={images[0].src} alt="Original" className="absolute inset-0 w-full h-full object-contain rounded-lg"
                    style={splitView ? { clipPath: `inset(0 0 0 ${splitPos}%)` } : {}} />
                )}
                {splitView && (
                  <div className="absolute inset-y-0 w-0.5 bg-white/80 z-10" style={{ left: `${splitPos}%` }}>
                    <input type="range" min="0" max="100" value={splitPos} onChange={(e) => setSplitPos(parseInt(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize" />
                  </div>
                )}
                {stickerImages.map((s, i) => (
                  <img key={i} src={s.url} alt="" className="absolute pointer-events-none" style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.scale * 100}%`, transform: 'translate(-50%,-50%)' }} />
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 flex items-center justify-center w-full h-full">
              <div className="rounded-2xl shadow-2xl relative overflow-hidden inline-block" style={{
                background: selectedBackground.id === 'custom' ? 'transparent' : selectedBackground.color,
                transform: `scale(${zoom})`, transition: 'transform 0.2s'
              }}>
                {selectedBackground.id === 'custom' && customBgUrl && (
                  <img src={customBgUrl} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: `${50 + bgOffset.x}% ${50 + bgOffset.y}%`, zIndex: 0 }} />
                )}
                <div className="grid relative p-4" style={{ gridTemplateColumns: `repeat(${selectedLayout.cols}, 1fr)`, gap: `${slotPadding}px`, zIndex: 1 }}>
                  {Array.from({ length: selectedLayout.slots }).map((_, i) => (
                    <div key={i} onClick={() => { if (!images[i]) { setPendingSlot(i); fileInputRef.current?.click(); } }}
                      className={`relative group transition-all flex items-center justify-center ${selectedAspect.id === 'circle' ? 'rounded-full' : 'rounded-lg'} overflow-hidden border ${images[i] ? 'border-white/10' : 'border-dashed border-zinc-600 hover:border-zinc-400 cursor-pointer'}`}
                      style={{ width: 120, aspectRatio: selectedAspect.id === 'circle' ? '1' : String(selectedAspect.ratio) }}>
                      {images[i] ? (
                        <img src={images[i].src} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="flex flex-col items-center gap-1"><Plus className="w-4 h-4 text-zinc-500" /><span className="text-[8px] text-zinc-600 font-bold">S{i + 1}</span></div>
                      )}
                      {images[i] && (
                        <button onClick={(e) => { e.stopPropagation(); setImages(p => { const u = [...p]; u[i] = undefined as any; return u; }); }}
                          className="absolute top-1 right-1 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500/80"><X className="w-2.5 h-2.5 text-white" /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="border-l border-white/5 k-glass p-4 flex flex-col gap-3 overflow-y-auto">
          {mode === 'photobooth' ? (
            <>
              <CollapsibleSection id="layout" title="Layout" icon={<Layers className="w-3.5 h-3.5 text-zinc-500" />}>
                <div className="grid grid-cols-3 gap-1.5">
                  {PHOTOBOOTH_LAYOUTS.map(l => (
                    <button key={l.id} onClick={() => setSelectedLayout(l)} className={`p-2 rounded-lg border text-left transition-all ${selectedLayout.id === l.id ? 'bg-zinc-100 border-zinc-100 text-zinc-900' : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:border-white/20'}`}>
                      <span className="text-[10px] font-bold block truncate">{l.name}</span><span className="text-[8px] opacity-60">{l.slots}slots</span>
                    </button>
                  ))}
                </div>
              </CollapsibleSection>

              <CollapsibleSection id="aspect" title="Aspect Ratio">
                <div className="grid grid-cols-4 gap-1.5">
                  {ASPECT_RATIOS.map(a => (
                    <button key={a.id} onClick={() => setSelectedAspect(a)} className={`p-2 rounded-lg border text-center text-[9px] font-bold transition-all ${selectedAspect.id === a.id ? 'bg-zinc-100 border-zinc-100 text-zinc-900' : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:border-white/20'}`}>
                      {a.label}
                    </button>
                  ))}
                </div>
              </CollapsibleSection>

              <CollapsibleSection id="bg" title="Background">
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {BACKGROUND_PATTERNS.map(bg => (
                    <button key={bg.id} onClick={() => setSelectedBackground(bg)} className={`p-2 rounded-lg border flex flex-col items-center gap-1 text-[8px] font-bold transition-all ${selectedBackground.id === bg.id ? 'bg-zinc-100 border-zinc-100 text-zinc-900' : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:border-white/20'}`}>
                      <div className="w-5 h-5 rounded-full border border-white/10" style={{ background: bg.color }} />
                      <span className="truncate w-full text-center">{bg.name}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => bgInputRef.current?.click()} className={`flex-1 p-2 rounded-lg border text-[9px] font-bold text-center ${selectedBackground.id === 'custom' ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'border-white/5 text-zinc-400 hover:border-white/20'}`}>
                    {customBgUrl ? '✓ Custom BG' : '↑ Upload BG'}
                  </button>
                  {customBgUrl && <button onClick={() => { setCustomBgImage(null); setCustomBgUrl(null); setSelectedBackground(BACKGROUND_PATTERNS[0]); }} className="p-2 rounded-lg border border-red-500/20 text-red-400 text-[9px] font-bold hover:bg-red-500/10">✕</button>}
                </div>
                {selectedBackground.id === 'custom' && customBgUrl && (
                  <div className="mt-2 space-y-1">
                    <Slider label="BG Offset X" value={bgOffset.x} min={-50} max={50} step={1} onChange={(v: number) => setBgOffset(p => ({ ...p, x: v }))} />
                    <Slider label="BG Offset Y" value={bgOffset.y} min={-50} max={50} step={1} onChange={(v: number) => setBgOffset(p => ({ ...p, y: v }))} />
                  </div>
                )}
              </CollapsibleSection>

              <CollapsibleSection id="spacing" title="Spacing & Size">
                <Slider label="Padding" value={slotPadding} min={0} max={60} step={2} onChange={setSlotPadding} display={`${slotPadding}px`} />
                <Slider label="Zoom" value={zoom} min={0.3} max={2} step={0.1} onChange={setZoom} display={`${zoom.toFixed(1)}x`} />
              </CollapsibleSection>

              <CollapsibleSection id="pb-export" title="Export Settings">
                <div className="grid grid-cols-2 gap-1.5">
                  <select value={exportFormat} onChange={e => setExportFormat(e.target.value as any)} className="bg-zinc-900 border border-white/10 rounded-lg p-1.5 text-[10px] font-bold text-zinc-300 outline-none">
                    <option value="image/png">PNG</option><option value="image/jpeg">JPEG</option>
                  </select>
                  <select value={exportScale} onChange={e => setExportScale(parseFloat(e.target.value))} className="bg-zinc-900 border border-white/10 rounded-lg p-1.5 text-[10px] font-bold text-zinc-300 outline-none">
                    <option value="1">1x</option><option value="2">2x</option><option value="3">3x</option>
                  </select>
                </div>
                {exportFormat === 'image/jpeg' && <Slider label="Quality" value={exportQuality} min={0.1} max={1} step={0.1} onChange={setExportQuality} display={`${Math.round(exportQuality * 100)}%`} />}
              </CollapsibleSection>

              <GalleryPanel forSlot={true} />
            </>
          ) : (
            <>
              <CollapsibleSection id="scenes" title="Scene Selection" icon={<Sliders className="w-3.5 h-3.5 text-zinc-500" />}>
                <div className="grid grid-cols-2 gap-1.5 max-h-60 overflow-y-auto pr-1">
                  {SCENE_KEYS.map(scene => (
                    <button key={scene} onClick={() => { setSelectedScene(scene); pushHistory(); }}
                      className={`p-2 rounded-lg border text-left text-[10px] font-bold truncate transition-all ${selectedScene === scene ? 'bg-zinc-100 border-zinc-100 text-zinc-900' : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:border-white/20'}`}>
                      {scene}
                    </button>
                  ))}
                </div>
              </CollapsibleSection>

              <CollapsibleSection id="adjust" title="Adjustments">
                <div className="space-y-3">
                  <Slider label="Filter Intensity" value={intensity} min={0} max={1} step={0.01} onChange={setIntensity} display={`${Math.round(intensity * 100)}%`} />
                  <Slider label="Skin Retouch" value={skinRetouch} min={0} max={1} step={0.01} onChange={setSkinRetouch} display={`${Math.round(skinRetouch * 100)}%`} />
                  <Slider label="Vignette" value={vignette} min={0} max={1} step={0.01} onChange={setVignette} display={`${Math.round(vignette * 100)}%`} />
                  <Slider label="Grain" value={grain} min={0} max={0.5} step={0.01} onChange={setGrain} display={`${Math.round(grain * 100)}%`} />
                  <Slider label="Sharpen/Soften" value={sharpen} min={-1} max={1} step={0.01} onChange={setSharpen} display={sharpen > 0 ? 'Sharp' : sharpen < 0 ? 'Soft' : '0'} />
                  <Slider label="Temperature" value={temperature} min={-1} max={1} step={0.01} onChange={setTemperature} display={temperature > 0 ? 'Warm' : temperature < 0 ? 'Cool' : '0'} />
                  <Slider label="Tint" value={tint} min={-1} max={1} step={0.01} onChange={setTint} display={tint > 0 ? 'Magenta' : tint < 0 ? 'Green' : '0'} />
                  <Slider label="Letterbox" value={letterbox} min={0} max={0.3} step={0.01} onChange={setLetterbox} display={`${Math.round(letterbox * 100)}%`} />
                  <Slider label="Lens Distortion" value={distortion} min={-0.5} max={0.5} step={0.01} onChange={setDistortion} display={`${distortion > 0 ? '+' : ''}${Math.round(distortion * 100)}%`} />
                </div>
              </CollapsibleSection>

              <CollapsibleSection id="transform" title="Transform">
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  <button onClick={() => { setFlipH(!flipH); pushHistory(); }} className={`p-1.5 rounded-lg border text-[9px] font-bold uppercase ${flipH ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'border-white/10 text-zinc-500'}`}>Flip H</button>
                  <button onClick={() => { setFlipV(!flipV); pushHistory(); }} className={`p-1.5 rounded-lg border text-[9px] font-bold uppercase ${flipV ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'border-white/10 text-zinc-500'}`}>Flip V</button>
                </div>
                <Slider label="Zoom" value={zoom} min={0.5} max={2} step={0.1} onChange={setZoom} display={`${zoom.toFixed(1)}x`} />
              </CollapsibleSection>

              <CollapsibleSection id="stickers" title="Stickers & Icons">
                <button onClick={() => stickerInputRef.current?.click()} className="w-full p-2 rounded-lg border border-dashed border-zinc-700 hover:border-zinc-500 text-zinc-500 text-[10px] font-bold flex items-center justify-center gap-1">
                  <Plus className="w-3 h-3" /> Add Sticker
                </button>
                {stickerImages.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {stickerImages.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 p-1 rounded bg-zinc-900/50">
                        <img src={s.url} alt="" className="w-6 h-6 object-contain" />
                        <div className="flex-1 space-y-1">
                          <input type="range" min={0} max={100} value={s.x} onChange={e => setStickerImages(p => p.map((st, j) => j === i ? { ...st, x: parseInt(e.target.value) } : st))} className="k-slider" />
                          <input type="range" min={0} max={100} value={s.y} onChange={e => setStickerImages(p => p.map((st, j) => j === i ? { ...st, y: parseInt(e.target.value) } : st))} className="k-slider" />
                        </div>
                        <button onClick={() => setStickerImages(p => p.filter((_, j) => j !== i))} className="p-0.5 text-red-400"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleSection>

              <CollapsibleSection id="export" title="Export Settings">
                <div className="grid grid-cols-2 gap-1.5">
                  <select value={exportFormat} onChange={e => setExportFormat(e.target.value as any)} className="bg-zinc-900 border border-white/10 rounded-lg p-1.5 text-[10px] font-bold text-zinc-300 outline-none">
                    <option value="image/png">PNG</option><option value="image/jpeg">JPEG</option>
                  </select>
                  <select value={exportScale} onChange={e => setExportScale(parseFloat(e.target.value))} className="bg-zinc-900 border border-white/10 rounded-lg p-1.5 text-[10px] font-bold text-zinc-300 outline-none">
                    <option value="0.5">0.5x</option><option value="1">1x</option><option value="2">2x</option>
                  </select>
                </div>
                {exportFormat === 'image/jpeg' && <Slider label="Quality" value={exportQuality} min={0.1} max={1} step={0.1} onChange={setExportQuality} display={`${Math.round(exportQuality * 100)}%`} />}
              </CollapsibleSection>

              <GalleryPanel forSlot={false} />
            </>
          )}
        </aside>
      </main>

      <footer className="h-6 border-t border-white/5 k-glass flex items-center px-6 justify-between text-[9px] text-zinc-500 uppercase tracking-widest shrink-0">
        <span>K-Cinema Filter Lab • TonalMapper v2.0</span>
        <span>© 2024 K-Cinema Labs</span>
      </footer>

      {previewUrl && (
        <div className="preview-modal-backdrop" onClick={() => setPreviewUrl(null)}>
          <div className="preview-modal" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Export Preview</h3>
              <div className="flex items-center gap-2">
                <button onClick={downloadImage} className="k-button text-sm flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Download</button>
                <button onClick={() => setPreviewUrl(null)} className="p-2 rounded-lg border border-white/10 hover:bg-white/5 text-zinc-400"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <img src={previewUrl} alt="Preview" className="w-full rounded-lg border border-white/10" />
          </div>
        </div>
      )}
    </div>
  );
}
