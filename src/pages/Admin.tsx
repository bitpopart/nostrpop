import { useState, useEffect } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoginArea } from '@/components/auth/LoginArea';
import { CardManagement } from '@/components/cards/CardManagement';
import { BadgeManagement } from '@/components/badges/BadgeManagement';
import { ProductManagement } from '@/components/marketplace/ProductManagement';
import { FundraiserManagement } from '@/components/fundraiser/FundraiserManagement';
import { BlogPostManagement } from '@/components/blog/BlogPostManagement';
import { PopUpManagement } from '@/components/popup/PopUpManagement';
import { ArtistContentManagement } from '@/components/artist/ArtistContentManagement';
import { ProjectManagement } from '@/components/projects/ProjectManagement';
import { ProjectDesignsManagement } from '@/components/projects/ProjectDesignsManagement';
import { NostrProjectManagement } from '@/components/nostrprojects/NostrProjectManagement';
import { PageManagement } from '@/components/pages/PageManagement';
import { SocialMediaManagement } from '@/components/social/SocialMediaManagement';
import { NewsletterManager } from '@/components/newsletter/NewsletterManager';
import { AnalyticsSettings } from '@/components/analytics/AnalyticsSettings';
import { ZapAnalytics } from '@/components/analytics/ZapAnalytics';
import { SiteSettings } from '@/components/settings/SiteSettings';
import { HomepageSettings } from '@/components/settings/HomepageSettings';
import { ArtworkOrderManager } from '@/components/art/ArtworkOrderManager';
import { ArtworkCleanupTool } from '@/components/art/ArtworkCleanupTool';
import { ArtBannerAdmin } from '@/components/art/ArtBannerAdmin';
import { ArtworkSalesManager } from '@/components/art/ArtworkSalesManager';
import { ArtProgressManagement } from '@/components/artprogress/ArtProgressManagement';
import { WallManagement } from '@/components/wall/WallManagement';
import { AppContentManagement } from '@/components/app/AppContentManagement';
import { AppContentDashboard } from '@/components/app/AppContentDashboard';
import { AppAnalyticsDashboard } from '@/components/app/AppAnalyticsDashboard';
import { WallpapersAdmin } from '@/components/app/WallpapersAdmin';
import { GifsAdmin } from '@/components/app/GifsAdmin';
import { AvatarsAdmin } from '@/components/app/AvatarsAdmin';
import { BannersAdmin } from '@/components/app/BannersAdmin';
import { ColoringPagesAdmin } from '@/components/app/ColoringPagesAdmin';
import { DesktopWallpapersAdmin } from '@/components/app/DesktopWallpapersAdmin';
import { MemesAdmin } from '@/components/app/MemesAdmin';
import { CarouselAdmin } from '@/components/app/CarouselAdmin';
import { FanAppPublishing } from '@/components/app/FanAppPublishing';
import { MediaUploader, MediaList } from '@/components/app/AppContentManagement';
import { AnimationsManagement } from '@/components/animations/AnimationsManagement';
import { StudioLibrariesAdmin } from '@/components/studio/StudioLibrariesAdmin';
import { CardTemplatesAdmin } from '@/components/cards/CardTemplatesAdmin';
import { PrintPostersAdmin } from '@/components/print/PrintPostersAdmin';
import { NFTCharacterAdmin } from '@/components/nft/NFTCharacterAdmin';
import { MediaGeneratorAdmin } from '@/components/mediagenerator/MediaGeneratorAdmin';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import {
  Plus,
  BarChart3,
  Users,
  Shield,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Library,
  Palette,
  ShoppingBag,
  CreditCard,
  Grid3X3,
  FileText,
  MapPin,
  User,
  FolderKanban,
  Share2,
  Mail,
  Target,
  Settings,
  Zap,
  Home,
  Award,
  Smartphone,
  Gamepad2,
  Clapperboard,
  Globe,
  CalendarClock,
  Store,
  Upload,
  ClipboardList,
  Monitor,
  Printer,
  ImageIcon,
  LayoutTemplate,
  LayoutGrid,
  Laugh,
  Shapes,
  Sparkles,
} from 'lucide-react';

