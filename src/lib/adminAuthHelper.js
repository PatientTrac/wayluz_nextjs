import { supabase } from '@/lib/customSupabaseClient';

/**
 * Helper function to handle admin authentication flow with better error handling.
 * Note: Supabase strict email confirmation cannot be bypassed client-side if enabled on the server.
 * This helper attempts to provide the best possible path and clear diagnostics.
 * 
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{success: boolean, session: object|null, error: object|null, warning: string|null}>}
 */
export const authenticateAdmin = async (email, password) => {
  try {
    // 1. Attempt standard sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Special handling for Email not confirmed
      if (error.message.includes('Email not confirmed')) {
        return {
          success: false,
          session: null,
          error: error,
          warning: 'EMAIL_NOT_CONFIRMED'
        };
      }
      
      return { success: false, session: null, error };
    }

    if (data.session) {
      return { success: true, session: data.session, error: null };
    }

    return { success: false, session: null, error: { message: "Unknown authentication state" } };

  } catch (err) {
    console.error("Unexpected auth error:", err);
    return { success: false, session: null, error: err };
  }
};