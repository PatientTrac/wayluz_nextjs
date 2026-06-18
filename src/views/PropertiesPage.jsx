'use client';

import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import PropertyCard from '@/components/PropertyCard';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import VisitsCounter from '@/components/VisitsCounter';

const PropertiesPage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useLanguage();

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map DB columns to component expected format (snake_case to camelCase)
      const mappedProperties = (data || []).map(p => ({
        ...p,
        priceCOP: p.price_cop,
        priceUSD: p.price_usd,
        yearBuilt: p.year_built,
        images: Array.isArray(p.images) ? p.images : [],
        videos: Array.isArray(p.videos) ? p.videos : []
      }));

      setProperties(mappedProperties);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError(err.message || "Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  return (
    <>
      <Helmet>
        <title>{t.properties.title} {t.properties.titleAccent} - WayLuz Inversions SAS</title>
        <meta name="description" content="Browse our exclusive collection of luxury properties in Colombia." />
      </Helmet>

      <div className="min-h-screen pt-20 bg-[#0f0f0f]">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f]">
          <div className="container mx-auto px-4 relative">

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {t.properties.title} <span className="text-[#d4af37]">{t.properties.titleAccent}</span>
              </h1>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                {t.properties.subtitle}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Properties Grid */}
        <section className="py-8 pb-16">
          <div className="container mx-auto px-4">
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-[#d4af37] animate-spin mb-4" />
                <p className="text-gray-400">Loading exclusive properties...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Unable to Load Properties</h3>
                <p className="text-gray-400 max-w-md mb-6">{error}</p>
                <Button 
                  onClick={fetchProperties}
                  className="bg-[#d4af37] hover:bg-[#c9a961] text-black"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {properties.map((property, index) => (
                    <PropertyCard 
                      key={property.id} 
                      property={property} 
                      index={index}
                    />
                  ))}
                </div>

                {properties.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                  >
                    <p className="text-gray-400 text-lg">
                      {t.properties.noProperties}
                    </p>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      <VisitsCounter increment={false} />
    </>
  );
};

export default PropertiesPage;