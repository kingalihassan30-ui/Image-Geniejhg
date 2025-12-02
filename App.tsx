import React, { useState, useRef, useEffect } from 'react';
import { Upload, Sparkles, AlertCircle, RotateCcw, Image as ImageIcon, History, Trash2, PanelLeftClose, PanelLeftOpen, X, Library, Wand2, Type, Camera, Globe, ClipboardPaste } from 'lucide-react';
import { AppState, ImageAsset, PromptTemplate } from './types';
import { editImageWithGemini, generateImageFromText, enhancePrompt } from './services/geminiService';
import Button from './components/Button';
import ImageCanvas from './components/ImageCanvas';
import PromptHub from './components/PromptHub';
import AdminModal from './components/AdminModal';
import CameraModal from './components/CameraModal';
import ExternalWebsiteModal from './components/ExternalWebsiteModal';

// Custom Genie Logo Component - Aesthetic G + Star Design
export const GenieLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <defs>
      <linearGradient id="logoGradient" x1="0" y1="0" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#A855F7" /> {/* Purple-500 */}
        <stop offset="100%" stopColor="#F59E0B" /> {/* Amber-500 */}
      </linearGradient>
    </defs>
    
    {/* Abstract G Shape */}
    <path 
      d="M19 5L17.5 6.5" 
      stroke="url(#logoGradient)" 
      strokeWidth="2.5"
    />
    <path 
      d="M21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C15.5 21 18.5 19 20 16" 
      stroke="url(#logoGradient)" 
      strokeWidth="2.5"
    />
    
    {/* Central Sparkle/Genie Star */}
    <path 
      d="M12 9L13 11.5L15.5 12.5L13 13.5L12 16L11 13.5L8.5 12.5L11 11.5L12 9Z" 
      fill="url(#logoGradient)" 
      stroke="none"
    />
  </svg>
);

// Default templates to show if no local storage exists
const DEFAULT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'default-1',
    title: 'Cyberpunk Neon',
    prompt: 'Transform the scene into a futuristic cyberpunk city with neon lights, rain-slicked streets, and high-tech architecture. Keep the main subject but change the atmosphere to be dark and vibrant with pink and blue hues.',
    // A simple colored placeholder for the default
    demoImageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAD0lEQVQIW2NkQAKrVq36DwABzAQ2wqVPbwAAAABJRU5ErkJggg==' 
  },
  {
    id: 'default-2',
    title: 'Vintage Film',
    prompt: 'Apply a vintage 1970s film aesthetic. Add grain, slightly desaturated warm colors, light leaks, and a soft focus effect to give it a nostalgic feel.',
    demoImageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAEklEQVQIW2NkQAOMBv///z8DDAAoBQzs0/g4yAAAAABJRU5ErkJggg=='
  },
  {
    id: 'default-3',
    title: 'Watercolor Sketch',
    prompt: 'Convert the image into a soft watercolor painting. Use pastel colors, visible brush strokes, and a paper texture background. Make it look artistic and dreamy.',
    demoImageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAEklEQVQIW2VkAAMjBoP///8/AwAI9QP59+V7TgAAAABJRU5ErkJggg=='
  }
];

const STYLE_PRESETS = [
  "Photorealistic", "Cinematic", "Anime", "Cyberpunk", 
  "Oil Painting", "3D Render", "Studio Lighting", "Minimalist",
  "Vintage", "Watercolor", "4K", "Vibrant"
];

