import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, Check, ZoomIn, ZoomOut, RotateCw, Move, 
  Eye, Image as ImageIcon, Sparkles, Sliders
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
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  // Reset state when a new image or mode is opened
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
      setImageLoaded(false);
    }
  }, [isOpen, imageUrl, mode]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    setImageLoaded(true);
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
    const outputWidth = mode === 'logo' ? 512 : 1200;
    const outputHeight = mode === 'logo' ? 512 : 500;

    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill background
    ctx.fillStyle = mode === 'logo' ? '#ffffff' : '#090C10';
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

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    onCropComplete(dataUrl);
    onClose();
  };

  if (!isOpen || !imageUrl) return null;

  const isLogo = mode === 'logo';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-[#090C10] border border-[#212634] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#12161F] border-b border-[#212634] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                {title || (isLogo ? 'İşletme Logosunu Düzenle & Kırp' : 'QR Menü Kapak Görselini Düzenle')}
              </h3>
              <p className="text-[11px] text-slate-400">
                Görseli sürükleyerek kaydırabilir ve alttaki sürgüyle yakınlaştırabilirsiniz.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-[#1E2433] transition"
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
              className={`relative overflow-hidden bg-[#0A0D14] border-2 border-indigo-500 shadow-2xl cursor-move select-none touch-none ${
                isLogo ? 'w-64 h-64 rounded-2xl' : 'w-full max-w-lg h-56 rounded-2xl'
              }`}
            >
              {/* Circular outline indicator for Logo */}
              {isLogo && (
                <div className="absolute inset-0 rounded-full border border-dashed border-indigo-400/50 pointer-events-none z-10" />
              )}

              {/* Rule of Thirds Grid Overlay */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none z-10 opacity-30">
                <div className="border-r border-b border-white/40" />
                <div className="border-r border-b border-white/40" />
                <div className="border-b border-white/40" />
                <div className="border-r border-b border-white/40" />
                <div className="border-r border-b border-white/40" />
                <div className="border-b border-white/40" />
                <div className="border-r border-white/40" />
                <div className="border-r border-white/40" />
                <div />
              </div>

              {/* Move Indicator Icon */}
              <div className="absolute top-2 left-2 z-20 bg-black/60 backdrop-blur-xs px-2 py-1 rounded-lg text-[10px] font-bold text-slate-300 flex items-center gap-1 pointer-events-none">
                <Move className="w-3 h-3 text-indigo-400" />
                <span>Sürükle</span>
              </div>

              {/* The Actual Image Being Manipulated */}
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
          <div className="w-full max-w-lg bg-[#12161F] border border-[#212634] rounded-2xl p-4 space-y-3">
            {/* Zoom Slider */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setScale((prev) => Math.max(0.5, prev - 0.1))}
                className="p-1.5 rounded-lg bg-[#0A0D14] border border-[#212634] text-slate-300 hover:text-white"
                title="Küçült"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <div className="flex-1 flex items-center gap-2">
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.05"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-[#212634] rounded-lg"
                />
                <span className="text-[11px] font-mono font-bold text-slate-400 w-12 text-right">
                  {Math.round(scale * 100)}%
                </span>
              </div>

              <button
                type="button"
                onClick={() => setScale((prev) => Math.min(3.0, prev + 0.1))}
                className="p-1.5 rounded-lg bg-[#0A0D14] border border-[#212634] text-slate-300 hover:text-white"
                title="Büyüt"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="p-1.5 rounded-lg bg-[#0A0D14] border border-[#212634] text-slate-300 hover:text-white"
                title="90° Döndür"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            {/* Reset Button */}
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#212634] text-slate-400">
              <span>{naturalSize.w > 0 ? `${naturalSize.w} x ${naturalSize.h} px` : ''}</span>
              <button
                type="button"
                onClick={() => {
                  setScale(1);
                  setRotation(0);
                  setPosition({ x: 0, y: 0 });
                }}
                className="text-indigo-400 hover:underline font-bold"
              >
                Konumu Sıfırla
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#12161F] border-t border-[#212634] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-[#1E2433] transition"
          >
            İptal
          </button>

          <button
            type="button"
            onClick={handleApplyCrop}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Kırp & Uygula</span>
          </button>
        </div>
      </div>
    </div>
  );
};
