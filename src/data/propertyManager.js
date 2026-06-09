import { supabase } from '@/lib/customSupabaseClient';

export const EXCHANGE_RATE = 4000;

export const convertCOPtoUSD = (copAmount) => {
  return Math.round(copAmount / EXCHANGE_RATE);
};

export const convertUSDtoCOP = (usdAmount) => {
  return Math.round(usdAmount * EXCHANGE_RATE);
};

// Helper to generate UUIDs
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// NOTE: This function is now async as it fetches from Supabase
export const getAllProperties = async () => {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching properties in manager:', error);
    return [];
  }

  // Map DB columns to application internal camelCase standard
  return (data || []).map(p => ({
    ...p,
    priceCOP: p.price_cop,
    priceUSD: p.price_usd,
    yearBuilt: p.year_built,
    images: Array.isArray(p.images) ? p.images : [],
    videos: Array.isArray(p.videos) ? p.videos : []
  }));
};

// These functions remain for legacy support or admin panel utility structure, 
// though they should ideally also be migrated to async Supabase calls if used.
// For now, only getAllProperties was explicitly requested to change source.

export const getProperty = (id) => {
  // Deprecated synchronous method. 
  // Use supabase.from('properties').select('*').eq('id', id).single() instead.
  console.warn("getProperty (synchronous) is deprecated. Use Supabase directly.");
  return null;
};

export const addProperty = (property) => {
  // Should implementation be needed, use supabase.from('properties').insert()
  console.warn("addProperty (local) is deprecated. Use Supabase directly.");
  return property;
};

export const updateProperty = (id, updatedData) => {
  // Should implementation be needed, use supabase.from('properties').update()
  console.warn("updateProperty (local) is deprecated. Use Supabase directly.");
  return null;
};

export const deleteProperty = (id) => {
   // Should implementation be needed, use supabase.from('properties').delete()
   console.warn("deleteProperty (local) is deprecated. Use Supabase directly.");
};