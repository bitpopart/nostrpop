import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { LogOut, Lock, AlertCircle } from 'lucide-react';
import {
  getPageBySlug, getPages, sessionCanAccessPage, getSession, clearSession,
  type ClientPage,
} from '@/lib/clientPortal';
import BrandGuideContent from './BrandGuideContent';
import { DesignSection } from '@/components/portal/DesignSection';

// ─── Portal shell ─────────────────────────────────────────────────────────────

export default function ClientPortalPage() {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<ClientPage | null | 'loading'>('loading');
  const [access, setAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      const dest = slug ? `/login?redirect=/client/${slug}` : '/login';
      navigate(dest, { replace: true });
      return;
    }

    if (!slug) {
      // No slug — show a list of pages the session has access to
      setPage(null);
      setAccess(true);
      return;
    }

    const found = getPageBySlug(slug);
    if (!found) {
      setPage(null);
      setAccess(false);
      return;
    }

    if (!sessionCanAccessPage(found.id)) {
      setPage(found);
      setAccess(false);
      return;
    }

    setPage(found);
    setAccess(true);
  }, [slug, navigate]);

  const handleLogout = () => {
    clearSession();
    navigate('/login', { replace: true });
  };

  if (page === 'loading') return null;

  // ── No slug: show index of accessible pages ──────────────────────────────
  if (!slug) {
    const session = getSession();
    const allPages = getPages().filter(p => p.active && session?.pageIds.includes(p.id));
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-950/10 via-background to-orange-950/5 px-4 py-12">
        <div className="max-w-xl mx-auto space-y-6">
          <PortalHeader onLogout={handleLogout} />
          <h1 className="text-2xl font-black">Your Portal</h1>
          <p className="text-sm text-muted-foreground">Select a page below to view your designs.</p>
          <div className="space-y-3">
            {allPages.map(p => (
              <Card key={p.id} className="border-orange-200 dark:border-orange-800 hover:shadow-lg transition cursor-pointer" onClick={() => navigate(`/client/${p.slug}`)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold">{p.title}</p>
                    {p.description && <p className="text-sm text-muted-foreground mt-0.5">{p.description}</p>}
                  </div>
                  <Badge className="bg-orange-500 text-white shrink-0">View →</Badge>
                </CardContent>
              </Card>
            ))}
            {allPages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No pages available yet.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Access denied ────────────────────────────────────────────────────────
  if (!access) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-950/10 via-background to-orange-950/5 px-4">
        <div className="max-w-sm mx-auto text-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertCircle className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="text-xl font-black">Access Denied</h1>
          <p className="text-sm text-muted-foreground">
            {page ? `You don't have access to "${(page as ClientPage).title}".` : 'This page does not exist.'}
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => navigate('/client')}>My Portal</Button>
            <Button onClick={handleLogout} variant="ghost" className="gap-1.5 text-muted-foreground">
              <LogOut className="h-3.5 w-3.5" /> Log out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const activePage = page as ClientPage;

  // ── Render the page's sections ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-950/10 via-background to-orange-950/5">
      <PortalHeader onLogout={handleLogout} pageTitle={activePage.title} />

      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-4">
        <div>
          <h1 className="text-2xl font-black">{activePage.title}</h1>
          {activePage.description && (
            <p className="text-sm text-muted-foreground mt-1">{activePage.description}</p>
          )}
        </div>

        {activePage.sections.map(section => (
          <SectionRenderer
            key={section}
            sectionId={section}
            pageId={activePage.id}
            clientLabel={activePage.title}
          />
        ))}

        {activePage.sections.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <Lock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Content coming soon.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── Portal header bar ────────────────────────────────────────────────────────

function PortalHeader({ onLogout, pageTitle }: { onLogout: () => void; pageTitle?: string }) {
  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
      <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-4xl">
        <div className="flex items-center gap-2">
          <img
            src="/bitpopart-logo.svg"
            alt="BitPopArt"
            className="h-7 w-auto"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground">Client Portal</span>
            {pageTitle && (
              <>
                <span className="text-muted-foreground/40">/</span>
                <span className="font-semibold text-foreground truncate max-w-[200px]">{pageTitle}</span>
              </>
            )}
          </div>
          <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-300 dark:border-orange-700 ml-1">
            <Lock className="h-2.5 w-2.5 mr-1" />Private
          </Badge>
        </div>
        <Button size="sm" variant="ghost" onClick={onLogout} className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground">
          <LogOut className="h-3 w-3" /> Log out
        </Button>
      </div>
    </div>
  );
}

// ─── Section router ───────────────────────────────────────────────────────────

function SectionRenderer({
  sectionId,
  pageId,
  clientLabel,
}: {
  sectionId: string;
  pageId: string;
  clientLabel?: string;
}) {
  switch (sectionId) {
    case 'brand-guide':
      return <BrandGuideContent allowZip={true} />;
    case 'designs':
      return <DesignSection pageId={pageId} clientLabel={clientLabel} />;
    default:
      return (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Unknown section: {sectionId}
          </CardContent>
        </Card>
      );
  }
}