type AppMode = 'edit' | 'create';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [assets, setAssets] = useState<ImageAsset[]>([]);
  const [currentAssetId, setCurrentAssetId] = useState<string | null>(null);
  const [originalAssetId, setOriginalAssetId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mode, setMode] = useState<AppMode>('edit');
  const [isEnhancing, setIsEnhancing] = useState(false);
  
  // Prompt Hub, Admin, & Camera State
  const [isPromptHubOpen, setIsPromptHubOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isWebPromptsOpen, setIsWebPromptsOpen] = useState(false);
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([]);
  const [shareData, setShareData] = useState<{prompt: string, image: string} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentAsset = assets.find(a => a.id === currentAssetId);
  const originalAsset = assets.find(a => a.id === originalAssetId);

  // Load templates from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('nano-banana-prompts');
    if (saved) {
      try {
        setPromptTemplates(JSON.parse(saved));
      } catch (e) {
        setPromptTemplates(DEFAULT_TEMPLATES);
      }
    } else {
      setPromptTemplates(DEFAULT_TEMPLATES);
    }
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const newAsset: ImageAsset = {
        id: crypto.randomUUID(),
        url: base64,
        mimeType: file.type,
        source: 'upload',
        timestamp: Date.now()
      };

      setAssets(prev => [...prev, newAsset]);
      setCurrentAssetId(newAsset.id);
      setOriginalAssetId(newAsset.id);
      setAppState(AppState.READY);
      setError(null);
      setIsSidebarOpen(true);
      setMode('edit');
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again if needed
    event.target.value = '';
  };

  const handleCameraCapture = (base64Image: string) => {
    const newAsset: ImageAsset = {
      id: crypto.randomUUID(),
      url: base64Image,
      mimeType: 'image/jpeg',
      source: 'upload',
      timestamp: Date.now()
    };

    setAssets(prev => [...prev, newAsset]);
    setCurrentAssetId(newAsset.id);
    setOriginalAssetId(newAsset.id);
    setAppState(AppState.READY);
    setError(null);
    setIsSidebarOpen(true);
    setMode('edit');
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || appState === AppState.GENERATING) return;

    // Validation based on mode
    if (mode === 'edit' && !currentAsset) {
      setError('Please upload an image to edit.');
      return;
    }

    setAppState(AppState.GENERATING);
    setError(null);

    try {
      let result;
      
      if (mode === 'edit' && currentAsset) {
         // Edit Mode: Send image + prompt
         result = await editImageWithGemini(
          currentAsset.url,
          currentAsset.mimeType,
          prompt
        );
      } else {
         // Create Mode: Send just prompt
         result = await generateImageFromText(prompt);
      }

      const { imageData, textData } = result;

      if (imageData) {
        const newAsset: ImageAsset = {
          id: crypto.randomUUID(),
          url: imageData,
          mimeType: 'image/png', // Gemini usually returns png
          source: 'generated',
          prompt: prompt,
          timestamp: Date.now()
        };

        setAssets(prev => [...prev, newAsset]);
        setCurrentAssetId(newAsset.id);
        
        // If we generated from text, this becomes the new "Original" for future edits
        if (mode === 'create') {
          setOriginalAssetId(newAsset.id);
          // Optional: switch to edit mode after generation so they can refine it
          // setMode('edit'); 
        }

        // Keep prompt so user can see what they used, or clear it. 
        // User request didn't specify, but usually clearing or keeping is fine.
        // Let's clear to encourage new prompts, but history has the prompt.
        // setPrompt(''); 
        setAppState(AppState.READY);
      } else if (textData) {
        setError(`The model responded with text instead of an image: "${textData}"`);
        setAppState(AppState.ERROR);
      } else {
        setError('Failed to generate image. Try a different prompt.');
        setAppState(AppState.ERROR);
      }
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred.');
      setAppState(AppState.ERROR);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    
    setIsEnhancing(true);
    try {
        const enhanced = await enhancePrompt(prompt);
        setPrompt(enhanced);
    } catch (e) {
        console.error("Failed to enhance prompt", e);
        // Fail silently or show small toast
    } finally {
        setIsEnhancing(false);
    }
  };

  const handleImageUpdate = (newUrl: string, label: string) => {
    const newAsset: ImageAsset = {
      id: crypto.randomUUID(),
      url: newUrl,
      mimeType: 'image/png',
      source: 'generated',
      prompt: label, // e.g. "Crop 1:1"
      timestamp: Date.now()
    };
    
    setAssets(prev => [...prev, newAsset]);
    setCurrentAssetId(newAsset.id);
    setError(null);
  };

  const handleDownload = () => {
    if (!currentAsset) return;
    const link = document.createElement('a');
    link.href = currentAsset.url;
    link.download = `image-gennie-edit-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareToHub = () => {
    if (!currentAsset) return;
    
    // Use the asset's stored prompt if available, otherwise current input
    const promptToShare = currentAsset.prompt || prompt || "My AI Creation";
    
    setShareData({
        prompt: promptToShare,
        image: currentAsset.url
    });
    setIsAdminModalOpen(true);
  };

  const handleReset = () => {
    if (originalAssetId) {
      setCurrentAssetId(originalAssetId);
      setError(null);
    }
  };

  const handleSelectHistory = (id: string) => {
    setCurrentAssetId(id);
    // If selecting history, we probably want to be in edit mode to see it/compare/tweak
    // But let's leave mode as is for flexibility, user can switch manually.
  };

  const handleDeleteAsset = (e: React.MouseEvent, assetId: string) => {
    e.stopPropagation();
    
    // If it's the last item being deleted, treat as clear all
    if (assets.length === 1) {
      handleClearHistory();
      return;
    }

    const index = assets.findIndex(a => a.id === assetId);
    const newAssets = assets.filter(a => a.id !== assetId);
    setAssets(newAssets);

    // If we deleted the active asset, select the one before it, or the first one if we deleted the head
    if (currentAssetId === assetId) {
      const newIndex = Math.max(0, index - 1);
      setCurrentAssetId(newAssets[newIndex].id);
    }

    // If we deleted the original asset, the next one becomes original
    if (originalAssetId === assetId) {
      setOriginalAssetId(newAssets[0].id);
    }
  };

  const handleClearHistory = () => {
    const shouldConfirm = assets.length > 1;
    if (shouldConfirm && !window.confirm("Are you sure you want to delete all history? This will reset the application.")) {
      return;
    }

    setAssets([]);
    setCurrentAssetId(null);
    setOriginalAssetId(null);
    setAppState(AppState.IDLE);
    setPrompt('');
    setError(null);
  };

  const handleAddStyle = (style: string) => {
    setPrompt(prev => {
        const trimmed = prev.trim();
        if (trimmed.length > 0) {
             // Check if already ends with comma
             if (trimmed.endsWith(',')) return `${trimmed} ${style}`;
             return `${trimmed}, ${style}`;
        }
        return style;
    });
  };

  const handlePastePrompt = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setPrompt(prev => {
          // If prompt is empty, just replace. If not, append.
          if (!prev.trim()) return text;
          return `${prev} ${text}`;
        });
      }
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
      // Fallback or silent fail (browsers usually block this without user gesture or permission)
      alert("Could not access clipboard. Please use Ctrl+V / Cmd+V to paste.");
    }
  };

  // --- Prompt Hub Logic ---

  const handleSelectTemplate = (template: PromptTemplate) => {
    setPrompt(template.prompt);
    setIsPromptHubOpen(false);
  };

  const handleAdminUnlock = () => {
    setShareData(null); // Ensure we are in "add new" mode, not "share" mode
    setIsAdminModalOpen(true);
  };

  const handleAddTemplate = (newTemplate: PromptTemplate) => {
    const updated = [newTemplate, ...promptTemplates];
    setPromptTemplates(updated);
    try {
      localStorage.setItem('nano-banana-prompts', JSON.stringify(updated));
    } catch (e) {
      alert("Storage limit reached! Could not save the prompt permanently. Try deleting some or using smaller images.");
      console.error("LocalStorage error:", e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <header className="flex-none bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between z-10 shadow-sm relative gap-4 md:gap-0">
        <div className="flex items-center gap-3 select-none cursor-default group w-full md:w-auto justify-center md:justify-start">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 shadow-sm group-hover:shadow-md transition-all group-hover:scale-105 duration-300">
             <GenieLogo className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-amber-500 tracking-tight">Image Gennie</h1>
            <p className="text-xs text-slate-500 font-medium tracking-wide">by Mirza Aoun</p>
          </div>
        </div>
        
        {/* Mode Switcher */}
        <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1 shadow-inner order-3 md:order-2">
           <button 
             onClick={() => setMode('edit')}
             className={`px-3 md:px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${mode === 'edit' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             <Wand2 size={16} />
             <span>Edit Image</span>
           </button>
           <button 
             onClick={() => setMode('create')}
             className={`px-3 md:px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${mode === 'create' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             <Type size={16} />
             <span>Text to Image</span>
           </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-center md:justify-end order-2 md:order-3 flex-wrap">
          <Button
             variant="ghost"
             onClick={() => setIsWebPromptsOpen(true)}
             icon={<Globe size={18} className="text-blue-500" />}
             className="text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-100"
             title="Mirza Prompts Website"
          >
            Web Prompts
          </Button>

          <Button
             variant="ghost"
             onClick={() => setIsPromptHubOpen(true)}
             icon={<Library size={18} className="text-purple-600" />}
             className="text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-100"
          >
            Prompt Hub
          </Button>
          
          {mode === 'edit' && (
            <>
              <Button 
                variant="secondary" 
                onClick={() => setIsCameraOpen(true)}
                icon={<Camera size={16} />}
                className="hidden sm:inline-flex"
                title="Use Camera"
              >
                Camera
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => fileInputRef.current?.click()}
                icon={<Upload size={16} />}
                className="hidden sm:inline-flex"
              >
                Upload
              </Button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept="image/png, image/jpeg, image/webp"
              />
            </>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex min-h-0 relative">
        
        {/* Left Sidebar - History (Desktop) */}
        {assets.length > 0 && (
          <div 
            className={`
              flex-none border-r border-slate-200 bg-white flex flex-col min-h-0 hidden md:flex 
              transition-all duration-300 ease-in-out overflow-hidden
              ${isSidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full border-none'}
            `}
          >
            <div className="p-4 border-b border-slate-100 font-semibold text-slate-700 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <History size={18} />
                <span className="whitespace-nowrap">History</span>
              </div>
              <div className="flex items-center gap-1">
                 <button 
                   onClick={handleClearHistory}
                   className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                   title="Clear All History"
                 >
                   <Trash2 size={16} />
                 </button>
                 <button 
                   onClick={() => setIsSidebarOpen(false)}
                   className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                   title="Collapse Sidebar"
                 >
                   <PanelLeftClose size={16} />
                 </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto w-72">
              {assets.map((asset, index) => {
                 const isSelected = currentAssetId === asset.id;
                 const isOriginal = index === 0;
                 return (
                  <div
                    key={asset.id}
                    onClick={() => handleSelectHistory(asset.id)}
                    className={`group relative w-full flex items-start gap-3 p-4 text-sm transition-all border-b border-slate-50 last:border-0 cursor-pointer ${
                        isSelected 
                        ? 'bg-purple-50/60 hover:bg-purple-50' 
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className={`mt-0.5 flex-shrink-0 ${isSelected ? 'text-purple-600' : 'text-slate-400'}`}>
                         {isOriginal ? <ImageIcon size={16} /> : <Sparkles size={16} />}
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                        <div className={`font-medium truncate mb-1 ${isSelected ? 'text-purple-900' : 'text-slate-700'}`}>
                            {isOriginal ? 'Original Image' : (asset.prompt || 'Untitled Edit')}
                        </div>
                        <div className="text-xs text-slate-400">
                            {new Date(asset.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                    </div>

                    <button
                      onClick={(e) => handleDeleteAsset(e, asset.id)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-300 hover:text-red-500 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10"
                      title="Delete Item"
                    >
                      <X size={14} />
                    </button>
                  </div>
                 );
              })}
            </div>
          </div>
        )}

        {/* Center - Canvas */}
        <div className="flex-1 flex flex-col relative min-w-0">
          
          {/* Sidebar Toggle Button (Floating) */}
          {assets.length > 0 && !isSidebarOpen && (
             <button 
               onClick={() => setIsSidebarOpen(true)}
               className="absolute left-4 top-4 z-30 p-2 bg-white/80 backdrop-blur-md border border-slate-200/50 shadow-sm rounded-lg text-slate-600 hover:text-slate-900 transition-colors hidden md:block"
               title="Expand History"
             >
               <PanelLeftOpen size={20} />
             </button>
          )}

          {/* Mobile Prompt Hub Button (Floating if needed, or in header) */}
          <div className="absolute right-4 top-4 z-30 sm:hidden flex flex-col gap-2">
             <button 
                onClick={() => setIsWebPromptsOpen(true)}
                className="p-2 bg-blue-50/90 backdrop-blur-md border border-blue-200 shadow-sm rounded-lg text-blue-600"
             >
               <Globe size={20} />
             </button>
             <button 
                onClick={() => setIsPromptHubOpen(true)}
                className="p-2 bg-purple-50/90 backdrop-blur-md border border-purple-200 shadow-sm rounded-lg text-purple-600"
             >
               <Library size={20} />
             </button>
             {mode === 'edit' && (
                <button 
                  onClick={() => setIsCameraOpen(true)}
                  className="p-2 bg-white/90 backdrop-blur-md border border-slate-200 shadow-sm rounded-lg text-slate-600"
                >
                  <Camera size={20} />
                </button>
             )}
          </div>

          <ImageCanvas 
            currentImage={currentAsset?.url || null}
            originalImage={originalAsset?.url || null}
            isGenerating={appState === AppState.GENERATING}
            onDownload={handleDownload}
            onImageUpdate={handleImageUpdate}
            onShare={handleShareToHub}
            mode={mode}
            onCameraOpen={() => setIsCameraOpen(true)}
            onUploadOpen={() => fileInputRef.current?.click()}
          />

          {/* Error Message */}
          {error && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 max-w-md w-full px-4 z-50 animate-in slide-in-from-top-4 fade-in duration-200">
               <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 text-sm">{error}</div>
                  <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">×</button>
               </div>
            </div>
          )}

          {/* Bottom Bar - Prompt Input */}
          <div className="flex-none p-4 md:p-6 bg-white border-t border-slate-200 z-20">
            <div className="max-w-4xl mx-auto w-full">
              
              {/* Prompt Style Bar for Create Mode */}
              {mode === 'create' && (
                <div className="flex gap-2 overflow-x-auto pb-3 mb-2">
                   <span className="inline-flex items-center px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider select-none">
                     Styles:
                   </span>
                   {STYLE_PRESETS.map(style => (
                     <button
                       key={style}
                       onClick={() => handleAddStyle(style)}
                       className="flex-none px-3 py-1.5 bg-slate-50 hover:bg-purple-50 text-slate-600 hover:text-purple-600 text-xs font-medium rounded-full border border-slate-200 hover:border-purple-200 transition-colors"
                     >
                       {style}
                     </button>
                   ))}
                </div>
              )}

              <div className="flex gap-2 items-center">
                 {currentAssetId !== originalAssetId && mode === 'edit' && (
                   <button 
                    onClick={handleReset}
                    className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Reset to Original"
                   >
                     <RotateCcw size={20} />
                   </button>
                 )}
                
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                    disabled={(mode === 'edit' && !currentAsset) || appState === AppState.GENERATING || isEnhancing}
                    placeholder={
                        mode === 'create' 
                        ? "Describe an image to generate (e.g., 'A futuristic city at night')..." 
                        : !currentAsset 
                            ? "Select a prompt from Hub or upload an image..." 
                            : "Describe your edit (e.g., 'Add a retro filter')..."
                    }
                    className="w-full pl-4 pr-24 py-3 rounded-xl border border-slate-300 focus:border-purple-400 focus:ring-4 focus:ring-purple-50 focus:outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      onClick={handlePastePrompt}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                      title="Paste from Clipboard"
                      disabled={isEnhancing}
                    >
                      <ClipboardPaste size={16} />
                    </button>
                    <button
                      onClick={handleEnhancePrompt}
                      disabled={isEnhancing || !prompt.trim()}
                      className={`p-1.5 rounded-md transition-colors ${isEnhancing ? 'text-purple-500 animate-pulse' : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50'}`}
                      title="Enhance Prompt with AI"
                    >
                      <Sparkles size={18} className={isEnhancing ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>

                <Button 
                  onClick={handleGenerate}
                  disabled={(!currentAsset && mode === 'edit') || !prompt.trim()}
                  isLoading={appState === AppState.GENERATING}
                  className="py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-shadow bg-gradient-to-r from-purple-500 to-amber-500 text-white font-semibold border-none"
                >
                  Generate
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <PromptHub 
        isOpen={isPromptHubOpen} 
        onClose={() => setIsPromptHubOpen(false)} 
        templates={promptTemplates}
        onSelect={handleSelectTemplate}
        onAdminAccess={handleAdminUnlock}
      />

      <ExternalWebsiteModal
        isOpen={isWebPromptsOpen}
        onClose={() => setIsWebPromptsOpen(false)}
      />
      
      <AdminModal 
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onAddTemplate={handleAddTemplate}
        initialData={shareData}
      />

      <CameraModal 
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      <footer className="flex-none py-1.5 bg-slate-50 border-t border-slate-200 text-center z-20">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Developed by MIRZA DEVELOPER
        </p>
      </footer>
    </div>
  );
};

export default App;