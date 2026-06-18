'use client';

// Admin-only WhatsApp inbox page.
// NOTE: adjust the two imports below to your repo's actual paths/exports —
//   ProtectedRoute  : WayLuz's existing auth guard
//   supabase        : WayLuz's configured browser client (customSupabaseClient)
// If your custom router intercepts /inbox, register <WhatsAppInbox> the same
// way your other admin views are mounted instead of relying on this file.

import ProtectedRoute from '@/components/ProtectedRoute';
import { supabase } from '@/lib/customSupabaseClient';
import WhatsAppInbox from '@/components/WhatsAppInbox';

export default function InboxPage() {
  return (
    <ProtectedRoute>
      <div style={{ padding: 24 }}>
        <WhatsAppInbox supabase={supabase} />
      </div>
    </ProtectedRoute>
  );
}
