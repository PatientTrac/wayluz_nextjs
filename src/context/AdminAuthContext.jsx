'use client';

// Invite-only admin auth, on top of Supabase Auth.
// Sign-in methods: email + password, and Google OAuth.
// A valid Supabase session is NOT sufficient — the user's email must also be
// on the `app_admins` allowlist. Anyone who signs in (incl. via Google) but is
// not allowlisted is immediately signed back out. This is what makes multi-user
// + Google safe: only emails you've approved can get in.

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { authenticateAdmin } from '@/lib/adminAuthHelper';

const AdminAuthContext = createContext();

// True only if `email` is on the app_admins allowlist.
async function isAllowedAdmin(email) {
  if (!email) return false;
  try {
    const { data, error } = await supabase
      .from('app_admins')
      .select('email')
      .ilike('email', email) // exact email, case-insensitive (emails have no LIKE wildcards)
      .maybeSingle();
    if (error) {
      console.error('[AdminAuth] allowlist check failed:', error.message);
      return false;
    }
    return !!data;
  } catch (e) {
    console.error('[AdminAuth] allowlist check error:', e);
    return false;
  }
}

export const AdminAuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // 'NOT_AUTHORIZED' | 'EMAIL_NOT_CONFIRMED' | 'RESET_SENT' | null
  const [authWarning, setAuthWarning] = useState(null);

  // Allow a session in only if its email is allowlisted; otherwise sign out.
  const evaluateSession = async (session) => {
    const email = session?.user?.email;
    if (!email) {
      setIsAuthenticated(false);
      setIsEditMode(false);
      return false;
    }
    const ok = await isAllowedAdmin(email);
    if (!ok) {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setIsEditMode(false);
      setAuthWarning('NOT_AUTHORIZED');
      return false;
    }
    setIsAuthenticated(true);
    return true;
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      const ok = await evaluateSession(session);
      if (mounted && ok) {
        setIsEditMode(sessionStorage.getItem('adminEditMode') === 'true');
      }
      if (mounted) setIsLoading(false);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) evaluateSession(session);
      else { setIsAuthenticated(false); setIsEditMode(false); }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Email + password.
  const login = async (email, password) => {
    setAuthWarning(null);
    if (!email || !password) return false;
    const { success, warning } = await authenticateAdmin(email.trim(), password);
    if (!success) {
      if (warning === 'EMAIL_NOT_CONFIRMED') setAuthWarning('EMAIL_NOT_CONFIRMED');
      return false;
    }
    const { data: { session } } = await supabase.auth.getSession();
    const ok = await evaluateSession(session);
    if (ok) {
      setIsEditMode(true);
      sessionStorage.setItem('adminEditMode', 'true');
    }
    return ok;
  };

  // Google OAuth — redirects to Google, returns to /admin; the allowlist gate
  // runs automatically on return via onAuthStateChange.
  const loginWithGoogle = async () => {
    setAuthWarning(null);
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/admin` : undefined;
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
    if (error) { console.error('[AdminAuth] Google sign-in error:', error.message); return false; }
    return true;
  };

  // Password reset email (requires SMTP configured in Supabase to actually send).
  const resetPassword = async (email) => {
    setAuthWarning(null);
    if (!email) return false;
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/admin-login` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    if (error) { console.error('[AdminAuth] reset error:', error.message); return false; }
    setAuthWarning('RESET_SENT');
    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setIsEditMode(false);
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminEditMode');
    setAuthWarning(null);
  };

  const toggleEditMode = () => {
    setIsEditMode((prev) => {
      const v = !prev;
      sessionStorage.setItem('adminEditMode', String(v));
      return v;
    });
  };

  const setEditMode = (value) => {
    setIsEditMode(value);
    sessionStorage.setItem('adminEditMode', String(value));
  };

  return (
    <AdminAuthContext.Provider value={{
      isAuthenticated, isEditMode, isLoading, authWarning,
      login, loginWithGoogle, resetPassword, logout, toggleEditMode, setEditMode,
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  return context;
};
