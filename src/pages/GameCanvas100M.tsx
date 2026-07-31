import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';

export default function GameCanvas100M() {
  const [loaded, setLoaded] = useState(false);

  useSeoMeta({
    title: '100M Canvas — 1 sat per pixel | BitPopArt',
    description: 'A collaborative art project on Nostr. Paint pixel by pixel on a 100 million pixel canvas. 1 sat per pixel, zapped over Lightning, stamped with the Bitcoin block height. Forever.',
    ogTitle: '100M Canvas — 1 sat per pixel | BitPopArt',
    ogDescription: 'Paint on the Bitcoin canvas. 1 sat = 1 pixel. Collaborative art on Nostr.',
    ogImage: 'https://bitpopart.com/bitpopart-logo.png',
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative bg-white">
      {/* Loading state */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="text-center space-y-2">
            <div className="animate-bounce text-5xl">🖌️</div>
            <p className="font-bold text-xl text-orange-500">LOADING CANVAS…</p>
          </div>
        </div>
      )}

      <iframe
        src="/games/100m-canvas.html"
        title="100M Canvas — 1 sat per pixel"
        className="w-full flex-1 border-0 block"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
