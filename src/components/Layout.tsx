import { lazy, ReactNode, Suspense } from 'react';
import { Navigation } from './Navigation';
import { Footer } from './Footer';
import { AuctionBanner } from './art/AuctionBanner';
import { SiteBannerBar } from './SiteBannerBar';
// Floating buttons are not needed for the first paint, so they load afterwards.
const MediaGeneratorFloat = lazy(() => import('./mediagenerator/MediaGeneratorFloat').then((m) => ({ default: m.MediaGeneratorFloat })));
const FloatingChatButton = lazy(() => import('./FloatingChatButton').then((m) => ({ default: m.FloatingChatButton })));

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--page-background)' }}>
      <Navigation />
      {/* AuctionBanner shows when there are live auctions */}
      <AuctionBanner />
      {/* SiteBannerBar shows the active site banner; hides itself when auction is live */}
      <SiteBannerBar />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="flex min-h-[60vh] items-center justify-center">
              <img src="/bitpopart-logo.png" alt="" width={56} height={56} className="animate-pulse rounded-full" />
            </div>
          }
        >
          {children}
        </Suspense>
      </main>
      <Footer />
      {/* Media Generator floating action buttons — shown per page config */}
      <Suspense fallback={null}>
        <MediaGeneratorFloat />
        {/* Floating chat button */}
        <FloatingChatButton />
      </Suspense>
    </div>
  );
}