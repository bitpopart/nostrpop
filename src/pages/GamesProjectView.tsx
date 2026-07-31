import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useSeoMeta } from '@unhead/react';
import { Skeleton } from '@/components/ui/skeleton';
import { nip19 } from 'nostr-tools';

const ADMIN_NPUB = 'npub1gwa27rpgum8mr9d30msg8cv7kwj2lhav2nvmdwh3wqnsa5vnudxqlta2sz';
const ADMIN_PUBKEY = nip19.decode(ADMIN_NPUB).data as string;

const htmlCache = new Map<string, string>();

export default function GamesProjectView() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { nostr } = useNostr();

  const { data: project, isLoading } = useQuery({
    queryKey: ['games-project', projectId],
    queryFn: async (c) => {
      if (!projectId) return null;
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      const events = await nostr.query(
        [{
          kinds: [36171],
          authors: [ADMIN_PUBKEY],
          '#d': [projectId],
          '#t': ['bitpopart-project'],
          limit: 1,
        }],
        { signal }
      );
      return events[0] ?? null;
    },
    enabled: !!projectId,
  });

  const brandSiteUrl = project?.tags.find(t => t[0] === 'brand-site')?.[1];
  const gameName = project?.tags.find(t => t[0] === 'name')?.[1] ?? 'Game';

  const [fetchedHtml, setFetchedHtml] = useState<string | null>(
    () => (brandSiteUrl ? htmlCache.get(brandSiteUrl) ?? null : null)
  );
  const [fetchingHtml, setFetchingHtml] = useState(false);
  const fetchingUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!brandSiteUrl) return;
    if (htmlCache.has(brandSiteUrl)) { setFetchedHtml(htmlCache.get(brandSiteUrl)!); return; }
    if (fetchingUrlRef.current === brandSiteUrl) return;
    fetchingUrlRef.current = brandSiteUrl;
    setFetchingHtml(true);
    fetch(brandSiteUrl)
      .then(r => r.text())
      .then(html => { htmlCache.set(brandSiteUrl, html); setFetchedHtml(html); setFetchingHtml(false); })
      .catch(() => setFetchingHtml(false));
  }, [brandSiteUrl]);

  useSeoMeta({
    title: project ? `${gameName} — BitPopArt Games` : 'BitPopArt Games',
  });

  if (isLoading || (fetchingHtml && !fetchedHtml)) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center space-y-2">
          <div className="animate-bounce text-5xl">🎮</div>
          <p className="font-bold text-xl text-violet-600" style={{ letterSpacing: '2px' }}>LOADING…</p>
        </div>
      </div>
    );
  }

  if (!project || !brandSiteUrl) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Game not found.</p>
          <button
            className="text-sm underline text-orange-600"
            onClick={() => navigate('/games')}
          >
            ← Back to Games
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col w-full" style={{ minHeight: 0 }}>
      {fetchedHtml ? (
        <iframe
          srcDoc={fetchedHtml}
          title={gameName}
          className="w-full flex-1 border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      ) : (
        <iframe
          src={brandSiteUrl}
          title={gameName}
          className="w-full flex-1 border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      )}
    </div>
  );
}
