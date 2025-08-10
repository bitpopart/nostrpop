import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoginArea } from '@/components/auth/LoginArea';
import { CardManagement } from '@/components/cards/CardManagement';
import { ProductManagement } from '@/components/marketplace/ProductManagement';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import {
  Plus,
  FolderOpen,
  BarChart3,
  Settings,
  Users,
  Shield,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Eye,
  Edit,
  Database
} from 'lucide-react';

const Admin = () => {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Check if current user is admin
  const isAdmin = useIsAdmin();

  useSeoMeta({
    title: 'Admin Dashboard - BitPop Cards',
    description: 'Administrative dashboard for managing BitPop Cards platform.',
  });

  useEffect(() => {
    // Redirect non-admin users to cards page
    if (user && !isAdmin) {
      navigate('/cards');
    }
  }, [user, isAdmin, navigate]);

  // Show login prompt if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-purple-600" />
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
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20 flex items-center justify-center">
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

  const cardActions = [
    {
      title: 'Create New Card',
      description: 'Design and publish a new BitPop card',
      icon: Plus,
      color: 'from-green-500 to-emerald-500',
      action: () => navigate('/cards/create'),
      badge: 'Create'
    },
    {
      title: 'Card Management',
      description: 'View and manage all your created cards',
      icon: FolderOpen,
      color: 'from-blue-500 to-cyan-500',
      action: () => navigate('/cards?tab=my-cards'),
      badge: 'Manage'
    },
    {
      title: 'Browse All Cards',
      description: 'View all cards in the platform (admin view)',
      icon: Eye,
      color: 'from-purple-500 to-pink-500',
      action: () => navigate('/cards?tab=browse'),
      badge: 'Browse'
    }
  ];

  const shopActions = [
    {
      title: 'Product Management',
      description: 'Create and manage marketplace products',
      icon: Settings,
      color: 'from-orange-500 to-red-500',
      action: () => navigate('/shop?tab=admin'),
      badge: 'Products'
    },
    {
      title: 'Shop Analytics',
      description: 'View sales and performance metrics',
      icon: BarChart3,
      color: 'from-indigo-500 to-purple-500',
      action: () => navigate('/shop'),
      badge: 'Analytics'
    }
  ];

  const statsCards = [
    {
      title: 'Total Cards',
      value: '∞',
      description: 'Cards created on platform',
      icon: Database,
      color: 'text-blue-600'
    },
    {
      title: 'Active Users',
      value: '∞',
      description: 'Registered users',
      icon: Users,
      color: 'text-green-600'
    },
    {
      title: 'Growth',
      value: '+∞%',
      description: 'This month',
      icon: TrendingUp,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-purple-600 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Welcome back! Manage your BitPop Cards platform from here.
          </p>
          <Badge className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
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
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="shop">Shop</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Quick Actions Overview */}
            <div className="space-y-8">
              {/* Card Management Section */}
              <div>
                <h2 className="text-2xl font-semibold mb-6 text-center">Card Administration</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  {cardActions.map((action, index) => (
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
                        <CardTitle className="text-xl group-hover:text-purple-600 transition-colors">
                          {action.title}
                        </CardTitle>
                        <CardDescription className="text-base">
                          {action.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center text-purple-600 group-hover:text-purple-700 transition-colors">
                          <span className="text-sm font-medium">Access</span>
                          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Shop Management Section */}
              <div>
                <h2 className="text-2xl font-semibold mb-6 text-center">Shop Administration</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  {shopActions.map((action, index) => (
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
                        <CardTitle className="text-xl group-hover:text-purple-600 transition-colors">
                          {action.title}
                        </CardTitle>
                        <CardDescription className="text-base">
                          {action.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center text-purple-600 group-hover:text-purple-700 transition-colors">
                          <span className="text-sm font-medium">Access</span>
                          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cards">
            <CardManagement />
          </TabsContent>

          <TabsContent value="shop">
            <ProductManagement />
          </TabsContent>
        </Tabs>

        {/* Platform Info */}
        <Card className="max-w-4xl mx-auto bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 border-0">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-purple-600 mr-2" />
              <h2 className="text-2xl font-bold">BitPop Cards Platform</h2>
            </div>
            <p className="text-lg mb-6 text-muted-foreground">
              Spreading joy through beautiful digital cards on the Nostr network
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate('/cards/create')}
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Edit className="mr-2 h-4 w-4" />
                Start Creating
              </Button>
              <Button
                onClick={() => navigate('/shop')}
                size="lg"
                variant="outline"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                View Shop
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-16 text-sm text-gray-500 dark:text-gray-400">
          <p>Admin Dashboard • BitPop Cards Platform</p>
          <p className="mt-2">
            Vibed with <a href="https://soapbox.pub/mkstack" className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300">MKStack</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Admin;