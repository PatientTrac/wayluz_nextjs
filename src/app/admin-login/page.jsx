'use client';

import dynamic from 'next/dynamic';

const AdminLoginPage = dynamic(() => import('@/views/AdminLoginPage'), {
  ssr: false,
  loading: () => <div className="min-h-screen" />,
});

export default function Page() {
  return <AdminLoginPage />;
}
