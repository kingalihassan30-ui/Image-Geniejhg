import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, RefreshCcw, AlertCircle } from 'lucide-react';
import Button from './Button';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    try {
      setError(null);
      if (streamRef.current) {
        stopCamera();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera Error:", err);
      setError("Unable to access camera. Please ensure you have granted permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleCapture = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Flip horizontally if using user/front camera for mirror effect
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64
        const imageSrc = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(imageSrc);
        onClose();
      }
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl h-full md:h-auto md:aspect-video bg-black flex flex-col md:rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Header Controls */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
          <div className="text-white font-medium flex items-center gap-2">
            <Camera size={20} />
            <span>Take Photo</span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Video Feed */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="text-center p-6 text-white max-w-md">
              <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
              <p>{error}</p>
              <Button onClick={startCamera} className="mt-4" variant="secondary">
                Retry
              </Button>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
          )}
        </div>

        {/* Footer Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex items-center justify-center gap-8 bg-gradient-to-t from-black/80 to-transparent">
          
          {/* Flip Camera */}
          <button 
            onClick={toggleCamera}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
            title="Switch Camera"
          >
            <RefreshCcw size={24} />
          </button>

          {/* Capture Button */}
          <button
            onClick={handleCapture}
            className="p-1 rounded-full border-4 border-white/80 hover:border-white transition-all group"
          >
            <div className="w-16 h-16 rounded-full bg-white/90 group-hover:bg-white transition-colors"></div>
          </button>

          {/* Spacer to balance layout */}
          <div className="w-12"></div>
        </div>
      </div>
    </div>
  );
};

export default CameraModal;
