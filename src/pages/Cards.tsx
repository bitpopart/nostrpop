import { useState, useEffect } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useSearchParams, Link, useLocation } from 'react-router-dom';
import { CreateCardForm } from '@/components/cards/CreateCardForm';
import { CardList } from '@/components/cards/CardList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { useCardCategories } from '@/hooks/useCardCategories';
import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsAdmin } from '@/hooks/useIsAdmin';



const Cards = () => {
  const { visibleCategories, getCategoryByName } = useCardCategories();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('create');

  // Get category names for filtering, with 'All' as first option
  const categoryOptions = ['All', ...visibleCategories.map(cat => cat.name)];

  // Check if current user is admin
  const isAdmin = useIsAdmin();

  // Handle URL parameters for tab navigation
  useEffect(() => {
    // Check if we're on the /cards/create route
    if (location.pathname === '/cards/create') {
      setActiveTab('create');
      return;
    }

    const tabParam = searchParams.get('tab');
    if (tabParam && ['create', 'my-cards', 'browse'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else if (isAdmin) {
      setActiveTab('create');
    } else {
      setActiveTab('browse');
    }
  }, [searchParams, isAdmin, location.pathname]);

  useSeoMeta({
    title: 'BitPop Cards - Create Beautiful Digital Cards',
    description: 'Create and share beautiful digital cards for any occasion. Choose from various categories and customize your perfect BitPop card.',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            BitPop Cards
          </h1>
        </div>

        {/* Main Content */}
        {isAdmin ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto mb-8">
              <TabsTrigger value="create">Create New</TabsTrigger>
              <TabsTrigger value="my-cards">My Cards</TabsTrigger>
              <TabsTrigger value="browse">Browse All</TabsTrigger>
            </TabsList>

            <TabsContent value="browse">
              <div className="max-w-6xl mx-auto space-y-6">
                {/* Category Filter */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-center">Browse All Cards (Admin View)</h3>
                  <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
                    {categoryOptions.map((categoryName) => {
                      const category = getCategoryByName(categoryName);
                      return (
                        <Button
                          key={categoryName}
                          variant={selectedCategory === categoryName ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedCategory(categoryName)}
                          className={cn(
                            "text-xs",
                            selectedCategory === categoryName
                              ? "bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600"
                              : "hover:bg-purple-50 dark:hover:bg-purple-900/20"
                          )}
                        >
                          {category && categoryName !== 'All' && (
                            <span className="mr-1">{category.icon}</span>
                          )}
                          {categoryName}
                          {categoryName === 'All' && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              All
                            </Badge>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Card List with Category Filter */}
                <CardList showMyCards={false} selectedCategory={selectedCategory === 'All' ? undefined : selectedCategory} />
              </div>
            </TabsContent>

            <TabsContent value="create">
              <Card className="max-w-4xl mx-auto shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl text-center">Create Your Perfect BitPop Card</CardTitle>
                  <CardDescription className="text-center">
                    Fill in the details below to create a personalized digital card
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CreateCardForm />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="my-cards">
              <div className="max-w-6xl mx-auto">
                <CardList showMyCards={true} />
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Category Filter */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">Browse by Category</h3>
              <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
                {categoryOptions.map((categoryName) => {
                  const category = getCategoryByName(categoryName);
                  return (
                    <Button
                      key={categoryName}
                      variant={selectedCategory === categoryName ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(categoryName)}
                      className={cn(
                        "text-xs",
                        selectedCategory === categoryName
                          ? "bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600"
                          : "hover:bg-purple-50 dark:hover:bg-purple-900/20"
                      )}
                    >
                      {category && categoryName !== 'All' && (
                        <span className="mr-1">{category.icon}</span>
                      )}
                      {categoryName}
                      {categoryName === 'All' && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          All
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Card List with Category Filter */}
            <CardList showMyCards={false} selectedCategory={selectedCategory === 'All' ? undefined : selectedCategory} />
          </div>
        )}

        {/* Floating Admin Button */}
        {isAdmin && (
          <div className="fixed bottom-6 right-6 z-50">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-full h-14 w-14 p-0"
            >
              <Link to="/admin" className="flex items-center justify-center">
                <Shield className="h-6 w-6" />
              </Link>
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-16 text-sm text-gray-500 dark:text-gray-400">
          <p>Nostr & BitPopArt {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
};

export default Cards;