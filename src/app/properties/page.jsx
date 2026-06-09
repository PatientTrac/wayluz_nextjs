'use client';

import dynamic from 'next/dynamic';

const PropertiesPage = dynamic(() => import('@/views/PropertiesPage'), {
  ssr: false,
  loading: () => <div className="min-h-screen" />,
});

export default function Page() {
  return <PropertiesPage />;
}
