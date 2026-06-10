import { Palette, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useProjectDesigns } from '@/hooks/useProjectDesigns';

const CORS_PROXY = 'https://proxy.shakespeare.diy/?url=';

function DesignImage({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      onError={(e) => {
        const img = e.currentTarget;
        if (!img.src.startsWith(CORS_PROXY) && /^https?:\/\//i.test(img.src)) {
          img.src = `${CORS_PROXY}${encodeURIComponent(img.src)}`;
        }
      }}
    />
  );
}

export function ProjectDesignsThumbnails() {
  const { data: designs = [], isLoading } = useProjectDesigns();

  // Don't render the section at all if nothing to show
  if (!isLoading && designs.length === 0) return null;

  const handleClick = (projectUrl: string) => {
    if (!projectUrl) return;
    if (projectUrl.startsWith('http')) {
      window.open(projectUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = projectUrl;
    }
  };

  return (
    <div className="mt-16 max-w-6xl mx-auto">
      {/* Section Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Palette className="h-8 w-8 text-pink-500 mr-3" />
          <h2 className="text-4xl font-bold bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-600 bg-clip-text text-transparent">
            Project Designs
          </h2>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Visual designs &amp; creative work — click a thumbnail to explore the project
        </p>
      </div>

      {/* Thumbnails Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {designs.map((design) => (
            <Card
              key={design.id}
              className={`group overflow-hidden transition-all duration-300 bg-white dark:bg-gray-800 border-2 border-transparent hover:border-pink-400 dark:hover:border-fuchsia-600 hover:shadow-2xl ${
                design.projectUrl ? 'cursor-pointer' : ''
              }`}
              onClick={() => design.projectUrl && handleClick(design.projectUrl)}
            >
              {/* Square thumbnail */}
              <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-pink-100 to-violet-100 dark:from-pink-900/20 dark:to-violet-900/20">
                <DesignImage src={design.thumbnail} alt={design.title || 'Project design'} />

                {/* Hover overlay */}
                {design.projectUrl && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-white text-center px-2">
                      <ExternalLink className="h-6 w-6" />
                      {design.title && (
                        <span className="text-xs font-medium leading-tight line-clamp-2">
                          {design.title}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Title below thumbnail (only if set) */}
              {design.title && (
                <CardContent className="py-2 px-3">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                    {design.title}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
