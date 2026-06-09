'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/customSupabaseClient';

/**
 * Hook to track and retrieve global site visits with retry logic and robust error handling.
 * @param {boolean} increment - Whether to increment the visit counter on mount.
 * @returns {Object} - { visitCount, formattedVisitCount, loading, error, retry }
 */
const usePageVisits = (increment = false) => {
  const [visitCount, setVisitCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mounted = useRef(true);
  const PAGE_NAME = 'total_visits';

  const fetchVisits = useCallback(async (attempt = 1) => {
    if (!mounted.current) return;
    
    try {
      if (attempt === 1) setLoading(true);
      setError(null);
      
      console.log(`[usePageVisits] Fetching visits (attempt ${attempt})`);
      
      const { data: existingPage, error: fetchError } = await supabase
        .from('page_visits')
        .select('visit_count')
        .eq('page_name', PAGE_NAME)
        .maybeSingle();

      if (fetchError) throw fetchError;

      let currentCount = existingPage ? existingPage.visit_count : 0;

      if (increment) {
        const newCount = currentCount + 1;
        if (mounted.current) setVisitCount(newCount);

        const { error: upsertError } = await supabase
          .from('page_visits')
          .upsert({ 
            page_name: PAGE_NAME, 
            visit_count: newCount,
            last_updated: new Date().toISOString() 
          }, { onConflict: 'page_name' });
          
        if (upsertError) throw upsertError;
      } else {
        if (mounted.current) setVisitCount(currentCount);
      }
      
      if (mounted.current) setLoading(false);
      
    } catch (err) {
      console.error(`[usePageVisits] Error fetching visits on attempt ${attempt}:`, err.message || err);
      
      // Exponential backoff logic (Max 3 attempts: attempt 1 -> 2s, attempt 2 -> 4s)
      if (attempt < 3 && mounted.current) {
        const delay = Math.pow(2, attempt) * 1000;
        setTimeout(() => fetchVisits(attempt + 1), delay);
      } else {
        if (mounted.current) {
          setError(err);
          setVisitCount(0); // Fallback to 0 if all retries fail
          setLoading(false);
        }
      }
    }
  }, [increment]);

  useEffect(() => {
    mounted.current = true;
    fetchVisits();
    return () => {
      mounted.current = false;
    };
  }, [fetchVisits]);

  return { 
    visitCount, 
    formattedVisitCount: visitCount.toLocaleString(), 
    loading, 
    error,
    retry: () => fetchVisits(1)
  };
};

export default usePageVisits;