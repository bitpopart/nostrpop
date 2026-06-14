import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { Layout } from "./components/Layout";

import Index from "./pages/Index";
import Cards from "./pages/Cards";
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
import FreeDownloads from "./pages/FreeDownloads";
import FreeGallery from "./pages/FreeGallery";
import Games from "./pages/Games";
import Animations from "./pages/Animations";
import Wallpapers from "./pages/Wallpapers";
import Gifs from "./pages/Gifs";
import Avatars from "./pages/Avatars";
import Banners from "./pages/Banners";
import Frl from "./pages/Frl";
import AppPage from "./pages/AppPage";
import PopPost from "./pages/PopPost";
import Community from "./pages/Community";
import NotFound from "./pages/NotFound";

export function AppRouter() {
  // Use the base URL that Vite injects based on build config
  const basename = import.meta.env.BASE_URL;
  
  return (
    <BrowserRouter basename={basename}>
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/cards" element={<Cards />} />
          <Route path="/cards/create" element={<Cards />} />
          <Route path="/card/:nip19" element={<CardView />} />
          <Route path="/share/:nip19" element={<CardPreview />} />
          <Route path="/art" element={<Art />} />
          <Route path="/art/:naddr" element={<ArtworkView />} />
          <Route path="/21k-art" element={<Art21K />} />
          <Route path="/canvas" element={<Canvas100M />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:articleId" element={<BlogPost />} />
          <Route path="/popup" element={<PopUp />} />
          <Route path="/popup/:eventId" element={<PopUpEventView />} />
          <Route path="/popup/:eventId/site" element={<PopUpEventSite />} />
          <Route path="/artist" element={<Artist />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/nostr-projects" element={<NostrProjects />} />
          <Route path="/nostr-projects/:projectId" element={<NostrProjectView />} />
          <Route path="/badges" element={<Badges />} />
          <Route path="/fundraising" element={<Fundraising />} />
          <Route path="/vlog" element={<Vlog />} />
          <Route path="/wall" element={<Wall />} />
          <Route path="/categories" element={<CategoryDemo />} />
          <Route path="/shop/:productId/delete" element={<DeleteProductPage />} />
          <Route path="/shop/:productId" element={<ProductPage />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/free" element={<FreeGallery />} />
          <Route path="/free/images" element={<FreeDownloads />} />
          <Route path="/games" element={<Games />} />
          <Route path="/animations" element={<Animations />} />
          <Route path="/wallpapers" element={<Wallpapers />} />
          <Route path="/gifs" element={<Gifs />} />
          <Route path="/avatars" element={<Avatars />} />
          <Route path="/banners" element={<Banners />} />
          <Route path="/frl" element={<Frl />} />
          <Route path="/app" element={<AppPage />} />
          <Route path="/poppost" element={<PopPost />} />
          <Route path="/community" element={<Community />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="/:slug" element={<CustomPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
export default AppRouter;
