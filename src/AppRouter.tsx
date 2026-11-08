import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { Layout } from "./components/Layout";
import { LayoutIframe } from "./components/LayoutIframe";
import { AppLayout } from "./components/AppLayout";

import Index from "./pages/Index";
const Cards = lazy(() => import("./pages/Cards"));
const CreateCard = lazy(() => import("./pages/CreateCard"));
const CardView = lazy(() => import("./pages/CardView"));
const CardPreview = lazy(() => import("./pages/CardPreview"));
const Art = lazy(() => import("./pages/Art"));
const ArtworkView = lazy(() => import("./pages/ArtworkView"));
const Art21K = lazy(() => import("./pages/Art21K"));
const Shop = lazy(() => import("./pages/Shop"));
const Admin = lazy(() => import("./pages/Admin"));
const Feed = lazy(() => import("./pages/Feed"));
const GameCanvas100M = lazy(() => import("./pages/GameCanvas100M"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const PopUp = lazy(() => import("./pages/PopUp"));
const PopUpEventView = lazy(() => import("./pages/PopUpEventView"));
const PopUpEventSite = lazy(() => import("./pages/PopUpEventSite"));
const Artist = lazy(() => import("./pages/Artist"));
const Projects = lazy(() => import("./pages/Projects"));
const NostrProjects = lazy(() => import("./pages/NostrProjects"));
const NostrProjectView = lazy(() => import("./pages/NostrProjectView"));
const Badges = lazy(() => import("./pages/Badges"));
const Fundraising = lazy(() => import("./pages/Fundraising"));
const Vlog = lazy(() => import("./pages/Vlog"));
const Wall = lazy(() => import("./pages/Wall"));
const CustomPage = lazy(() => import("./pages/CustomPage"));
const CategoryDemo = lazy(() => import("./pages/CategoryDemo").then((m) => ({ default: m.CategoryDemo })));
const ProductPage = lazy(() => import("./pages/ProductPage").then((m) => ({ default: m.ProductPage })));
const DeleteProductPage = lazy(() => import("./pages/DeleteProductPage").then((m) => ({ default: m.DeleteProductPage })));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const OrdersPage = lazy(() => import("./pages/Orders"));
const ShopDebugPage = lazy(() => import("./pages/ShopDebug"));
const FreeDownloads = lazy(() => import("./pages/FreeDownloads"));
const FreeGallery = lazy(() => import("./pages/FreeGallery"));
const Games = lazy(() => import("./pages/Games"));
const GameMoneyPrinter = lazy(() => import("./pages/GameMoneyPrinter"));
const GameQuiz21 = lazy(() => import("./pages/GameQuiz21"));
const GamesProjectView = lazy(() => import("./pages/GamesProjectView"));
const Animations = lazy(() => import("./pages/Animations"));
const Wallpapers = lazy(() => import("./pages/Wallpapers"));
const Gifs = lazy(() => import("./pages/Gifs"));
const Avatars = lazy(() => import("./pages/Avatars"));
const Banners = lazy(() => import("./pages/Banners"));
const ColoringPages = lazy(() => import("./pages/ColoringPages"));
const DesktopWallpapers = lazy(() => import("./pages/DesktopWallpapers"));
const Memes = lazy(() => import("./pages/Memes"));
const AppPage = lazy(() => import("./pages/AppPage"));
const AppHashtagPage = lazy(() => import("./pages/AppHashtagPage"));
const PopPost = lazy(() => import("./pages/PopPost"));
const Community = lazy(() => import("./pages/Community"));
const Studio = lazy(() => import("./pages/Studio"));
const Frl = lazy(() => import("./pages/Frl"));
const FrlProjectView = lazy(() => import("./pages/FrlProjectView"));
const Print = lazy(() => import("./pages/Print"));
const NFT = lazy(() => import("./pages/NFT"));
const NFTAdmin = lazy(() => import("./pages/NFTAdmin"));
const Block = lazy(() => import("./pages/Block"));
const BrandPortalPage = lazy(() => import("./pages/BrandPortalPage"));
const ClientLogin = lazy(() => import("./pages/ClientLogin"));
const ClientPortalPage = lazy(() => import("./pages/ClientPortalPage"));
const ProposalPublicPage = lazy(() => import("./pages/ProposalPublicPage"));
const Sitemap = lazy(() => import("./pages/Sitemap"));
const CloudPage = lazy(() => import("./pages/Cloud"));
const CloudAppViewer = lazy(() => import("./pages/CloudAppViewer"));
const Gallery = lazy(() => import("./pages/Gallery"));
const IconDownloads = lazy(() => import("./pages/IconDownloads"));
const Zapper = lazy(() => import("./pages/Zapper"));
const ZapWall = lazy(() => import("./pages/ZapWall"));
const JustB = lazy(() => import("./pages/JustB"));
const Rare = lazy(() => import("./pages/Rare"));
const WhatsNew = lazy(() => import("./pages/WhatsNew"));
const TCG = lazy(() => import("./pages/TCG"));
const BitBot = lazy(() => import("./pages/BitBot"));
const BitBotCrowdfunding = lazy(() => import("./pages/BitBotCrowdfunding"));
const NotFound = lazy(() => import("./pages/NotFound"));
import { SeoCanonical } from "./components/SeoCanonical";

function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <img src="/bitpopart-logo.png" alt="" width={56} height={56} className="animate-pulse rounded-full" />
    </div>
  );
}

