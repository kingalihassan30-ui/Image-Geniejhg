import React, { useState, useEffect, useRef } from 'react';
import { Download, Maximize2, ZoomIn, ZoomOut, RotateCcw, Move, Crop, Share2, Camera, Upload } from 'lucide-react';
import { GenieLogo } from '../App';
import Button from './Button';

interface ImageCanvasProps {
  currentImage: string | null;
  originalImage: string | null;
  isGenerating: boolean;
  onDownload: () => void;
  onImageUpdate?: (newImage: string, label: string) => void;
  onShare?: () => void;
  mode: 'edit' | 'create';
  onCameraOpen?: () => void;
  onUploadOpen?: () => void;
}

const ASPECT_RATIOS = [
  { label: 'Square (1:1)', ratio: 1, id: '1:1' },
  { label: 'Landscape (16:9)', ratio: 16/9, id: '16:9' },
  { label: 'Portrait (9:16)', ratio: 9/16, id: '9:16' },
  { label: 'Standard (4:3)', ratio: 4/3, id: '4:3' },
  { label: 'Classic (3:2)', ratio: 3/2, id: '3:2' }
];

const ImageCanvas: React.FC<ImageCanvasProps> = ({ 
  currentImage, 
  originalImage, 
  isGenerating,
  onDownload,
  onImageUpdate,
  onShare,
  mode,
  onCameraOpen,
  onUploadOpen
}) => {
  const [showComparison, setShowComparison] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [showCropMenu, setShowCropMenu] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);
  
  // Refs for drag tracking to avoid stale closures in event listeners
  const isDraggingSlider = useRef(false);
  const isDraggingPan = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const activeImage = currentImage || (mode === 'edit' ? originalImage : null);

  // Reset view when image changes
  useEffect(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    // Disable comparison if the image changes (especially if it was a crop)
    setShowComparison(false);
  }, [currentImage, originalImage]);

  const handleZoomIn = () => setScale(s => Math.min(s + 0.5, 8));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.5, 1));
  const handleResetView = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Basic wheel zoom
    const delta = -e.deltaY;
    const factor = delta > 0 ? 0.2 : -0.2;
    
    setScale(s => {
      const newScale = Math.max(1, Math.min(8, s + factor));
      // If we are zooming out to 1, reset pan to re-center
      if (newScale === 1) {
        setPan({ x: 0, y: 0 });
      }
      return newScale;
    });
  };

  const performCrop = (ratio: number, label: string) => {
    if (!activeImage || !onImageUpdate) return;
    setShowCropMenu(false);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
        const srcW = img.naturalWidth;
        const srcH = img.naturalHeight;
        const srcRatio = srcW / srcH;
        
        let dstW = srcW;
        let dstH = srcH;
        let cropX = 0;
        let cropY = 0;

        if (srcRatio > ratio) {
            // Source is wider than target. Constrain by height.
            dstH = srcH;
            dstW = srcH * ratio;
            cropX = (srcW - dstW) / 2;
        } else {
            // Source is taller/narrower than target. Constrain by width.
            dstW = srcW;
            dstH = srcW / ratio;
            cropY = (srcH - dstH) / 2;
        }

        const canvas = document.createElement('canvas');
        canvas.width = dstW;
        canvas.height = dstH;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, cropX, cropY, dstW, dstH, 0, 0, dstW, dstH);
            // Default to PNG to preserve quality/transparency
            const newBase64 = canvas.toDataURL('image/png');
            onImageUpdate(newBase64, `Crop ${label}`);
        }
    };
    img.src = activeImage || "";
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    // Determine if we are starting a slider drag or a pan
    // Check if the target is part of the slider handle
    const target = e.target as HTMLElement;
    const isSliderHandle = target.closest('.slider-handle');

    if (isSliderHandle) {
      isDraggingSlider.current = true;
    } else if (scale > 1) {
      isDraggingPan.current = true;
      setIsPanning(true);
    }

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    lastMousePos.current = { x: clientX, y: clientY };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      // Handle Slider Drag
      if (isDraggingSlider.current && imageWrapperRef.current) {
        const rect = imageWrapperRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const percentage = (x / rect.width) * 100;
        setSliderPosition(Math.max(0.1, Math.min(99.9, percentage))); // Clamp to avoid 0/100 edge cases
      }

      // Handle Panning
      if (isDraggingPan.current) {
        const dx = clientX - lastMousePos.current.x;
        const dy = clientY - lastMousePos.current.y;
        
        setPan(prev => ({
          x: prev.x + dx,
          y: prev.y + dy
        }));
        
        lastMousePos.current = { x: clientX, y: clientY };
      }
    };

    const handleMouseUp = () => {
      isDraggingSlider.current = false;
      isDraggingPan.current = false;
      setIsPanning(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, []); // Dependencies empty as we use refs

  if (!activeImage) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 m-4 min-h-[400px]">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
            <GenieLogo className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 tracking-tight">
            {mode === 'create' ? "Dream it. Create it." : "Turn your imagination into image"}
          </h3>
          <p className="text-slate-500 mt-2 text-sm max-w-sm mx-auto mb-8">
            {mode === 'create' 
              ? "Type a detailed prompt below to generate a brand new image from scratch." 
              : "Upload an image and describe your vision to see it transform instantly."}
          </p>
          
          {mode === 'edit' && (
            <div className="flex items-center justify-center gap-4">
              {onUploadOpen && (
                <Button onClick={onUploadOpen} icon={<Upload size={16} />} variant="secondary">
                   Upload Image
                </Button>
              )}
              {onCameraOpen && (
                <Button onClick={onCameraOpen} icon={<Camera size={16} />} variant="secondary">
                   Take Photo
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 flex flex-col min-h-0 bg-slate-900/5 overflow-hidden rounded-xl m-2 sm:m-6 select-none">
      
      {/* Top Controls */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        {onShare && (
           <button
             onClick={onShare}
             className="p-2 rounded-full bg-white/90 text-purple-600 hover:bg-white hover:text-purple-700 backdrop-blur-md transition-colors shadow-sm"
             title="Share to Prompt Hub"
           >
             <Share2 size={16} />
           </button>
        )}
        
        {onImageUpdate && (
          <div className="relative">
            <button
              onClick={() => setShowCropMenu(!showCropMenu)}
              className="p-2 rounded-full bg-white/90 text-slate-700 hover:bg-white backdrop-blur-md transition-colors shadow-sm"
              title="Crop to Aspect Ratio"
            >
              <Crop size={16} />
            </button>
            {showCropMenu && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setShowCropMenu(false)}
                />
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Aspect Ratio</div>
                  {ASPECT_RATIOS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => performCrop(item.ratio, item.label)}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {originalImage && currentImage && currentImage !== originalImage && mode === 'edit' && (
           <button
             onClick={() => setShowComparison(!showComparison)}
             className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition-colors shadow-sm ${showComparison ? 'bg-yellow-400 text-yellow-950' : 'bg-white/90 text-slate-700 hover:bg-white'}`}
           >
             {showComparison ? 'Hide Comparison' : 'Compare Original'}
           </button>
        )}
        <button 
          onClick={onDownload}
          className="p-2 rounded-full bg-white/90 text-slate-700 hover:bg-white backdrop-blur-md transition-colors shadow-sm"
          title="Download Image"
        >
          <Download size={16} />
        </button>
      </div>

      {/* Bottom Zoom Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-white/90 backdrop-blur-md p-1.5 rounded-full shadow-md border border-slate-200/50">
        <button 
          onClick={handleZoomOut}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-600 disabled:opacity-50"
          disabled={scale <= 1}
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        <div className="w-px h-4 bg-slate-200 mx-1"></div>
        <span className="text-xs font-medium text-slate-500 min-w-[3ch] text-center">
          {Math.round(scale * 100)}%
        </span>
        <div className="w-px h-4 bg-slate-200 mx-1"></div>
        <button 
          onClick={handleZoomIn}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-600 disabled:opacity-50"
          disabled={scale >= 8}
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
        <button 
          onClick={handleResetView}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-600 ml-1 border-l border-slate-200"
          title="Reset View"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Main Canvas Area */}
      <div 
        className={`flex-1 relative flex items-center justify-center w-full h-full overflow-hidden ${isPanning ? 'cursor-grabbing' : scale > 1 ? 'cursor-grab' : 'cursor-default'}`}
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        {isGenerating && (
          <div className="absolute inset-0 z-30 bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
               <div className="relative w-24 h-24">
                 <div className="absolute inset-0 border-4 border-yellow-200 rounded-full animate-ping opacity-75"></div>
                 <div className="absolute inset-0 border-4 border-yellow-400 rounded-full animate-spin border-t-transparent"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <GenieLogo className="w-8 h-8 text-yellow-500" />
                 </div>
               </div>
               <p className="mt-6 font-bold text-slate-800 bg-white/90 backdrop-blur px-6 py-2 rounded-full shadow-lg border border-slate-100">Working magic...</p>
            </div>
          </div>
        )}

        {/* Transform Layer */}
        <div 
          style={{ 
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transition: isDraggingPan.current ? 'none' : 'transform 0.1s ease-out'
          }}
          className="origin-center will-change-transform"
        >
          {/* Image Wrapper */}
          <div 
            ref={imageWrapperRef}
            className="relative shadow-2xl rounded-lg overflow-hidden"
          >
            {/* Main Image Layer */}
            <img 
              src={activeImage} 
              alt="Active" 
              draggable={false}
              className="max-w-[85vw] max-h-[75vh] object-contain block pointer-events-none"
            />

            {/* Comparison Layer (Original) - Only in Edit Mode */}
            {showComparison && originalImage && mode === 'edit' && (
              <div 
                className="absolute inset-0 overflow-hidden border-r-2 border-white/50 z-10"
                style={{ width: `${sliderPosition}%` }}
              >
                <img 
                  src={originalImage} 
                  alt="Original" 
                  draggable={false}
                  className="max-w-none h-full object-contain pointer-events-none"
                  style={{ 
                    // This creates a "reveal" effect by keeping the inner image size matched to the outer wrapper
                    // We counteract the container's width percentage
                     width: `${100 * (100 / sliderPosition)}%`,
                     maxWidth: 'none'
                  }}
                />
              </div>
            )}
            
            {/* Slider Handle - Only in Edit Mode */}
            {showComparison && mode === 'edit' && (
              <div 
                className="slider-handle absolute top-0 bottom-0 w-8 -ml-4 cursor-ew-resize z-20 flex items-center justify-center group"
                style={{ left: `${sliderPosition}%` }}
                // Note: Mouse events are handled by the parent container now for robust dragging
              >
                <div className="w-0.5 h-full bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)]"></div>
                <div className="w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center absolute top-1/2 -translate-y-1/2 text-slate-400 group-hover:scale-110 transition-transform">
                  <Maximize2 size={14} className="rotate-45 text-slate-600" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCanvas;