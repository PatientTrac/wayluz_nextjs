'use client';

import dynamic from 'next/dynamic';

const FincaAerialViewPage = dynamic(() => import('@/views/FincaAerialViewPage'), {
  ssr: false,
  loading: () => <div className="min-h-screen" />,
});

export default function Page() {
  return <FincaAerialViewPage />;
}