const Admin = () => {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'overview');

  // Check if current user is admin
  const isAdmin = useIsAdmin();

  useSeoMeta({
    title: 'Admin Dashboard - BitPopArt',
    description: 'Administrative dashboard for managing BitPopArt platform.',
    robots: 'noindex, nofollow',
  });

  // Sync activeTab when URL search params change (e.g. navigating to /admin?tab=app)
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    // Redirect non-admin users to cards page
    if (user && !isAdmin) {
      navigate('/cards');
    }
  }, [user, isAdmin, navigate]);

  // Show login prompt if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 dark:from-gray-900 dark:via-orange-900/20 dark:to-yellow-900/20 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-orange-600" />
            <CardTitle className="text-2xl">Admin Access Required</CardTitle>
            <CardDescription>
              Please log in with your admin account to access the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginArea className="w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 dark:from-gray-900 dark:via-orange-900/20 dark:to-yellow-900/20 flex items-center justify-center">
        <Card className="max-w-md mx-auto border-red-200 dark:border-red-800">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <CardTitle className="text-2xl text-red-600 dark:text-red-400">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the admin dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate('/cards')}
              className="w-full"
              variant="outline"
            >
              Go to Cards
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const projectsActions = [
    {
      title: 'All Projects',
      description: 'Portfolio, Designs, Games, Animations, FRL & Nostr — all in one place',
      icon: FolderKanban,
      color: 'from-orange-500 to-red-500',
      action: () => setActiveTab('projects'),
      badge: 'Projects'
    },
    {
      title: 'Fundraising',
      description: 'Crowdfunding campaigns',
      icon: Target,
      color: 'from-green-500 to-teal-500',
      action: () => setActiveTab('fundraisers'),
      badge: 'Fundraising'
    },
  ];

  const bitpopcardsActions = [
    {
      title: 'POP Cards',
      description: 'Create and share digital cards',
      icon: CreditCard,
      color: 'from-violet-500 to-purple-500',
      action: () => setActiveTab('cards'),
      badge: 'Cards'
    },
    {
      title: 'Card Editor Templates',
      description: 'Upload background images users pick in the "Create Your Own Card" editor',
      icon: LayoutTemplate,
      color: 'from-pink-500 to-rose-500',
      action: () => setActiveTab('card-templates'),
      badge: 'Templates'
    },
    {
      title: 'POP Badges',
      description: 'Create collectible badges',
      icon: Award,
      color: 'from-indigo-500 to-purple-500',
      action: () => setActiveTab('badges'),
      badge: 'Badges'
    },
    {
      title: 'Art Gallery',
      description: 'Manage artwork sales and auctions',
      icon: Palette,
      color: 'from-pink-500 to-rose-500',
      action: () => navigate('/art'),
      badge: 'Gallery'
    },
    {
      title: 'Shop Products',
      description: 'Marketplace product management',
      icon: ShoppingBag,
      color: 'from-amber-500 to-orange-500',
      action: () => setActiveTab('shop'),
      badge: 'Shop'
    },
    {
      title: 'Print Shop',
      description: 'Upload SVG posters — A3, A4, A5, A6 — pay with Lightning, download PDF',
      icon: Printer,
      color: 'from-orange-500 to-rose-500',
      action: () => setActiveTab('print'),
      badge: 'Print'
    },
    {
      title: 'Orders',
      description: 'View purchases, manage shipping & digital downloads',
      icon: ClipboardList,
      color: 'from-green-500 to-teal-500',
      action: () => setActiveTab('shop'),
      badge: 'Orders'
    },
    {
      title: 'Publish to Markets',
      description: 'Broadcast merch to Shopstr, Plebeian, Conduit & Cypher',
      icon: Store,
      color: 'from-purple-500 to-pink-500',
      action: () => { setActiveTab('shop'); },
      badge: 'Markets'
    },
  ];

  const contentActions = [
    {
      title: 'PopPost Scheduler',
      description: 'Schedule & share BitPopArt content to Nostr community',
      icon: CalendarClock,
      color: 'from-orange-500 to-pink-500',
      action: () => navigate('/poppost'),
      badge: 'Scheduler'
    },
    {
      title: 'News Articles',
      description: 'Publish news and blog posts',
      icon: FileText,
      color: 'from-blue-500 to-cyan-500',
      action: () => setActiveTab('blog'),
      badge: 'News'
    },
    {
      title: 'Artist Page',
      description: 'Update your artist bio and story',
      icon: User,
      color: 'from-purple-500 to-pink-500',
      action: () => setActiveTab('artist'),
      badge: 'Bio'
    },
    {
      title: 'Wall Gallery',
      description: 'Street art photo gallery',
      icon: Sparkles,
      color: 'from-orange-500 to-red-500',
      action: () => setActiveTab('wall'),
      badge: 'Street Art'
    },
    {
      title: 'PopUp Events',
      description: 'Manage worldwide event schedule',
      icon: MapPin,
      color: 'from-green-500 to-emerald-500',
      action: () => setActiveTab('popup'),
      badge: 'Events'
    },
    {
      title: 'Custom Pages',
      description: 'Create general pages with galleries',
      icon: FileText,
      color: 'from-teal-500 to-cyan-500',
      action: () => setActiveTab('pages'),
      badge: 'Pages'
    },
    {
      title: 'Social Media',
      description: 'Manage footer social links',
      icon: Share2,
      color: 'from-blue-500 to-indigo-500',
      action: () => setActiveTab('social'),
      badge: 'Social'
    },
    {
      title: 'Newsletter',
      description: 'Compose and send newsletters',
      icon: Mail,
      color: 'from-pink-500 to-rose-500',
      action: () => setActiveTab('newsletter'),
      badge: 'Email'
    },
    {
      title: 'Fan App',
      description: 'Manage app content for fans',
      icon: Smartphone,
      color: 'from-orange-500 to-amber-500',
      action: () => setActiveTab('app'),
      badge: 'App'
    },
    {
      title: 'App Carousel',
      description: 'Edit the sliding image carousel on the /app frontpage',
      icon: ImageIcon,
      color: 'from-orange-400 to-pink-500',
      action: () => setActiveTab('app-carousel'),
      badge: 'Carousel'
    },
    {
      title: 'Meme Creator',
      description: 'Memes, canvas Templates & Icons for the Meme Creator in Pop Art Studio',
      icon: Laugh,
      color: 'from-yellow-500 to-orange-500',
      action: () => setActiveTab('app-memes'),
      badge: 'Memes'
    },
    {
      title: 'Pops',
      description: 'Upload cartoon & pop art characters — shown in the Pops tab across Studio, Memes, Cards & App',
      icon: Sparkles,
      color: 'from-pink-500 to-violet-500',
      action: () => setActiveTab('app-pops'),
      badge: 'Pops'
    },
    {
      title: 'Publish Fan App',
      description: 'Publish to Apple, Google Play & Zapstore',
      icon: Upload,
      color: 'from-yellow-500 to-orange-500',
      action: () => setActiveTab('app-publish'),
      badge: 'Publish'
    },
    {
      title: 'Pop Art Studio',
      description: 'Manage element libraries for the design studio',
      icon: Library,
      color: 'from-orange-500 to-pink-500',
      action: () => setActiveTab('studio'),
      badge: 'Studio'
    },
    {
      title: 'Analytics',
      description: 'Track site visitors',
      icon: BarChart3,
      color: 'from-indigo-500 to-purple-500',
      action: () => setActiveTab('analytics'),
      badge: 'Stats'
    },
    {
      title: 'Zap Analytics',
      description: 'Track lightning zaps',
      icon: Zap,
      color: 'from-yellow-500 to-orange-500',
      action: () => setActiveTab('zaps'),
      badge: 'Zaps'
    },
    {
      title: 'NFT Characters',
      description: 'Upload layered cartoon characters for the /NFT generator',
      icon: ImageIcon,
      color: 'from-orange-500 to-pink-600',
      action: () => setActiveTab('nft'),
      badge: 'NFT'
    },
    {
      title: 'Media Generator',
      description: 'Configure floating Merch, Download, Create & Zap buttons per page',
      icon: LayoutGrid,
      color: 'from-pink-500 to-purple-600',
      action: () => setActiveTab('media-generator'),
      badge: '🎛️ New'
    },
  ];

  const statsCards = [
    {
      title: 'Platform',
      value: 'BitPopArt',
      description: 'On Nostr Network',
      icon: Sparkles,
                  color: 'text-orange-600'
    },
    {
      title: 'Sections',
      value: '8',
      description: 'Content areas',
      icon: Grid3X3,
      color: 'text-blue-600'
    },
    {
      title: 'Decentralized',
      value: '100%',
      description: 'On Nostr',
      icon: TrendingUp,
      color: 'text-green-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 dark:from-gray-900 dark:via-orange-900/20 dark:to-yellow-900/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-orange-600 mr-3" />
            <h1 className="text-4xl font-bold gradient-header-text">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Welcome back! Manage your BitPopArt platform from here.
          </p>
          <Badge className="mt-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0">
            Administrator Access
          </Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <Card key={index} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Admin Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap w-full max-w-7xl mx-auto mb-8 text-xs h-auto gap-1 bg-muted/50 p-1 rounded-lg justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger
              value="studio"
              className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white data-[state=active]:from-orange-600 data-[state=active]:to-pink-600 data-[state=active]:text-white font-bold rounded-md"
            >
              <Library className="h-3.5 w-3.5" />
              🎨 Studio
            </TabsTrigger>
            <TabsTrigger value="homepage">Homepage</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="art-progress">Art Progress</TabsTrigger>
            <TabsTrigger value="blog">News</TabsTrigger>
            <TabsTrigger value="artist">Artist</TabsTrigger>
            <TabsTrigger value="wall">Wall</TabsTrigger>
            <TabsTrigger value="popup">PopUp</TabsTrigger>
            <TabsTrigger value="pages">Pages</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="zaps">Zaps</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="animations-videos">Animations</TabsTrigger>
            <TabsTrigger value="fundraisers">Fundraisers</TabsTrigger>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="card-templates" className="flex items-center gap-1 text-pink-600 dark:text-pink-400 font-semibold">
              <LayoutTemplate className="h-3.5 w-3.5" />
              Card Templates
            </TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="shop">Shop</TabsTrigger>
            <TabsTrigger value="print" className="flex items-center gap-1">
              <Printer className="h-3.5 w-3.5" />
              Print Shop
            </TabsTrigger>
            <TabsTrigger value="art">Art</TabsTrigger>
            <TabsTrigger value="app">App</TabsTrigger>
            <TabsTrigger value="app-carousel" className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-semibold">
              🎠 Carousel
            </TabsTrigger>
            <TabsTrigger value="app-wallpapers">Wallpapers</TabsTrigger>
            <TabsTrigger value="app-gifs">GIFs</TabsTrigger>
            <TabsTrigger value="app-avatars">Avatars</TabsTrigger>
            <TabsTrigger value="app-banners">Banners</TabsTrigger>
            <TabsTrigger value="app-coloring-pages">Coloring Pages</TabsTrigger>
            <TabsTrigger value="app-desktop-wallpapers">Desktop WP</TabsTrigger>
            <TabsTrigger value="app-memes" className="flex items-center gap-1">
              <Laugh className="h-3.5 w-3.5" />
              Meme Creator
            </TabsTrigger>
            <TabsTrigger value="app-meme-templates" className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
              <LayoutTemplate className="h-3.5 w-3.5" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="app-meme-icons" className="flex items-center gap-1 text-pink-600 dark:text-pink-400">
              <Shapes className="h-3.5 w-3.5" />
              Icons
            </TabsTrigger>
            <TabsTrigger
              value="app-publish"
              className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-semibold"
            >
              <Upload className="h-3.5 w-3.5" />
              Publish App
            </TabsTrigger>
            <TabsTrigger
              value="poppost"
              onClick={() => navigate('/poppost')}
              className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-semibold"
            >
              <CalendarClock className="h-3.5 w-3.5" />
              PopPost
            </TabsTrigger>
            <TabsTrigger
              value="media-generator"
              className="flex items-center gap-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white data-[state=active]:from-pink-600 data-[state=active]:to-purple-600 data-[state=active]:text-white font-bold rounded-md"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              🎛️ Media Gen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Quick Actions Overview */}
            <div className="space-y-8">
              {/* Projects Section */}
              <div>
                <h2 className="text-2xl font-semibold mb-6 text-center">Projects</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                  {projectsActions.map((action, index) => (
                    <Card
                      key={index}
                      className="group hover:shadow-xl transition-all duration-300 cursor-pointer bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg"
                      onClick={action.action}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className={`p-3 rounded-lg bg-gradient-to-r ${action.color} text-white`}>
                            <action.icon className="h-6 w-6" />
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {action.badge}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg group-hover:text-orange-600 transition-colors">
                          {action.title}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {action.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center text-orange-600 group-hover:text-orange-700 transition-colors">
                          <span className="text-sm font-medium">Manage</span>
                          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* BitPopCards Section */}
              <div>
                <h2 className="text-2xl font-semibold mb-6 text-center">BitPopCards</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                  {bitpopcardsActions.map((action, index) => (
                    <Card
                      key={index}
                      className="group hover:shadow-xl transition-all duration-300 cursor-pointer bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg"
                      onClick={action.action}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className={`p-3 rounded-lg bg-gradient-to-r ${action.color} text-white`}>
                            <action.icon className="h-6 w-6" />
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {action.badge}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg group-hover:text-orange-600 transition-colors">
                          {action.title}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {action.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center text-orange-600 group-hover:text-orange-700 transition-colors">
                          <span className="text-sm font-medium">Manage</span>
                          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Content Management Section */}
              <div>
                <h2 className="text-2xl font-semibold mb-6 text-center">Content Management</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                  {contentActions.map((action, index) => (
                    <Card
                      key={index}
                      className="group hover:shadow-xl transition-all duration-300 cursor-pointer bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg"
                      onClick={action.action}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className={`p-3 rounded-lg bg-gradient-to-r ${action.color} text-white`}>
                            <action.icon className="h-6 w-6" />
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {action.badge}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg group-hover:text-orange-600 transition-colors">
                          {action.title}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {action.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center text-orange-600 group-hover:text-orange-700 transition-colors">
                          <span className="text-sm font-medium">Manage</span>
                          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Quick Links Section */}
              <div>
                <h2 className="text-2xl font-semibold mb-6 text-center">Quick Access</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 border-orange-200"
                    onClick={() => navigate('/poppost')}
                  >
                    <CalendarClock className="h-6 w-6 text-orange-600" />
                    <span className="text-sm font-medium">PopPost</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                    onClick={() => navigate('/art')}
                  >
                <Palette className="h-6 w-6 text-orange-600" />
                    <span className="text-sm font-medium">View Gallery</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-pink-50 dark:hover:bg-pink-900/20"
                    onClick={() => navigate('/projects')}
                  >
                    <FolderKanban className="h-6 w-6 text-pink-600" />
                    <span className="text-sm font-medium">View Projects</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-green-50 dark:hover:bg-green-900/20"
                    onClick={() => navigate('/popup')}
                  >
                    <MapPin className="h-6 w-6 text-green-600" />
                    <span className="text-sm font-medium">View Events</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                    onClick={() => navigate('/shop?tab=fundraisers')}
                  >
                    <Target className="h-6 w-6 text-teal-600" />
                    <span className="text-sm font-medium">Fundraising</span>
                  </Button>
                   <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 border-orange-200"
                    onClick={() => navigate('/studio')}
                  >
                    <Library className="h-6 w-6 text-orange-600" />
                    <span className="text-sm font-medium">Pop Art Studio</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 border-orange-200"
                    onClick={() => setActiveTab('print')}
                  >
                    <Printer className="h-6 w-6 text-orange-500" />
                    <span className="text-sm font-medium">Print Shop</span>
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="homepage">
            <HomepageSettings />
          </TabsContent>

          <TabsContent value="settings">
            <SiteSettings />
          </TabsContent>

          <TabsContent value="art-progress">
            <ArtProgressManagement />
          </TabsContent>

          <TabsContent value="blog">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-6 w-6 mr-2" />
                  News Management
                </CardTitle>
                <CardDescription>
                  Import WordPress articles and manage your news posts on Nostr
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BlogPostManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="artist">
            <ArtistContentManagement />
          </TabsContent>

          <TabsContent value="wall">
            <WallManagement />
          </TabsContent>

          <TabsContent value="projects">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <FolderKanban className="h-6 w-6 text-orange-600" />
                <div>
                  <h2 className="text-2xl font-bold">Projects Management</h2>
                  <p className="text-sm text-muted-foreground">All project types in one place</p>
                </div>
              </div>
              <Tabs defaultValue="portfolio" className="w-full">
                <TabsList className="flex flex-wrap h-auto gap-1 w-full justify-start mb-4">
                  <TabsTrigger value="portfolio" className="flex items-center gap-1.5">
                    <FolderKanban className="h-3.5 w-3.5" /> Portfolio
                  </TabsTrigger>
                  <TabsTrigger value="designs" className="flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5" /> Project Designs
                  </TabsTrigger>
                  <TabsTrigger value="games" className="flex items-center gap-1.5">
                    <Gamepad2 className="h-3.5 w-3.5" /> Games
                  </TabsTrigger>
                  <TabsTrigger value="animations-projects" className="flex items-center gap-1.5">
                    <Clapperboard className="h-3.5 w-3.5" /> Animations
                  </TabsTrigger>
                  <TabsTrigger value="frl" className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" /> POPArt.frl
                  </TabsTrigger>
                  <TabsTrigger value="nostr" className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" /> Nostr Projects
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="portfolio">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FolderKanban className="h-5 w-5 mr-2" />
                        Portfolio Projects
                      </CardTitle>
                      <CardDescription>
                        Create and manage your main project portfolio shown on <a href="/projects" className="underline text-orange-600">/projects</a>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ProjectManagement />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="designs">
                  <Card>
                    <CardContent className="pt-6">
                      <ProjectDesignsManagement />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="games">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Gamepad2 className="h-5 w-5 mr-2" />
                        Games Projects
                      </CardTitle>
                      <CardDescription>
                        Add and manage game projects that appear on the <a href="/games" className="underline text-orange-600">/games</a> page
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ProjectManagement filterCategory="games" />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="animations-projects">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Clapperboard className="h-5 w-5 mr-2" />
                        Animations Projects
                      </CardTitle>
                      <CardDescription>
                        Add and manage animation projects that appear on the <a href="/animations" className="underline text-orange-600">/animations</a> page
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ProjectManagement filterCategory="animations" />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="frl">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Globe className="h-5 w-5 mr-2" />
                        POPArt.frl Projects
                      </CardTitle>
                      <CardDescription>
                        Add and manage projects that appear on the <a href="/frl" className="underline text-orange-600">/frl</a> page
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ProjectManagement filterCategory="frl" />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="nostr">
                  <NostrProjectManagement />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          <TabsContent value="animations-videos">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clapperboard className="h-6 w-6 mr-2" />
                  Animation Videos
                </CardTitle>
                <CardDescription>
                  Upload short animation videos that appear on the <a href="/animations" className="underline text-orange-600">/animations</a> page. Visitors can watch, download, and zap.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnimationsManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pages">
            <PageManagement />
          </TabsContent>

          <TabsContent value="social">
            <SocialMediaManagement />
          </TabsContent>

          <TabsContent value="newsletter">
            <NewsletterManager />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsSettings />
          </TabsContent>

          <TabsContent value="zaps">
            <ZapAnalytics />
          </TabsContent>

          <TabsContent value="popup">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-6 w-6 mr-2" />
                  PopUp Events Management
                </CardTitle>
                <CardDescription>
                  Create and manage your worldwide PopUp events schedule
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PopUpManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cards">
            <div className="space-y-8">
              <CardManagement />
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <LayoutTemplate className="h-6 w-6 mr-2 text-pink-600" />
                    Card Editor Templates
                  </CardTitle>
                  <CardDescription>
                    Upload background images that users can select in the "Create Your Own Card" editor.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CardTemplatesAdmin />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="card-templates">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LayoutTemplate className="h-6 w-6 text-pink-600" />
                  Card Editor Templates
                </CardTitle>
                <CardDescription>
                  Upload landscape background images for users to pick in the <strong>"Create Your Own Card"</strong> editor (<code>/cards/editor</code>).
                  Recommended size: <strong>1200 × 900 px (4:3 landscape)</strong>.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CardTemplatesAdmin />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="badges">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-6 w-6 mr-2" />
                  Badge Management
                </CardTitle>
                <CardDescription>
                  Create and manage collectible POP badges for your community
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BadgeManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shop">
            <ProductManagement />
          </TabsContent>

          <TabsContent value="print">
            <PrintPostersAdmin />
          </TabsContent>

          <TabsContent value="fundraisers">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-6 w-6 mr-2" />
                  Fundraiser Management
                </CardTitle>
                <CardDescription>
                  Create and manage crowdfunding campaigns for art projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FundraiserManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="art" className="space-y-6">
            {/* Sales — most important for admin, shown first */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-purple-600" />
                  Artwork Sales
                </CardTitle>
                <CardDescription>
                  All purchases, buyer info, shipping addresses and payment details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ArtworkSalesManager />
              </CardContent>
            </Card>

            <ArtBannerAdmin />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="h-6 w-6 mr-2" />
                  Artwork Management
                </CardTitle>
                <CardDescription>
                  Manage your artwork gallery and listings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={() => navigate('/art')} size="lg">
                    <Palette className="mr-2 h-5 w-5" />
                    Go to Art Gallery
                  </Button>
                  <Button onClick={() => navigate('/art?action=create')} size="lg" variant="outline">
                    <Plus className="mr-2 h-5 w-5" />
                    Create New Artwork
                  </Button>
                </div>
              </CardContent>
            </Card>

            <ArtworkCleanupTool />

            <ArtworkOrderManager />
          </TabsContent>

          <TabsContent value="app">
            <div className="space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <Smartphone className="h-6 w-6 text-orange-600" />
                <div>
                  <h2 className="text-xl font-bold">Fan App Content</h2>
                  <p className="text-sm text-muted-foreground">
                    Quick-upload and preview all content for the{' '}
                    <a href="/app" className="underline text-orange-600">BitPopArt App</a>.
                    Click <strong>Manage</strong> on any section for full edit/delete controls.
                  </p>
                </div>
              </div>
              <AppContentDashboard onNavigate={setActiveTab} />

              {/* Download analytics — inline in the same tab */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <h2 className="text-xl font-bold">Download Analytics</h2>
                </div>
                <AppAnalyticsDashboard />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="app-carousel">
            <CarouselAdmin onBack={() => setActiveTab('app')} />
          </TabsContent>

          <TabsContent value="app-wallpapers">
            <WallpapersAdmin onBack={() => setActiveTab('app')} />
          </TabsContent>

          <TabsContent value="app-gifs">
            <GifsAdmin onBack={() => setActiveTab('app')} />
          </TabsContent>

          <TabsContent value="app-avatars">
            <AvatarsAdmin onBack={() => setActiveTab('app')} />
          </TabsContent>

          <TabsContent value="app-banners">
            <BannersAdmin onBack={() => setActiveTab('app')} />
          </TabsContent>

          <TabsContent value="app-coloring-pages">
            <ColoringPagesAdmin onBack={() => setActiveTab('app')} />
          </TabsContent>

          <TabsContent value="app-desktop-wallpapers">
            <DesktopWallpapersAdmin onBack={() => setActiveTab('app')} />
          </TabsContent>

          <TabsContent value="app-memes">
            <MemesAdmin onBack={() => setActiveTab('app')} />
          </TabsContent>

          <TabsContent value="app-pops">
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={() => setActiveTab('app')} className="gap-1.5">
                <ArrowRight className="h-4 w-4 rotate-180" />
                Back to Fan App Overview
              </Button>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shapes className="h-5 w-5 text-violet-600" />
                    Pops — Cartoon &amp; Pop Characters
                  </CardTitle>
                  <CardDescription>
                    Upload cartoon illustrations, pop art characters, and sticker-style images. These appear in the
                    <strong> "Pops"</strong> tab in the Studio, Memes page, Cards editor, and the App meme/card creator.
                    Users tap a Pop to add it as a canvas layer on top of their design.
                    <br />
                    <span className="text-xs text-muted-foreground block mt-1">
                      Best format: PNG with transparent background, or SVG. Recommended: at least 500×500 px.
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <MediaUploader type="app-pop" label="Pop" />
                  <MediaList type="app-pop" aspectClass="aspect-square" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="app-meme-templates">
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={() => setActiveTab('app-memes')} className="gap-1.5">
                <ArrowRight className="h-4 w-4 rotate-180" />
                Back to Meme Creator
              </Button>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LayoutTemplate className="h-5 w-5 text-orange-600" />
                    Meme Creator — Templates
                  </CardTitle>
                  <CardDescription>
                    Upload background / canvas template images that appear in the <strong>"Templates"</strong> panel
                    below the canvas in the Pop Art Studio Meme Creator. Users click a template to use it as
                    their canvas background.
                    <br />
                    <span className="text-xs text-muted-foreground block mt-1">
                      Recommended: square or landscape JPG/PNG at 1080×1080 px or larger.
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <MediaUploader type="app-meme-template" label="Template" />
                  <MediaList type="app-meme-template" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="app-meme-icons">
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={() => setActiveTab('app-memes')} className="gap-1.5">
                <ArrowRight className="h-4 w-4 rotate-180" />
                Back to Meme Creator
              </Button>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shapes className="h-5 w-5 text-pink-600" />
                    Meme Creator — Icons
                  </CardTitle>
                  <CardDescription>
                    Upload SVG (or PNG) icons that users can add as extra layers in the Meme Creator. They appear
                    in the <strong>"Icons"</strong> tab of the element library in the Pop Art Studio.
                    <br />
                    <span className="text-xs text-muted-foreground block mt-1">
                      Best format: SVG files for crisp scaling. PNG with transparent background also works.
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <MediaUploader type="app-meme-icon" label="Icon" />
                  <MediaList type="app-meme-icon" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="app-publish">
            <FanAppPublishing />
          </TabsContent>

          <TabsContent value="studio">
            <StudioLibrariesAdmin />
          </TabsContent>

          <TabsContent value="nft">
            <NFTCharacterAdmin />
          </TabsContent>

          <TabsContent value="media-generator">
            <MediaGeneratorAdmin />
          </TabsContent>

        </Tabs>

        {/* Platform Info */}
        <Card className="max-w-6xl mx-auto bg-gradient-to-r from-orange-100 to-pink-100 dark:from-orange-900/30 dark:to-pink-900/30 border-0">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-orange-600 mr-2" />
                <h2 className="text-2xl font-bold">BitPopArt Platform</h2>
              </div>
              <p className="text-lg mb-6 text-muted-foreground">
                Bitcoin PopArt meets Nostr - Decentralized creativity and commerce
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Button
                onClick={() => navigate('/art')}
                size="lg"
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
              >
                <Palette className="h-6 w-6 text-purple-600" />
                <div className="text-center">
                  <div className="font-semibold">Art Gallery</div>
                  <div className="text-xs text-muted-foreground">Browse & Sell</div>
                </div>
              </Button>
              <Button
                onClick={() => navigate('/projects')}
                size="lg"
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
              >
                <FolderKanban className="h-6 w-6 text-pink-600" />
                <div className="text-center">
                  <div className="font-semibold">Projects</div>
                  <div className="text-xs text-muted-foreground">Portfolio</div>
                </div>
              </Button>
              <Button
                onClick={() => navigate('/popup')}
                size="lg"
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
              >
                <MapPin className="h-6 w-6 text-green-600" />
                <div className="text-center">
                  <div className="font-semibold">PopUp Events</div>
                  <div className="text-xs text-muted-foreground">Worldwide</div>
                </div>
              </Button>
              <Button
                onClick={() => navigate('/shop')}
                size="lg"
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
              >
                <ShoppingBag className="h-6 w-6 text-orange-600" />
                <div className="text-center">
                  <div className="font-semibold">Shop</div>
                  <div className="text-xs text-muted-foreground">Marketplace</div>
                </div>
              </Button>
              <Button
                onClick={() => navigate('/cards')}
                size="lg"
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
              >
                <CreditCard className="h-6 w-6 text-violet-600" />
                <div className="text-center">
                  <div className="font-semibold">POP Cards</div>
                  <div className="text-xs text-muted-foreground">Good Vibes</div>
                </div>
              </Button>
              <Button
                onClick={() => navigate('/artist')}
                size="lg"
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
              >
                <User className="h-6 w-6 text-blue-600" />
                <div className="text-center">
                  <div className="font-semibold">Artist Page</div>
                  <div className="text-xs text-muted-foreground">Your Story</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-16 text-sm text-gray-500 dark:text-gray-400">
          <p>Nostr & BitPopArt {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
};

export default Admin;