'use client';

import React, { useState } from 'react';
import { Link, useLocation } from '@/lib/routerAdapter';
import { motion } from 'framer-motion';
import { Menu, X, Globe } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import EditModeToggle from '@/components/EditModeToggle';
import Logo from '@/components/Logo';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { language, toggleLanguage, t } = useLanguage();

  const navLinks = [
    { name: t.nav.home, path: '/' },
    { name: t.nav.about, path: '/about' },
    { name: t.nav.properties, path: '/properties' },
    { name: t.nav.contact, path: '/contact' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f0f0f]/95 backdrop-blur-md border-b border-[#d4af37]/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
             <Logo className="h-10 w-10 md:h-12 md:w-12 group-hover:scale-105 transition-transform duration-300" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative text-sm font-medium transition-colors flex items-center gap-1 ${
                  isActive(link.path) ? 'text-[#d4af37]' : 'text-white hover:text-[#d4af37]'
                }`}
              >
                {link.icon && <link.icon size={14} />}
                {link.name}
                {isActive(link.path) && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#d4af37]"
                  />
                )}
              </Link>
            ))}
            
            <div className="flex items-center space-x-4 pl-4 border-l border-[#d4af37]/20">
              {/* Language Switcher */}
              <button
                onClick={toggleLanguage}
                className="flex items-center space-x-2 text-sm font-medium text-white hover:text-[#d4af37] transition-colors border border-[#d4af37]/30 rounded-full px-3 py-1 hover:border-[#d4af37]"
              >
                <Globe size={16} />
                <span>{language === 'en' ? 'ES' : 'EN'}</span>
              </button>

              {/* Edit Mode Toggle - Only visible when authenticated */}
              <EditModeToggle />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-[#d4af37] hover:text-[#c9a961] transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden py-4 border-t border-[#d4af37]/20"
          >
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-2 py-3 px-4 text-sm font-medium transition-colors ${
                  isActive(link.path) ? 'text-[#d4af37] bg-[#d4af37]/10' : 'text-white hover:text-[#d4af37] hover:bg-[#d4af37]/5'
                }`}
              >
                {link.icon && <link.icon size={16} />}
                {link.name}
              </Link>
            ))}
            <div className="py-3 px-4 space-y-4">
              <button
                onClick={() => {
                  toggleLanguage();
                  setIsOpen(false);
                }}
                className="flex items-center space-x-2 text-sm font-medium text-white hover:text-[#d4af37] transition-colors"
              >
                <Globe size={16} />
                <span>Switch to {language === 'en' ? 'Español' : 'English'}</span>
              </button>

              <div className="pt-2 border-t border-[#d4af37]/10">
                 <EditModeToggle />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
