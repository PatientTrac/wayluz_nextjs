'use client';

// Invite-only admin auth on top of Supabase Auth.
//   Factor 1: email + password
//   Factor 2: TOTP authenticator app (Google Authenticator, Authy, 1Password...)
//   Gate:     email must be on the app_admins allowlist
// A valid session is never enough: the email must be allowlisted, and if the
// account has a verified authenticator factor it must be stepped up to aal2
// (6-digit code) before it counts as authenticated. Session lives in
// sessionStorage, so closing the browser logs the admin out.

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { authenticateAdmin } from '@/lib/adminAuthHelper';

const AdminAuthContext = createContext();

async function isAllowedAdmin(email) {
  if (!email) return false;
  try {
    const { data, error } = await supabase
      .from('app_admins')
      .select('email')
      .ilike('email', email)
      .maybeSingle();
    if (error) { console.error('[AdminAuth] allowlist check failed:', error.message); return false; }
    return !!data;
  } catch (e) { console.error('[AdminAuth] allowlist check error:', e); return false; }
}

export const AdminAuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authWarning, setAuthWarning] = useState(null); // NOT_AUTHORIZED | EMAIL_NOT_CONFIRMED | RESET_SENT
  const [mfaChallenge, setMfaChallenge] = useState(false); // password OK, awaiting 6-digit code
  const [needsEnrollment, setNeedsEnrollment] = useState(false); // logged in but no authenticator yet
  const pendingFactorRef = useRef(null);

  const markAuthed = () => {
    setIsAuthenticated(true);
    setMfaChallenge(false);
    setIsEditMode(true);
    sessionStorage.setItem('adminEditMode', 'true');
  };

  // Allowlist + MFA gate for a given session.
  const evaluateSession = async (session) => {
    const email = session?.user?.email;
    if (!email) { setIsAuthenticated(false); setIsEditMode(false); return false; }

    if (!(await isAllowedAdmin(email))) {
      await supabase.auth.signOut();
      setIsAuthenticated(false); setIsEditMode(false);
      setAuthWarning('NOT_AUTHORIZED');
      return false;
    }

    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal && aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') {
      // Verified authenticator exists but this session hasn't entered a code yet.
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.find((f) => f.status === 'verified') || factors?.totp?.[0];
      pendingFactorRef.current = totp?.id || null;
      setMfaChallenge(true);
      setIsAuthenticated(false);
      return false;
    }

    setNeedsEnrollment(aal ? aal.nextLevel === 'aal1' : false);
    setIsAuthenticated(true);
    return true;
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      const ok = await evaluateSession(session);
      if (mounted && ok) setIsEditMode(sessionStorage.getItem('adminEditMode') === 'true');
      if (mounted) setIsLoading(false);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) evaluateSession(session);
      else { setIsAuthenticated(false); setIsEditMode(false); setMfaChallenge(false); }
    });
    return () => { mounted = false; subscription.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step 1: email + password. Returns 'MFA' (code needed), 'OK' (done), or false.
  const login = async (email, password) => {
    setAuthWarning(null);
    if (!email || !password) return false;
    const { success, warning } = await authenticateAdmin(email.trim(), password);
    if (!success) {
      if (warning === 'EMAIL_NOT_CONFIRMED') setAuthWarning('EMAIL_NOT_CONFIRMED');
      return false;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!(await isAllowedAdmin(session?.user?.email))) {
      await supabase.auth.signOut();
      setIsAuthenticated(false); setIsEditMode(false);
      setAuthWarning('NOT_AUTHORIZED');
      return false;
    }
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal && aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.find((f) => f.status === 'verified') || factors?.totp?.[0];
      pendingFactorRef.current = totp?.id || null;
      setMfaChallenge(true);
      return 'MFA';
    }
    setNeedsEnrollment(aal ? aal.nextLevel === 'aal1' : false);
    markAuthed();
    return 'OK';
  };

  // Step 2: verify the 6-digit authenticator code (steps session up to aal2).
  const verifyMfa = async (code) => {
    const factorId = pendingFactorRef.current;
    if (!factorId) return false;
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: String(code).trim() });
    if (error) { console.error('[AdminAuth] MFA verify failed:', error.message); return false; }
    pendingFactorRef.current = null;
    setNeedsEnrollment(false);
    markAuthed();
    return true;
  };

  // Abandon a pending MFA challenge (e.g. user hits "back").
  const cancelMfa = async () => {
    await supabase.auth.signOut();
    pendingFactorRef.current = null;
    setMfaChallenge(false);
    setIsAuthenticated(false);
  };

  // Begin authenticator enrollment -> returns QR + secret to display.
  const enrollMfa = async () => {
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const stale = (factors?.totp || []).filter((f) => f.status === 'unverified');
      for (const f of stale) { await supabase.auth.mfa.unenroll({ factorId: f.id }); }
    } catch (_) { /* ignore */ }
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `Authenticator ${Date.now()}` });
    if (error) { console.error('[AdminAuth] enroll failed:', error.message); return { error: error.message }; }
    return { factorId: data.id, qr: data.totp?.qr_code, secret: data.totp?.secret, uri: data.totp?.uri };
  };

  // Confirm enrollment with the first 6-digit code from the app.
  const confirmEnrollment = async (factorId, code) => {
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: String(code).trim() });
    if (error) { console.error('[AdminAuth] enroll verify failed:', error.message); return false; }
    setNeedsEnrollment(false);
    return true;
  };

  const listMfaFactors = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) return [];
    return data?.totp || [];
  };

  const disableMfa = async (factorId) => {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) { console.error('[AdminAuth] unenroll failed:', error.message); return false; }
    return true;
  };

  // Change password for the currently signed-in admin (no SMTP needed).
  const changePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

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
    setMfaChallenge(false);
    setNeedsEnrollment(false);
    sessionStorage.removeItem('adminEditMode');
    setAuthWarning(null);
  };

  const toggleEditMode = () => {
    setIsEditMode((prev) => { const v = !prev; sessionStorage.setItem('adminEditMode', String(v)); return v; });
  };
  const setEditMode = (value) => { setIsEditMode(value); sessionStorage.setItem('adminEditMode', String(value)); };

  return (
    <AdminAuthContext.Provider value={{
      isAuthenticated, isEditMode, isLoading, authWarning, mfaChallenge, needsEnrollment,
      login, verifyMfa, cancelMfa, enrollMfa, confirmEnrollment, listMfaFactors, disableMfa,
      changePassword, resetPassword, logout, toggleEditMode, setEditMode,
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