export function AppRouter() {
  // Use the base URL that Vite injects based on build config
  const basename = import.meta.env.BASE_URL;
  
  return (
    <BrowserRouter basename={basename}>
      <ScrollToTop />
      <SeoCanonical />
      <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Full-screen admin route — no site Layout */}
        <Route path="/nft-admin" element={<NFTAdmin />} />

        {/* All other routes wrapped in the site Layout */}
        <Route path="/" element={<Layout><Index /></Layout>} />
        <Route path="/cards" element={<Layout><Cards /></Layout>} />
        <Route path="/cards/create" element={<Layout><Cards /></Layout>} />
        <Route path="/cards/editor" element={<Layout><CreateCard /></Layout>} />
        <Route path="/card/:nip19" element={<Layout><CardView /></Layout>} />
        <Route path="/share/:nip19" element={<Layout><CardPreview /></Layout>} />
        <Route path="/art" element={<Layout><Art /></Layout>} />
        <Route path="/art/:naddr" element={<Layout><ArtworkView /></Layout>} />
        <Route path="/21k-art" element={<Layout><Art21K /></Layout>} />
        <Route path="/canvas" element={<LayoutIframe><GameCanvas100M /></LayoutIframe>} />
        <Route path="/shop" element={<Layout><Shop /></Layout>} />
        <Route path="/admin" element={<Layout><Admin /></Layout>} />
        <Route path="/feed" element={<Layout><Feed /></Layout>} />
        <Route path="/blog" element={<Layout><Blog /></Layout>} />
        <Route path="/blog/:articleId" element={<Layout><BlogPost /></Layout>} />
        <Route path="/popup" element={<Layout><PopUp /></Layout>} />
        <Route path="/popup/:eventId" element={<Layout><PopUpEventView /></Layout>} />
        <Route path="/popup/:eventId/site" element={<Layout><PopUpEventSite /></Layout>} />
        <Route path="/artist" element={<Layout><Artist /></Layout>} />
        <Route path="/projects" element={<Layout><Projects /></Layout>} />
        <Route path="/nostr-projects" element={<Layout><NostrProjects /></Layout>} />
        <Route path="/nostr-projects/:projectId" element={<Layout><NostrProjectView /></Layout>} />
        <Route path="/badges" element={<Layout><Badges /></Layout>} />
        <Route path="/fundraising" element={<Layout><Fundraising /></Layout>} />
        <Route path="/vlog" element={<Layout><Vlog /></Layout>} />
        <Route path="/wall" element={<Layout><Wall /></Layout>} />
        <Route path="/categories" element={<Layout><CategoryDemo /></Layout>} />
        <Route path="/shop/:productId/delete" element={<Layout><DeleteProductPage /></Layout>} />
        <Route path="/shop/:productId" element={<Layout><ProductPage /></Layout>} />
        <Route path="/order-confirmation" element={<Layout><OrderConfirmation /></Layout>} />
        <Route path="/orders" element={<Layout><OrdersPage /></Layout>} />
        <Route path="/debug" element={<Layout><ShopDebugPage /></Layout>} />
        <Route path="/free" element={<Layout><FreeGallery /></Layout>} />
        <Route path="/icon-downloads" element={<Layout><IconDownloads /></Layout>} />
        <Route path="/free/images" element={<Layout><FreeDownloads /></Layout>} />
        <Route path="/games" element={<Layout><Games /></Layout>} />
        <Route path="/games/moneyprinter" element={<LayoutIframe><GameMoneyPrinter /></LayoutIframe>} />
        <Route path="/games/quiz21" element={<LayoutIframe><GameQuiz21 /></LayoutIframe>} />
        <Route path="/games/:projectId" element={<LayoutIframe><GamesProjectView /></LayoutIframe>} />
        <Route path="/animations" element={<Layout><Animations /></Layout>} />
        <Route path="/wallpapers" element={<Layout><Wallpapers /></Layout>} />
        <Route path="/gifs" element={<Layout><Gifs /></Layout>} />
        <Route path="/avatars" element={<Layout><Avatars /></Layout>} />
        <Route path="/banners" element={<Layout><Banners /></Layout>} />
        <Route path="/coloring-pages" element={<Layout><ColoringPages /></Layout>} />
        <Route path="/desktop-wallpapers" element={<Layout><DesktopWallpapers /></Layout>} />
        <Route path="/memes" element={<Layout><Memes /></Layout>} />
        <Route path="/app" element={<AppLayout><AppPage /></AppLayout>} />
        <Route path="/app/hashtag/:tag" element={<AppLayout><AppHashtagPage /></AppLayout>} />
        <Route path="/poppost" element={<Layout><PopPost /></Layout>} />
        <Route path="/community" element={<Layout><Community /></Layout>} />
        <Route path="/studio" element={<Layout><Studio /></Layout>} />
        <Route path="/frl" element={<Layout><Frl /></Layout>} />
        <Route path="/frl/:projectId" element={<LayoutIframe><FrlProjectView /></LayoutIframe>} />
        <Route path="/print" element={<Layout><Print /></Layout>} />
        <Route path="/NFT" element={<Layout><NFT /></Layout>} />
        <Route path="/Block" element={<Layout><Block /></Layout>} />
        {/* Brand guide — gated behind Client Portal session, no site Layout */}
        <Route path="/brand" element={<BrandPortalPage />} />
        {/* Legacy URL: redirect old /brand-guide to the new /brand */}
        <Route path="/brand-guide" element={<Navigate to="/brand" replace />} />
        {/* Client portal — no site Layout; has own sticky header */}
        <Route path="/login" element={<ClientLogin />} />
        <Route path="/client" element={<ClientPortalPage />} />
        <Route path="/client/:slug" element={<ClientPortalPage />} />
        {/* Public proposal page — no login needed; uses main site Layout */}
        <Route path="/proposal/:slug" element={<Layout><ProposalPublicPage /></Layout>} />
        <Route path="/sitemap" element={<Layout><Sitemap /></Layout>} />
        {/* Cloud private space — no site Layout wrapper; full-screen experience */}
        <Route path="/cloud" element={<CloudPage />} />
        <Route path="/cloud/:appId" element={<CloudAppViewer />} />
        {/* POP WORLD Virtual Gallery — full-screen iframe experience */}
        <Route path="/gallery" element={<LayoutIframe><Gallery /></LayoutIframe>} />
        {/* Zapper — ZAPPER zap lamps updates & control, inline under the site menu/footer */}
        <Route path="/zapper" element={<Layout><Zapper /></Layout>} />
        {/* Zapwall — Stream Road live channels & zap walls, inline under the site menu/footer */}
        <Route path="/zapwall" element={<Layout><ZapWall /></Layout>} />
        {/* Just B — Mystery Box, inline under the site menu/footer */}
        <Route path="/b" element={<Layout><JustB /></Layout>} />
        {/* RARE — the Just B rarity ledger full page, same document as the ledger on /b */}
        <Route path="/rare" element={<Layout><Rare /></Layout>} />
        {/* NEW — the Just B "What's New" feed, inline under the site menu/footer */}
        <Route path="/new" element={<Layout><WhatsNew /></Layout>} />
        {/* The Stack — Just B card game, inline under the site menu/footer */}
        <Route path="/tcg" element={<Layout><TCG /></Layout>} />
        {/* BitBot — pocket bot page (birth date, in-progress), inline under the site menu/footer */}
        <Route path="/bitbot" element={<Layout><BitBotCrowdfunding /></Layout>} />
        {/* The original BitBot page (live board, pocket guide) now lives here */}
        <Route path="/bitbot/guide" element={<Layout><BitBot /></Layout>} />
        {/* BitBot crowdfunding — campaign page, inline under the site menu/footer */}
        <Route path="/bitbot/crowdfunding" element={<Layout><BitBotCrowdfunding /></Layout>} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="/:slug" element={<Layout><CustomPage /></Layout>} />
        <Route path="*" element={<Layout><NotFound /></Layout>} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
export default AppRouter;
