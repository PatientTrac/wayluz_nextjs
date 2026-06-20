'use client';

// Admin-only WhatsApp inbox, branded with WayLuz's home-page logo + gold.
// Adjust the imports to your repo's paths if they differ.

import ProtectedRoute from '@/components/ProtectedRoute';
import { supabase } from '@/lib/customSupabaseClient';
import WhatsAppInbox from '@/components/WhatsAppInbox';
import Logo from '@/components/Logo';

export default function InboxPage() {
  return (
    <ProtectedRoute>
      <div style={{ padding: 24 }}>
        <a
          href="/admin"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16,
            color: '#d4af37', textDecoration: 'none', fontSize: 14, fontWeight: 500,
          }}
        >
          ← Back to Admin Panel
        </a>
        <WhatsAppInbox
          supabase={supabase}
          branding={{
            logo: <Logo showText className="h-9 w-9" />,
            name: 'WayLuz',
            accent: '#d4af37',
            bg: '#0d0d10',
          }}
        />
      </div>
    </ProtectedRoute>
  );
}
