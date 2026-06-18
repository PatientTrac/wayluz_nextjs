'use client';

import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from '@/lib/routerAdapter';
import { TrendingUp, Home, Palmtree, Globe, ArrowRight, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import Logo from '@/components/Logo';
import VisitsCounter from '@/components/VisitsCounter';

const HomePage = () => {
  const { t } = useLanguage();
  
  const features = [
    {
      icon: TrendingUp,
      title: t.home.features.economic.title,
      description: t.home.features.economic.desc,
      color: '#FFD700'
    },
    {
      icon: Home,
      title: t.home.features.market.title,
      description: t.home.features.market.desc,
      color: '#d4af37'
    },
    {
      icon: Palmtree,
      title: t.home.features.nature.title,
      description: t.home.features.nature.desc,
      color: '#003087'
    },
    {
      icon: Globe,
      title: t.home.features.culture.title,
      description: t.home.features.culture.desc,
      color: '#CE1126'
    }
  ];

  const metaImage = "https://horizons-cdn.hostinger.com/01704172-086d-454b-9cc3-9fd38c2d1034/eafdfc4f55d3f0edd14d8a2d08e3d889.png";

  return (
    <>
      <Helmet>
        <title>Wayluz | Colombia & Venezuela Real Estate • Homes, Land & Fincas</title>
        <meta name="description" content="Wayluz helps buyers explore real estate in Colombia and Venezuela, including homes, land, and fincas. Property information and purchase options, including cryptocurrency where permitted. | Wayluz facilita la búsqueda de bienes raíces en Colombia y Venezuela, incluyendo casas, terrenos y fincas. Información de propiedades y opciones de compra, incluyendo criptomonedas donde sea permitido." />
        <meta name="keywords" content="Colombia real estate, Venezuela real estate, fincas Colombia, fincas Venezuela, land for sale Colombia, land for sale Venezuela, homes for sale Colombia, casas en venta Colombia, bienes raíces Colombia, bienes raíces Venezuela, Los Patios Colombia real estate, Cúcuta Colombia real estate, rural land Colombia, agricultural land Colombia, crypto real estate, buy property with cryptocurrency, comprar propiedad con criptomonedas, Wayluz" />
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph Tags */}
        <meta property="og:title" content="Wayluz – Real Estate in Colombia & Venezuela" />
        <meta property="og:description" content="Homes, land, and fincas for buyers in Colombia and Venezuela. Property information with purchase pathways, including crypto where legally permitted." />
        <meta property="og:site_name" content="Wayluz" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={metaImage} />
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Wayluz – Real Estate in Colombia & Venezuela" />
        <meta name="twitter:description" content="Homes, land, and fincas for buyers in Colombia and Venezuela. Property information with purchase pathways, including crypto where legally permitted." />
        <meta name="twitter:image" content={metaImage} />
      </Helmet>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1534679334002-2daee02d4a46"
            alt="Cartagena, Colombia"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0f0f0f]/80 via-[#0f0f0f]/70 to-[#0f0f0f]/90" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
          >
             <motion.div 
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.2, duration: 0.6 }}
               className="mb-8"
             >
                <div className="p-4 bg-black/40 backdrop-blur-sm rounded-full border border-[#d4af37]/30 shadow-2xl shadow-[#d4af37]/10">
                  <Logo className="h-24 w-24 md:h-32 md:w-32" showText={false} />
                </div>
             </motion.div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              {t.home.heroTitle}{' '}
              <span className="text-[#d4af37]">{t.home.heroTitleAccent}</span>
              <br />
              <span className="text-2xl md:text-4xl lg:text-5xl font-light mt-4 block">
                WayLuz Inversions SAS
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-3xl mx-auto">
              {t.home.heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/properties">
                <Button className="bg-[#d4af37] hover:bg-[#c9a961] text-[#0f0f0f] font-semibold px-8 py-6 text-lg rounded-full transition-all hover:scale-105 shadow-lg hover:shadow-2xl h-auto">
                  {t.home.exploreBtn}
                  <ArrowRight className="ml-2" size={20} />
                </Button>
              </Link>
              
              <a href="tel:+573209937784">
                <Button variant="outline" className="border-2 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0f0f0f] font-semibold px-8 py-6 text-lg rounded-full transition-all hover:scale-105 h-auto">
                  <Phone className="mr-2" size={20} />
                  {t.contact.callNow}
                </Button>
              </a>

              <a href="mailto:info@wayluz.com">
                <Button variant="outline" className="border-2 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0f0f0f] font-semibold px-8 py-6 text-lg rounded-full transition-all hover:scale-105 h-auto">
                  <Mail className="mr-2" size={20} />
                  {t.contact.emailUs}
                </Button>
              </a>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
        >
          <div className="w-6 h-10 border-2 border-[#d4af37] rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-[#d4af37] rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* About Colombia Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-[#0f0f0f] to-[#1a1a1a]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              {t.home.whyInvest} <span className="text-[#d4af37]">{t.home.whyInvestAccent}</span>?
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              {t.home.whyInvestDesc}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -10 }}
                className="bg-[#1a1a1a]/50 backdrop-blur-sm border-2 border-[#d4af37]/30 rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all hover:border-[#d4af37]"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${feature.color}20` }}
                >
                  <feature.icon size={32} style={{ color: feature.color }} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-[#d4af37]/10 to-[#c9a961]/10">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t.home.readyTitle}
            </h2>
            <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
              {t.home.readyDesc}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center flex-wrap">
              <Link to="/properties">
                <Button className="bg-[#d4af37] hover:bg-[#c9a961] text-[#0f0f0f] font-semibold px-10 py-6 text-lg rounded-full transition-all hover:scale-105 shadow-lg h-auto">
                  {t.home.viewAllBtn}
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" className="border-2 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0f0f0f] font-semibold px-10 py-6 text-lg rounded-full transition-all hover:scale-105 h-auto">
                  {t.home.scheduleBtn}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <VisitsCounter increment={false} />
    </>
  );
};

export default HomePage;