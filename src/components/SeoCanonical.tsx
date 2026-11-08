import { useLocation } from 'react-router-dom';
import { useHead } from '@unhead/react';

const SITE = 'https://bitpopart.com';

/**
 * Sets a canonical link and og:url that match the page being shown.
 * Without this every URL on the site declared the homepage as its canonical,
 * which tells search engines to ignore all other pages.
 * Query strings and hashes are dropped on purpose.
 */
export function SeoCanonical() {
  const { pathname } = useLocation();
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/';
  const url = `${SITE}${path === '/' ? '/' : path}`;

  useHead({
    link: [{ rel: 'canonical', href: url }],
    meta: [{ property: 'og:url', content: url }],
  });

  return null;
}
