import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { Layout } from "./components/Layout";
import { AppLayout } from "./components/AppLayout";

import Index from "./pages/Index";
import Cards from "./pages/Cards";
import CreateCard from "./pages/CreateCard";
import CardView from "./pages/CardView";
import CardPreview from "./pages/CardPreview";
import Art from "./pages/Art";
import ArtworkView from "./pages/ArtworkView";
import Art21K from "./pages/Art21K";
import Shop from "./pages/Shop";
import Admin from "./pages/Admin";
import Feed from "./pages/Feed";
import Canvas100M from "./pages/Canvas100M";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import PopUp from "./pages/PopUp";
import PopUpEventView from "./pages/PopUpEventView";
import PopUpEventSite from "./pages/PopUpEventSite";
import Artist from "./pages/Artist";
import Projects from "./pages/Projects";
import NostrProjects from "./pages/NostrProjects";
import NostrProjectView from "./pages/NostrProjectView";
import Badges from "./pages/Badges";
import Fundraising from "./pages/Fundraising";
import Vlog from "./pages/Vlog";
import Wall from "./pages/Wall";
import CustomPage from "./pages/CustomPage";
import { CategoryDemo } from "./pages/CategoryDemo";
import { ProductPage } from "./pages/ProductPage";
import { DeleteProductPage } from "./pages/DeleteProductPage";
import OrderConfirmation from "./pages/OrderConfirmation";
import OrdersPage from "./pages/Orders";
import ShopDebugPage from "./pages/ShopDebug";
import FreeDownloads from "./pages/FreeDownloads";
import FreeGallery from "./pages/FreeGallery";
import Games from "./pages/Games";
import Animations from "./pages/Animations";
import Wallpapers from "./pages/Wallpapers";
import Gifs from "./pages/Gifs";
import Avatars from "./pages/Avatars";
import Banners from "./pages/Banners";
import ColoringPages from "./pages/ColoringPages";
import DesktopWallpapers from "./pages/DesktopWallpapers";
import Memes from "./pages/Memes";
import AppPage from "./pages/AppPage";
import AppHashtagPage from "./pages/AppHashtagPage";
import PopPost from "./pages/PopPost";
import Community from "./pages/Community";
import Studio from "./pages/Studio";
import Frl from "./pages/Frl";
import FrlProjectView from "./pages/FrlProjectView";
import Print from "./pages/Print";
import NFT from "./pages/NFT";
import NFTAdmin from "./pages/NFTAdmin";
import Block from "./pages/Block";
import BrandGuide from "./pages/BrandGuide";
import Sitemap from "./pages/Sitemap";
import CloudPage from "./pages/Cloud";
import CloudAppViewer from "./pages/CloudAppViewer";
import NotFound from "./pages/NotFound";

export function AppRouter() {
  // Use the base URL that Vite injects based on build config
  const basename = import.meta.env.BASE_URL;
  
  return (
    <BrowserRouter basename={basename}>
      <ScrollToTop />
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
        <Route path="/canvas" element={<Layout><Canvas100M /></Layout>} />
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
        <Route path="/free/images" element={<Layout><FreeDownloads /></Layout>} />
        <Route path="/games" element={<Layout><Games /></Layout>} />
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
        <Route path="/frl/:projectId" element={<Layout><FrlProjectView /></Layout>} />
        <Route path="/print" element={<Layout><Print /></Layout>} />
        <Route path="/NFT" element={<Layout><NFT /></Layout>} />
        <Route path="/Block" element={<Layout><Block /></Layout>} />
        <Route path="/brand-guide" element={<Layout><BrandGuide /></Layout>} />
        <Route path="/sitemap" element={<Layout><Sitemap /></Layout>} />
        {/* Cloud private space — no site Layout wrapper; full-screen experience */}
        <Route path="/cloud" element={<CloudPage />} />
        <Route path="/cloud/:appId" element={<CloudAppViewer />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="/:slug" element={<Layout><CustomPage /></Layout>} />
        <Route path="*" element={<Layout><NotFound /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}
export default AppRouter;
