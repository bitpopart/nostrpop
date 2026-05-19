import { useSeoMeta } from '@unhead/react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Gamepad2, Sparkles } from 'lucide-react';

export default function Games() {
  const { getGradientStyle } = useThemeColors();

  useSeoMeta({
    title: 'Games - BitPopArt',
    description: 'Fun Bitcoin and pop art inspired games by BitPopArt. Coming soon!',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-fuchsia-50 to-pink-50 dark:from-gray-900 dark:via-violet-900/20 dark:to-fuchsia-900/20">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4 gap-3">
            <Gamepad2 className="h-12 w-12 text-violet-600" />
            <h1 className="text-5xl font-bold leading-tight gradient-header-text">
              Games
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Bitcoin and pop art inspired games by BitPopArt
          </p>
        </div>

        {/* Coming Soon */}
        <div className="max-w-lg mx-auto">
          <Card className="overflow-hidden border-0 shadow-xl">
            <div className="h-2" style={getGradientStyle('primary')} />
            <CardContent className="py-16 text-center space-y-6">
              <div className="relative inline-flex">
                <Gamepad2 className="h-20 w-20 text-violet-400" />
                <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div className="space-y-3">
                <Badge
                  className="text-white text-lg px-4 py-2 border-0"
                  style={getGradientStyle('coming-soon')}
                >
                  Coming Soon
                </Badge>
                <p className="text-muted-foreground text-lg">
                  Fun games are on the way! Stay tuned.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-sm text-gray-500 dark:text-gray-400">
          <p>Nostr & BitPopArt {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}
