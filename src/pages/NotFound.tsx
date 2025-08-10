import { useSeoMeta } from "@unhead/react";
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-8xl mb-6">🎨</div>
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
          404
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Oops! This page seems to have wandered off into the digital void.
        </p>
        <div className="space-y-4">
          <Button asChild className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600">
            <Link to="/cards">
              <Home className="mr-2 h-4 w-4" />
              Go to Cards
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/shop">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Visit Shop
            </Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-8">
          Let's get you back to creating beautiful cards!
        </p>
      </div>
    </div>
  );
};

export default NotFound;
