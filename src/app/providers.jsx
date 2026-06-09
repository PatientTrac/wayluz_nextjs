'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { SupabaseAuthProvider } from '@/contexts/SupabaseAuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { AdminAuthProvider, useAdminAuth } from '@/context/AdminAuthContext';
import { Toaster } from '@/components/ui/toaster';
import ScrollToTop from '@/components/ScrollToTop';
import usePageVisits from '@/hooks/usePageVisits';

const EditModeRouteGuard = () => {
  const { setEditMode } = useAdminAuth();
  const pathname = usePathname() || '/';

  useEffect(() => {
    if (!pathname.startsWith('/admin')) {
      setEditMode(false);
    }
  }, [pathname, setEditMode]);

  useEffect(() => {
    const handleUnload = () => setEditMode(false);
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [setEditMode]);

  return null;
};

const GlobalVisitTracker = () => {
  usePageVisits(true);
  return null;
};

export default function Providers({ children }) {
  return (
    <LanguageProvider>
      <SupabaseAuthProvider>
        <AdminAuthProvider>
          <EditModeRouteGuard />
          <GlobalVisitTracker />
          <ScrollToTop />
          {children}
          <Toaster />
        </AdminAuthProvider>
      </SupabaseAuthProvider>
    </LanguageProvider>
  );
}
