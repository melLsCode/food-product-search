import type { Metadata, Viewport } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Food Product Search',
  description:
    'Search packaged food products and explore ingredients, categories, and nutrition information.',
};

/**
 * Prevents iOS Safari from zooming when a text input is focused, without
 * disabling pinch-zoom, which would be an accessibility regression.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // The selected language is a search parameter rather than a route segment, so
    // the document language is set per page by the pages that know it.
    <html lang="en">
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
