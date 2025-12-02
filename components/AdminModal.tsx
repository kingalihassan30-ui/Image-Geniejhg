import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Save, Loader2 } from 'lucide-react';
import { PromptTemplate } from '../types';
import Button from './Button';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTemplate: (template: PromptTemplate) => void;
  initialData?: { prompt: string; image: string } | null;
}

const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, onAddTemplate, initialData }) => {
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [demoImage, setDemoImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial data if provided (for "Share to Hub" feature)
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(''); // Let user name their creation
        setPrompt(initialData.prompt);
        setDemoImage(initialData.image);
      } else {
        // Reset if opening empty
        setTitle('');
        setPrompt('');
        setDemoImage(null);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // Helper to resize image for thumbnail storage
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          // Resize to max 400px width to save LocalStorage space
          const maxWidth = 400;
          const scaleSize = maxWidth / img.width;
          
          // Only resize if bigger than max width
          const width = img.width > maxWidth ? maxWidth : img.width;
          const height = img.width > maxWidth ? img.height * scaleSize : img.height;

          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress to JPEG 0.7 quality
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          } else {
            reject(new Error('Canvas context failed'));
          }
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsProcessing(true);
        const resizedBase64 = await resizeImage(file);
        setDemoImage(resizedBase64);
      } catch (err) {
        console.error("Error processing image", err);
        alert("Failed to process image. Please try another.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !prompt || !demoImage) return;

    const newTemplate: PromptTemplate = {
      id: crypto.randomUUID(),
      title,
      prompt,
      demoImageUrl: demoImage
    };

    onAddTemplate(newTemplate);
    
    // Reset form
    setTitle('');
    setPrompt('');
    setDemoImage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">
            {initialData ? "Share to Prompt Hub" : "Admin: Add New Prompt"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {initialData ? "Give your creation a title" : "Prompt Name"}
            </label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              placeholder={initialData ? "e.g., Neon Cityscape" : "e.g., Cyberpunk Style"}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Prompt Text</label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none min-h-[100px]"
              placeholder="The actual prompt to send to Gemini..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Demo Image</label>
            <div 
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-slate-50 transition-colors ${demoImage ? 'border-purple-300 bg-purple-50' : 'border-slate-300'}`}
              onClick={() => !initialData && !isProcessing && fileInputRef.current?.click()}
            >
              {isProcessing ? (
                 <div className="py-8 flex flex-col items-center justify-center text-slate-500">
                    <Loader2 className="animate-spin mb-2" />
                    <span>Processing Image...</span>
                 </div>
              ) : demoImage ? (
                <div className="relative h-32 w-full">
                  <img src={demoImage} alt="Preview" className="h-full w-full object-contain mx-auto" />
                  {!initialData && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                      <span className="text-white text-sm font-medium">Change Image</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-4">
                  <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                  <p className="text-sm text-slate-500">Click to upload demo image</p>
                  <p className="text-xs text-slate-400 mt-1">Images are compressed automatically</p>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
                accept="image/*"
                required={!demoImage}
                disabled={isProcessing || !!initialData}
              />
            </div>
            {initialData && (
              <p className="text-xs text-slate-500 mt-1 text-center">Using your generated image as preview.</p>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button 
              type="submit" 
              disabled={!title || !prompt || !demoImage || isProcessing}
              icon={<Save size={16} />}
              className="bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500"
            >
              {initialData ? "Save to Hub" : "Upload Prompt"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminModal;