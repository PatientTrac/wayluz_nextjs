'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from '@/lib/routerAdapter';
import { Bed, Bath, Maximize, MapPin, ArrowRight, FileImage as ImageIcon } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import PriceDisplay from '@/components/PriceDisplay';
import { createSlug } from '@/lib/slugUtils';

const PropertyCard = ({ property, index, customLink }) => {
  const { t } = useLanguage();

  // Priority: featured_image_url -> first image in array (object) -> first image in array (string)
  let displayImage = null;

  if (property.featured_image_url) {
    displayImage = property.featured_image_url;
  } else if (property.images && Array.isArray(property.images) && property.images.length > 0) {
    const firstImg = property.images[0];
    if (typeof firstImg === 'string') {
      displayImage = firstImg;
    } else if (typeof firstImg === 'object' && firstImg?.url) {
      displayImage = firstImg.url;
    }
  }

  // Generate slug-based link unless a custom one is provided
  const slug = createSlug(property.name || property.title);
  const linkDestination = customLink || `/properties/${slug}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -10 }}
      className="group"
    >
      <Link to={linkDestination}>
        <div className="bg-[#1a1a1a] rounded-xl overflow-hidden border-2 border-[#d4af37]/30 hover:border-[#d4af37] transition-all shadow-lg hover:shadow-2xl h-full flex flex-col">
          {/* Image */}
          <div className="relative h-64 overflow-hidden bg-[#0f0f0f]">
            {displayImage ? (
              <img
                src={displayImage}
                alt={property.name || property.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://placehold.co/600x400?text=Image+Load+Error';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a] text-gray-600">
                <div className="flex flex-col items-center">
                   <ImageIcon size={48} className="mb-2 opacity-50" />
                   <span className="text-xs">No Image</span>
                </div>
              </div>
            )}
            <div className="absolute top-4 left-4 bg-[#0f0f0f]/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
              {property.type}
            </div>
            {/* Price Overlay */}
             <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 pt-10">
               <PriceDisplay priceCOP={property.price_cop || property.priceCOP} priceUSD={property.price_usd || property.priceUSD} size="medium" />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 flex flex-col flex-grow">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xl font-bold text-white group-hover:text-[#d4af37] transition-colors line-clamp-2">
                {property.name || property.title}
              </h3>
            </div>

            <div className="flex items-center text-gray-400 mb-4">
              <MapPin size={16} className="mr-2 text-[#d4af37]" />
              <span className="text-sm">{property.location}</span>
            </div>

            {/* Features */}
            <div className="flex items-center gap-4 text-gray-400 text-sm mb-4 mt-auto">
              <div className="flex items-center gap-1">
                <Bed size={16} className="text-[#d4af37]" />
                <span>{property.bedrooms} {t.properties.beds}</span>
              </div>
              <div className="flex items-center gap-1">
                <Bath size={16} className="text-[#d4af37]" />
                <span>{property.bathrooms} {t.properties.baths}</span>
              </div>
              <div className="flex items-center gap-1">
                <Maximize size={16} className="text-[#d4af37]" />
                <span>{property.area || property.size} {t.properties.size}</span>
              </div>
            </div>

            {/* View Details */}
            <div className="flex items-center justify-between pt-4 border-t border-[#d4af37]/20">
              <span className="text-[#d4af37] font-medium group-hover:translate-x-2 transition-transform inline-flex items-center gap-2">
                {t.properties.details}
                <ArrowRight size={16} />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default PropertyCard;