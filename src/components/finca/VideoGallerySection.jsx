'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';

const VideoGallerySection = ({ videos }) => {
  const { t } = useLanguage();

  // 1. Check if videos array exists and has length > 0
  const hasVideos = videos && Array.isArray(videos) && videos.length > 0;

  if (!hasVideos) {
    // 3. If false: render simple "No videos available" message
    return (
      <section className="py-12 bg-[#0f0f0f] border-t border-[#d4af37]/10">
        <div className="container mx-auto px-4 text-center">
          <div className="text-gray-500 mb-2">No videos available for this property.</div>
        </div>
      </section>
    );
  }

  // 2. If true: render iframe with src={videos[0]} directly
  // Note: We assume videos is an array of strings as per the prompt instructions
  const videoSrc = videos[0];

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
            {t.propertyDetail.tour || "Video Tour"}
          </h2>
          <div className="w-24 h-1 bg-[#d4af37] mx-auto rounded-full"></div>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative aspect-video rounded-xl overflow-hidden border border-[#d4af37]/30 shadow-lg bg-black"
          >
            <iframe
              className="w-full h-full"
              src={videoSrc}
              title="Property Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default VideoGallerySection;