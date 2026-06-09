'use client';

import React, { useState } from 'react';
import { Bug, RefreshCw, Check, X, AlertTriangle, Database, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DebugPanel = ({ property, onRefresh }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [urlStatuses, setUrlStatuses] = useState({});

  if (!property) return null;

  const testUrl = async (url) => {
    if (!url) return;
    setUrlStatuses(prev => ({ ...prev, [url]: 'loading' }));
    try {
      const response = await fetch(url, { method: 'HEAD' });
      // HEAD request to youtube often fails with 404/403 due to bot protection, but we can check if it resolves at all
      setUrlStatuses(prev => ({ 
        ...prev, 
        [url]: response.ok || response.status === 405 ? 'success' : 'error' 
      }));
    } catch (error) {
      setUrlStatuses(prev => ({ ...prev, [url]: 'error' }));
    }
  };

  const checkAllUrls = () => {
    const images = Array.isArray(property.images) ? property.images : [];
    images.forEach(img => {
      const url = typeof img === 'string' ? img : img?.url;
      if (url) testUrl(url);
    });
    if (property.featured_image_url) testUrl(property.featured_image_url);
    
    // Check videos
    if (Array.isArray(property.videos)) {
      property.videos.forEach(v => {
        if(v.url) testUrl(v.url);
      });
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-none">
      <div className="pointer-events-auto">
        <Button 
          onClick={() => setIsOpen(!isOpen)} 
          className="bg-red-600 hover:bg-red-700 text-white rounded-full p-3 shadow-lg mb-2"
        >
          <Bug size={24} />
        </Button>
      </div>

      {isOpen && (
        <div className="bg-black/90 text-xs font-mono text-green-400 p-4 rounded-lg shadow-2xl border border-green-500/30 w-[500px] max-h-[80vh] overflow-y-auto pointer-events-auto backdrop-blur-md">
          <div className="flex justify-between items-center mb-4 border-b border-green-500/30 pb-2">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Database size={16} /> Property Debugger
            </h3>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-6 text-xs border-green-500 text-green-500 hover:bg-green-500/20" onClick={checkAllUrls}>
                Test All URLs
              </Button>
              <Button size="sm" variant="outline" className="h-6 text-xs border-green-500 text-green-500 hover:bg-green-500/20" onClick={onRefresh}>
                <RefreshCw size={12} className="mr-1" /> Refresh
              </Button>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-400 hover:text-red-300" onClick={() => setIsOpen(false)}>
                <X size={16} />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {/* ID & Basic Info */}
            <div className="bg-black/50 p-2 rounded border border-green-900">
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <span className="text-gray-400">ID:</span>
                <span className="break-all">{property.id}</span>
                <span className="text-gray-400">Name:</span>
                <span className="text-white">{property.name}</span>
              </div>
            </div>

            {/* Videos Section */}
            <div className="bg-black/50 p-2 rounded border border-green-900">
              <div className="mb-2 text-gray-400 font-bold flex items-center gap-2">
                <Video size={14} /> Videos ({Array.isArray(property.videos) ? property.videos.length : 0})
              </div>
              
              {(!property.videos || property.videos.length === 0) && (
                 <div className="text-yellow-500 italic">No video data found</div>
              )}

              {Array.isArray(property.videos) && property.videos.map((vid, i) => (
                <div key={i} className="mb-2 p-2 bg-gray-900 rounded border border-gray-800">
                  <div className="flex justify-between text-gray-500 mb-1">
                    <span>Index {i}</span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] gap-1 text-[10px]">
                    <span className="text-gray-500">Title:</span>
                    <span className="text-white">{vid.title || 'N/A'}</span>
                    
                    <span className="text-gray-500">Type:</span>
                    <span className="text-yellow-400">
                      {vid.youtube_id ? 'YouTube ID' : (vid.url ? 'URL' : 'Unknown')}
                    </span>
                    
                    <span className="text-gray-500">Value:</span>
                    <span className="break-all text-blue-300">
                      {vid.youtube_id || vid.url || 'N/A'}
                    </span>
                  </div>
                  
                  {(vid.url) && (
                    <div className="mt-1 flex items-center gap-2">
                      <a href={vid.url} target="_blank" rel="noreferrer" className="underline text-gray-400">Open</a>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Images Array */}
            <div className="space-y-2">
              <div className="text-gray-400 font-bold border-b border-gray-800 pb-1">Images Array Content:</div>
              {(!property.images || (Array.isArray(property.images) && property.images.length === 0)) && (
                <div className="text-red-400 italic">No images found in array</div>
              )}
              
              {Array.isArray(property.images) && property.images.map((img, idx) => {
                const url = typeof img === 'string' ? img : img?.url;
                return (
                  <div key={idx} className="bg-black/50 p-2 rounded border border-gray-800 text-[10px]">
                    <div className="break-all text-blue-300 mb-1">
                      {url || "NO URL FOUND"}
                    </div>
                  </div>
                );
              })}
            </div>
            
             {/* Full JSON Dump */}
            <details>
              <summary className="cursor-pointer text-gray-400 hover:text-white mt-4">Raw JSON Dump</summary>
              <pre className="mt-2 p-2 bg-gray-900 rounded overflow-x-auto text-[10px] text-gray-300">
                {JSON.stringify(property, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugPanel;