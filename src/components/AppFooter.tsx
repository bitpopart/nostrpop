import { Link } from 'react-router-dom';
import { useSocialMediaLinks } from '@/hooks/usePages';
import { Button } from '@/components/ui/button';
import { Users, Zap, ShoppingBag, MessageCircleQuestion } from 'lucide-react';
import BitPopArtLogo from '@/assets/bitpopart-logo.png';

export function AppFooter() {
  const { data: socialLinks = [] } = useSocialMediaLinks();

  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-8">
      <div className="container mx-auto px-4 py-8 max-w-xl">

        {/* Brand */}
        <div className="flex items-center gap-3 mb-2">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <img src={BitPopArtLogo} alt="BitPopArt" className="h-10 w-10 rounded-lg" />
          </Link>
          <div>
            <Link to="/" className="hover:opacity-80 transition-opacity">
              <img
                src="/bitpopart-text-logo.svg"
                alt="BitPopArt"
                className="h-5 dark:invert"
              />
            </Link>
            <p className="text-xs text-muted-foreground mt-0.5">Love, Freedom &amp; Joy</p>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-2 mb-4">
          {/* BitPopArt on Nostr */}
          <Button
            asChild
            size="sm"
            variant="outline"
            className="w-full justify-start text-xs border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/20"
          >
            <a
              href="https://primal.net/p/npub1gwa27rpgum8mr9d30msg8cv7kwj2lhav2nvmdwh3wqnsa5vnudxqlta2sz"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Users className="h-3 w-3 mr-1.5 text-purple-500" />
              BitPopArt on Nostr
            </a>
          </Button>

          {/* ⚡ Support */}
          <Button
            asChild
            size="sm"
            variant="outline"
            className="w-full justify-start text-xs border-yellow-200 hover:bg-yellow-50 dark:border-yellow-800 dark:hover:bg-yellow-900/20"
          >
            <a href="lightning:bitpopart@rizful.com" target="_blank" rel="noopener noreferrer">
              <Zap className="h-3 w-3 mr-1.5 text-yellow-500" />
              ⚡ Support
            </a>
          </Button>

          {/* Shop */}
          <Button
            asChild
            size="sm"
            variant="outline"
            className="w-full justify-start text-xs border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-900/20"
          >
            <Link to="/shop">
              <ShoppingBag className="h-3 w-3 mr-1.5 text-orange-500" />
              Shop
            </Link>
          </Button>
        </div>

        {/* Social icons */}
        {socialLinks.length > 0 && (
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            {socialLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-2xl hover:scale-110 transition-transform"
                title={link.platform}
              >
                {link.icon}
              </a>
            ))}
          </div>
        )}

        {/* Community Support button */}
        <div className="mb-6">
          <Button
            asChild
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl"
          >
            <Link to="/community" className="flex items-center justify-center gap-2">
              <MessageCircleQuestion className="h-4 w-4" />
              Community Support
            </Link>
          </Button>
        </div>

        {/* Copyright */}
        <div className="border-t pt-4 text-center space-y-1">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} BitPopArt. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Powered by{' '}
            <a
              href="https://nostr.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:underline"
            >
              Nostr Protocol
            </a>{' '}
            &amp; Bitcoin Lightning ⚡
          </p>
        </div>
      </div>
    </footer>
  );
}
