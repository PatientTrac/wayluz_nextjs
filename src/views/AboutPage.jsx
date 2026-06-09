'use client';

import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from '@/lib/routerAdapter';
import { ArrowRight, Quote } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import GeographicMapSection from '@/components/GeographicMapSection';
import VisitsCounter from '@/components/VisitsCounter';

const AboutPage = () => {
  const { t } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{t.about.title} - WayLuz Inversions SAS</title>
        <meta name="description" content="Strategic real estate investment partners in Norte de Santander, Colombia. Bridging international capital with premium local opportunities." />
      </Helmet>

      {/* Hero Section */}
      <section className="relative h-[50vh] flex items-center justify-center overflow-hidden mt-20">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1579541592398-d892d24594c4?q=80&w=2070&auto=format&fit=crop"
            alt="Abstract Architecture"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f0f0f] via-[#0f0f0f]/80 to-[#0f0f0f]" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
              {t.about.title} <span className="text-[#d4af37]">WayLuz Inversions SAS</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto font-light">
              {t.about.subtitle}
            </p>
            <div className="w-24 h-1 bg-[#d4af37] mx-auto mt-8 rounded-full" />
          </motion.div>
        </div>
      </section>

      {/* Mission Statement Section */}
      <section className="py-24 bg-[#0f0f0f] relative">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#d4af37]/5 to-transparent pointer-events-none" />
        
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-5xl mx-auto"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-[#d4af37]/10 p-4 rounded-full mb-6">
                <Quote size={32} className="text-[#d4af37]" />
              </div>
              
              <h2 className="text-3xl md:text-5xl font-bold mb-10 text-white">
                {t.about.missionTitle}
              </h2>
              
              <div className="relative">
                <div className="absolute -left-4 -top-4 w-12 h-12 border-t-2 border-l-2 border-[#d4af37] opacity-50" />
                <div className="absolute -right-4 -bottom-4 w-12 h-12 border-b-2 border-r-2 border-[#d4af37] opacity-50" />
                
                <p className="text-gray-300 text-lg md:text-xl leading-relaxed font-light tracking-wide px-4 md:px-12">
                  {t.about.missionStatement}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* GeographicMap Section */}
      <GeographicMapSection />

      {/* Call to Action Section */}
      <section className="py-24 bg-gradient-to-r from-[#d4af37]/10 to-[#c9a961]/10 border-t border-[#d4af37]/20 pb-32 md:pb-24">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              {t.about.cta.title}
            </h2>
            <p className="text-gray-300 text-xl mb-10 max-w-2xl mx-auto">
              {t.about.cta.desc}
            </p>
            
            <Link to="/contact">
              <Button 
                size="lg"
                className="bg-[#d4af37] hover:bg-[#c9a961] text-black font-bold text-lg px-10 py-6 h-auto rounded-full transition-all hover:scale-105 shadow-[0_0_20px_rgba(212,175,55,0.3)]"
              >
                {t.about.cta.button}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <VisitsCounter increment={false} />
    </>
  );
};

export default AboutPage;