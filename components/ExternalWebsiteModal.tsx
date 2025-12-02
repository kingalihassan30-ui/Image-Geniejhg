import React from 'react';
import { X, ExternalLink, Globe } from 'lucide-react';

interface ExternalWebsiteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ExternalWebsiteModal: React.FC<ExternalWebsiteModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 md:p-8">
      <div className="bg-white w-full h-full max-w-7xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Globe size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Mirza Prompts Collection</h2>
              <p className="text-xs text-slate-500 hidden sm:block">Browse website, copy a prompt, and paste it into the tool.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href="https://mirza-prompts-image-9squ.bolt.host/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <span>Open in New Tab</span>
              <ExternalLink size={14} />
            </a>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Iframe Content */}
        <div className="flex-1 bg-slate-50 relative">
          <iframe 
            src="https://mirza-prompts-image-9squ.bolt.host/" 
            className="absolute inset-0 w-full h-full border-0"
            title="External Prompts Website"
            allow="clipboard-write" // Important for copying text from the iframe
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
          />
        </div>
      </div>
    </div>
  );
};

export default ExternalWebsiteModal;