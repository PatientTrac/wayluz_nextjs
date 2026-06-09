'use client';

import React from 'react';
import { Link } from '@/lib/routerAdapter';
import { Facebook, Instagram, Linkedin, Twitter, Mail, Phone, MapPin, Clock } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import Logo from '@/components/Logo';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  return (
    <footer className="bg-[#1a1a1a] border-t border-[#d4af37]/20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
               <Logo className="h-14 w-14" />
            </Link>
            <p className="text-gray-400 text-sm mt-4">
              {t.footer.desc}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-[#d4af37] font-semibold mb-4">{t.footer.quickLinks}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-[#d4af37] transition-colors text-sm">
                  {t.nav.home}
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-[#d4af37] transition-colors text-sm">
                  {t.nav.about}
                </Link>
              </li>
              <li>
                <Link to="/properties" className="text-gray-400 hover:text-[#d4af37] transition-colors text-sm">
                  {t.nav.properties}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-[#d4af37] transition-colors text-sm">
                  {t.nav.contact}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-[#d4af37] font-semibold mb-4">{t.footer.contact}</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-2 text-gray-400 text-sm">
                <MapPin size={16} className="mt-1 text-[#d4af37] flex-shrink-0" />
                <span>{t.contact.address}</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-400 text-sm">
                <Phone size={16} className="text-[#d4af37] flex-shrink-0" />
                <a href="tel:+573209937784" className="hover:text-[#d4af37] transition-colors">
                  {t.contact.phone}
                </a>
              </li>
              <li className="flex items-center space-x-2 text-gray-400 text-sm">
                <Clock size={16} className="text-[#d4af37] flex-shrink-0" />
                <span>{t.contact.hours}</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-400 text-sm">
                <Mail size={16} className="text-[#d4af37] flex-shrink-0" />
                <a href="mailto:info@wayluz.com" className="hover:text-[#d4af37] transition-colors">
                  info@wayluz.com
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-[#d4af37] font-semibold mb-4">{t.footer.follow}</h3>
            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com/profile.php?id=61579118194130"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#d4af37]/10 flex items-center justify-center hover:bg-[#d4af37]/20 transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={18} className="text-[#d4af37]" />
              </a>
              <a
                href="#" // Instagram link not provided, keeping placeholder
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#d4af37]/10 flex items-center justify-center hover:bg-[#d4af37]/20 transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={18} className="text-[#d4af37]" />
              </a>
              <a
                href="https://www.linkedin.com/company/wayluz-inversion-sas"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#d4af37]/10 flex items-center justify-center hover:bg-[#d4af37]/20 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={18} className="text-[#d4af37]" />
              </a>
              <a
                href="https://x.com/WayluzInversion"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-[#d4af37]/10 flex items-center justify-center hover:bg-[#d4af37]/20 transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={18} className="text-[#d4af37]" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#d4af37]/20 text-center">
          <p className="text-gray-400 text-sm">
            © {currentYear} WayLuz Inversions SAS. {t.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;