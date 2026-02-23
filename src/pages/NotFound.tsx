import { useSeoMeta } from "@unhead/react";
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Palette, ShoppingBag } from "lucide-react";

// Get the base path from import.meta.env or default to '/'
const basePath = import.meta.env.BASE_URL || '/';

const NotFound = () => {
  const location = useLocation();

  useSeoMeta({
    title: "404 - Page Not Found",
    description: "The page you are looking for could not be found. Return to the home page to continue browsing.",
  });

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-50 dark:from-gray-900 dark:via-orange-900/20 dark:to-yellow-900/20 flex items-center justify-center">
      <div className="text-center max-w-lg mx-auto px-4 py-12">
        {/* Large B Logo */}
        <div className="mb-8 animate-bounce">
          <img 
            src={`${basePath}B-Funny_avatar_orange.svg`}
            alt="BitPopArt Logo" 
            className="h-40 w-40 mx-auto"
          />
        </div>

        {/* 404 Text */}
        <h1 className="text-7xl font-bold mb-4 bg-gradient-to-r from-orange-600 via-yellow-600 to-orange-600 bg-clip-text text-transparent">
          404
        </h1>

        {/* Message */}
        <p className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-8">
          Nothing POPping up!?
        </p>

        <p className="text-lg text-muted-foreground mb-8">
          Go to:
        </p>

        {/* Buttons */}
        <div className="space-y-4 max-w-sm mx-auto">
          <Button 
            asChild 
            className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white text-lg py-6"
          >
            <Link to="/">
              <Home className="mr-2 h-5 w-5" />
              Home
            </Link>
          </Button>
          
          <Button 
            asChild 
            variant="outline"
            className="w-full border-2 border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-lg py-6"
          >
            <Link to="/art">
              <Palette className="mr-2 h-5 w-5" />
              Art
            </Link>
          </Button>

          <Button 
            asChild 
            variant="outline"
            className="w-full border-2 border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-lg py-6"
          >
            <Link to="/shop">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Visit Shop
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
