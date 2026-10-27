import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import Header from '@/components/Header';
import DailyCommunityVisit from '@/components/DailyCommunityVisit';

export const metadata: Metadata = {
  title: 'Communauté Le Revenu',
  description: 'Échangez sur la bourse, l\'épargne, les impôts et la retraite.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <AuthProvider>
          <DailyCommunityVisit />
          <Header />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}