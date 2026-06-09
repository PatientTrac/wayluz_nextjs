'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import usePageVisits from '@/hooks/usePageVisits';

const VisitsCounter = ({ increment = false }) => {
  const { formattedVisitCount, loading, error } = usePageVisits(increment);

  // Gracefully hide the counter on error, ensuring it doesn't break the page
  if (error) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, x: -20 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed bottom-6 left-6 z-50 bg-black/60 backdrop-blur-md border border-[#d4af37]/20 rounded-lg px-4 py-2 shadow-lg flex items-center gap-2 pointer-events-none"
      >
        <Eye size={14} className="text-[#d4af37]" />
        <span className="text-gray-300 text-xs font-medium tracking-wide flex items-center gap-1.5">
          Total Visits: 
          {loading ? (
            <Skeleton className="h-4 w-10 bg-gray-600 rounded" />
          ) : (
            <span className="text-white font-bold">{formattedVisitCount}</span>
          )}
        </span>
      </motion.div>
    </AnimatePresence>
  );
};

export default VisitsCounter;