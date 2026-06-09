'use client';

import React from 'react';

const Logo = ({ className = "h-12 w-12", showText = true }) => {
  return (
    <div className="flex items-center gap-3">
      <img 
        src="https://horizons-cdn.hostinger.com/01704172-086d-454b-9cc3-9fd38c2d1034/eafdfc4f55d3f0edd14d8a2d08e3d889.png" 
        alt="WayLuz Inversions SAS Logo" 
        className={`${className} object-contain rounded-full shadow-lg border border-[#d4af37]/20`}
      />
      {showText && (
        <div className="flex flex-col justify-center select-none">
          <span className="text-[#d4af37] font-bold text-xl leading-none tracking-tight">WayLuz</span>
          <span className="text-white text-xs font-medium tracking-wide mt-0.5">Inversions SAS</span>
        </div>
      )}
    </div>
  );
};

export default Logo;