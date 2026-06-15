'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';

// Accepts `videos` as an array of either:
//   - strings (treated as embed URLs -> <iframe>, e.g. YouTube), or
//   - objects { url, poster, type } where type 'file' renders a native <video>.
const VideoGallerySection = ({ videos }) => {
  const { t } = useLanguage();

  const list = Array.isArray(videos) ? videos.filter(Boolean) : [];
  const hasVideos = list.length > 0;

  if (!hasVideos) {
    return (
      <section className="py-12 bg-[#0f0f0f] border-t border-[#d4af37]/10">
        <div className="container mx-auto px-4 text-center">
          <div className="text-gray-500 mb-2">
            {t.propertyDetail?.noVideos || 'No hay videos para esta propiedad.'}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-[#0f0f0f] border-t border-[#d4af37]/10">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#d4af37]">
            {t.propertyDetail?.tour || 'Video Tour'}
          </h2>
          <div className="w-24 h-1 bg-[#d4af37] mx-auto rounded-full"></div>
        </motion.div>

        <div className="max-w-4xl mx-auto space-y-8">
          {list.map((video, index) => {
            const isFile = typeof video === 'object' && video?.type === 'file';
            const src = typeof video === 'string' ? video : video?.url;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative aspect-video rounded-xl overflow-hidden border border-[#d4af37]/30 shadow-lg bg-black"
              >
                {isFile ? (
                  <video
                    className="w-full h-full object-contain bg-black"
                    src={src}
                    poster={video.poster}
                    controls
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <iframe
                    className="w-full h-full"
                    src={src}
                    title={`Property Video ${index + 1}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default VideoGallerySection;
