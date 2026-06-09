'use client';

import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from '@/lib/routerAdapter';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { getProperty } from '@/data/propertyManager';
import PriceDisplay from '@/components/PriceDisplay';

import PropertyFeaturesSection from '@/components/finca/PropertyFeaturesSection';
import PropertyGallerySection from '@/components/finca/PropertyGallerySection';
import VideoGallerySection from '@/components/finca/VideoGallerySection';
import CallToActionSection from '@/components/finca/CallToActionSection';
import VisitsCounter from '@/components/VisitsCounter';

const FincaAerialViewPage = () => {
  const { t } = useLanguage();
  const [fincaProperty, setFincaProperty] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);

  useEffect(() => {
    // The fixed ID for the finca property in propertyManager
    const FINCA_ID = 1705425678;
    const property = getProperty(FINCA_ID);
    setFincaProperty(property);

    if (property && property.images) {
      // Sort images to show featured first for the hero background or gallery
      const sortedImages = [...property.images]
        .sort((a, b) => (b.featured === true) - (a.featured === true))
        .map(img => img.url);
      setGalleryImages(sortedImages);
    }
  }, []);

  const heroImage = galleryImages.length > 0 ? galleryImages[0] : 'https://images.unsplash.com/photo-1694666655068-322be960e718';

  return (
    <>
      <Helmet>
        <title>{t.fincaPage.title} - WayLuz Inversions SAS</title>
        <meta name="description" content={t.fincaPage.description} />
      </Helmet>

      <div className="min-h-screen bg-[#0f0f0f] text-white pt-20">
        {/* Back Navigation */}
        <div className="container mx-auto px-4 py-6">
          <Link to="/properties">
            <Button variant="ghost" className="text-[#d4af37] hover:text-[#c9a961] hover:bg-[#d4af37]/10 pl-0">
              <ArrowLeft size={20} className="mr-2" />
              {t.fincaPage.backLink}
            </Button>
          </Link>
        </div>

        {/* Hero Section */}
        <section className="relative h-[80vh] overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src={heroImage} 
              alt="Spectacular FINCA Estate" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0f0f0f]/30 via-[#0f0f0f]/10 to-[#0f0f0f]" />
            <div className="absolute inset-0 bg-black/20" /> {/* Extra overlay for text readability */}
          </div>
          
          <div className="relative h-full container mx-auto px-4 flex flex-col justify-end pb-20">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 text-[#d4af37] mb-4">
                    <MapPin size={24} />
                    <span className="text-xl font-medium">{t.fincaPage.location}</span>
                  </div>
                  <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white drop-shadow-lg">
                    {t.fincaPage.heroTitle}
                  </h1>
                  <p className="text-xl md:text-2xl text-gray-200 max-w-3xl drop-shadow-md leading-relaxed mb-6">
                    {t.fincaPage.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-4">
                     <a href="tel:+573209937784">
                      <Button className="bg-[#d4af37] hover:bg-[#c9a961] text-[#0f0f0f] font-semibold h-auto py-3 px-6">
                        <Phone className="mr-2" size={20} />
                        {t.contact.callNow}
                      </Button>
                    </a>
                    <a href="mailto:info@wayluz.com">
                      <Button variant="outline" className="border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0f0f0f] h-auto py-3 px-6 bg-black/50 backdrop-blur-sm">
                        <Mail className="mr-2" size={20} />
                        {t.contact.emailUs}
                      </Button>
                    </a>
                  </div>

                </div>
                {fincaProperty && (
                   <div className="bg-black/40 backdrop-blur-md p-6 rounded-xl border border-[#d4af37]/30">
                      <PriceDisplay priceCOP={fincaProperty.priceCOP} priceUSD={fincaProperty.priceUSD} size="large" />
                   </div>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Feature Sections */}
        <PropertyFeaturesSection />
        {/* Pass galleryImages to the section if it supports props, otherwise it likely relies on internal logic or context, but updating the hero above ensures the main image is correct */}
        <PropertyGallerySection images={galleryImages} />
        <VideoGallerySection />
        <CallToActionSection />
      </div>

      <VisitsCounter increment={false} />
    </>
  );
};

export default FincaAerialViewPage;