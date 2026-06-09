'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

const PriceDisplay = ({ priceCOP, priceUSD, size = 'medium', className }) => {
  const { t } = useLanguage();

  const formatCurrency = (amount, currency, locale = 'en-US') => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formattedCOP = formatCurrency(priceCOP, 'COP', 'es-CO');
  const formattedUSD = formatCurrency(priceUSD, 'USD', 'en-US');

  const sizes = {
    small: 'text-sm',
    medium: 'text-lg',
    large: 'text-2xl md:text-3xl'
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <div className={cn("font-bold text-[#d4af37]", sizes[size])}>
        {formattedUSD} <span className="text-xs md:text-sm text-[#d4af37]/80">{t.currency.usd}</span>
      </div>
      <div className={cn("text-gray-400 font-medium", size === 'large' ? 'text-lg md:text-xl' : 'text-xs')}>
        {formattedCOP} <span className="text-gray-500">{t.currency.cop}</span>
      </div>
    </div>
  );
};

export default PriceDisplay;