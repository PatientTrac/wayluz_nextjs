'use client';

import dynamic from 'next/dynamic';

const AboutPage = dynamic(() => import('@/views/AboutPage'), {
  ssr: false,
  loading: () => <div className="min-h-screen" />,
});

export default function Page() {
  return <AboutPage />;
}
