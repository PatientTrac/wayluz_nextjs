import { supabase } from '@/lib/customSupabaseClient';

/**
 * Fetches the first record to inspect structure, as Supabase JS client doesn't expose schema metadata directly easily.
 * We can infer schema from the keys of the returned object.
 */
export async function inspectTableSchema() {
  console.group('🔍 Inspecting Table Schema');
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Schema fetch error:', error);
      return { success: false, error };
    }

    if (data && data.length > 0) {
      const keys = Object.keys(data[0]);
      const types = {};
      keys.forEach(key => {
        types[key] = typeof data[0][key];
        if (Array.isArray(data[0][key])) types[key] = 'array';
        if (data[0][key] === null) types[key] = 'null (unknown)';
      });
      console.log('Inferred Schema:', types);
      return { success: true, keys, types, sample: data[0] };
    } else {
      console.warn('Table is empty, cannot infer schema.');
      return { success: true, empty: true };
    }
  } catch (e) {
    console.error('Unexpected error:', e);
    return { success: false, error: e };
  } finally {
    console.groupEnd();
  }
}

export async function fetchAllPropertiesSummary() {
  console.group('🔍 Fetching All Properties Summary');
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('id, name, videos');

    if (error) {
      console.error('Fetch all error:', error);
      return { success: false, error };
    }

    console.log('Found properties:', data.length);
    data.forEach(p => console.log(`[${p.id}] ${p.name} - Videos: ${p.videos ? (Array.isArray(p.videos) ? `Array(${p.videos.length})` : typeof p.videos) : 'null'}`));
    return { success: true, data };
  } catch (e) {
    console.error('Unexpected error:', e);
    return { success: false, error: e };
  } finally {
    console.groupEnd();
  }
}

export async function fetchPropertyByName(name) {
  console.group(`🔍 Fetching Property by Name: "${name}"`);
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .ilike('name', `%${name}%`); // Using ilike for case-insensitive partial match

    if (error) {
      console.error('Fetch by name error:', error);
      return { success: false, error };
    }

    console.log('Search results:', data);
    return { success: true, data };
  } catch (e) {
    console.error('Unexpected error:', e);
    return { success: false, error: e };
  } finally {
    console.groupEnd();
  }
}

export async function fetchPropertyById(id) {
  console.group(`🔍 Fetching Property by ID: "${id}"`);
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Fetch by ID error:', error);
      return { success: false, error };
    }

    console.log('Result:', data);
    return { success: true, data };
  } catch (e) {
    console.error('Unexpected error:', e);
    return { success: false, error: e };
  } finally {
    console.groupEnd();
  }
}