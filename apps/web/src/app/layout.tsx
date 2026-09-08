import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Food Product Search',
  description: 'Search packaged food products from Open Food Facts.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // The selected language is a search parameter rather than a route segment, so
    // the document language is set per page by the pages that know it.
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900 antialiased">{children}</body>
    </html>
  );
}
