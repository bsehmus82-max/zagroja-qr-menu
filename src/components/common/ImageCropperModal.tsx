import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, Check, ZoomIn, ZoomOut, RotateCw, Move, 
  Image as ImageIcon, Sliders, Maximize2, RefreshCw, Sparkles
} from 'lucide-react';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageUrl: string;
  mode: 'logo' | 'banner';
  title?: string;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageUrl,
  mode,
  title,
  onClose,
  onCropComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Crop State
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const isLogo = mode === 'logo';

  // Reset state when a new image is opened
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageUrl, mode]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
  };

  // Fit Full Image into viewport
  const handleFitFull = () => {
    if (!containerRef.current || naturalSize.w === 0) return;
    const container = containerRef.current;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    
    const scaleW = cw / naturalSize.w;
    const scaleH = ch / naturalSize.h;
    const fitScale = Math.min(scaleW, scaleH);
    
    setScale(Math.max(0.1, Number(fitScale.toFixed(2))));
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };

  // Mouse / Touch Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Export cropped canvas
  const handleApplyCrop = () => {
    if (!imgRef.current || !containerRef.current) return;

    const img = imgRef.current;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    // Output target dimensions
    const outputWidth = isLogo ? 512 : 1280;
    const outputHeight = isLogo ? 512 : 640;

    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill background (neutral dark or white for logo)
    ctx.fillStyle = isLogo ? '#ffffff' : '#0B0F17';
    ctx.fillRect(0, 0, outputWidth, outputHeight);

    // Save and transform canvas
    ctx.save();
    ctx.translate(outputWidth / 2, outputHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    // Calculate scale factor relative to container viewport
    const viewportScale = outputWidth / rect.width;
    ctx.scale(scale * viewportScale, scale * viewportScale);
    ctx.translate(position.x, position.y);

    // Draw the image centered
    const imgAspect = img.naturalWidth / img.naturalHeight;
    let drawW = rect.width;
    let drawH = rect.width / imgAspect;
    if (drawH < rect.height) {
      drawH = rect.height;
      drawW = rect.height * imgAspect;
    }

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.94);
    onCropComplete(dataUrl);
    onClose();
  };

  // Direct untouched original upload
  const handleUseOriginal = () => {
    onCropComplete(imageUrl);
    onClose();
  };

  if (!isOpen || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-[#0F172A] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#1E293B] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                {title || (isLogo ? 'İşletme Logosunu Ayarla' : 'Kapak / Arka Plan Görselini Ayarla')}
              </h3>
              <p className="text-[11px] text-slate-400">
                Görseli serbestçe kaydırabilir, yakınlaştırabilir veya tamamını sığdırabilirsiniz.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="p-6 flex-1 flex flex-col items-center justify-center overflow-y-auto space-y-4">
          {/* Main Cropping Window */}
          <div className="relative w-full flex justify-center">
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              className={`relative overflow-hidden bg-[#070A10] border-2 border-orange-500 shadow-2xl cursor-move select-none touch-none ${
                isLogo ? 'w-64 h-64 rounded-2xl' : 'w-full max-w-2xl h-72 sm:h-80 rounded-2xl'
              }`}
            >
              {/* Circular guide indicator for Logo */}
              {isLogo && (
                <div className="absolute inset-0 rounded-full border border-dashed border-orange-400/60 pointer-events-none z-10" />
              )}

              {/* Rule of Thirds Grid Overlay */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none z-10 opacity-25">
                <div className="border-r border-b border-white/50" />
                <div className="border-r border-b border-white/50" />
                <div className="border-b border-white/50" />
                <div className="border-r border-b border-white/50" />
                <div className="border-r border-b border-white/50" />
                <div className="border-b border-white/50" />
                <div className="border-r border-b border-white/50" />
                <div className="border-r border-b border-white/50" />
                <div />
              </div>

              {/* Move Indicator Badge */}
              <div className="absolute top-2 left-2 z-20 bg-black/70 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[10px] font-bold text-orange-300 flex items-center gap-1.5 pointer-events-none border border-orange-500/20">
                <Move className="w-3 h-3 text-orange-400" />
                <span>Sürükleyerek Konumlandır</span>
              </div>

              {/* The Image Element */}
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Crop preview"
                onLoad={handleImageLoad}
                draggable={false}
                style={{
                  transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                }}
                className="absolute top-1/2 left-1/2 max-w-none transition-transform duration-75 pointer-events-none"
              />
            </div>
          </div>

          {/* Controls Bar */}
          <div className="w-full max-w-2xl bg-[#1E293B] border border-slate-800 rounded-2xl p-4 space-y-3">
            {/* Zoom Slider & Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setScale((prev) => Math.max(0.1, Number((prev - 0.1).toFixed(2))))}
                className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition"
                title="Küçült"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <div className="flex-1 min-w-[140px] flex items-center gap-2">
                <input
                  type="range"
                  min="0.1"
                  max="4.0"
                  step="0.05"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <span className="text-xs font-mono font-bold text-orange-400 w-14 text-right">
                  %{Math.round(scale * 100)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setScale((prev) => Math.min(4.0, Number((prev + 0.1).toFixed(2))))}
                className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition"
                title="Büyüt"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-xs font-bold"
                title="90° Döndür"
              >
                <RotateCw className="w-4 h-4 text-orange-400" />
                <span className="hidden sm:inline">Döndür</span>
              </button>

              <button
                type="button"
                onClick={handleFitFull}
                className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-bold"
                title="Tüm Fotoğrafı Ekrana Sığdır"
              >
                <Maximize2 className="w-4 h-4 text-orange-400" />
                <span>Tamamını Sığdır</span>
              </button>
            </div>

            {/* Quick Helper Tools */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800 text-slate-400">
              <span className="font-mono text-[11px]">
                {naturalSize.w > 0 ? `Orijinal: ${naturalSize.w} x ${naturalSize.h} px` : ''}
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setScale(1);
                    setRotation(0);
                    setPosition({ x: 0, y: 0 });
                  }}
                  className="text-slate-400 hover:text-white font-bold transition flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Sıfırla</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#1E293B] border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleUseOriginal}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition"
            title="Fotoğrafı kırpmadan orijinal haliyle kaydeder"
          >
            Kırpmadan Orijinal Olarak Kullan
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition"
            >
              Vazgeç
            </button>

            <button
              type="button"
              onClick={handleApplyCrop}
              className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-orange-500/25 active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Görseli Kaydet & Uygula</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
