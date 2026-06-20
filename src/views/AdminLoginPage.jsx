'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight, Loader2, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from '@/lib/routerAdapter';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, loginWithGoogle, resetPassword, isAuthenticated, authWarning } = useAdminAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated) navigate('/admin');
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    const success = await login(email, password);
    if (success) {
      toast({ title: 'Access Granted', description: 'Welcome to the Admin Dashboard.' });
      navigate('/admin');
    } else {
      if (!authWarning) {
        setError('Invalid email or password.');
        toast({ title: 'Access Denied', description: 'Incorrect credentials or unauthorized account.', variant: 'destructive' });
      }
      setPassword('');
    }
    setIsSubmitting(false);
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    await loginWithGoogle(); // redirects to Google
    setGoogleLoading(false);
  };

  const handleForgot = async () => {
    setError('');
    if (!email) { setError('Enter your email above first, then click "Forgot password".'); return; }
    const ok = await resetPassword(email);
    if (ok) toast({ title: 'Reset link sent', description: 'Check your email for a password reset link.' });
    else setError('Could not send the reset email. (Confirm SMTP is configured in Supabase.)');
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#d4af37]/5 via-transparent to-transparent opacity-50" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#d4af37]/20 mb-6 shadow-lg shadow-[#d4af37]/5">
            <Shield className="w-8 h-8 text-[#d4af37]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Admin Portal</h1>
          <p className="text-gray-400">Restricted access area. Please sign in.</p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#d4af37]/20 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
          {authWarning === 'NOT_AUTHORIZED' && (
            <Alert variant="destructive" className="bg-red-900/20 border-red-600 text-red-200 mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Not authorized</AlertTitle>
              <AlertDescription className="text-xs mt-1">
                Those credentials are valid, but this account isn't on the admin allowlist. Ask an existing admin to add your email.
              </AlertDescription>
            </Alert>
          )}
          {authWarning === 'EMAIL_NOT_CONFIRMED' && (
            <Alert variant="destructive" className="bg-amber-900/20 border-amber-600 text-amber-200 mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Email confirmation required</AlertTitle>
              <AlertDescription className="text-xs mt-1">
                Your credentials are correct, but the email isn't confirmed. Confirm it via the link in your inbox, or in Supabase → Authentication → Users.
              </AlertDescription>
            </Alert>
          )}
          {authWarning === 'RESET_SENT' && (
            <Alert className="bg-green-900/20 border-green-600 text-green-200 mb-6">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Reset link sent</AlertTitle>
              <AlertDescription className="text-xs mt-1">
                If that email belongs to an admin account, a password reset link is on its way.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[#d4af37] text-xs font-semibold mb-2 uppercase tracking-wider">Email</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-[#d4af37] transition-colors" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-[#d4af37]/30 rounded-lg pl-10 pr-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all"
                  placeholder="you@company.com"
                  autoFocus
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#d4af37] text-xs font-semibold mb-2 uppercase tracking-wider">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-[#d4af37] transition-colors" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-[#d4af37]/30 rounded-lg pl-10 pr-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all"
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                />
              </div>
              {error && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-red-400 text-sm mt-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> {error}
                </motion.p>
              )}
              <button type="button" onClick={handleForgot} className="text-gray-500 hover:text-[#d4af37] text-xs mt-3 transition-colors">
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#d4af37] hover:bg-[#c9a961] text-black font-bold py-6 rounded-lg transition-all shadow-lg shadow-[#d4af37]/10"
            >
              {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <span className="flex items-center justify-center gap-2">Sign in <ArrowRight size={18} /></span>}
            </Button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-600 text-xs uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-medium py-3.5 rounded-lg transition-all disabled:opacity-60"
          >
            {googleLoading ? <Loader2 className="animate-spin w-5 h-5" /> : (
              <>
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
                  <path fill="#FBBC05" d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"/>
                  <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <Button variant="link" className="text-gray-500 hover:text-white text-sm transition-colors" onClick={() => navigate('/')}>
              ← Back to Homepage
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLoginPage;
