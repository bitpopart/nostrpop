import { ReactNode } from 'react';
import { Navigation } from './Navigation';
import { Footer } from './Footer';
import { AuctionBanner } from './art/AuctionBanner';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--page-background)' }}>
      <Navigation />
      <AuctionBanner />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}