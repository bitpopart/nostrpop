import { ReactNode } from 'react';
import { Navigation } from './Navigation';

interface LayoutIframeProps {
  children: ReactNode;
}

/**
 * LayoutIframe — used for pages that embed a full-height iframe (e.g. an
 * inline HTML project on /frl/:projectId).
 *
 * Unlike the main site `Layout`, this has NO Footer and constrains the page
 * to exactly `100vh` with `overflow-hidden` on the outer wrapper. This
 * prevents the classic "double scrollbar" problem where both the outer page
 * and the inner iframe scroll independently — instead only the iframe's own
 * content scrolls (if it needs to), and the outer page never does.
 */
export function LayoutIframe({ children }: LayoutIframeProps) {
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--page-background)' }}>
      <Navigation />
      <main className="flex-1 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
        {children}
      </main>
    </div>
  );
}
