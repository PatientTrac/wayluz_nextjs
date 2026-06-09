'use client';

import dynamic from 'next/dynamic';

const ContactPage = dynamic(() => import('@/views/ContactPage'), {
  ssr: false,
  loading: () => <div className="min-h-screen" />,
});

export default function Page() {
  return <ContactPage />;
}
