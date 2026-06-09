'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, FileImage as ImageIcon, AlertCircle } from 'lucide-react';

const PropertyGallery = ({ images, title }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [processedImages, setProcessedImages] = useState([]);
  const [debugInfo, setDebugInfo] = useState([]);

  // Task 3: Comprehensive logging and defensive programming
  useEffect(() => {
    console.group(`🖼️ PropertyGallery: Processing Images for "${title}"`);
    console.log('Raw images prop type:', typeof images);
    console.log('Raw images prop value:', images);

    const logs = [];
    let normalized = [];

    if (!images) {
      console.warn('Images prop is null or undefined.');
      logs.push('Images prop is missing');
    } else if (typeof images === 'string') {
      console.log('Images prop is a single string. Wrapping in array.');
      normalized = [{ url: images, type: 'derived-from-string' }];
      logs.push('Converted single string to array');
    } else if (Array.isArray(images)) {
      console.log(`Images prop is array of length ${images.length}`);
      
      normalized = images.map((img, index) => {
        if (!img) return null;
        
        // Handle String
        if (typeof img === 'string') {
          console.log(`Image [${index}] is String: ${img.substring(0, 30)}...`);
          return { url: img, type: 'string', original: img };
        }
        
        // Handle Object
        if (typeof img === 'object') {
          if (img.url) {
            console.log(`Image [${index}] is Object with .url`);
            return { ...img, type: 'object' };
          } 
          // Attempt to find any property that looks like a URL if 'url' is missing
          const values = Object.values(img);
          const foundUrl = values.find(v => typeof v === 'string' && v.startsWith('http'));
          
          if (foundUrl) {
            console.warn(`Image [${index}] missing .url, found likely candidate:`, foundUrl);
            return { url: foundUrl, type: 'recovered-object' };
          }
          
          console.error(`Image [${index}] is Object but has no recognizable URL`, img);
          return null;
        }

        return null;
      }).filter(Boolean);
      
    } else {
      console.error('Images prop is unknown type:', typeof images);
      logs.push(`Unknown type: ${typeof images}`);
    }

    console.log('Final Normalized Images:', normalized);
    console.groupEnd();

    setProcessedImages(normalized);
    setDebugInfo(logs);
  }, [images, title]);

  if (processedImages.length === 0) {
    return (
      <section className="relative h-[50vh] bg-[#0f0f0f] flex items-center justify-center border-b border-[#d4af37]/20">
        <div className="text-center text-gray-500">
          <ImageIcon size={64} className="mx-auto mb-4 opacity-50" />
          <p>No images available</p>
          <div className="mt-4 text-xs font-mono text-gray-700 bg-black/20 p-2 rounded max-w-md mx-auto">
            Debug: {debugInfo.join(', ') || 'Images array empty'}
          </div>
        </div>
      </section>
    );
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % processedImages.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + processedImages.length) % processedImages.length);
  };

  const currentImage = processedImages[currentIndex];

  return (
    <>
      <section className="relative h-[70vh] bg-[#0f0f0f]">
        <div className="container mx-auto px-4 h-full">
          <div className="relative h-full rounded-xl overflow-hidden border border-[#d4af37]/20 bg-[#1a1a1a]">
            {/* Main Image */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="relative w-full h-full cursor-pointer bg-black flex items-center justify-center"
                onClick={() => setIsFullscreen(true)}
              >
                <img
                  src={currentImage.url}
                  alt={`${title} - View ${currentIndex + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error(`Failed to load image: ${e.target.src}`);
                    e.target.src = 'https://placehold.co/1200x800/1a1a1a/FFF?text=Image+Load+Failed';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f]/60 to-transparent pointer-events-none" />
                
                {/* Image Count/Title */}
                <div className="absolute bottom-8 left-8 bg-[#0f0f0f]/80 backdrop-blur-sm px-6 py-3 rounded-lg border border-[#d4af37]/30">
                  <p className="text-white font-medium">
                    {title} • {currentIndex + 1} / {processedImages.length}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            {processedImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-[#0f0f0f]/80 backdrop-blur-sm hover:bg-[#d4af37] text-white p-3 rounded-full transition-all hover:scale-110 border border-[#d4af37]/30 z-10"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-[#0f0f0f]/80 backdrop-blur-sm hover:bg-[#d4af37] text-white p-3 rounded-full transition-all hover:scale-110 border border-[#d4af37]/30 z-10"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Thumbnails */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 overflow-x-auto max-w-full px-4 pb-2 scrollbar-hide z-10">
              {processedImages.map((image, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all bg-black ${
                    currentIndex === index
                      ? 'border-[#d4af37] scale-110'
                      : 'border-white/30 hover:border-white/60'
                  }`}
                >
                  <img 
                    src={image.url} 
                    alt={`Thumbnail ${index + 1}`} 
                    className="w-full h-full object-cover" 
                    onError={(e) => e.target.style.opacity = 0.3}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center backdrop-blur-xl"
            onClick={() => setIsFullscreen(false)}
          >
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-all z-10"
            >
              <X size={24} />
            </button>

            {processedImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-[#d4af37] text-white p-4 rounded-full transition-all hover:scale-110 z-10"
                >
                  <ChevronLeft size={32} />
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/10 hover:bg-[#d4af37] text-white p-4 rounded-full transition-all hover:scale-110 z-10"
                >
                  <ChevronRight size={32} />
                </button>
              </>
            )}

            <motion.img
              key={currentIndex}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={currentImage.url}
              alt={`${title} - Fullscreen ${currentIndex + 1}`}
              className="max-w-[95%] max-h-[90vh] object-contain rounded-lg shadow-2xl shadow-black"
              onClick={(e) => e.stopPropagation()}
            />

            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-[#0f0f0f]/80 backdrop-blur-sm px-6 py-3 rounded-lg border border-[#d4af37]/30">
              <p className="text-white font-medium">
                 {currentIndex + 1} / {processedImages.length}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PropertyGallery;