import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { AppFooter } from './AppFooter';
import { MediaGeneratorFloat } from './mediagenerator/MediaGeneratorFloat';
import BitPopArtLogo from '@/assets/bitpopart-logo.png';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 dark:from-gray-900 dark:via-orange-900/20 dark:to-yellow-900/20">
      {/* Simplified App Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            {/* Logo only */}
            <Link
              to="/app"
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <img
                src={BitPopArtLogo}
                alt="BitPopArt"
                className="h-9 w-9 rounded-lg"
              />
            </Link>

            {/* ← Site button */}
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full text-sm font-medium border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-900/20"
            >
              <Link to="/" className="flex items-center gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" />
                Site
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <AppFooter />

      {/* Media Generator floating action buttons */}
      <MediaGeneratorFloat />
    </div>
  );
}
