import type { Metadata, Viewport } from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { Toaster } from '@/components/ui/toaster';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1a365d',
};

const baseUrl = 'https://gigconnect.bw';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'GigConnect | Botswana Musical Talent & Event Hub',
    template: '%s | GigConnect',
  },
  description: 'The home for Batswana musical excellence. Find gigs, hire professional DJs and artists, and buy event tickets across Botswana.',
  keywords: ['Botswana music', 'Gaborone events', 'Amapiano Botswana', 'Motswako', 'Hire DJ Botswana', 'GigConnect', 'Botswana Gigs'],
  authors: [{ name: 'Mogakolodi Ranthokwane' }],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_BW',
    url: baseUrl,
    siteName: 'GigConnect',
    title: 'GigConnect | Connect with the Beat of Botswana',
    description: 'Find talent, discover gigs, and buy tickets for the best events in Botswana.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'GigConnect Botswana',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GigConnect | Botswana Musical Talent Hub',
    description: 'Discover the best talent and events in Botswana.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen bg-background">
        <FirebaseClientProvider>
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
