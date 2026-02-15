import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { ProjectData } from '@/lib/projectTypes';

const ADMIN_PUBKEY = '7d33ba57d8a6e8869a1f1d5215254597594ac0dbfeb01b690def8c461b82db35';

// Built-in projects
const BUILTIN_PROJECTS = [
  {
    id: '21k-art',
    name: '21K Art',
    description: 'Exclusive artwork collection priced at 21,000 sats',
    thumbnail: '',
    url: '/21k-art',
    order: 1,
  },
  {
    id: '100m-canvas',
    name: '100M Canvas',
    description: 'Collaborative pixel art on a massive canvas',
    thumbnail: '',
    url: '/canvas',
    order: 2,
  },
  {
    id: 'cards',
    name: 'POP Cards',
    description: 'Create and share beautiful Good Vibes cards',
    thumbnail: '',
    url: '/cards',
    order: 3,
  },
];

export function useFeaturedProjects() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['projects-featured'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      // Fetch built-in project customizations
      const builtInEvents = await nostr.query(
        [{ kinds: [36171], authors: [ADMIN_PUBKEY], '#t': ['builtin-project'], limit: 10 }],
        { signal }
      );

      // Apply custom thumbnails to built-in projects
      console.log('[useFeaturedProjects] Found built-in customizations:', builtInEvents.length);
      
      const builtInWithThumbnails = BUILTIN_PROJECTS.map(project => {
        const customization = builtInEvents.find(e => e.tags.find(t => t[0] === 'd')?.[1] === project.id);
        const customThumbnail = customization?.tags.find(t => t[0] === 'image')?.[1];
        
        console.log(`[useFeaturedProjects] Project ${project.id}: ${customThumbnail ? `has thumbnail: ${customThumbnail.substring(0, 50)}...` : 'NO THUMBNAIL'}`);
        
        return {
          ...project,
          thumbnail: customThumbnail || project.thumbnail,
          author_pubkey: ADMIN_PUBKEY,
          created_at: new Date().toISOString(),
          featured: true,
        };
      });

      // Fetch custom featured projects
      const events = await nostr.query(
        [{ kinds: [36171], authors: [ADMIN_PUBKEY], '#t': ['bitpopart-project'], '#featured': ['true'], limit: 10 }],
        { signal }
      );

      const customProjects: ProjectData[] = events
        .map((event): ProjectData | null => {
          try {
            const content = JSON.parse(event.content);
            const id = event.tags.find(t => t[0] === 'd')?.[1];
            const name = event.tags.find(t => t[0] === 'name')?.[1] || content.name;
            const thumbnail = event.tags.find(t => t[0] === 'image')?.[1] || content.thumbnail;
            const url = event.tags.find(t => t[0] === 'r')?.[1] || content.url;
            const order = event.tags.find(t => t[0] === 'order')?.[1];
            const featured = event.tags.find(t => t[0] === 'featured')?.[1] === 'true';

            if (!id || !name || !featured) return null;

            return {
              id,
              event,
              name,
              description: content.description || '',
              thumbnail: thumbnail || '',
              url,
              author_pubkey: event.pubkey,
              created_at: new Date(event.created_at * 1000).toISOString(),
              order: order ? parseInt(order) : 999,
              featured,
            };
          } catch {
            return null;
          }
        })
        .filter((p): p is ProjectData => p !== null);

      // Combine built-in and custom projects, sort by order, take first 3
      const allProjects = [...builtInWithThumbnails, ...customProjects]
        .sort((a, b) => (a.order || 999) - (b.order || 999))
        .slice(0, 3);

      return allProjects;
    },
  });
}
