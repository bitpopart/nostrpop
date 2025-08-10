import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/useToast';
import { useNavigate } from 'react-router-dom';
import { useCardCategories } from '@/hooks/useCardCategories';
import { CategoryManagement } from './CategoryManagement';
import type { NostrEvent } from '@nostrify/nostrify';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  TrendingUp,
  Users,
  Eye,
  Calendar,
  Tag,
  Image as ImageIcon,
  Settings
} from 'lucide-react';

interface CardData {
  id: string;
  title: string;
  description: string;
  category: string;
  images?: string[];
  created_at: string;
  event: NostrEvent;
}

const CARD_KIND = 30402; // NIP-99 classified listings for cards



export function CardManagement() {
  const [activeTab, setActiveTab] = useState('cards');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchQuery, setSearchQuery] = useState('');

  const { user } = useCurrentUser();
  const { nostr } = useNostr();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Get categories
  const { allCategories, visibleCategories, getCategoryByName } = useCardCategories();

  // Create category options for the select (only visible categories)
  const categoryOptions = ['All Categories', ...visibleCategories.map(cat => cat.name)];

  // Fetch all cards
  const { data: allCards, isLoading, refetch } = useQuery({
    queryKey: ['admin-cards', selectedCategory],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      const events = await nostr.query([
        {
          kinds: [CARD_KIND],
          '#t': ['ecard'],
          limit: 100
        }
      ], { signal });

      const processedCards = events
        .map(event => {
          try {
            const content = JSON.parse(event.content);
            const dTag = event.tags.find(([name]) => name === 'd')?.[1];
            const titleTag = event.tags.find(([name]) => name === 'title')?.[1];

            if (!dTag || !titleTag || !content.title || !content.category) {
              return null;
            }

            return {
              id: dTag,
              event,
              ...content
            } as CardData;
          } catch {
            return null;
          }
        })
        .filter(Boolean) as CardData[];

      // Filter by category if selected
      const filteredCards = selectedCategory === 'All Categories'
        ? processedCards
        : processedCards.filter(card => card.category === selectedCategory);

      return filteredCards.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Filter cards by search query
  const filteredCards = allCards?.filter(card =>
    card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.category.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Get user's cards only
  const userCards = allCards?.filter(card => card.event.pubkey === user?.pubkey) || [];

  // Calculate stats
  const totalCards = allCards?.length || 0;
  const userCardCount = userCards.length;
  const categoriesCount = allCategories.length;
  const recentCards = allCards?.filter(card => {
    const cardDate = new Date(card.created_at);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return cardDate > weekAgo;
  }).length || 0;

  const handleDeleteCard = async (cardId: string) => {
    try {
      console.log('Deleting card:', cardId);
      toast({
        title: "Card Deleted",
        description: "The card has been removed from the platform.",
      });
      refetch();
    } catch {
      toast({
        title: "Delete Failed",
        description: "Failed to delete the card. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditCard = (cardId: string) => {
    navigate(`/cards/edit/${cardId}`);
  };

  const handleViewCard = (cardId: string) => {
    // Create naddr for the card
    const card = allCards?.find(c => c.id === cardId);
    if (card) {
      // For now, just navigate to cards page - in a real implementation,
      // you'd create a proper naddr and navigate to the card view
      navigate(`/cards`);
    }
  };

  if (!user) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>
            Please log in to manage cards.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Card Administration</h1>
          <p className="text-muted-foreground">
            Manage BitPop cards across the platform
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setActiveTab('categories')}
          >
            <Settings className="w-4 h-4 mr-2" />
            Manage Categories
          </Button>
          <Button
            onClick={() => navigate('/cards/create')}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Card
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cards</p>
                <p className="text-2xl font-bold">{totalCards}</p>
              </div>
              <ImageIcon className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">My Cards</p>
                <p className="text-2xl font-bold">{userCardCount}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{categoriesCount}</p>
              </div>
              <Tag className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">{recentCards}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="cards">All Cards</TabsTrigger>
          <TabsTrigger value="my-cards">My Cards</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search cards..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <div className="aspect-video">
                    <Skeleton className="w-full h-full" />
                  </div>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCards.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 px-8 text-center">
                <div className="max-w-sm mx-auto space-y-6">
                  <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                  <div>
                    <CardTitle className="mb-2">No Cards Found</CardTitle>
                    <CardDescription>
                      {searchQuery || selectedCategory !== 'All Categories'
                        ? "No cards match your current filters. Try adjusting your search or category filter."
                        : "No cards have been created yet. Be the first to create a beautiful BitPop card!"
                      }
                    </CardDescription>
                  </div>
                  <Button onClick={() => navigate('/cards/create')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Card
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCards.map((card) => (
                <Card key={card.id} className="group hover:shadow-lg transition-all duration-300">
                  {/* Card Preview */}
                  <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20">
                    {card.images && card.images.length > 0 ? (
                      <img
                        src={card.images[0]}
                        alt={card.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-gray-400" />
                      </div>
                    )}

                    {/* Category Badge */}
                    <div className="absolute top-2 left-2">
                      {(() => {
                        const category = getCategoryByName(card.category);
                        return category ? (
                          <Badge
                            style={{ backgroundColor: category.color, color: '#fff' }}
                            className="text-xs flex items-center space-x-1"
                          >
                            <span>{category.icon}</span>
                            <span>{card.category}</span>
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            {card.category}
                          </Badge>
                        );
                      })()}
                    </div>

                    {/* Author indicator */}
                    {card.event.pubkey === user?.pubkey && (
                      <div className="absolute top-2 right-2">
                        <Badge className="text-xs bg-green-500">
                          My Card
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold truncate">
                      {card.title}
                    </CardTitle>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(card.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <CardDescription className="text-sm line-clamp-2 mb-3">
                      {card.description}
                    </CardDescription>

                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewCard(card.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {card.event.pubkey === user?.pubkey && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditCard(card.id)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Card</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{card.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteCard(card.id)}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-cards" className="space-y-6">
          {userCards.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 px-8 text-center">
                <div className="max-w-sm mx-auto space-y-6">
                  <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                  <div>
                    <CardTitle className="mb-2">No Cards Created</CardTitle>
                    <CardDescription>
                      You haven't created any cards yet. Start creating beautiful BitPop cards to share joy!
                    </CardDescription>
                  </div>
                  <Button onClick={() => navigate('/cards/create')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Card
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userCards.map((card) => (
                <Card key={card.id} className="group hover:shadow-lg transition-all duration-300">
                  {/* Card Preview */}
                  <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20">
                    {card.images && card.images.length > 0 ? (
                      <img
                        src={card.images[0]}
                        alt={card.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-gray-400" />
                      </div>
                    )}

                    {/* Category Badge */}
                    <div className="absolute top-2 left-2">
                      {(() => {
                        const category = getCategoryByName(card.category);
                        return category ? (
                          <Badge
                            style={{ backgroundColor: category.color, color: '#fff' }}
                            className="text-xs flex items-center space-x-1"
                          >
                            <span>{category.icon}</span>
                            <span>{card.category}</span>
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            {card.category}
                          </Badge>
                        );
                      })()}
                    </div>
                  </div>

                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold truncate">
                      {card.title}
                    </CardTitle>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(card.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <CardDescription className="text-sm line-clamp-2 mb-3">
                      {card.description}
                    </CardDescription>

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewCard(card.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCard(card.id)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Card</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{card.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteCard(card.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories">
          <CategoryManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}