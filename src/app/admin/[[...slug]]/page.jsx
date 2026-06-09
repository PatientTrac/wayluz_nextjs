'use client';

import dynamic from 'next/dynamic';

const AdminPanel = dynamic(() => import('@/views/AdminPanel'), {
  ssr: false,
  loading: () => <div className="min-h-screen" />,
});

export default function Page() {
  return <AdminPanel />;
}
