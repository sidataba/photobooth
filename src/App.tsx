/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Download, RefreshCcw, Image as ImageIcon, Sliders, Play, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { KOREAN_SCENES, ColorGrade, PHOTOBOOTH_LAYOUTS, BACKGROUND_PATTERNS } from './constants';

export default function App() {
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [originalImageDataList, setOriginalImageDataList] = useState<ImageData[]>([]);
  const [selectedScene, setSelectedScene] = useState<string>("Seoul Night");
  const [intensity, setIntensity] = useState(1.0);
  const [skinRetouch, setSkinRetouch] = useState(0.5);
  const [grain, setGrain] = useState(0.15);
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
  const [tonalDistribution, setTonalDistribution] = useState<number[]>([33, 33, 34]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [splitView, setSplitView] = useState(false);
  const [splitPos, setSplitPos] = useState(50);
  const [previewScale, setPreviewScale] = useState(1.0);
  const [selectedLayout, setSelectedLayout] = useState(PHOTOBOOTH_LAYOUTS[0]);
  const [selectedBackground, setSelectedBackground] = useState(BACKGROUND_PATTERNS[0]);
  const [mode, setMode] = useState<'editor' | 'photobooth'>('editor');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: HTMLImageElement[] = [];
    const fileArray = Array.from(files) as File[];
    
    let loadedCount = 0;
    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          newImages.push(img);
          loadedCount++;
          if (loadedCount === fileArray.length) {
            setImages(prev => [...prev, ...newImages]);
            setOriginalImageDataList([]); // Reset to re-capture
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Initialize canvas and capture original image data when images are loaded
  useEffect(() => {
    if (images.length > 0 && canvasRef.current && originalImageDataList.length === 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        // For editor mode, we only use the first image for now
        const image = images[0];
        const maxDim = 1280;
        const scale = Math.min(1.0, maxDim / Math.max(image.width, image.height));
        setPreviewScale(scale);

        canvas.width = image.width * scale;
        canvas.height = image.height * scale;
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setOriginalImageDataList([data]);
        
        // Calculate initial tonal distribution
        const pixels = data.data;
        let s = 0, m = 0, h = 0;
        for (let i = 0; i < pixels.length; i += 40) {
          const lum = 0.299 * pixels[i] + 0.587 * pixels[i+1] + 0.114 * pixels[i+2];
          if (lum < 85) s++;
          else if (lum < 170) m++;
          else h++;
        }
        const total = s + m + h;
        setTonalDistribution([(s/total)*100, (m/total)*100, (h/total)*100]);
      }
    }
  }, [images, originalImageDataList, previewScale]);

  const handleReset = () => {
    if (images.length > 0 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(images[0], 0, 0, canvas.width, canvas.height);
      }
    }
  };

  const applyFilter = useCallback(() => {
    if (originalImageDataList.length === 0 || !canvasRef.current) return;
    
    setIsProcessing(true);
    
    requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const grade = KOREAN_SCENES[selectedScene];
      const { width, height } = canvas;
      
      const newImageData = ctx.createImageData(width, height);
      const data = newImageData.data;
      const originalData = originalImageDataList[0].data;

      const getZoneFactor = (lum: number) => {
        return Math.min(8, Math.floor(lum / 28.33));
      };

      const centerX = width / 2;
      const centerY = height / 2;
      const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

      for (let i = 0; i < originalData.length; i += 4) {
        let r = originalData[i];
        let g = originalData[i + 1];
        let b = originalData[i + 2];
        const a = originalData[i + 3];

        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const zone = getZoneFactor(lum);

        let targetGrade;
        let intensityMultiplier = 1;

        if (zone < 3) {
          targetGrade = grade.shadows;
          intensityMultiplier = 1.2 - (zone * 0.2); 
        } else if (zone < 6) {
          targetGrade = grade.midtones;
          intensityMultiplier = zone === 4 ? 0.5 : 0.8;
        } else {
          targetGrade = grade.highlights;
          intensityMultiplier = 0.5 + (zone - 6) * 0.25;
        }

        // Apply color shift
        r += targetGrade.r * targetGrade.intensity * intensityMultiplier * intensity;
        g += targetGrade.g * targetGrade.intensity * intensityMultiplier * intensity;
        b += targetGrade.b * targetGrade.intensity * intensityMultiplier * intensity;

        // Saturation
        const avg = (r + g + b) / 3;
        const sat = 1 + (grade.saturation - 1) * intensity;
        r = avg + (r - avg) * sat;
        g = avg + (g - avg) * sat;
        b = avg + (b - avg) * sat;

        // Contrast & Brightness
        const cont = 1 + (grade.contrast - 1) * intensity;
        const bright = 1 + (grade.brightness - 1) * intensity;
        r = (r - 128) * cont + 128 * bright;
        g = (g - 128) * cont + 128 * bright;
        b = (b - 128) * cont + 128 * bright;

        // White Balance (Temperature & Tint)
        if (temperature !== 0) {
          r += temperature * 20;
          b -= temperature * 20;
        }
        if (tint !== 0) {
          g += tint * 20;
          r += tint * 10;
          b += tint * 10;
        }

        // Cinematic Effects: Vignette
        if (vignette > 0) {
          const x = (i / 4) % width;
          const y = Math.floor((i / 4) / width);
          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const vFactor = 1 - (dist / maxDist) * vignette;
          r *= vFactor;
          g *= vFactor;
          b *= vFactor;
        }

        // Cinematic Effects: Grain
        if (grain > 0) {
          const noise = (Math.random() - 0.5) * grain * 255;
          r += noise;
          g += noise;
          b += noise;
        }

        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = a;
      }

      // Optional: Sharpen/Softness Pass
      if (sharpen !== 0) {
        const tempData = new Uint8ClampedArray(data);
        const amount = sharpen * 0.5;
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const i = (y * width + x) * 4;
            // Simple Laplacian Sharpening
            const center = data[i] * 5;
            const neighbors = (data[i - 4] + data[i + 4] + data[i - width * 4] + data[i + width * 4]);
            const res = center - neighbors;
            
            tempData[i] = Math.min(255, Math.max(0, data[i] + res * amount));
            tempData[i+1] = Math.min(255, Math.max(0, data[i+1] + res * amount));
            tempData[i+2] = Math.min(255, Math.max(0, data[i+2] + res * amount));
          }
        }
        data.set(tempData);
      }

      // Optional: Skin Retouching Pass (Optimized)
      if (skinRetouch > 0) {
        const radius = Math.max(1, Math.round(skinRetouch * 2));
        const tempData = new Uint8ClampedArray(data);
        const step = radius > 2 ? 2 : 1; // Sample every 2nd pixel if radius is large
        
        for (let y = radius; y < height - radius; y += step) {
          for (let x = radius; x < width - radius; x += step) {
            const i = (y * width + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const isSkin = r > 95 && g > 40 && b > 20 && 
                           (Math.max(r, g, b) - Math.min(r, g, b) > 15) && 
                           Math.abs(r - g) > 15 && r > g && r > b;

            if (isSkin) {
              let sumR = 0, sumG = 0, sumB = 0, count = 0;
              for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                  const ni = ((y + dy) * width + (x + dx)) * 4;
                  const nr = data[ni];
                  const ng = data[ni + 1];
                  const nb = data[ni + 2];
                  const diff = Math.abs(r - nr) + Math.abs(g - ng) + Math.abs(b - nb);
                  if (diff < 25) {
                    sumR += nr; sumG += ng; sumB += nb; count++;
                  }
                }
              }
              if (count > 0) {
                const fr = sumR / count;
                const fg = sumG / count;
                const fb = sumB / count;
                
                // Apply to a small block if we skipped pixels
                for (let sy = 0; sy < step; sy++) {
                  for (let sx = 0; sx < step; sx++) {
                    const fi = ((y + sy) * width + (x + sx)) * 4;
                    tempData[fi] = Math.min(255, fr * (1 + 0.03 * skinRetouch));
                    tempData[fi + 1] = Math.min(255, fg * (1 + 0.01 * skinRetouch));
                    tempData[fi + 2] = fb;
                  }
                }
              }
            }
          }
        }
        data.set(tempData);
      }

      ctx.putImageData(newImageData, 0, 0);

      // Post-processing: Letterbox & Distortion (Canvas Level)
      if (letterbox > 0 || distortion !== 0) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.drawImage(canvas, 0, 0);
          ctx.clearRect(0, 0, width, height);
          
          if (distortion !== 0) {
            // Simple barrel distortion simulation using drawImage with scaling
            const dFactor = 1 + distortion * 0.1;
            ctx.drawImage(tempCanvas, width * (1 - dFactor) / 2, height * (1 - dFactor) / 2, width * dFactor, height * dFactor);
          } else {
            ctx.drawImage(tempCanvas, 0, 0);
          }

          if (letterbox > 0) {
            const lbHeight = (height * letterbox) / 2;
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, width, lbHeight);
            ctx.fillRect(0, height - lbHeight, width, lbHeight);
          }
        }
      }

      setIsProcessing(false);
    });
  }, [originalImageDataList, selectedScene, intensity, skinRetouch, grain, vignette, temperature, tint, distortion, letterbox, sharpen]);

  useEffect(() => {
    if (originalImageDataList.length > 0) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        applyFilter();
      }, 50);
    }
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [selectedScene, intensity, skinRetouch, grain, vignette, temperature, tint, distortion, letterbox, sharpen, originalImageDataList, applyFilter]);

  const downloadImage = () => {
    if (images.length === 0) return;
    
    setIsProcessing(true);
    
    if (mode === 'editor') {
      const image = images[0];
      // Use a hidden canvas for full-resolution export
      const exportCanvas = document.createElement('canvas');
      const exportWidth = image.width * exportScale;
      const exportHeight = image.height * exportScale;
      exportCanvas.width = exportWidth;
      exportCanvas.height = exportHeight;
      const exportCtx = exportCanvas.getContext('2d', { willReadFrequently: true });
      if (!exportCtx) return;

      // Draw original image to export canvas
      exportCtx.drawImage(image, 0, 0, exportWidth, exportHeight);
      const fullResData = exportCtx.getImageData(0, 0, exportWidth, exportHeight);
      
      // Apply filters to full resolution data
      const grade = KOREAN_SCENES[selectedScene];
      const data = fullResData.data;
      const centerX = exportWidth / 2;
      const centerY = exportHeight / 2;
      const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];
        const a = data[i + 3];

        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const zone = Math.min(8, Math.floor(lum / 28.33));

        let targetGrade;
        let intensityMultiplier = 1;

        if (zone < 3) {
          targetGrade = grade.shadows;
          intensityMultiplier = 1.2 - (zone * 0.2); 
        } else if (zone < 6) {
          targetGrade = grade.midtones;
          intensityMultiplier = zone === 4 ? 0.5 : 0.8;
        } else {
          targetGrade = grade.highlights;
          intensityMultiplier = 0.5 + (zone - 6) * 0.25;
        }

        r += targetGrade.r * targetGrade.intensity * intensityMultiplier * intensity;
        g += targetGrade.g * targetGrade.intensity * intensityMultiplier * intensity;
        b += targetGrade.b * targetGrade.intensity * intensityMultiplier * intensity;

        const avg = (r + g + b) / 3;
        const sat = 1 + (grade.saturation - 1) * intensity;
        r = avg + (r - avg) * sat;
        g = avg + (g - avg) * sat;
        b = avg + (b - avg) * sat;

        const cont = 1 + (grade.contrast - 1) * intensity;
        const bright = 1 + (grade.brightness - 1) * intensity;
        r = (r - 128) * cont + 128 * bright;
        g = (g - 128) * cont + 128 * bright;
        b = (b - 128) * cont + 128 * bright;

        if (temperature !== 0) {
          r += temperature * 20;
          b -= temperature * 20;
        }
        if (tint !== 0) {
          g += tint * 20;
          r += tint * 10;
          b += tint * 10;
        }

        if (vignette > 0) {
          const x = (i / 4) % exportWidth;
          const y = Math.floor((i / 4) / exportWidth);
          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const vFactor = 1 - (dist / maxDist) * vignette;
          r *= vFactor;
          g *= vFactor;
          b *= vFactor;
        }

        if (grain > 0) {
          const noise = (Math.random() - 0.5) * grain * 255;
          r += noise;
          g += noise;
          b += noise;
        }

        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
      }

      // Apply Sharpen to full resolution data
      if (sharpen !== 0) {
        const tempData = new Uint8ClampedArray(data);
        const amount = sharpen * 0.5;
        for (let y = 1; y < exportHeight - 1; y++) {
          for (let x = 1; x < exportWidth - 1; x++) {
            const i = (y * exportWidth + x) * 4;
            const center = data[i] * 5;
            const neighbors = (data[i - 4] + data[i + 4] + data[i - exportWidth * 4] + data[i + exportWidth * 4]);
            const res = center - neighbors;
            tempData[i] = Math.min(255, Math.max(0, data[i] + res * amount));
            tempData[i+1] = Math.min(255, Math.max(0, data[i+1] + res * amount));
            tempData[i+2] = Math.min(255, Math.max(0, data[i+2] + res * amount));
          }
        }
        data.set(tempData);
      }

      exportCtx.putImageData(fullResData, 0, 0);

      // Apply transformations and letterbox to a final canvas
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = exportWidth;
      finalCanvas.height = exportHeight;
      const finalCtx = finalCanvas.getContext('2d');
      if (finalCtx) {
        finalCtx.save();
        finalCtx.translate(exportWidth / 2, exportHeight / 2);
        finalCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
        finalCtx.scale(zoom, zoom);
        finalCtx.translate(-exportWidth / 2, -exportHeight / 2);
        
        if (distortion !== 0) {
          const dFactor = 1 + distortion * 0.1;
          finalCtx.drawImage(exportCanvas, exportWidth * (1 - dFactor) / 2, exportHeight * (1 - dFactor) / 2, exportWidth * dFactor, exportHeight * dFactor);
        } else {
          finalCtx.drawImage(exportCanvas, 0, 0);
        }
        finalCtx.restore();

        if (letterbox > 0) {
          const lbHeight = (exportHeight * letterbox) / 2;
          finalCtx.fillStyle = 'black';
          finalCtx.fillRect(0, 0, exportWidth, lbHeight);
          finalCtx.fillRect(0, exportHeight - lbHeight, exportWidth, lbHeight);
        }

        const link = document.createElement('a');
        const ext = exportFormat === 'image/png' ? 'png' : 'jpg';
        link.download = `k-cinema-${selectedScene.toLowerCase().replace(' ', '-')}.${ext}`;
        link.href = finalCanvas.toDataURL(exportFormat, exportQuality);
        link.click();
      }
    } else {
      // Photobooth export
      const exportCanvas = document.createElement('canvas');
      const padding = 40 * exportScale;
      const slotWidth = 600 * exportScale;
      const slotHeight = 400 * exportScale;
      const cols = selectedLayout.cols;
      const rows = Math.ceil(selectedLayout.slots / cols);
      
      exportCanvas.width = (slotWidth + padding) * cols + padding;
      exportCanvas.height = (slotHeight + padding) * rows + padding;
      
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) return;
      
      // Draw background
      if (selectedBackground.color.includes('gradient')) {
        // Simple approximation for gradient
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      } else {
        ctx.fillStyle = selectedBackground.color;
        ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      }
      
      // Draw slots
      for (let i = 0; i < selectedLayout.slots; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = padding + col * (slotWidth + padding);
        const y = padding + row * (slotHeight + padding);
        
        if (images[i]) {
          ctx.drawImage(images[i], x, y, slotWidth, slotHeight);
        } else {
          ctx.fillStyle = '#333';
          ctx.fillRect(x, y, slotWidth, slotHeight);
        }
      }
      
      const link = document.createElement('a');
      link.download = `photobooth-${selectedLayout.id}.png`;
      link.href = exportCanvas.toDataURL('image/png');
      link.click();
    }
    
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 k-glass sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center">
            <Play className="w-4 h-4 text-zinc-900 fill-current" />
          </div>
          <h1 className="font-serif italic text-xl tracking-tight">K-Cinema <span className="text-zinc-500 font-sans not-italic text-sm font-medium ml-2 uppercase tracking-widest">Filter Lab</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/5 mr-4">
            <button 
              onClick={() => setMode('editor')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${mode === 'editor' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Editor
            </button>
            <button 
              onClick={() => setMode('photobooth')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${mode === 'photobooth' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Photobooth
            </button>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="k-button flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {mode === 'editor' ? 'Upload' : 'Bulk Upload'}
          </button>
          {images.length > 0 && (
            <div className="flex items-center gap-2">
              {mode === 'editor' && (
                <>
                  <button 
                    onClick={() => setSplitView(!splitView)}
                    className={`px-4 py-2 rounded-lg border transition-all text-xs font-medium uppercase tracking-wider ${
                      splitView ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'border-white/10 text-zinc-400'
                    }`}
                  >
                    Split View
                  </button>
                  <button 
                    onMouseDown={() => !splitView && setShowOriginal(true)}
                    onMouseUp={() => setShowOriginal(false)}
                    onMouseLeave={() => setShowOriginal(false)}
                    onTouchStart={() => setShowOriginal(true)}
                    onTouchEnd={() => setShowOriginal(false)}
                    className={`px-4 py-2 rounded-lg border transition-all text-xs font-medium uppercase tracking-wider select-none ${
                      showOriginal 
                        ? 'bg-zinc-100 text-zinc-900 border-zinc-100' 
                        : 'border-white/10 hover:bg-white/5 text-zinc-400'
                    }`}
                  >
                    {showOriginal ? 'Original' : 'Hold to Compare'}
                  </button>
                </>
              )}
              <button 
                onClick={() => {
                  setIntensity(1.0);
                  setSkinRetouch(0.5);
                  setGrain(0.15);
                  setVignette(0.3);
                  setTemperature(0);
                  setTint(0);
                  setDistortion(0);
                  setLetterbox(0);
                  setSharpen(0);
                  setFlipH(false);
                  setFlipV(false);
                  setZoom(1.0);
                  setSelectedScene("Seoul Night");
                  if (mode === 'photobooth') setImages([]);
                }}
                className="p-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-zinc-400"
                title="Reset Settings"
              >
                <RefreshCcw className="w-4 h-4" />
              </button>
              <button 
                onClick={downloadImage}
                className="k-button flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {mode === 'editor' ? 'Export' : 'Print Strip'}
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] overflow-hidden">
        {/* Preview Area */}
        <div className="relative bg-black flex items-center justify-center p-8 overflow-auto">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept="image/*"
          />
          
          {!images.length ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-2xl aspect-video border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center gap-6 cursor-pointer hover:border-zinc-600 transition-colors group"
            >
              <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ImageIcon className="w-8 h-8 text-zinc-500" />
              </div>
              <div className="text-center">
                <p className="text-zinc-300 font-medium text-lg">Drop your cinematic vision here</p>
                <p className="text-zinc-500 text-sm mt-1">Supports JPG, PNG, WEBP</p>
              </div>
            </motion.div>
          ) : mode === 'editor' ? (
            <div className="relative max-w-full max-h-full shadow-2xl rounded-lg overflow-hidden group">
              <div 
                style={{ 
                  transform: `scale(${zoom}) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                  transition: 'transform 0.2s ease-out'
                }}
                className="relative"
              >
                <canvas 
                  ref={canvasRef} 
                  className={`max-w-full h-auto block transition-opacity duration-200 ${showOriginal ? 'opacity-0' : 'opacity-100'}`}
                  style={splitView ? { clipPath: `inset(0 ${100 - splitPos}% 0 0)` } : {}}
                />
                {(showOriginal || splitView) && images[0] && (
                  <img 
                    src={images[0].src} 
                    alt="Original" 
                    className="absolute inset-0 w-full h-full object-contain"
                    style={splitView ? { clipPath: `inset(0 0 0 ${splitPos}%)` } : {}}
                  />
                )}
                {splitView && (
                  <div 
                    className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-ew-resize z-10"
                    style={{ left: `${splitPos}%` }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-4 h-0.5 bg-zinc-900 rotate-90" />
                    </div>
                    <input 
                      type="range" min="0" max="100" value={splitPos}
                      onChange={(e) => setSplitPos(parseInt(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
                    />
                  </div>
                )}
              </div>
              {isProcessing && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                  <RefreshCcw className="w-8 h-8 animate-spin text-white" />
                </div>
              )}
            </div>
          ) : (
            <div 
              className="p-12 rounded-3xl shadow-2xl transition-all duration-500"
              style={{ background: selectedBackground.color }}
            >
              <div 
                className="grid gap-4"
                style={{ gridTemplateColumns: `repeat(${selectedLayout.cols}, 1fr)` }}
              >
                {Array.from({ length: selectedLayout.slots }).map((_, i) => (
                  <div 
                    key={i} 
                    className="w-64 aspect-[3/2] bg-zinc-900/20 rounded-lg overflow-hidden border border-white/10 flex items-center justify-center group relative"
                  >
                    {images[i] ? (
                      <img src={images[i].src} className="w-full h-full object-cover" alt={`Slot ${i+1}`} />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <ImageIcon className="w-6 h-6 text-zinc-600" />
                        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Slot {i+1}</span>
                      </div>
                    )}
                    <button 
                      onClick={() => {
                        const newImages = [...images];
                        newImages.splice(i, 1);
                        setImages(newImages);
                      }}
                      className="absolute top-2 right-2 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <RefreshCcw className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Controls Sidebar */}
        <aside className="border-l border-white/5 k-glass p-8 flex flex-col gap-8 overflow-y-auto">
          {mode === 'photobooth' ? (
            <>
              <section>
                <label className="k-input-label">Booth Layout</label>
                <div className="grid grid-cols-2 gap-2">
                  {PHOTOBOOTH_LAYOUTS.map((layout) => (
                    <button
                      key={layout.id}
                      onClick={() => setSelectedLayout(layout)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                        selectedLayout.id === layout.id 
                          ? 'bg-zinc-100 border-zinc-100 text-zinc-900' 
                          : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:border-white/20'
                      }`}
                    >
                      <span className="text-xs font-bold truncate">{layout.name}</span>
                      <span className="text-[10px] opacity-60">{layout.slots} Slots</span>
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <label className="k-input-label">Background Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {BACKGROUND_PATTERNS.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => setSelectedBackground(bg)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                        selectedBackground.id === bg.id 
                          ? 'bg-zinc-100 border-zinc-100 text-zinc-900' 
                          : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:border-white/20'
                      }`}
                    >
                      <div 
                        className="w-4 h-4 rounded-full border border-white/10" 
                        style={{ background: bg.color }}
                      />
                      <span className="text-xs font-bold truncate">{bg.name}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="pt-8 border-t border-white/5">
                <div className="flex items-center gap-3 text-zinc-500">
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-xs font-medium">Photobooth Mode</span>
                </div>
                <p className="text-[10px] text-zinc-600 mt-2 leading-relaxed">
                  Arrange multiple images into high-quality photobooth strips. Perfect for printing and sharing memories.
                </p>
              </section>
            </>
          ) : (
            <>
              <section>
                <label className="k-input-label">Scene Selection</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(KOREAN_SCENES).map((scene) => (
                    <button
                      key={scene}
                      onClick={() => setSelectedScene(scene)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                        selectedScene === scene 
                          ? 'bg-zinc-100 border-zinc-100 text-zinc-900' 
                          : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:border-white/20'
                      }`}
                    >
                      <span className="text-xs font-bold truncate">{scene}</span>
                      <div className={`w-full h-1 rounded-full ${selectedScene === scene ? 'bg-zinc-900/20' : 'bg-zinc-800'}`} />
                    </button>
                  ))}
                </div>
              </section>

          <section>
            <label className="k-input-label">Transformations</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button 
                onClick={() => setFlipH(!flipH)}
                className={`p-2 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all ${flipH ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'border-white/10 text-zinc-500'}`}
              >
                Flip H
              </button>
              <button 
                onClick={() => setFlipV(!flipV)}
                className={`p-2 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all ${flipV ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'border-white/10 text-zinc-500'}`}
              >
                Flip V
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] text-zinc-500 uppercase font-bold">
                <span>Zoom</span>
                <span>{zoom.toFixed(1)}x</span>
              </div>
              <input 
                type="range" min="0.5" max="2" step="0.1" value={zoom} 
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-zinc-100"
              />
            </div>
          </section>

          <section className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <label className="k-input-label mb-0">Tonal Map Analysis</label>
              <Layers className="w-3 h-3 text-zinc-500" />
            </div>
            
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/5">
                <div className="flex justify-between text-[10px] text-zinc-500 uppercase tracking-widest mb-3">
                  <span>Shadows</span>
                  <span>Midtones</span>
                  <span>Highlights</span>
                </div>
                <div className="h-2 w-full flex rounded-full overflow-hidden bg-zinc-800">
                  <motion.div 
                    animate={{ width: `${tonalDistribution[0]}%` }}
                    className="h-full bg-zinc-700" 
                  />
                  <motion.div 
                    animate={{ width: `${tonalDistribution[1]}%` }}
                    className="h-full bg-zinc-600" 
                  />
                  <motion.div 
                    animate={{ width: `${tonalDistribution[2]}%` }}
                    className="h-full bg-zinc-500" 
                  />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="text-[10px] text-zinc-500 mb-1">{Math.round(tonalDistribution[0])}%</div>
                    <div className="w-full h-1 bg-blue-500/30 rounded-full" />
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-zinc-500 mb-1">{Math.round(tonalDistribution[1])}%</div>
                    <div className="w-full h-1 bg-zinc-500/30 rounded-full" />
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-zinc-500 mb-1">{Math.round(tonalDistribution[2])}%</div>
                    <div className="w-full h-1 bg-orange-500/30 rounded-full" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="k-input-label mb-0">Wedding Skin Retouch</label>
                  <span className="text-[10px] font-mono text-zinc-400">{Math.round(skinRetouch * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01" 
                  value={skinRetouch}
                  onChange={(e) => setSkinRetouch(parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-zinc-100"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="k-input-label mb-0">Letterbox (2.35:1)</label>
                  <span className="text-[10px] font-mono text-zinc-400">{Math.round(letterbox * 100)}%</span>
                </div>
                <input 
                  type="range" min="0" max="0.3" step="0.01" value={letterbox}
                  onChange={(e) => setLetterbox(parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-zinc-100"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="k-input-label mb-0">Lens Distortion</label>
                  <span className="text-[10px] font-mono text-zinc-400">{distortion > 0 ? '+' : ''}{Math.round(distortion * 100)}%</span>
                </div>
                <input 
                  type="range" min="-0.5" max="0.5" step="0.01" value={distortion}
                  onChange={(e) => setDistortion(parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-zinc-100"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="k-input-label mb-0">Temperature</label>
                  <span className="text-[10px] font-mono text-zinc-400">{temperature > 0 ? 'Warm' : temperature < 0 ? 'Cool' : '0'}</span>
                </div>
                <input 
                  type="range" min="-1" max="1" step="0.01" value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-zinc-100"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="k-input-label mb-0">Tint</label>
                  <span className="text-[10px] font-mono text-zinc-400">{tint > 0 ? 'Magenta' : tint < 0 ? 'Green' : '0'}</span>
                </div>
                <input 
                  type="range" min="-1" max="1" step="0.01" value={tint}
                  onChange={(e) => setTint(parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-zinc-100"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="k-input-label mb-0">Sharpen / Soften</label>
                  <span className="text-[10px] font-mono text-zinc-400">{sharpen > 0 ? 'Sharpen' : sharpen < 0 ? 'Soften' : '0'}</span>
                </div>
                <input 
                  type="range" min="-1" max="1" step="0.01" value={sharpen}
                  onChange={(e) => setSharpen(parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-zinc-100"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="k-input-label mb-0">Cinematic Grain</label>
                  <span className="text-[10px] font-mono text-zinc-400">{Math.round(grain * 100)}%</span>
                </div>
                <input 
                  type="range" min="0" max="0.5" step="0.01" value={grain}
                  onChange={(e) => setGrain(parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-zinc-100"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="k-input-label mb-0">Vignette</label>
                  <span className="text-[10px] font-mono text-zinc-400">{Math.round(vignette * 100)}%</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.01" value={vignette}
                  onChange={(e) => setVignette(parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-zinc-100"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="k-input-label mb-0">Filter Intensity</label>
                  <span className="text-[10px] font-mono text-zinc-400">{Math.round(intensity * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01" 
                  value={intensity}
                  onChange={(e) => setIntensity(parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-zinc-100"
                />
              </div>
            </div>
          </section>

          <section className="pt-8 border-t border-white/5 space-y-4">
            <label className="k-input-label">Export Settings</label>
            <div className="grid grid-cols-2 gap-2">
              <select 
                value={exportFormat} 
                onChange={(e) => setExportFormat(e.target.value as any)}
                className="bg-zinc-900 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-zinc-300 outline-none"
              >
                <option value="image/png">PNG</option>
                <option value="image/jpeg">JPEG</option>
              </select>
              <select 
                value={exportScale} 
                onChange={(e) => setExportScale(parseFloat(e.target.value))}
                className="bg-zinc-900 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-zinc-300 outline-none"
              >
                <option value="0.5">0.5x</option>
                <option value="1.0">1.0x</option>
                <option value="2.0">2.0x</option>
              </select>
            </div>
            {exportFormat === 'image/jpeg' && (
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-zinc-500 uppercase font-bold">
                  <span>Quality</span>
                  <span>{Math.round(exportQuality * 100)}%</span>
                </div>
                <input 
                  type="range" min="0.1" max="1" step="0.1" value={exportQuality}
                  onChange={(e) => setExportQuality(parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-zinc-100"
                />
              </div>
            )}
          </section>

          <section className="pt-8 border-t border-white/5">
            <div className="flex items-center gap-3 text-zinc-500">
              <Sliders className="w-4 h-4" />
              <span className="text-xs font-medium">Automatic Grading Active</span>
            </div>
            <p className="text-[10px] text-zinc-600 mt-2 leading-relaxed">
              Our algorithm divides the image into 9 tonal zones, mapping them to 3 primary color areas to replicate the unique desaturated, moody aesthetic of Korean cinema.
            </p>
          </section>
        </>
      )}
    </aside>
  </main>

      {/* Footer / Status Bar */}
      <footer className="h-8 border-t border-white/5 k-glass flex items-center px-8 justify-between text-[10px] text-zinc-500 uppercase tracking-widest">
        <div className="flex gap-6">
          <span>Status: Ready</span>
          <span>Engine: TonalMapper v1.0</span>
        </div>
        <div>
          © 2024 K-Cinema Labs
        </div>
      </footer>
    </div>
  );
}
