import { useState } from 'react';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ShareDialog } from '@/components/share/ShareDialog';
import { ArrowRight, Share2, Image as ImageIcon, ArrowLeft, Globe, House, TreePine } from 'lucide-react';
import { nip19 } from 'nostr-tools';
import type { ProjectData, GameMode } from '@/lib/projectTypes';
import type { ProjectCategory } from '@/components/projects/ProjectManagement';

const ADMIN_NPUB = 'npub1gwa27rpgum8mr9d30msg8cv7kwj2lhav2nvmdwh3wqnsa5vnudxqlta2sz';
const ADMIN_PUBKEY = nip19.decode(ADMIN_NPUB).data as string;
const CORS_PROXY = 'https://proxy.shakespeare.diy/?url=';

function getFirstTagValue(tags: string[][], names: string[]) {
  for (const name of names) {
    const value = tags.find(t => t[0] === name)?.[1];
    if (value) return value;
  }
  return '';
}

function getProjectThumbnail(tags: string[][], content: Record<string, unknown>) {
  const tagImage = getFirstTagValue(tags, ['image', 'thumb', 'thumbnail', 'picture', 'cover']);
  if (tagImage) return tagImage;

  const candidates = [
    content.thumbnail,
    content.image,
    content.picture,
    content.cover,
    content.header_image,
  ];

  const images = content.images;
  if (Array.isArray(images) && typeof images[0] === 'string') {
    candidates.push(images[0]);
  }

  return candidates.find((value): value is string => typeof value === 'string' && value.length > 0) || '';
}

function ProjectThumbnailImage({ src, alt, className }: { src: string; alt: string; className: string }) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (!currentSrc.startsWith(CORS_PROXY) && /^https?:\/\//i.test(currentSrc)) {
          setCurrentSrc(`${CORS_PROXY}${encodeURIComponent(currentSrc)}`);
        } else {
          setFailed(true);
        }
      }}
    />
  );
}

interface CategoryProjectsPageProps {
  category: ProjectCategory;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  headerIcon?: string; // SVG path in public
  gradient: string; // Background gradient classes
  emptyIcon: React.ReactNode;
  emptyText: string;
}

