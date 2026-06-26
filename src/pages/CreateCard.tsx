import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Link, useNavigate } from 'react-router-dom';
import { CardEditor } from '@/components/cards/CardEditor';
import { CardLibraryBox } from '@/components/cards/CardLibraryBox';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles } from 'lucide-react';

const CreateCard = () => {
  const navigate = useNavigate();
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  useSeoMeta({
    title: 'Create Your Own Card — BitPop Cards',
    description: 'Design and publish your own personalised BitPop greeting card. Pick a background template, add text and images, then share it on Nostr.',
    ogTitle: 'Create Your Own BitPop Card',
    ogDescription: 'Use the BitPop Card Editor to design a personalised card and publish it on Nostr.',
    ogImage: 'https://bitpopart.com/bitpopart-logo.png',
    robots: 'index, follow',
  });

  const handlePublished = (url: string) => {
    setPublishedUrl(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 dark:from-gray-900 dark:via-orange-900/20 dark:to-yellow-900/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
            <Link to="/cards">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cards
            </Link>
          </Button>

          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2 gradient-header-text flex items-center justify-center gap-2">
              <Sparkles className="h-8 w-8 text-pink-500" />
              Create Your Own Card
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Pick a background template, add your own text and images, then download your card or publish it to the Nostr network.
            </p>
          </div>
        </div>

        {/* Success banner after publish */}
        {publishedUrl && (
          <div className="max-w-2xl mx-auto mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-center space-y-2">
            <p className="font-semibold text-green-700 dark:text-green-300">🎉 Card published successfully!</p>
            <div className="flex justify-center gap-2">
              <Button size="sm" onClick={() => navigate(publishedUrl)}>View Card</Button>
              <Button size="sm" variant="outline" onClick={() => navigate('/cards')}>Browse All Cards</Button>
            </div>
          </div>
        )}

        {/* Editor */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-6">
          <CardEditor onPublished={handlePublished} />
        </div>

        {/* Ready-made Card Library */}
        <CardLibraryBox />

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-gray-500 dark:text-gray-400">
          <p>Nostr & BitPopArt {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
};

export default CreateCard;
