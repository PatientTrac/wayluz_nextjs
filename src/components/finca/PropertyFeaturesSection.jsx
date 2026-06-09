'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Bed, Bath, Maximize, Palmtree, Warehouse, Coffee, Mountain, Home } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const PropertyFeaturesSection = () => {
  const { t } = useLanguage();

  const features = [
    { icon: Bed, label: `7 ${t.fincaPage.specs.bedrooms}` },
    { icon: Bath, label: `6 ${t.fincaPage.specs.bathrooms}` },
    { icon: Maximize, label: `800m² ${t.fincaPage.specs.area}` },
    { icon: Coffee, label: t.fincaPage.amenitiesList.coffee },
    { icon: Mountain, label: t.fincaPage.amenitiesList.mountain },
    { icon: Home, label: t.fincaPage.amenitiesList.guest },
    { icon: Warehouse, label: t.fincaPage.amenitiesList.stable },
    { icon: Palmtree, label: t.fincaPage.amenitiesList.pool }
  ];

  return (
    <section className="py-16 bg-[#0f0f0f]">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#d4af37]">
            {t.fincaPage.featuresTitle}
          </h2>
          <div className="w-24 h-1 bg-[#d4af37] mx-auto rounded-full"></div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5, borderColor: '#d4af37' }}
              className="bg-[#1a1a1a] border border-[#d4af37]/20 rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3 shadow-lg hover:shadow-[#d4af37]/10 transition-all duration-300"
            >
              <feature.icon size={32} className="text-[#d4af37]" />
              <span className="text-gray-300 font-medium">{feature.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PropertyFeaturesSection;