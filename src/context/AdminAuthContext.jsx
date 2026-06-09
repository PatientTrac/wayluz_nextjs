'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { authenticateAdmin } from '@/lib/adminAuthHelper';

const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  // Main authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // UI state for edit controls
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authWarning, setAuthWarning] = useState(null);
  // Admin email is public; the password/access code is never bundled in frontend code.
  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_WAYLUZ_ADMIN_EMAIL || 'admin@wayluz.com';

  useEffect(() => {
    // Check for active Supabase session on mount
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('[AdminAuth] Active Supabase session found');
          setIsAuthenticated(true);
          // Only auto-enable edit mode if we have a valid session
          // We can check localStorage for preference
          const savedEditMode = localStorage.getItem('adminEditMode');
          setIsEditMode(savedEditMode === 'true');
        } else {
          console.log('[AdminAuth] No active session');
          setIsAuthenticated(false);
          setIsEditMode(false);
        }
      } catch (error) {
        console.error('[AdminAuth] Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (!session) {
        setIsEditMode(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (passcode) => {
    console.log('[AdminAuth] Processing login attempt...');
    setAuthWarning(null);
    
    if (!passcode) {
      console.warn('[AdminAuth] Login failed: Empty passcode');
      return false;
    }

    const cleanPasscode = passcode.trim();
    // Authenticate directly through Supabase Auth. Keep the password/access code only in Supabase Auth, not in source code.
    // 1. Perform actual Supabase Authentication via Helper
    try {
      const { success, error, warning } = await authenticateAdmin(ADMIN_EMAIL, cleanPasscode);

      if (success) {
        console.log('[AdminAuth] Supabase Authentication Successful');
        setIsAuthenticated(true);
        setIsEditMode(true);
        localStorage.setItem('adminEditMode', 'true');
        return true;
      }

      // Handle Failures
      console.log('[AdminAuth] Sign in failed:', error?.message);

      if (warning === 'EMAIL_NOT_CONFIRMED') {
         console.warn('[AdminAuth] Email not confirmed blocking login.');
         setAuthWarning('EMAIL_NOT_CONFIRMED');
         // We cannot force authentication without a session token from the server.
         // Do not allow fake auth if RLS depends on real Supabase Auth.
         // Instead, we return false and let the UI show the specific warning.
         return false; 
      }
      console.error('[AdminAuth] Supabase Login Error:', error);
      return false;

    } catch (err) {
      console.error('[AdminAuth] Unexpected auth error:', err);
      return false;
    }
  };

  const logout = async () => {
    console.log('[AdminAuth] Logging out');
    await supabase.auth.signOut();
    setIsEditMode(false);
    setIsAuthenticated(false);
    localStorage.removeItem('adminEditMode');
    setAuthWarning(null);
  };

  const toggleEditMode = () => {
    setIsEditMode(prev => {
      const newVal = !prev;
      localStorage.setItem('adminEditMode', String(newVal));
      return newVal;
    });
  };

  const setEditMode = (value) => {
    setIsEditMode(value);
    localStorage.setItem('adminEditMode', String(value));
  };

  return (
    <AdminAuthContext.Provider value={{ 
      isAuthenticated, 
      isEditMode, 
      isLoading,
      authWarning,
      login, 
      logout, 
      toggleEditMode,
      setEditMode 
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};