export function CategoryProjectsPage({
  category,
  title,
  subtitle,
  icon,
  gradient,
  emptyIcon,
  emptyText,
}: CategoryProjectsPageProps) {
  const { nostr } = useNostr();
  const navigate = useNavigate();
  const { getGradientStyle } = useThemeColors();

  // Fetch category projects from Nostr
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', category],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);

      const events = await nostr.query(
        [{ kinds: [36171], authors: [ADMIN_PUBKEY], '#t': ['bitpopart-project'], limit: 50 }],
        { signal }
      );

      const categoryProjects: ProjectData[] = events
        .map((event): ProjectData | null => {
          try {
            const content = JSON.parse(event.content);
            const id = event.tags.find(t => t[0] === 'd')?.[1];
            const name = event.tags.find(t => t[0] === 'name')?.[1] || content.name;
            const thumbnail = getProjectThumbnail(event.tags, content);
            const url = event.tags.find(t => t[0] === 'r')?.[1] || content.url;
            const order = event.tags.find(t => t[0] === 'order')?.[1];
            const featured = event.tags.find(t => t[0] === 'featured')?.[1] === 'true';
            const comingSoon = event.tags.find(t => t[0] === 'coming-soon')?.[1] === 'true';
            const eventCategory = event.tags.find(t => t[0] === 'category')?.[1] || 'general';
            const brandSite = event.tags.find(t => t[0] === 'brand-site')?.[1];
            const brandSiteInline = event.tags.find(t => t[0] === 'brand-site-inline')?.[1] === 'true';
            const frlInline = event.tags.find(t => t[0] === 'frl-inline')?.[1] === 'true';
            const gameMode = event.tags.find(t => t[0] === 'game-mode')?.[1] as GameMode | undefined;

            if (!id || !name) return null;
            if (eventCategory !== category) return null;

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
              brand_site: brandSite,
              brand_site_inline: brandSiteInline,
              frl_inline: frlInline,
              game_mode: gameMode,
            };
          } catch {
            return null;
          }
        })
        .filter((p): p is ProjectData => p !== null)
        .sort((a, b) => (a.order || 999) - (b.order || 999));

      return categoryProjects;
    },
  });

  const handleProjectClick = (project: ProjectData) => {
    if (project.coming_soon) return;

    // HTML upload project with frl-inline flag → open inline below header menu
    if (project.frl_inline && project.brand_site) {
      navigate(`/frl/${project.id}`);
      return;
    }

    // HTML upload project without frl-inline → open brand_site in new tab
    if (project.brand_site_inline && project.brand_site && !project.url) {
      window.open(project.brand_site, '_blank');
      return;
    }

    if (project.url) {
      if (project.url.startsWith('http')) {
        window.open(project.url, '_blank');
      } else {
        navigate(project.url);
      }
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradient}`}>
      <div className="container mx-auto px-4 py-12">
        {/* Back to Projects */}
        <div className="max-w-6xl mx-auto mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/projects')}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4 gap-3">
            {icon}
            <h1 className="text-5xl font-bold leading-tight gradient-header-text">
              {title}
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Projects Grid */}
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
        ) : projects.length === 0 ? (
          <div className="max-w-lg mx-auto">
            <Card className="overflow-hidden border-0 shadow-xl">
              <div className="h-2" style={getGradientStyle('primary')} />
              <CardContent className="py-16 text-center space-y-6">
                {emptyIcon}
                <div className="space-y-3">
                  <p className="text-muted-foreground text-lg">
                    {emptyText}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {projects.map((project, index) => {
              const isComingSoon = project.coming_soon;

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
                      <ProjectThumbnailImage
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
                            ${['#a855f7', '#ec4899', '#6366f1', '#14b8a6', '#8b5cf6', '#f59e0b', '#f472b6'][index % 7]} 0%, 
                            ${['#ec4899', '#6366f1', '#8b5cf6', '#06b6d4', '#f472b6', '#ef4444', '#a855f7'][index % 7]} 100%)`,
                          opacity: isComingSoon ? 0.6 : 1,
                        }}
                      >
                        <span className="text-6xl opacity-90">
                          {['⚡', '🎨', '💝', '🎁', '🎮', '🎬', '✨'][index % 7]}
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

                    {/* Hover overlay */}
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
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isComingSoon && (
                          <Badge className="bg-gradient-to-r from-orange-100 to-pink-100 dark:from-orange-900/30 dark:to-pink-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-pink-700 text-xs">
                            Coming Soon
                          </Badge>
                        )}
                        {project.game_mode === 'indoor' && (
                          <Badge variant="outline" className="text-xs text-violet-700 border-violet-300 bg-violet-50 dark:text-violet-300 dark:border-violet-700 dark:bg-violet-900/20 gap-1">
                            <House className="h-3 w-3" />
                            Indoor
                          </Badge>
                        )}
                        {project.game_mode === 'outdoor' && (
                          <Badge variant="outline" className="text-xs text-green-700 border-green-300 bg-green-50 dark:text-green-300 dark:border-green-700 dark:bg-green-900/20 gap-1">
                            <TreePine className="h-3 w-3" />
                            Outdoor
                          </Badge>
                        )}
                        {project.game_mode === 'both' && (
                          <Badge variant="outline" className="text-xs text-blue-700 border-blue-300 bg-blue-50 dark:text-blue-300 dark:border-blue-700 dark:bg-blue-900/20 gap-1">
                            <House className="h-3 w-3" />
                            <TreePine className="h-3 w-3" />
                            Indoor & Outdoor
                          </Badge>
                        )}
                      </div>
                    </CardTitle>
                    <CardDescription className="line-clamp-3 text-base">
                      {project.description}
                    </CardDescription>
                    {/* Project Website / Open Button */}
                     {!isComingSoon && project.brand_site && (
                       <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                         {project.frl_inline ? (
                           <Button
                             variant="outline"
                             size="sm"
                             className="w-full gap-2 border-pink-300 text-pink-700 hover:bg-pink-50 dark:border-pink-700 dark:text-pink-300 dark:hover:bg-pink-900/20"
                             onClick={() => navigate(`/frl/${project.id}`)}
                           >
                             <Globe className="h-4 w-4" />
                             Open Project
                           </Button>
                         ) : (
                           <Button
                             variant="outline"
                             size="sm"
                             className="w-full gap-2 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20"
                             onClick={() => window.open(project.brand_site, '_blank')}
                           >
                             <Globe className="h-4 w-4" />
                             View Project Site
                           </Button>
                         )}
                       </div>
                     )}

                    {/* Share Button */}
                     {!isComingSoon && (
                       <div className="pt-3" onClick={(e) => e.stopPropagation()}>
                         <ShareDialog
                          title={project.name}
                          description={project.description}
                          url={project.url?.startsWith('http') ? project.url : `${window.location.origin}${project.url || `/projects#${project.id}`}`}
                          imageUrl={project.thumbnail}
                          contentType="project"
                          eventRef={project.event ? {
                            id: project.event.id,
                            kind: project.event.kind,
                            pubkey: project.event.pubkey,
                            dTag: project.id,
                          } : undefined}
                        >
                          <Button variant="outline" size="sm" className="w-full">
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
        )}

        {/* Footer */}
        <div className="text-center mt-16 text-sm text-gray-500 dark:text-gray-400">
          <p>Nostr & BitPopArt {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}
