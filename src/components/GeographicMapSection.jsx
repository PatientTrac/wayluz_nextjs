'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Globe, Maximize } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const GeographicMapSection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-20 bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-10 left-10 w-96 h-96 bg-[#d4af37] rounded-full blur-[128px]" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-900 rounded-full blur-[128px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            {t.about.map.title}
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {t.about.map.subtitle}
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-12 items-center justify-center">
          
          {/* Map Visualization */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="w-full lg:w-2/3 relative aspect-[16/9] lg:aspect-[2/1] bg-[#0f0f0f] border-2 border-[#d4af37]/20 rounded-2xl overflow-hidden shadow-2xl group"
          >
            {/* Abstract SVG Map Representation */}
            <svg 
              viewBox="0 0 800 400" 
              className="w-full h-full filter drop-shadow-[0_0_15px_rgba(212,175,55,0.1)]"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="landGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1a1a1a" stopOpacity="1" />
                  <stop offset="100%" stopColor="#2a2a2a" stopOpacity="1" />
                </linearGradient>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(212,175,55,0.05)" strokeWidth="1"/>
                </pattern>
              </defs>

              {/* Background Grid */}
              <rect width="800" height="400" fill="url(#grid)" />

              {/* Abstract Border Line (Venezuela Border) */}
              <path 
                d="M 600,0 C 620,100 580,200 650,400" 
                fill="none" 
                stroke="#d4af37" 
                strokeWidth="2" 
                strokeDasharray="10,5"
                className="opacity-50"
              />

              {/* Text: Venezuela */}
              <text x="660" y="200" fill="rgba(255,255,255,0.3)" fontSize="14" letterSpacing="2" className="uppercase font-light tracking-widest">
                Venezuela
              </text>

              {/* Text: Colombia */}
              <text x="300" y="200" fill="rgba(212,175,55,0.1)" fontSize="48" fontWeight="bold" className="uppercase font-bold">
                {t.about.map.colombia}
              </text>

              {/* Region Highlight - Norte de Santander */}
              <path 
                d="M 450,150 Q 500,100 550,150 T 600,250 T 500,350 T 400,250 T 450,150" 
                fill="rgba(212,175,55,0.05)" 
                stroke="#d4af37" 
                strokeWidth="1"
                className="animate-pulse"
              />

              {/* Location: Cúcuta */}
              <g className="cursor-pointer group/pin">
                <circle cx="580" cy="220" r="6" fill="#1a1a1a" stroke="#d4af37" strokeWidth="2" />
                <circle cx="580" cy="220" r="12" fill="none" stroke="#d4af37" strokeWidth="1" opacity="0.5" className="animate-ping" />
                <text x="560" y="205" fill="#ffffff" fontSize="12" textAnchor="end" className="font-semibold drop-shadow-md">
                  {t.about.map.cucuta}
                </text>
              </g>

              {/* Location: Los Patios (HQ) */}
              <g className="cursor-pointer group/pin">
                 {/* Connection line */}
                <line x1="580" y1="220" x2="570" y2="240" stroke="#d4af37" strokeWidth="1" opacity="0.5" />
                
                <circle cx="570" cy="240" r="8" fill="#d4af37" />
                <circle cx="570" cy="240" r="4" fill="#000" />
                <text x="550" y="255" fill="#d4af37" fontSize="14" fontWeight="bold" textAnchor="end" className="drop-shadow-lg filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                  {t.about.map.losPatios}
                </text>
              </g>

              {/* Scale/Compass Decoration */}
              <g transform="translate(50, 320)">
                 <circle cx="30" cy="30" r="25" stroke="#d4af37" strokeWidth="1" fill="none" opacity="0.3" />
                 <path d="M 30,5 L 35,25 L 55,30 L 35,35 L 30,55 L 25,35 L 5,30 L 25,25 Z" fill="#d4af37" opacity="0.5" />
                 <text x="30" y="75" fill="#d4af37" fontSize="10" textAnchor="middle" opacity="0.7">N</text>
              </g>
            </svg>
            
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-[#d4af37]/30 px-3 py-1 rounded-full text-xs text-[#d4af37] flex items-center gap-2">
              <Globe size={12} />
              {t.about.map.region}
            </div>
          </motion.div>

          {/* Context Details */}
          <div className="w-full lg:w-1/3 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-[#1a1a1a] p-6 rounded-xl border-l-4 border-[#d4af37] shadow-lg"
            >
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="text-[#d4af37]" />
                <h3 className="text-xl font-bold text-white">{t.about.map.losPatios}</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Strategic headquarters located just minutes from the Cúcuta metropolitan center, offering a tranquil yet connected environment for operations and client meetings.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-[#1a1a1a] p-6 rounded-xl border-l-4 border-blue-800 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-2">
                <Maximize className="text-blue-500" />
                <h3 className="text-xl font-bold text-white">{t.about.map.venezuela}</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Proximity to the international border creates unique cross-border trade and investment dynamics, fueling demand for logistics, commercial, and residential real estate.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GeographicMapSection;