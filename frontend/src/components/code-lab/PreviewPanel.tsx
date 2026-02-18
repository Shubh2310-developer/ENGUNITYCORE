import React, { useState } from 'react';
import { Eye, RefreshCw, Smartphone, Monitor, Tablet, Loader2 } from 'lucide-react';

export const PreviewPanel = () => {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const getViewportStyle = () => {
    switch (viewport) {
      case 'mobile': return { width: '375px', height: '667px' };
      case 'tablet': return { width: '768px', height: '1024px' };
      default: return { width: '100%', height: '100%' };
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F1F5F9]">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-[#E2E8F0] bg-white">
        <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-lg">
          <button
            onClick={() => setViewport('desktop')}
            className={`p-1.5 rounded transition-all ${viewport === 'desktop' ? 'bg-white shadow-sm text-[#0F172A]' : 'text-[#64748B] hover:text-[#0F172A]'}`}
            title="Desktop"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewport('tablet')}
            className={`p-1.5 rounded transition-all ${viewport === 'tablet' ? 'bg-white shadow-sm text-[#0F172A]' : 'text-[#64748B] hover:text-[#0F172A]'}`}
            title="Tablet"
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewport('mobile')}
            className={`p-1.5 rounded transition-all ${viewport === 'mobile' ? 'bg-white shadow-sm text-[#0F172A]' : 'text-[#64748B] hover:text-[#0F172A]'}`}
            title="Mobile"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleRefresh}
          className={`p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg transition-all ${isLoading ? 'animate-spin' : ''}`}
          title="Refresh Preview"
        >
          {isLoading ? <Loader2 className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
        </button>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-hidden flex items-center justify-center p-4">
        <div
          className="bg-white shadow-lg border border-[#E2E8F0] transition-all duration-300 relative overflow-hidden"
          style={getViewportStyle()}
        >
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" />
                <span className="text-xs text-[#64748B]">Rendering...</span>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#94A3B8]">
              <Eye className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">Preview Ready</p>
              <p className="text-xs opacity-70 mt-1">Run code to see output here</p>

              {/* Mock Content to simulate a UI */}
              <div className="mt-8 w-3/4 opacity-10 space-y-3">
                <div className="h-4 bg-slate-400 rounded w-1/2"></div>
                <div className="h-20 bg-slate-300 rounded w-full"></div>
                <div className="h-4 bg-slate-400 rounded w-2/3"></div>
                <div className="flex gap-2">
                    <div className="h-8 bg-blue-400 rounded w-20"></div>
                    <div className="h-8 bg-slate-300 rounded w-20"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
