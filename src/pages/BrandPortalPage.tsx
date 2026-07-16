/**
 * BrandPortalPage — /brand
 *
 * The brand guide is no longer public. Visitors must have an active Client
 * Portal session with access to a page that includes the "brand-guide" section.
 *
 * Unauthenticated users are sent to /login?redirect=/brand.
 * Authenticated users whose session doesn't include any brand-guide page
 * see an "access denied" screen.
 *
 * The old /brand-guide URL is redirected here via AppRouter.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Lock, AlertCircle } from 'lucide-react';
import {
  getSession, clearSession, getPages, sessionCanAccessPage,
} from '@/lib/clientPortal';
import BrandGuideContent from './BrandGuideContent';

export default function BrandPortalPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'ok' | 'denied'>('loading');

  useEffect(() => {
    const session = getSession();

    // No session → send to login
    if (!session) {
      navigate('/login?redirect=/brand', { replace: true });
      return;
    }

    // Check whether the session has access to at least one page that contains
    // the "brand-guide" section
    const pages = getPages();
    const hasBrandAccess = pages.some(
      p => p.active && p.sections.includes('brand-guide') && sessionCanAccessPage(p.id)
    );

    setStatus(hasBrandAccess ? 'ok' : 'denied');
  }, [navigate]);

  const handleLogout = () => {
    clearSession();
    navigate('/login', { replace: true });
  };

  if (status === 'loading') return null;

  if (status === 'denied') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-950/10 via-background to-orange-950/5 px-4">
        <div className="max-w-sm mx-auto text-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertCircle className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="text-xl font-black">Access Denied</h1>
          <p className="text-sm text-muted-foreground">
            You don't have access to the Brand Guide. Contact BitPopArt for an access code.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => navigate('/client')}>My Portal</Button>
            <Button variant="ghost" onClick={handleLogout} className="gap-1.5 text-muted-foreground">
              <LogOut className="h-3.5 w-3.5" /> Log out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-950/10 via-background to-orange-950/5">

      {/* Sticky portal header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-3xl">
          <div className="flex items-center gap-2">
            <img
              src="/bitpopart-logo.svg"
              alt="BitPopArt"
              className="h-7 w-auto"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-muted-foreground">Client Portal</span>
              <span className="text-muted-foreground/40">/</span>
              <span className="font-semibold text-foreground">Brand Guide</span>
            </div>
            <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-300 dark:border-orange-700 ml-1">
              <Lock className="h-2.5 w-2.5 mr-1" />Private
            </Badge>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleLogout}
            className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-3 w-3" /> Log out
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
          <img
            src="/bitpopart-logo.svg"
            alt="BitPopArt"
            className="h-16 w-auto"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div>
            <h1 className="text-3xl font-black tracking-tight">Brand Guide</h1>
            <p className="text-muted-foreground text-sm mt-1">
              BitPopArt · Bitcoin Pop Art · Complete UI/UX &amp; Visual Identity Kit
            </p>
          </div>
        </div>

        <BrandGuideContent allowZip={true} />
      </div>
    </div>
  );
}
