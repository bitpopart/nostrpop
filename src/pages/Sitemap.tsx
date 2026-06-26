import { Link } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { useFooterPages } from '@/hooks/usePages';
import {
  Home,
  User,
  Palette,
  FolderKanban,
  CreditCard,
  ShoppingCart,
  Newspaper,
  Rss,
  MapPin,
  Award,
  Trophy,
  Target,
  Download,
  Image as ImageIcon,
  Clapperboard,
  Smile,
  Smartphone,
  Monitor,
  Printer,
  Wand2,
  Users,
  Globe,
  Layers,
  Brush,
  Sparkles,
  Gift,
  Play,
  LayoutGrid,
  BookOpen,
  PenTool,
  Zap,
  ExternalLink,
  Map,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────

interface SitemapLink {
  label: string;
  path: string;
  description?: string;
  icon: React.ReactNode;
  external?: boolean;
}

interface SitemapSection {
  title: string;
  color: string;        // Tailwind gradient for the section header bar
  textColor: string;    // Tailwind text colour for icons/labels
  borderColor: string;
  bgColor: string;
  icon: React.ReactNode;
  links: SitemapLink[];
}

// ── Static site structure ──────────────────────────────────

const SECTIONS: SitemapSection[] = [
  {
    title: 'Main',
    color: 'from-orange-500 to-pink-500',
    textColor: 'text-orange-600 dark:text-orange-400',
    borderColor: 'border-orange-200 dark:border-orange-800',
    bgColor: 'bg-orange-50/60 dark:bg-orange-900/10',
    icon: <Home className="h-4 w-4" />,
    links: [
      { label: 'Home', path: '/', description: 'Start here', icon: <Home className="h-4 w-4" /> },
      { label: 'Artist', path: '/artist', description: 'About Johannes Oppewal', icon: <User className="h-4 w-4" /> },
      { label: 'Community', path: '/community', description: 'Join the BitPopArt family', icon: <Users className="h-4 w-4" /> },
      { label: 'Feed', path: '/feed', description: 'Nostr news & updates', icon: <Rss className="h-4 w-4" /> },
      { label: 'News / Blog', path: '/blog', description: 'Articles & announcements', icon: <Newspaper className="h-4 w-4" /> },
      { label: 'Sitemap', path: '/sitemap', description: 'You are here', icon: <Map className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Art & Creative',
    color: 'from-violet-500 to-purple-500',
    textColor: 'text-violet-600 dark:text-violet-400',
    borderColor: 'border-violet-200 dark:border-violet-800',
    bgColor: 'bg-violet-50/60 dark:bg-violet-900/10',
    icon: <Palette className="h-4 w-4" />,
    links: [
      { label: 'Art Gallery', path: '/art', description: 'Browse & buy original artwork', icon: <Palette className="h-4 w-4" /> },
      { label: '21K Art', path: '/21k-art', description: 'Special 21K Bitcoin art collection', icon: <Zap className="h-4 w-4" /> },
      { label: 'Canvas', path: '/canvas', description: '100M collaborative canvas', icon: <Brush className="h-4 w-4" /> },
      { label: 'Wall Gallery', path: '/wall', description: 'Street art photo gallery', icon: <ImageIcon className="h-4 w-4" /> },
      { label: 'Pop Art Studio', path: '/studio', description: 'Design your own pop art', icon: <Wand2 className="h-4 w-4" /> },
      { label: 'Meme Creator', path: '/memes', description: 'Create & share memes', icon: <Smile className="h-4 w-4" /> },
      { label: 'NFT Generator', path: '/NFT', description: 'Generate layered NFT characters', icon: <Layers className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Projects',
    color: 'from-blue-500 to-cyan-500',
    textColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-800',
    bgColor: 'bg-blue-50/60 dark:bg-blue-900/10',
    icon: <FolderKanban className="h-4 w-4" />,
    links: [
      { label: 'Projects', path: '/projects', description: 'Portfolio & featured work', icon: <FolderKanban className="h-4 w-4" /> },
      { label: 'Nostr Projects', path: '/nostr-projects', description: 'Collaborative community projects', icon: <Users className="h-4 w-4" /> },
      { label: 'POPArt.frl', path: '/frl', description: 'POPArt on .frl domain', icon: <Globe className="h-4 w-4" /> },
      { label: 'Animations', path: '/animations', description: 'Motion art & animated works', icon: <Clapperboard className="h-4 w-4" /> },
      { label: 'Games', path: '/games', description: 'Bitcoin & pop art games', icon: <Play className="h-4 w-4" /> },
      { label: 'Fundraising', path: '/fundraising', description: 'Support ongoing art projects', icon: <Target className="h-4 w-4" /> },
      { label: 'PopUp Events', path: '/popup', description: 'Worldwide live pop art events', icon: <MapPin className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Cards & Badges',
    color: 'from-pink-500 to-rose-500',
    textColor: 'text-pink-600 dark:text-pink-400',
    borderColor: 'border-pink-200 dark:border-pink-800',
    bgColor: 'bg-pink-50/60 dark:bg-pink-900/10',
    icon: <CreditCard className="h-4 w-4" />,
    links: [
      { label: 'POP Cards', path: '/cards', description: 'Send positive vibes', icon: <CreditCard className="h-4 w-4" /> },
      { label: 'Create a Card', path: '/cards/editor', description: 'Design your own card', icon: <PenTool className="h-4 w-4" /> },
      { label: 'Badges', path: '/badges', description: 'Collect & award POP badges', icon: <Award className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Shop & Print',
    color: 'from-amber-500 to-orange-500',
    textColor: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-200 dark:border-amber-800',
    bgColor: 'bg-amber-50/60 dark:bg-amber-900/10',
    icon: <ShoppingCart className="h-4 w-4" />,
    links: [
      { label: 'Shop', path: '/shop', description: 'Merch & digital products', icon: <ShoppingCart className="h-4 w-4" /> },
      { label: 'Print Shop', path: '/print', description: 'A3–A6 art posters', icon: <Printer className="h-4 w-4" /> },
    ],
  },
  {
    title: 'Free Downloads',
    color: 'from-teal-500 to-green-500',
    textColor: 'text-teal-600 dark:text-teal-400',
    borderColor: 'border-teal-200 dark:border-teal-800',
    bgColor: 'bg-teal-50/60 dark:bg-teal-900/10',
    icon: <Gift className="h-4 w-4" />,
    links: [
      { label: 'Free Gallery', path: '/free', description: 'All free downloads in one place', icon: <Gift className="h-4 w-4" /> },
      { label: 'Wallpapers', path: '/wallpapers', description: 'Mobile wallpapers', icon: <Smartphone className="h-4 w-4" /> },
      { label: 'Desktop Wallpapers', path: '/desktop-wallpapers', description: 'Desktop backgrounds', icon: <Monitor className="h-4 w-4" /> },
      { label: 'GIFs', path: '/gifs', description: 'Animated GIFs', icon: <Sparkles className="h-4 w-4" /> },
      { label: 'Avatars', path: '/avatars', description: 'Profile picture avatars', icon: <ImageIcon className="h-4 w-4" /> },
      { label: 'Banners', path: '/banners', description: 'Social media headers', icon: <LayoutGrid className="h-4 w-4" /> },
      { label: 'Coloring Pages', path: '/coloring-pages', description: 'Printable coloring sheets', icon: <BookOpen className="h-4 w-4" /> },
      { label: 'Free Images', path: '/free/images', description: 'All free image downloads', icon: <Download className="h-4 w-4" /> },
    ],
  },
  {
    title: 'App',
    color: 'from-indigo-500 to-violet-500',
    textColor: 'text-indigo-600 dark:text-indigo-400',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    bgColor: 'bg-indigo-50/60 dark:bg-indigo-900/10',
    icon: <Smartphone className="h-4 w-4" />,
    links: [
      { label: 'BitPopArt App', path: '/app', description: 'Fan app — art for everyone', icon: <Smartphone className="h-4 w-4" /> },
      { label: 'Vlog', path: '/vlog', description: 'Video travel diary', icon: <Play className="h-4 w-4" /> },
    ],
  },
];

// ── Link card ──────────────────────────────────────────────

function SitemapLinkCard({ link, textColor }: { link: SitemapLink; textColor: string }) {
  const inner = (
    <div className="group flex items-start gap-3 p-3 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-gray-800/60 transition-all duration-200">
      <div className={`mt-0.5 flex-shrink-0 ${textColor} opacity-70 group-hover:opacity-100 transition-opacity`}>
        {link.icon}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
            {link.label}
          </span>
          {link.external && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
        </div>
        {link.description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{link.description}</p>
        )}
      </div>
    </div>
  );

  if (link.external) {
    return (
      <a href={link.path} target="_blank" rel="noopener noreferrer" className="block">
        {inner}
      </a>
    );
  }
  return <Link to={link.path} className="block">{inner}</Link>;
}

// ── Section card ───────────────────────────────────────────

function SitemapSectionCard({ section }: { section: SitemapSection }) {
  return (
    <div className={`rounded-2xl border ${section.borderColor} ${section.bgColor} overflow-hidden`}>
      {/* Section header */}
      <div className={`bg-gradient-to-r ${section.color} px-4 py-3 flex items-center gap-2`}>
        <span className="text-white/90">{section.icon}</span>
        <h2 className="text-white font-bold text-sm tracking-wide">{section.title}</h2>
        <span className="ml-auto text-white/60 text-xs">{section.links.length} pages</span>
      </div>

      {/* Links grid */}
      <div className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-0.5">
        {section.links.map(link => (
          <SitemapLinkCard key={link.path} link={link} textColor={section.textColor} />
        ))}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────

export default function Sitemap() {
  // Pull in dynamic custom pages from Nostr
  const { data: footerPages = [] } = useFooterPages();

  useSeoMeta({
    title: 'Sitemap — BitPopArt',
    description: 'Full overview of all pages and sections on BitPopArt.com.',
    robots: 'index, follow',
  });

  // Build a dynamic "Pages" section from custom Nostr pages
  const customSection: SitemapSection | null = footerPages.length > 0
    ? {
        title: 'Custom Pages',
        color: 'from-rose-500 to-pink-500',
        textColor: 'text-rose-600 dark:text-rose-400',
        borderColor: 'border-rose-200 dark:border-rose-800',
        bgColor: 'bg-rose-50/60 dark:bg-rose-900/10',
        icon: <BookOpen className="h-4 w-4" />,
        links: footerPages.map(p => ({
          label: p.title,
          path: `/${p.id}`,
          description: p.subtitle || undefined,
          icon: <BookOpen className="h-4 w-4" />,
        })),
      }
    : null;

  const allSections = customSection ? [...SECTIONS, customSection] : SECTIONS;

  const totalPages = allSections.reduce((acc, s) => acc + s.links.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 dark:from-gray-900 dark:via-purple-900/10 dark:to-indigo-900/10">
      <div className="container mx-auto px-4 py-12 max-w-5xl">

        {/* Hero header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-500 shadow-lg mb-5">
            <Map className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold mb-3 bg-gradient-to-r from-orange-500 via-pink-500 to-violet-500 bg-clip-text text-transparent">
            Sitemap
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Every page on BitPopArt in one place — <strong>{totalPages} pages</strong> across{' '}
            {allSections.length} sections.
          </p>
        </div>

        {/* Section grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {allSections.map(section => (
            <SitemapSectionCard key={section.title} section={section} />
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground mt-10">
          Custom pages added from the admin panel appear automatically in this sitemap.
        </p>
      </div>
    </div>
  );
}
