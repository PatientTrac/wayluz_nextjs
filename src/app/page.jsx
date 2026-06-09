'use client';

import dynamic from 'next/dynamic';

const HomePage = dynamic(() => import('@/views/HomePage'), {
  ssr: false,
  loading: () => <div className="min-h-screen" />,
});

export default function Page() {
  return <HomePage />;
}
