'use client';

import dynamic from 'next/dynamic';

const PropertyDetailPage = dynamic(() => import('@/views/PropertyDetailPage'), {
  ssr: false,
  loading: () => <div className="min-h-screen" />,
});

export default function Page() {
  return <PropertyDetailPage />;
}
