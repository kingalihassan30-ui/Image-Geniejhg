
import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, Sparkles, Flower, Search } from 'lucide-react';
import { PromptTemplate } from '../types';
import Button from './Button';

interface PromptHubProps {
  isOpen: boolean;
  onClose: () => void;
  templates: PromptTemplate[];
  onSelect: (template: PromptTemplate) => void;
  onAdminAccess: () => void;
}

const PromptHub: React.FC<PromptHubProps> = ({ isOpen, onClose, templates, onSelect, onAdminAccess }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const gridRef = useRef<HTMLDivElement>(null);
  
  // Track previous length to detect adds
  const prevTemplatesLength = useRef(templates.length);

  // Auto-reset search and scroll to top when a new template is added
  useEffect(() => {
    if (templates.length > prevTemplatesLength.current) {
      setSearchQuery(''); // Clear search so the new item (at top) is visible
      if (gridRef.current) {
        gridRef.current.scrollTop = 0;
      }
    }
    prevTemplatesLength.current = templates.length;
  }, [templates]);

  if (!isOpen) return null;

  const filteredTemplates = templates.filter(template => 
    template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex flex-col border-b border-slate-100 bg-white z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <div 
              className="flex items-center gap-2 select-none"
              title="Prompt Hub"
            >
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Prompt Hub</h2>
                <p className="text-xs text-slate-500">Choose a style to apply to your image</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
               <button
                 onClick={onAdminAccess}
                 className="p-2 text-slate-300 hover:text-pink-500 hover:bg-pink-50 rounded-full transition-colors"
                 title="Admin Access"
               >
                 <Flower size={20} />
               </button>
               <button 
                 onClick={onClose}
                 className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
               >
                 <X size={20} />
               </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="px-6 pb-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search prompts by name or keyword..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-purple-300 focus:ring-4 focus:ring-purple-50 focus:outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Grid */}
        <div 
          ref={gridRef}
          className="flex-1 overflow-y-auto p-6 bg-slate-50/50 scroll-smooth"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-400">
                {templates.length === 0 ? (
                  <p>No prompts available yet.</p>
                ) : (
                  <p>No matches found for "{searchQuery}".</p>
                )}
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <div 
                  key={template.id}
                  className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-purple-200 transition-all flex flex-col h-full animate-in fade-in zoom-in-50 duration-300"
                >
                  <div className="relative aspect-video bg-slate-100 overflow-hidden">
                    <img 
                      src={template.demoImageUrl} 
                      alt={template.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <button 
                        onClick={() => onSelect(template)}
                        className="w-full py-2 bg-white text-slate-900 text-sm font-semibold rounded-lg shadow-sm hover:bg-purple-50 flex items-center justify-center gap-2"
                      >
                        Try this <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-semibold text-slate-800 mb-1">{template.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-3 mb-4 flex-1">"{template.prompt}"</p>
                    <div className="pt-3 border-t border-slate-50 md:hidden">
                       <Button 
                         variant="secondary" 
                         className="w-full justify-center"
                         onClick={() => onSelect(template)}
                       >
                         Try this
                       </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptHub;
