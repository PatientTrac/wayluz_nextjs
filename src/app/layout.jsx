import './globals.css';
import Providers from './providers';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';

export const metadata = {
  title: 'WayLuz Inversion SAS',
  description: 'Premium real estate investments in Colombia.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
            <Navigation />
            <main className="flex-grow">{children}</main>
            <Footer />
            <WhatsAppButton />
          </div>
        </Providers>
      </body>
    </html>
  );
}
