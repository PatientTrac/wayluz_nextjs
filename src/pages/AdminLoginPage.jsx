'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Loader2, Shield, AlertTriangle } from 'lucide-react';
import { useNavigate } from '@/lib/routerAdapter';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const AdminLoginPage = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated, authWarning } = useAdminAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 800));

    const success = await login(password); // login is async now
    
    if (success) {
      toast({
        title: "Access Granted",
        description: "Welcome to the Admin Dashboard.",
      });
      navigate('/admin');
    } else {
      if (!authWarning) {
        setError('Invalid access credentials provided.');
        toast({
          title: "Access Denied",
          description: "Incorrect password or authentication failed.",
          variant: "destructive"
        });
        setPassword('');
      }
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
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
          <p className="text-gray-400">Restricted access area. Please identify yourself.</p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#d4af37]/20 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Warning Alerts based on auth state */}
            {authWarning === 'EMAIL_NOT_CONFIRMED' && (
              <Alert variant="destructive" className="bg-amber-900/20 border-amber-600 text-amber-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Email Confirmation Required</AlertTitle>
                <AlertDescription className="text-xs mt-1">
                  Your credentials are correct, but Supabase requires email verification. 
                  <br/><br/>
                  <strong>Action Required:</strong> Check your email inbox for a confirmation link, or verify your email manually in the Supabase Dashboard under Authentication {'>'} Users.
                </AlertDescription>
              </Alert>
            )}

            {authWarning === 'CONFIRMATION_SENT' && (
              <Alert className="bg-blue-900/20 border-blue-600 text-blue-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Account Created</AlertTitle>
                <AlertDescription className="text-xs mt-1">
                  A new admin account has been created. Please check your email to confirm your address before logging in.
                </AlertDescription>
              </Alert>
            )}

            <div>
              <label className="block text-[#d4af37] text-xs font-semibold mb-2 uppercase tracking-wider">
                Access Code
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-[#d4af37] transition-colors" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0f0f0f] border border-[#d4af37]/30 rounded-lg pl-10 pr-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all"
                  placeholder="••••••••••••••••"
                  autoFocus
                  autoComplete="current-password"
                />
              </div>
              {error && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-red-400 text-sm mt-3 flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {error}
                </motion.p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#d4af37] hover:bg-[#c9a961] text-black font-bold py-6 rounded-lg transition-all transform hover:translate-y-[-1px] active:translate-y-[1px] shadow-lg shadow-[#d4af37]/10"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Authenticate <ArrowRight size={18} />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <Button 
              variant="link" 
              className="text-gray-500 hover:text-white text-sm transition-colors"
              onClick={() => navigate('/')}
            >
              ← Back to Homepage
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLoginPage;