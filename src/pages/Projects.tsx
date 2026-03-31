import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ShareToNostrButton } from '@/components/ShareToNostrButton';
import { ClawstrShare } from '@/components/ClawstrShare';
import { ZapButton } from '@/components/ZapButton';
import { ShareDialog } from '@/components/share/ShareDialog';
import { Sparkles, ArrowRight, Users, Zap, Award, Share2, Image as ImageIcon } from 'lucide-react';
import { useNostrProjects } from '@/hooks/useNostrProjects';
import { useNIP58BadgeDefinitions, useNIP58BadgeAwards } from '@/hooks/useNIP58Badges';
import { nip19 } from 'nostr-tools';
import type { ProjectData } from '@/lib/projectTypes';

const ADMIN_NPUB = 'npub1gwa27rpgum8mr9d30msg8cv7kwj2lhav2nvmdwh3wqnsa5vnudxqlta2sz'; // BitPopArt admin
const ADMIN_PUBKEY = nip19.decode(ADMIN_NPUB).data as string;

// Built-in projects
const BUILTIN_PROJECTS = [
  {
    id: '21k-art',
    name: '21K Art',
    description: 'Exclusive artwork collection priced at 21,000 sats - celebrating Bitcoin\'s 21 million supply cap',
    thumbnail: '', // Will use default gradient
    url: '/21k-art',
    isBuiltIn: true,
  },
  {
    id: '100m-canvas',
    name: '100M Canvas',
    description: 'Collaborative pixel art project on a massive 100 million pixel canvas',
    thumbnail: '',
    url: '/canvas',
    isBuiltIn: true,
  },
  {
    id: 'cards',
    name: 'POP Cards',
    description: 'Create and share beautiful Good Vibes cards for any occasion',
    thumbnail: '',
    url: '/cards',
    isBuiltIn: true,
  },
];

export default function Projects() {
  const { nostr } = useNostr();
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const { getGradientStyle } = useThemeColors();
  const [_selectedProject, _setSelectedProject] = useState<string | null>(null);

  useSeoMeta({
    title: 'Projects - BitPopArt',
    description: 'Explore creative projects by BitPopArt including 21K Art, 100M Canvas, POP Cards and more',
  });

  // Fetch Nostr Projects (collaborative art)
  const { data: nostrProjects = [] } = useNostrProjects();

  // Fetch NIP-58 badge definitions (kind 30009)
  const { data: nip58Definitions = [] } = useNIP58BadgeDefinitions();
  const badgeAddrs = nip58Definitions.map(d => `30009:${d.pubkey}:${d.id}`);
  const { data: nip58Awards = [] } = useNIP58BadgeAwards(badgeAddrs);

  // Fetch built-in project customizations
  const { data: builtInCustomizations = [] } = useQuery({
    queryKey: ['builtin-projects'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      console.log('[Projects] Fetching built-in project customizations...');
      
      const events = await nostr.query(
        [{ kinds: [36171], authors: [ADMIN_PUBKEY], '#t': ['builtin-project'], limit: 10 }],
        { signal }
      );

      console.log('[Projects] Found built-in customizations:', events.length);
      events.forEach(e => {
        const id = e.tags.find(t => t[0] === 'd')?.[1];
        const image = e.tags.find(t => t[0] === 'image')?.[1];
        console.log(`  - ${id}: ${image ? 'has thumbnail' : 'no thumbnail'}`);
      });

      return events;
    },
  });

  // Fetch custom projects from Nostr
  const { data: customProjects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      const events = await nostr.query(
        [{ kinds: [36171], authors: [ADMIN_PUBKEY], '#t': ['bitpopart-project'], limit: 50 }],
        { signal }
      );

      const projects: ProjectData[] = events
        .map((event): ProjectData | null => {
          try {
            const content = JSON.parse(event.content);
            const id = event.tags.find(t => t[0] === 'd')?.[1];
            const name = event.tags.find(t => t[0] === 'name')?.[1] || content.name;
            const thumbnail = event.tags.find(t => t[0] === 'image')?.[1] || content.thumbnail;
            const url = event.tags.find(t => t[0] === 'r')?.[1] || content.url;
            const order = event.tags.find(t => t[0] === 'order')?.[1];
            const featured = event.tags.find(t => t[0] === 'featured')?.[1] === 'true';
            const comingSoon = event.tags.find(t => t[0] === 'coming-soon')?.[1] === 'true';

            if (!id || !name) return null;

            return {
              id,
              event,
              name,
              description: content.description || '',
              thumbnail: thumbnail || '',
              url,
              author_pubkey: event.pubkey,
              created_at: new Date(event.created_at * 1000).toISOString(),
              order: order ? parseInt(order) : undefined,
              featured,
              coming_soon: comingSoon,
            };
          } catch {
            return null;
          }
        })
        .filter((p): p is ProjectData => p !== null)
        .sort((a, b) => (a.order || 999) - (b.order || 999));

      return projects;
    },
  });

  // Apply custom thumbnails to built-in projects
  const builtInProjectsWithThumbnails = BUILTIN_PROJECTS.map(project => {
    const customization = builtInCustomizations.find(e => e.tags.find(t => t[0] === 'd')?.[1] === project.id);
    const customThumbnail = customization?.tags.find(t => t[0] === 'image')?.[1];
    
    console.log(`[Projects] Built-in project ${project.id}: ${customThumbnail ? 'custom thumbnail' : 'default gradient'}`);
    
    return {
      ...project,
      thumbnail: customThumbnail || project.thumbnail,
    };
  });

  // Combine built-in and custom projects
  const allProjects = [...builtInProjectsWithThumbnails, ...customProjects];

  const handleProjectClick = (project: typeof BUILTIN_PROJECTS[0] | ProjectData) => {
    // Prevent navigation for coming soon projects
    if ('coming_soon' in project && project.coming_soon) {
      return;
    }
    
    if ('isBuiltIn' in project && project.isBuiltIn) {
      navigate(project.url);
    } else if ('url' in project && project.url) {
      if (project.url.startsWith('http')) {
        window.open(project.url, '_blank');
      } else {
        navigate(project.url);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4 gap-3">
            <img 
              src={`${import.meta.env.BASE_URL || '/'}projects_button_1.svg`} 
              alt="Projects" 
              className="h-12 w-12 flex-shrink-0" 
            />
            <h1 className="text-5xl font-bold leading-tight gradient-header-text">
              Projects
            </h1>
          </div>
        </div>

        {/* Regular Projects Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardHeader className="space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {allProjects.map((project, index) => {
              const isComingSoon = 'coming_soon' in project && project.coming_soon;
              
              return (
              <Card
                key={project.id}
                className={`group overflow-hidden transition-all duration-300 bg-white dark:bg-gray-800 ${
                  isComingSoon 
                    ? 'cursor-default' 
                    : 'cursor-pointer hover:shadow-2xl'
                }`}
                onClick={() => handleProjectClick(project)}
              >
                {/* Thumbnail */}
                <div className="relative h-56 overflow-hidden">
                  {project.thumbnail ? (
                    <img
                      src={project.thumbnail}
                      alt={project.name}
                      className={`w-full h-full object-cover transition-transform duration-500 ${
                        isComingSoon ? 'opacity-60' : 'group-hover:scale-110'
                      }`}
                    />
                  ) : (
                    <div 
                      className="w-full h-full bg-gradient-to-br from-purple-400 via-pink-400 to-indigo-400 dark:from-purple-600 dark:via-pink-600 dark:to-indigo-600 flex items-center justify-center"
                      style={{
                        backgroundImage: `linear-gradient(135deg, 
                          ${['#a855f7', '#ec4899', '#6366f1', '#8b5cf6', '#f472b6'][index % 5]} 0%, 
                          ${['#ec4899', '#6366f1', '#8b5cf6', '#f472b6', '#a855f7'][index % 5]} 100%)`,
                        opacity: isComingSoon ? 0.6 : 1
                      }}
                    >
                      <span className="text-6xl opacity-90">
                        {index === 0 ? '⚡' : index === 1 ? '🎨' : index === 2 ? '💝' : '✨'}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Coming Soon Badge Overlay */}
                  {isComingSoon && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Badge 
                        className="text-white text-lg px-4 py-2 border-0 shadow-lg"
                        style={getGradientStyle('coming-soon')}
                      >
                        Coming Soon
                      </Badge>
                    </div>
                  )}
                  
                  {/* Hover overlay (only for non-coming-soon projects) */}
                  {!isComingSoon && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button
                        variant="secondary"
                        size="lg"
                        className="gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProjectClick(project);
                        }}
                      >
                        Explore Project
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Content */}
                <CardHeader>
                  <CardTitle className="text-2xl group-hover:text-orange-600 transition-colors flex items-center justify-between gap-2 flex-wrap">
                    <span>{project.name}</span>
                    <div className="flex items-center gap-2">
                      {isComingSoon && (
                        <Badge className="bg-gradient-to-r from-orange-100 to-pink-100 dark:from-orange-900/30 dark:to-pink-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-pink-700 text-xs">
                          Coming Soon
                        </Badge>
                      )}
                    </div>
                  </CardTitle>
                  <CardDescription className="line-clamp-3 text-base">
                    {project.description}
                  </CardDescription>
                  {/* Share Button */}
                  {!isComingSoon && (
                    <div className="pt-3" onClick={(e) => e.stopPropagation()}>
                      <ShareDialog
                        title={project.name}
                        description={project.description}
                        url={project.url?.startsWith('http') ? project.url : `${window.location.origin}${project.url || `/projects#${project.id}`}`}
                        imageUrl={project.thumbnail}
                        contentType="project"
                        eventRef={'event' in project ? {
                          id: project.event.id,
                          kind: project.event.kind,
                          pubkey: project.event.pubkey,
                          dTag: project.id
                        } : undefined}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Share Project
                        </Button>
                      </ShareDialog>
                    </div>
                  )}
                </CardHeader>
              </Card>
              );
            })}
          </div>

          {/* Nostr Projects Section */}
          {nostrProjects.length > 0 && (
            <div className="mt-16 max-w-6xl mx-auto">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-orange-600 mr-3" />
                  <h2 className="text-4xl font-bold gradient-header-text">
                    Nostr Projects
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nostrProjects.map((project) => {
                  const isComingSoon = project.coming_soon;
                  
                  return (
                  <Card
                    key={project.id}
                    className={`group overflow-hidden transition-all duration-300 bg-white dark:bg-gray-800 ${
                      isComingSoon 
                        ? 'cursor-default' 
                        : 'cursor-pointer hover:shadow-2xl'
                    }`}
                    onClick={() => !isComingSoon && navigate(`/nostr-projects/${project.id}`)}
                  >
                    {/* Thumbnail / Image Preview */}
                    <div className="relative h-56 overflow-hidden bg-gradient-to-br from-orange-100 to-pink-100 dark:from-orange-900/20 dark:to-pink-900/20">
                      {project.header_image ? (
                        <img
                          src={project.header_image}
                          alt={project.title}
                          className={`w-full h-full object-cover transition-transform duration-500 ${
                            isComingSoon ? 'opacity-60' : 'group-hover:scale-110'
                          }`}
                        />
                      ) : project.images.length > 0 ? (
                        <div className={`grid grid-cols-2 gap-1 h-full p-2 ${isComingSoon ? 'opacity-60' : ''}`}>
                          {project.images.slice(0, 4).map((img, index) => (
                            <div key={index} className="relative overflow-hidden rounded-lg">
                              <img
                                src={img}
                                alt=""
                                className={`w-full h-full object-cover transition-transform duration-500 ${
                                  isComingSoon ? '' : 'group-hover:scale-110'
                                }`}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full opacity-60">
                          <ImageIcon className="h-16 w-16 text-purple-300" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Coming Soon Badge Overlay */}
                      {isComingSoon && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <Badge 
                            className="text-white text-lg px-4 py-2 border-0 shadow-lg"
                            style={getGradientStyle('coming-soon')}
                          >
                            Coming Soon
                          </Badge>
                        </div>
                      )}
                      
                      {/* Badge Thumbnail (top left) */}
                      {project.badge_naddr && project.badge_image && (
                        <a
                          href={`https://badges.page/a/${project.badge_naddr}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute top-2 left-2 z-10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="relative group/badge">
                            <img
                              src={project.badge_image}
                              alt="Project badge"
                              className="w-16 h-16 rounded-full border-4 border-white dark:border-gray-800 shadow-lg hover:scale-110 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover/badge:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                              <Award className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        </a>
                      )}
                      
                      {/* Zap button overlay (only for non-coming-soon projects) */}
                      {!isComingSoon && project.event && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div onClick={(e) => e.stopPropagation()}>
                            <ZapButton
                              authorPubkey={project.event.pubkey}
                              event={project.event}
                              eventTitle={project.title}
                              size="sm"
                              variant="default"
                              className="bg-orange-600 hover:bg-orange-700 text-white border-0 shadow-lg h-8 w-8 p-0"
                              showLabel={false}
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Hover overlay (only for non-coming-soon projects) */}
                      {!isComingSoon && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Button
                            variant="secondary"
                            size="lg"
                            className="gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/nostr-projects/${project.id}`);
                            }}
                          >
                            Join Project
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <CardTitle className="text-2xl group-hover:text-orange-600 transition-colors flex-1">
                          {project.title}
                        </CardTitle>
                        {isAdmin && project.event && (
                          <div className="flex gap-1">
                            <ShareToNostrButton
                              url={`/nostr-projects/${project.id}`}
                              title={project.title}
                              description={project.description}
                              image={project.images[0]}
                              variant="ghost"
                              size="icon"
                            />
                            <ClawstrShare
                              event={project.event}
                              contentType="project"
                              trigger={
                                <Button variant="ghost" size="icon">
                                  <Share2 className="h-4 w-4" />
                                </Button>
                              }
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="default" className="gap-1">
                          <Zap className="h-3 w-3" />
                          {project.price_sats.toLocaleString()}
                        </Badge>
                        {isComingSoon && (
                          <Badge className="bg-gradient-to-r from-orange-100 to-pink-100 dark:from-orange-900/30 dark:to-pink-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-pink-700 text-xs">
                            Coming Soon
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="line-clamp-3 text-base">
                        {project.description}
                      </CardDescription>
                      <div className="flex items-center gap-2 pt-2">
                        <Badge variant="outline" className="gap-1">
                          <Sparkles className="h-3 w-3" />
                          {project.images.length} images
                        </Badge>
                        <Badge variant="secondary">Collaborative</Badge>
                      </div>
                    </CardHeader>
                  </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Badges Section — always shown under Nostr Projects */}
          <div className="mt-16 max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <Award className="h-8 w-8 text-purple-600 mr-3" />
                <h2 className="text-4xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Nostr Badges
                </h2>
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Exclusive NIP-58 badges by BitPopArt — collect &amp; display on your Nostr profile
              </p>
            </div>

            {nip58Definitions.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {nip58Definitions.slice(0, 6).map((def) => {
                    const thumb =
                      def.thumbs.find(t => t.size === '256x256')?.url ??
                      def.thumbs[0]?.url ??
                      def.image;
                    const coord = `30009:${def.pubkey}:${def.id}`;
                    const awardeeCount = new Set(
                      nip58Awards.filter(a => a.badgeAddr === coord).flatMap(a => a.awardees)
                    ).size;

                    return (
                      <Card
                        key={def.id}
                        className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800"
                        onClick={() => navigate('/badges')}
                      >
                        {/* Badge Image */}
                        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={def.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Award className="h-10 w-10 text-purple-300" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>

                        {/* Content */}
                        <CardHeader className="pb-3 pt-3">
                          <CardTitle className="text-sm group-hover:text-purple-600 transition-colors truncate">
                            {def.name}
                          </CardTitle>
                          {awardeeCount > 0 && (
                            <Badge variant="outline" className="gap-1 w-fit text-xs">
                              <Users className="h-3 w-3" />
                              {awardeeCount}
                            </Badge>
                          )}
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>

                <div className="text-center mt-6">
                  <Button
                    className="gap-2 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-700 hover:via-purple-700 hover:to-indigo-700 text-white border-0"
                    onClick={() => navigate('/badges')}
                  >
                    <Award className="h-4 w-4" />
                    View All Badges
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <Card
                className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-800/80 border-dashed border-purple-200 dark:border-purple-800 max-w-sm mx-auto"
                onClick={() => navigate('/badges')}
              >
                <CardContent className="py-10 text-center space-y-3">
                  <Award className="h-12 w-12 mx-auto text-purple-400" />
                  <p className="font-semibold text-purple-700 dark:text-purple-300">Nostr Badges</p>
                  <p className="text-sm text-muted-foreground">
                    Exclusive NIP-58 badges — collect &amp; show on your profile
                  </p>
                  <Badge
                    variant="secondary"
                    className="gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                  >
                    <Sparkles className="h-3 w-3" />
                    Explore Badges
                    <ArrowRight className="h-3 w-3" />
                  </Badge>
                </CardContent>
              </Card>
            )}
          </div>
        </>
        )}

        {/* Footer */}
        <div className="text-center mt-16 text-sm text-gray-500 dark:text-gray-400">
          <p>Nostr & BitPopArt {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}
