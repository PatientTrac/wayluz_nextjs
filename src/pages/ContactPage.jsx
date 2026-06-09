'use client';

import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Facebook, Linkedin, Twitter, Instagram } from 'lucide-react';
import ContactForm from '@/components/ContactForm';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import VisitsCounter from '@/components/VisitsCounter';

const ContactPage = () => {
  const { t } = useLanguage();

  const contactInfo = [
    {
      icon: MapPin,
      title: t.contact.visitUs,
      details: [t.contact.address],
      color: '#FFD700'
    },
    {
      icon: Phone,
      title: t.contact.callUs,
      details: [t.contact.phone],
      color: '#d4af37'
    },
    {
      icon: Mail,
      title: t.contact.emailUsTitle,
      details: ['info@wayluz.com', 'sales@wayluz.com'],
      color: '#003087'
    },
    {
      icon: Clock,
      title: t.contact.hoursLabel,
      details: [t.contact.hours],
      color: '#CE1126'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Contact Us - WayLuz Inversions SAS</title>
        <meta name="description" content="Get in touch with WayLuz Inversions SAS. Schedule a consultation or property tour today." />
      </Helmet>

      <div className="min-h-screen pt-20 bg-[#0f0f0f]">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f]">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Get in <span className="text-[#d4af37]">Touch</span>
              </h1>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Ready to start your investment journey? Our team is here to help you every step of the way.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-[#1a1a1a] border-2 border-[#d4af37]/30 rounded-xl p-6 text-center hover:border-[#d4af37] transition-all flex flex-col items-center"
                >
                  <div
                    className="w-16 h-16 mb-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${info.color}20` }}
                  >
                    <info.icon size={28} style={{ color: info.color }} />
                  </div>
                  <h3 className="text-lg font-bold mb-3 text-white">{info.title}</h3>
                  {info.details.map((detail, idx) => (
                    <p key={idx} className="text-gray-400 text-sm">
                      {detail}
                    </p>
                  ))}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Social Media Links */}
        <section className="py-4 mb-12">
          <div className="container mx-auto px-4 flex justify-center gap-6">
             <a
                href="https://www.facebook.com/profile.php?id=61579118194130"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-[#d4af37]/30 flex items-center justify-center hover:bg-[#d4af37]/20 hover:border-[#d4af37] transition-all hover:-translate-y-1"
                aria-label="Facebook"
              >
                <Facebook size={24} className="text-[#d4af37]" />
              </a>
              <a
                href="https://www.linkedin.com/company/wayluz-inversion-sas"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-[#d4af37]/30 flex items-center justify-center hover:bg-[#d4af37]/20 hover:border-[#d4af37] transition-all hover:-translate-y-1"
                aria-label="LinkedIn"
              >
                <Linkedin size={24} className="text-[#d4af37]" />
              </a>
              <a
                href="https://x.com/WayluzInversion"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-[#d4af37]/30 flex items-center justify-center hover:bg-[#d4af37]/20 hover:border-[#d4af37] transition-all hover:-translate-y-1"
                aria-label="Twitter"
              >
                <Twitter size={24} className="text-[#d4af37]" />
              </a>
              <a
                href="#" 
                className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-[#d4af37]/30 flex items-center justify-center hover:bg-[#d4af37]/20 hover:border-[#d4af37] transition-all hover:-translate-y-1"
                aria-label="Instagram"
              >
                <Instagram size={24} className="text-[#d4af37]" />
              </a>
          </div>
        </section>

        {/* Contact Form and Map */}
        <section className="py-12 pb-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="bg-[#1a1a1a] border-2 border-[#d4af37]/30 rounded-xl p-8">
                  <h2 className="text-3xl font-bold mb-6">
                    Send us a <span className="text-[#d4af37]">Message</span>
                  </h2>
                  <ContactForm />
                </div>
              </motion.div>

              {/* Map */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="bg-[#1a1a1a] border-2 border-[#d4af37]/30 rounded-xl overflow-hidden h-full min-h-[500px]">
                   <iframe 
                      title="WayLuz Inversions SAS Location"
                      width="100%" 
                      height="100%" 
                      style={{ border: 0, minHeight: '500px' }}
                      src="https://www.openstreetmap.org/export/embed.html?bbox=-72.5074,7.8285,-72.4974,7.8385&layer=mapnik&marker=7.8335,-72.5024" 
                      allowFullScreen
                      loading="lazy"
                    ></iframe>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Schedule Virtual Tour Section */}
        <section className="py-16 bg-gradient-to-r from-[#d4af37]/10 to-[#c9a961]/10">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto text-center"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Schedule a Virtual Tour
              </h2>
              <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
                Can't visit in person? No problem! Schedule a virtual tour with one of our expert agents and explore properties from the comfort of your home.
              </p>
              <div className="bg-[#1a1a1a] border-2 border-[#d4af37]/30 rounded-xl p-8">
                <p className="text-gray-400 mb-6">
                  Virtual tours available Monday - Saturday. Select your preferred date and time, and we'll send you a confirmation with meeting details.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="date"
                    className="px-4 py-3 bg-[#0f0f0f] border-2 border-[#d4af37]/30 rounded-lg text-white focus:outline-none focus:border-[#d4af37] transition-colors"
                  />
                  <input
                    type="time"
                    className="px-4 py-3 bg-[#0f0f0f] border-2 border-[#d4af37]/30 rounded-lg text-white focus:outline-none focus:border-[#d4af37] transition-colors"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-[#0f0f0f]">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Invest in Colombia?
              </h2>
              <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
                Our team of experts is ready to guide you through every step of your real estate investment journey.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="tel:+573209937784" className="inline-block">
                  <Button className="bg-[#d4af37] hover:bg-[#c9a961] text-[#0f0f0f] font-semibold px-10 py-6 text-lg rounded-full transition-all hover:scale-105 shadow-lg h-auto flex items-center gap-2">
                    <Phone size={24} />
                    {t.contact.callNow}
                  </Button>
                </a>
                <a href="mailto:info@wayluz.com" className="inline-block">
                  <Button variant="outline" className="border-2 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0f0f0f] font-semibold px-10 py-6 text-lg rounded-full transition-all hover:scale-105 h-auto flex items-center gap-2">
                     <Mail size={24} />
                     {t.contact.emailUs}
                  </Button>
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      <VisitsCounter increment={false} />
    </>
  );
};

export default ContactPage;