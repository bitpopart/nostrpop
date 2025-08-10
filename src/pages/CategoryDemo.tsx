import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCardCategories } from '@/hooks/useCardCategories';
import { CreateCardForm } from '@/components/cards/CreateCardForm';
import { CategoryManagement } from '@/components/cards/CategoryManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Plus, Settings, Eye, EyeOff } from 'lucide-react';

export function CategoryDemo() {
  const { allCategories, visibleCategories } = useCardCategories();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          BitPop Card Categories
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Explore the available categories in our card creation system. Categories can be managed, customized, and new ones can be added.
        </p>
      </div>

      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Available Categories
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create New Card
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Category Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-6">
          {/* Categories Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Category Overview
              </CardTitle>
              <CardDescription>
                These are the categories available when creating new BitPop cards. Each category has its own color, icon, and description.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Eye className="h-4 w-4 text-green-600" />
                    Total Categories
                  </h4>
                  <p className="text-2xl font-bold text-green-600">{allCategories.length}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Eye className="h-4 w-4 text-blue-600" />
                    Visible Categories
                  </h4>
                  <p className="text-2xl font-bold text-blue-600">{visibleCategories.length}</p>
                </div>
              </div>

              <Separator className="my-6" />

              {/* All Categories Grid */}
              <div className="space-y-4">
                <h4 className="font-medium text-lg">All Available Categories</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {allCategories.map((category) => (
                    <Card key={category.id} className="group hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-xl"
                            style={{ backgroundColor: category.color + '20' }}
                          >
                            {category.icon}
                          </div>
                          <div className="flex items-center gap-1">
                            {category.isVisible ? (
                              <Eye className="h-4 w-4 text-green-600" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            )}
                            {category.isDefault && (
                              <Badge variant="outline" className="text-xs">
                                Default
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium">{category.name}</h5>
                            <Badge
                              style={{ backgroundColor: category.color, color: '#fff' }}
                              className="text-xs"
                            >
                              {category.name}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {category.description}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{category.color}</span>
                            <span className={category.isVisible ? "text-green-600" : "text-gray-400"}>
                              {category.isVisible ? "Visible" : "Hidden"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Usage in Create Form */}
          <Card>
            <CardHeader>
              <CardTitle>How Categories Appear in "Create New" Form</CardTitle>
              <CardDescription>
                When users create new cards, they see these categories in the "Choose Category" dropdown.
                All categories (both visible and hidden) are available for card creation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h4 className="font-medium">Categories in Dropdown Order:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {allCategories.map((category, index) => (
                    <div
                      key={category.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span className="text-sm text-muted-foreground w-6">
                        {index + 1}.
                      </span>
                      <span className="text-lg">{category.icon}</span>
                      <span className="font-medium">{category.name}</span>
                      <Badge
                        style={{ backgroundColor: category.color, color: '#fff' }}
                        className="text-xs ml-auto"
                      >
                        {category.name}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New BitPop Card</CardTitle>
              <CardDescription>
                Try the card creation form to see how categories appear in the "Choose Category" dropdown.
                All categories (both visible and hidden) are available for selection.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateCardForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Category Management</CardTitle>
              <CardDescription>
                Add new categories, edit existing ones, or manage their visibility.
                New categories will automatically appear in the "Choose Category" dropdown.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}