'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/components/ui/use-toast';

const CallToActionSection = () => {
  const { t } = useLanguage();
  const { toast } = useToast();

  const handleAction = (action) => {
    toast({
      title: "Action Requested",
      description: `${action} functionality coming soon.`,
    });
  };

  return (
    <section className="py-20 bg-gradient-to-r from-[#d4af37]/10 to-[#c9a961]/10">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
            {t.fincaPage.interested || "Interested in this Paradise?"}
          </h2>
          <p className="text-gray-300 text-lg mb-10">
            {t.fincaPage.description}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button 
              onClick={() => handleAction('Schedule Tour')}
              className="bg-[#d4af37] hover:bg-[#c9a961] text-[#0f0f0f] font-bold px-10 py-8 text-lg rounded-full transition-all hover:scale-105 shadow-lg hover:shadow-[#d4af37]/20 flex items-center gap-3 w-full sm:w-auto justify-center h-auto"
            >
              <Calendar size={24} />
              {t.fincaPage.scheduleTour}
            </Button>
            
            <a href="tel:+573209937784" className="w-full sm:w-auto">
              <Button 
                variant="outline" 
                className="bg-transparent border-2 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0f0f0f] font-bold px-10 py-8 text-lg rounded-full transition-all hover:scale-105 shadow-lg flex items-center gap-3 w-full justify-center h-auto"
              >
                <Phone size={24} />
                {t.contact.callNow}
              </Button>
            </a>

            <a href="mailto:info@wayluz.com" className="w-full sm:w-auto">
              <Button 
                variant="outline" 
                className="bg-transparent border-2 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0f0f0f] font-bold px-10 py-8 text-lg rounded-full transition-all hover:scale-105 shadow-lg flex items-center gap-3 w-full justify-center h-auto"
              >
                <Mail size={24} />
                {t.contact.emailUs}
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CallToActionSection;