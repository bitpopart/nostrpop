import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { ProjectData } from '@/lib/projectTypes';
import { getAdminPubkeyHex } from '@/lib/adminUtils';

const BASE = typeof import.meta !== 'undefined' ? (import.meta.env?.BASE_URL ?? '/') : '/';

// Built-in projects
const BUILTIN_PROJECTS = [
  {
    id: '21k-art',
    name: '21K Art',
    description: 'Exclusive artwork collection priced at 21,000 sats',
    thumbnail: `${BASE}Art_button_1.svg`,
    gradient: 'from-yellow-400 via-orange-400 to-pink-500',
    emoji: '₿',
    url: '/21k-art',
    order: 1,
  },
  {
    id: '100m-canvas',
    name: '100M Canvas',
    description: 'Collaborative pixel art on a massive canvas',
    thumbnail: `${BASE}spray_paint_icon.svg`,
    gradient: 'from-cyan-400 via-blue-500 to-purple-600',
    emoji: '🎨',
    url: '/canvas',
    order: 2,
  },
  {
    id: 'cards',
    name: 'POP Cards',
    description: 'Create and share beautiful Good Vibes cards',
    thumbnail: `${BASE}PopUP_button_1.svg`,
    gradient: 'from-pink-400 via-rose-400 to-fuchsia-500',
    emoji: '💝',
    url: '/cards',
    order: 3,
  },
  {
    id: 'free-downloads',
    name: 'Free Downloads',
    description: 'Free images and art — download and use however you like!',
    thumbnail: `${BASE}Art_button_1.svg`,
    gradient: 'from-green-400 via-teal-400 to-cyan-500',
    emoji: '🎁',
    url: '/free',
    order: 4,
  },
  {
    id: 'games',
    name: 'Games',
    description: 'Bitcoin and pop art inspired games',
    thumbnail: `${BASE}projects_button_1.svg`,
    gradient: 'from-violet-500 via-fuchsia-500 to-pink-500',
    emoji: '🎮',
    url: '/games',
    order: 5,
  },
  {
    id: 'animations',
    name: 'Animations',
    description: 'Animated pop art and motion graphics',
    thumbnail: `${BASE}projects_button_1.svg`,
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
    emoji: '🎬',
    url: '/animations',
    order: 6,
  },
];

export function useFeaturedProjects(options?: { enabled?: boolean }) {
  const { nostr } = useNostr();
  const adminPubkey = getAdminPubkeyHex();

  return useQuery({
    queryKey: ['projects-featured', adminPubkey],
    enabled: options?.enabled !== false,
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      // Fetch built-in project customizations
      const builtInEvents = await nostr.query(
        [{ kinds: [36171], authors: [adminPubkey], '#t': ['builtin-project'], limit: 10 }],
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
          author_pubkey: adminPubkey,
          created_at: new Date().toISOString(),
          featured: true,
        };
      });

      // Fetch custom featured projects
      const events = await nostr.query(
        [{ kinds: [36171], authors: [adminPubkey], '#t': ['bitpopart-project'], '#featured': ['true'], limit: 10 }],
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
    enabled: !!adminPubkey,
  });
}
