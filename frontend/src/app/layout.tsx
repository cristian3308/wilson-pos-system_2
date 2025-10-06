import './globals-simple.css';
import type { Metadata } from 'next';
import { Inter, Fira_Code } from 'next/font/google';
import { Providers } from '../components/providers/Providers';
import { Toaster } from 'react-hot-toast';
import { GlobalBarcodeScanner } from '../components/GlobalBarcodeScanner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-fira-code',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Wilson Cars & Wash | Sistema POS Profesional',
    template: '%s | Wilson Cars & Wash',
  },
  description: 'Sistema profesional de punto de venta con gestión de parqueadero y lavadero de vehículos Wilson Cars & Wash. Diseñado para eficiencia y modernidad.',
  keywords: [
    'Wilson Cars & Wash',
    'POS',
    'punto de venta',
    'parqueadero',
    'lavadero',
    'gestión empresarial',
    'sistema integral',
    'vehículos',
    'tickets',
    'reportes',
    'dashboard'
  ],
  authors: [{ name: 'POS Professional Team' }],
  creator: 'POS Professional',
  publisher: 'POS Professional',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: '/',
    title: 'POS Professional | Sistema de Gestión Integral',
    description: 'Sistema profesional de punto de venta con gestión de parqueadero y lavadero de vehículos.',
    siteName: 'POS Professional',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'POS Professional Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'POS Professional | Sistema de Gestión Integral',
    description: 'Sistema profesional de punto de venta con gestión de parqueadero y lavadero de vehículos.',
    images: ['/images/twitter-image.jpg'],
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
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', sizes: '16x16', type: 'image/svg+xml' },
      { url: '/favicon.svg', sizes: '32x32', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/favicon.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/favicon.svg',
        color: '#2563eb',
      },
    ],
  },
  verification: {
    google: 'google-site-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="es" 
      className={`${inter.variable} ${firaCode.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#3b82f6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="POS Professional" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body 
        className={`${inter.className} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <div className="min-h-screen flex flex-col">
            {children}
          </div>
          <GlobalBarcodeScanner />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: '!bg-white dark:!bg-neutral-800 !text-neutral-900 dark:!text-neutral-100 !border !border-neutral-200 dark:!border-neutral-700 !shadow-elevation-2',
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#ffffff',
                },
              },
            }}
          />
        </Providers>
        
        {/* Loading scripts for better performance */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Theme detection script to prevent flash
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}