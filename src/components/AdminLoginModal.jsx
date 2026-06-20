'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/context/AdminAuthContext';

const AdminLoginModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAdminAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    const success = await login(email, password);
    if (success) {
      setEmail('');
      setPassword('');
      onClose();
    } else {
      setError('Incorrect credentials, or this account isn\u2019t authorized.');
    }
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#1a1a1a] border border-[#d4af37]/30 rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-[#d4af37]/20 bg-[#0f0f0f]">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Lock size={20} className="text-[#d4af37]" />
              Admin Access
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-medium mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0f0f0f] border border-[#d4af37]/30 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#d4af37] transition-colors"
                    placeholder="you@company.com"
                    autoFocus
                    autoComplete="email"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#0f0f0f] border border-[#d4af37]/30 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-[#d4af37] transition-colors"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                </div>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <Button type="button" variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-[#d4af37] hover:bg-[#c9a961] text-black font-medium min-w-[100px]">
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Login'}
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AdminLoginModal;
