import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft } from 'lucide-react';
import { AppFooter } from './AppFooter';
import { MediaGeneratorFloat } from './mediagenerator/MediaGeneratorFloat';
import { ChatwootWidget } from './ChatwootWidget';
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
            {/* Logo — links back to the main site */}
            <Link
              to="/"
              className="flex items-center hover:opacity-80 transition-opacity"
              title="Back to BitPopArt site"
            >
              <img
                src={BitPopArtLogo}
                alt="BitPopArt"
                className="h-9 w-9 rounded-lg"
              />
            </Link>

            {/* Store badges + ← Site button */}
            <div className="flex items-center gap-2">
              <TooltipProvider>
                {/* Zapstore */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href="https://zapstore.dev/apps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-1 rounded-lg border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-all"
                    >
                      <img
                        src="https://zapstore.dev/images/logo.svg"
                        alt="Zapstore"
                        className="h-4 w-4"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <span className="text-[10px] font-bold text-yellow-700 dark:text-yellow-300 hidden sm:inline">Zapstore</span>
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">Get on Zapstore</p>
                  </TooltipContent>
                </Tooltip>

                {/* Google Play — coming soon */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60 cursor-default select-none">
                      {/* Google Play icon */}
                      <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3.18 23.76c.37.21.8.22 1.18.03l11.62-6.55-2.6-2.6-10.2 9.12zM.5 1.63C.19 1.98 0 2.52 0 3.22v17.56c0 .7.19 1.24.5 1.59l.08.08L9.91 12v-.22L.58 1.55.5 1.63zM20.33 10.3l-2.62-1.48-2.94 2.94 2.94 2.94 2.65-1.49c.76-.43.76-1.48-.03-1.91zM4.36.21L15.98 6.76l-2.6 2.6L3.18.24C3.56.05 3.99.06 4.36.21z" />
                      </svg>
                      <span className="text-[10px] font-bold text-gray-500 hidden sm:inline">Play</span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">Google Play — coming soon</p>
                  </TooltipContent>
                </Tooltip>

                {/* App Store — coming soon */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60 cursor-default select-none">
                      {/* Apple icon */}
                      <svg className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                      </svg>
                      <span className="text-[10px] font-bold text-gray-500 hidden sm:inline">iOS</span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">App Store — coming soon</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

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
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <AppFooter />

      {/* Media Generator floating action buttons */}
      <MediaGeneratorFloat />
      {/* Chatwoot live chat widget */}
      <ChatwootWidget />
    </div>
  );
}
