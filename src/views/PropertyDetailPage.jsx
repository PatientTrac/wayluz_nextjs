'use client';

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link } from '@/lib/routerAdapter';
import { motion } from 'framer-motion';
import { Bed, Bath, Maximize, MapPin, Calendar, Home as HomeIcon, ArrowLeft, Phone, Mail, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import PropertyGallery from '@/components/PropertyGallery';
import PriceDisplay from '@/components/PriceDisplay';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/lib/customSupabaseClient';
import VideoGallerySection from '@/components/finca/VideoGallerySection';
import { createSlug } from '@/lib/slugUtils';
import VisitsCounter from '@/components/VisitsCounter';

const PropertyDetailPage = () => {
  const { slug } = useParams();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    if (slug) {
      fetchPropertyBySlug();
    }
  }, [slug]);

  const fetchPropertyBySlug = async () => {
    setLoading(true);
    setFetchError(null);
    
    try {
      console.log(`[PropertyDetailPage] Fetching property for slug: ${slug}...`);
      
      // Step 1: Fetch all properties (minimal fields) to find the one matching the slug
      // We do this because we don't have a 'slug' column in the database yet
      const { data: allProperties, error: listError } = await supabase
        .from('properties')
        .select('id, name');

      if (listError) {
        console.error('[PropertyDetailPage] Error fetching property list:', listError);
        throw listError;
      }

      // Find property where slug matches
      const matchedProperty = allProperties.find(p => createSlug(p.name) === slug);

      if (!matchedProperty) {
        throw new Error("Property not found.");
      }

      const id = matchedProperty.id;

      // Step 2: Fetch full details for the matched ID
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
         console.error('[PropertyDetailPage] Supabase Error:', error);
         throw error;
      }

      if (!data) {
        throw new Error("Property details not found.");
      }

      console.log('[PropertyDetailPage] Raw Data:', data);

      // Handle Image Logic: Merge featured_image_url with images array
      let galleryImages = [];
      
      // 1. Add featured image first if it exists
      if (data.featured_image_url) {
        galleryImages.push(data.featured_image_url);
      }
      
      // 2. Add rest of images
      if (Array.isArray(data.images)) {
        galleryImages = [...galleryImages, ...data.images];
      } else if (data.images) {
        // Handle case where images might be a single string or object (legacy data)
        galleryImages.push(data.images);
      }

      // 3. Deduplicate images based on URL string
      const uniqueImages = [...new Set(galleryImages.map(img => 
        typeof img === 'object' ? img?.url || JSON.stringify(img) : img
      ))].map(urlOrStr => {
         // Attempt to restore object if it was stringified for dedupe
         try {
            return urlOrStr.startsWith('{') ? JSON.parse(urlOrStr) : urlOrStr;
         } catch {
            return urlOrStr;
         }
      });


      // Standardize data with defensive defaults for all fields
      const standardizedProp = {
        id: data.id,
        name: data.name || 'Untitled Property',
        description: data.description || 'No description available.',
        location: data.location || 'Location Not Specified',
        priceCOP: data.price_cop || 0,
        priceUSD: data.price_usd || 0,
        bedrooms: data.bedrooms ?? 0, // Use nullish coalescing to allow 0
        bathrooms: data.bathrooms ?? 0,
        area: data.area ?? 0,
        yearBuilt: data.year_built || 'N/A',
        type: data.type || 'Property',
        amenities: data.amenities || [],
        images: uniqueImages.length > 0 ? uniqueImages : [],
        videos: Array.isArray(data.videos) ? data.videos : []
      };
      
      console.log('[PropertyDetailPage] Standardized Data:', standardizedProp);
      setProperty(standardizedProp);

    } catch (error) {
      console.error("PropertyDetailPage: Error loading property:", error);
      
      let msg = error.message;
      if (error.code === '22P02') msg = "Invalid Property format.";
      if (error.code === 'PGRST116') msg = "Property not found.";
      if (msg === "Property not found.") msg = "We couldn't find a property matching that address.";
      
      setFetchError(msg);
      
      toast({
        title: "Error Loading Property",
        description: msg,
        variant: "destructive"
      });
    } finally {
      // Small delay to prevent layout thrashing
      setTimeout(() => setLoading(false), 300);
    }
  };

  const handleScheduleTour = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Online scheduling is currently under development. Please contact us via phone or email.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 bg-[#0f0f0f] pb-20">
        <div className="container mx-auto px-4">
           {/* Skeleton Header */}
           <div className="mb-6">
             <Skeleton className="h-10 w-32 mb-4 bg-gray-800" />
           </div>
           
           {/* Skeleton Gallery */}
           <Skeleton className="w-full h-[60vh] rounded-xl mb-12 bg-gray-800" />
           
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
             <div className="lg:col-span-2 space-y-8">
               {/* Skeleton Title & Price */}
               <div className="space-y-4">
                 <Skeleton className="h-12 w-3/4 bg-gray-800" />
                 <Skeleton className="h-8 w-1/2 bg-gray-800" />
               </div>
               
               {/* Skeleton Stats */}
               <div className="grid grid-cols-4 gap-4">
                 <Skeleton className="h-24 w-full bg-gray-800" />
                 <Skeleton className="h-24 w-full bg-gray-800" />
                 <Skeleton className="h-24 w-full bg-gray-800" />
                 <Skeleton className="h-24 w-full bg-gray-800" />
               </div>
               
               {/* Skeleton Text */}
               <div className="space-y-4">
                 <Skeleton className="h-4 w-full bg-gray-800" />
                 <Skeleton className="h-4 w-full bg-gray-800" />
                 <Skeleton className="h-4 w-2/3 bg-gray-800" />
               </div>
             </div>
             
             {/* Skeleton Sidebar */}
             <div className="lg:col-span-1">
               <Skeleton className="h-96 w-full rounded-xl bg-gray-800" />
             </div>
           </div>
        </div>
      </div>
    );
  }

  if (fetchError || !property) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center bg-[#0f0f0f]">
        <div className="text-center text-white p-8 bg-[#1a1a1a] rounded-xl border border-red-900/50 max-w-lg mx-auto shadow-2xl">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-4 text-red-500">Property Unavailable</h1>
          <p className="text-gray-400 mb-8 text-lg">
            {fetchError || "The property you are looking for could not be found."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/properties">
              <Button className="bg-[#d4af37] hover:bg-[#c9a961] text-[#0f0f0f] w-full sm:w-auto">
                <ArrowLeft className="mr-2 h-4 w-4" /> Return to Properties
              </Button>
            </Link>
            <Button variant="outline" onClick={fetchPropertyBySlug} className="border-gray-700 text-gray-300 hover:text-white w-full sm:w-auto">
               <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{property.name} - WayLuz Inversions SAS</title>
        <meta name="description" content={property.description.substring(0, 160)} />
      </Helmet>

      <div className="min-h-screen pt-20 bg-[#0f0f0f]">
        {/* Back Button */}
        <div className="container mx-auto px-4 py-6">
          <Link to="/properties">
            <Button variant="ghost" className="text-[#d4af37] hover:text-[#c9a961] hover:bg-transparent p-0 flex items-center gap-2 group">
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-lg">{t.propertyDetail.back}</span>
            </Button>
          </Link>
        </div>

        {/* Image Gallery */}
        <PropertyGallery images={property.images} title={property.name} />

        {/* Property Details */}
        <section className="py-12 bg-gradient-to-b from-[#0f0f0f] to-[#1a1a1a]">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  {/* Header */}
                  <div className="mb-8 border-b border-[#d4af37]/10 pb-8">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className="bg-[#d4af37]/20 text-[#d4af37] px-4 py-1.5 rounded-full text-sm font-semibold uppercase tracking-wide border border-[#d4af37]/30">
                        {property.type}
                      </span>
                      <div className="flex items-center text-gray-400 bg-white/5 px-3 py-1.5 rounded-full">
                        <MapPin size={14} className="mr-2 text-[#d4af37]" />
                        <span>{property.location}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
                      <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
                        {property.name}
                      </h1>
                      <div className="xl:text-right bg-[#1a1a1a]/50 p-4 rounded-xl border border-white/5 inline-block">
                        <PriceDisplay priceCOP={property.priceCOP} priceUSD={property.priceUSD} size="large" />
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats Grid - Explicitly populated fields */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {/* Bedrooms */}
                    <div className="bg-[#1a1a1a] border border-[#d4af37]/20 hover:border-[#d4af37]/50 transition-colors rounded-xl p-5 text-center group">
                      <Bed size={28} className="mx-auto mb-3 text-[#d4af37] group-hover:scale-110 transition-transform" />
                      <div className="text-3xl font-bold text-white mb-1">{property.bedrooms}</div>
                      <div className="text-gray-400 text-sm font-medium uppercase tracking-wider">{t.properties.beds}</div>
                    </div>
                    
                    {/* Bathrooms */}
                    <div className="bg-[#1a1a1a] border border-[#d4af37]/20 hover:border-[#d4af37]/50 transition-colors rounded-xl p-5 text-center group">
                      <Bath size={28} className="mx-auto mb-3 text-[#d4af37] group-hover:scale-110 transition-transform" />
                      <div className="text-3xl font-bold text-white mb-1">{property.bathrooms}</div>
                      <div className="text-gray-400 text-sm font-medium uppercase tracking-wider">{t.properties.baths}</div>
                    </div>
                    
                    {/* Area */}
                    <div className="bg-[#1a1a1a] border border-[#d4af37]/20 hover:border-[#d4af37]/50 transition-colors rounded-xl p-5 text-center group">
                      <Maximize size={28} className="mx-auto mb-3 text-[#d4af37] group-hover:scale-110 transition-transform" />
                      <div className="text-3xl font-bold text-white mb-1">
                        {property.area} <span className="text-lg text-gray-500 font-normal">m²</span>
                      </div>
                      <div className="text-gray-400 text-sm font-medium uppercase tracking-wider">{t.properties.size}</div>
                    </div>
                    
                    {/* Year Built */}
                    <div className="bg-[#1a1a1a] border border-[#d4af37]/20 hover:border-[#d4af37]/50 transition-colors rounded-xl p-5 text-center group">
                      <Calendar size={28} className="mx-auto mb-3 text-[#d4af37] group-hover:scale-110 transition-transform" />
                      <div className="text-3xl font-bold text-white mb-1">{property.yearBuilt}</div>
                      <div className="text-gray-400 text-sm font-medium uppercase tracking-wider">{t.propertyDetail.yearBuilt}</div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-10">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
                      <HomeIcon className="text-[#d4af37]" size={24} />
                      {t.propertyDetail.about}
                    </h2>
                    <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/5">
                      <p className="text-gray-300 leading-relaxed text-lg whitespace-pre-line">
                        {property.description}
                      </p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-10">
                    <h2 className="text-2xl font-bold mb-6 text-white">{t.propertyDetail.features}</h2>
                    {property.amenities && property.amenities.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {property.amenities.map((feature, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 bg-[#1a1a1a] hover:bg-[#252525] border border-white/10 rounded-lg p-3 transition-colors"
                          >
                            <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full shadow-[0_0_8px_#d4af37]" />
                            <span className="text-gray-300 font-medium">{feature}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No specific amenities listed.</p>
                    )}
                  </div>

                  {/* Videos Section */}
                  <VideoGallerySection videos={property.videos} />

                </motion.div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="sticky top-24 space-y-6"
                >
                  {/* Action Card */}
                  <div className="bg-[#1a1a1a] border-2 border-[#d4af37]/30 rounded-xl p-6 shadow-2xl shadow-black/50">
                    <h3 className="text-xl font-bold mb-2 text-[#d4af37]">{t.propertyDetail.interested}</h3>
                    <p className="text-gray-400 text-sm mb-6">Contact our agents to schedule a private viewing.</p>
                    
                    <div className="space-y-3">
                      <Button
                        onClick={handleScheduleTour}
                        className="w-full bg-[#d4af37] hover:bg-[#c9a961] text-[#0f0f0f] font-bold py-6 h-auto text-lg shadow-lg shadow-[#d4af37]/20"
                      >
                        <Calendar size={20} className="mr-2" />
                        {t.propertyDetail.scheduleTour}
                      </Button>
                      
                      <a href="tel:+573209937784" className="block w-full">
                        <Button
                          variant="outline"
                          className="w-full border border-gray-600 hover:border-[#d4af37] text-gray-200 hover:text-[#d4af37] hover:bg-[#1a1a1a] font-semibold py-6 h-auto transition-all"
                        >
                          <Phone size={20} className="mr-2" />
                          {t.contact.callNow}
                        </Button>
                      </a>

                      <a href="mailto:info@wayluz.com" className="block w-full">
                         <Button
                          variant="outline"
                          className="w-full border border-gray-600 hover:border-[#d4af37] text-gray-200 hover:text-[#d4af37] hover:bg-[#1a1a1a] font-semibold py-6 h-auto transition-all"
                        >
                          <Mail size={20} className="mr-2" />
                          {t.contact.emailUs}
                        </Button>
                      </a>
                    </div>
                  </div>

                  {/* Detail Summary Card */}
                  <div className="bg-[#1a1a1a] border border-[#d4af37]/20 rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-4 text-white border-b border-white/10 pb-2">Property Summary</h3>
                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">{t.propertyDetail.type}</span>
                        <span className="font-medium text-white">{property.type}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">{t.propertyDetail.location}</span>
                        <span className="font-medium text-white text-right max-w-[60%]">{property.location}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">{t.propertyDetail.yearBuilt}</span>
                        <span className="font-medium text-white">{property.yearBuilt}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">{t.propertyDetail.size}</span>
                        <span className="font-medium text-white">{property.area} m²</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Status</span>
                        <span className="font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">Active</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <VisitsCounter increment={false} />
    </>
  );
};

export default PropertyDetailPage;