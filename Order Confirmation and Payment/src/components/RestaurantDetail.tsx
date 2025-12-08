import { useState, useMemo, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useMenuItems } from '../lib/utils/hooks';
import { Loader2 } from 'lucide-react';
import { 
  ArrowLeft, 
  Star, 
  Clock, 
  MapPin, 
  Plus,
  Minus,
  ShoppingCart,
  Heart,
  Share,
  Info
} from 'lucide-react';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image?: string;
  category: string;
  isPopular?: boolean;
}

interface Restaurant {
  id: number;
  supabaseId?: string; // Supabase UUID for fetching menu items
  name: string;
  rating: number;
  deliveryTime: string;
  distance: string;
  category: string;
  image: string;
  promo?: string;
  address?: string;
  phone?: string;
  openingTime: string;
  closingTime: string;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartState {
  items: CartItem[];
  restaurant: Restaurant | null;
}

interface RestaurantDetailProps {
  restaurant: Restaurant;
  onBack: () => void;
  onOrderFood: () => void;
  cart: CartState;
  addToCart: (item: { id: number; name: string; price: number; image?: string }, restaurant: Restaurant) => void;
  removeFromCart: (itemId: number) => void;
  getCartItemQuantity: (itemId: number) => number;
  getCartTotal: () => number;
  getTotalItems: () => number;
}

export function RestaurantDetail({ 
  restaurant, 
  onBack, 
  onOrderFood, 
  cart,
  addToCart,
  removeFromCart,
  getCartItemQuantity,
  getCartTotal,
  getTotalItems
}: RestaurantDetailProps) {
  const [selectedCategory, setSelectedCategory] = useState('featured');
  
  // Fetch menu items from Supabase
  const { menuItems: supabaseMenuItems, loading: menuLoading, error: menuError } = useMenuItems(restaurant.supabaseId || null);

  // Debug logging
  useEffect(() => {
    if (restaurant.supabaseId) {
      console.log('Fetching menu items for restaurant:', restaurant.supabaseId);
    } else {
      console.warn('No supabaseId found for restaurant:', restaurant.name);
    }
  }, [restaurant.supabaseId, restaurant.name]);

  useEffect(() => {
    console.log('Menu items loaded:', supabaseMenuItems.length, supabaseMenuItems);
  }, [supabaseMenuItems]);

  // Check if restaurant is currently open
  const isRestaurantOpen = (): boolean => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const currentTime = now.getHours() * 100 + now.getMinutes(); // Convert to HHMM format
    
    // Special handling for Best Burgers
    if (restaurant.name.toLowerCase().includes('burger') || restaurant.supabaseId === '003') {
      // Best Burgers: Mon-Fri: 9am-12am, Sat-Sun: Closed
      if (currentDay === 0 || currentDay === 6) { // Sunday (0) or Saturday (6)
        return false; // Closed on weekends
      } else if (currentDay >= 1 && currentDay <= 5) { // Monday-Friday
        // 9:00 AM (900) to 12:00 AM next day (midnight, represented as 0)
        const openingTime = 900; // 9:00 AM
        // Restaurant is open if current time is >= 9am OR it's before 1 AM (meaning after midnight but still part of previous day)
        return currentTime >= openingTime || (currentTime >= 0 && currentTime < 100);
      }
    }
    
    // Special handling for Pizza Only
    if (restaurant.name.toLowerCase().includes('pizza') || restaurant.supabaseId === '002') {
      // Pizza Only: Mon-Thu: 12pm-12am, Fri: Closed, Sat-Sun: 10am-12am
      if (currentDay === 5) { // Friday
        return false; // Closed on Friday
      } else if (currentDay >= 1 && currentDay <= 4) { // Monday-Thursday
        // 12:00 PM (1200) to 12:00 AM next day (midnight, represented as 0 or 2400)
        const openingTime = 1200; // 12:00 PM (noon)
        // Restaurant is open if current time is >= noon OR it's before 1 AM (meaning after midnight but still part of previous day)
        return currentTime >= openingTime || (currentTime >= 0 && currentTime < 100);
      } else { // Saturday (6) or Sunday (0)
        // 10:00 AM to 12:00 AM next day (midnight)
        const openingTime = 1000; // 10:00 AM
        // Restaurant is open if current time is >= 10am OR it's before 1 AM (meaning after midnight but still part of previous day)
        return currentTime >= openingTime || (currentTime >= 0 && currentTime < 100);
      }
    }
    
    // Parse opening and closing times for other restaurants
    const parseTime = (timeStr: string): number => {
      const [time, period] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      
      return hours * 100 + minutes;
    };
    
    const openingTime = parseTime(restaurant.openingTime);
    const closingTime = parseTime(restaurant.closingTime);
    
    return currentTime >= openingTime && currentTime <= closingTime;
  };

  // Map Supabase menu items to component format
  const mappedMenuItems: MenuItem[] = useMemo(() => {
    if (supabaseMenuItems.length > 0) {
      return supabaseMenuItems.map((item, index) => ({
        id: index + 1, // Use index for component compatibility
        name: item.name || 'Menu Item',
        description: item.description || '',
        price: item.price || 0,
        image: item.image_url || restaurant.image,
        category: item.category || 'featured',
        isPopular: false // You can add a field for this in your database if needed
      }));
    }
    return [];
  }, [supabaseMenuItems, restaurant.image]);

  // Use menu items from database only
  const menuItems = mappedMenuItems;

  // Dynamic categories based on actual menu items from database
  const getCategoriesForStore = () => {
    // Get all unique categories from menu items
    const uniqueCategories = Array.from(new Set(menuItems.map(item => item.category || 'featured')));
    
    // Create category objects with counts
    return uniqueCategories.map(category => {
      const count = menuItems.filter(item => (item.category || 'featured') === category).length;
      // Format category name (capitalize first letter, add spaces)
      const formattedName = category
        .split(/(?=[A-Z])|[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      return {
        id: category,
        name: formattedName,
        count: count
      };
    });
  };

  const categories = getCategoriesForStore().filter(cat => cat.count > 0);
  
  // Set default category to first available category when menu items load
  useEffect(() => {
    if (categories.length > 0) {
      // If selected category doesn't exist or has no items, switch to first available
      const selectedCategoryExists = categories.find(c => c.id === selectedCategory && c.count > 0);
      if (!selectedCategoryExists) {
        setSelectedCategory(categories[0].id);
      }
    }
  }, [categories.length]); // Only run when categories change

  // Filter items based on selected category
  // If 'featured' is selected but no items have that category, show all items
  const filteredItems = useMemo(() => {
    if (menuItems.length === 0) return [];
    
    if (selectedCategory === 'featured') {
      const featuredItems = menuItems.filter(item => (item.category || 'featured') === 'featured');
      // If no items have 'featured' category, show all items
      return featuredItems.length > 0 ? featuredItems : menuItems;
    }
    
    return menuItems.filter(item => (item.category || 'featured') === selectedCategory);
  }, [menuItems, selectedCategory]);

  const handleAddToCart = (item: MenuItem) => {
    // Check if restaurant is open before allowing add to cart
    if (!isRestaurantOpen()) {
      alert(`${restaurant.name} is currently closed. Hours: ${restaurant.openingTime} - ${restaurant.closingTime}`);
      return;
    }
    
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image
    }, restaurant);
  };

  const handleRemoveFromCart = (itemId: number) => {
    removeFromCart(itemId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Restaurant Hero */}
        <Card className="mb-6 overflow-hidden">
          <div className="relative h-48 md:h-64">
            <ImageWithFallback
              src={restaurant.image}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30" />
            {restaurant.promo && (
              <Badge className="absolute top-4 left-4 bg-orange-500 text-white">
                {restaurant.promo}
              </Badge>
            )}
          </div>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{restaurant.name}</h1>
                <p className="text-gray-600 mb-4">{restaurant.category} • {restaurant.address || "123 Main Street, Downtown"}</p>
                
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{restaurant.rating}</span>
                    <span className="text-gray-500">(200+ ratings)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{restaurant.deliveryTime}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{restaurant.distance}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Restaurant Actions */}
        <div className="flex justify-center gap-2 mb-6">
          <Button variant="ghost" size="sm">
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Save</span>
          </Button>
          <Button variant="ghost" size="sm">
            <Share className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Share</span>
          </Button>
          <Button variant="ghost" size="sm">
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Info</span>
          </Button>
        </div>

        <div className="flex gap-6">
          {/* Left Sidebar - Categories */}
          <aside className="w-64 space-y-2">
            <div className="bg-white rounded-lg p-4 border">
              <h3 className="font-semibold mb-3">Menu Categories</h3>
              <nav className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-orange-50 text-orange-600 border border-orange-200'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="font-medium">{category.name}</span>
                    <span className="text-sm text-gray-500">{category.count}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Delivery Info */}
            <div className="bg-white rounded-lg p-4 border">
              <h3 className="font-semibold mb-3">Delivery Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery time</span>
                  <span className="font-medium">{restaurant.deliveryTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery fee</span>
                  <span className="font-medium">{restaurant.promo ? 'Free' : '$2.99'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Minimum order</span>
                  <span className="font-medium">
                    {restaurant.id >= 101 && restaurant.id <= 200 ? '$35.00' : 
                     restaurant.id >= 201 && restaurant.id <= 300 ? '$50.00' :
                     restaurant.id >= 301 && restaurant.id <= 400 ? '$25.00' : '$10.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hours</span>
                  <div className="text-right">
                    {(restaurant.name.toLowerCase().includes('chicken') || restaurant.supabaseId === '001') ? (
                      <>
                        <div className="font-medium">9:00 AM - 9:00 PM</div>
                        <div className="text-xs text-gray-500">Mon-Fri (Regular Hours)</div>
                        <div className="text-xs text-gray-500 mt-1">Sat-Sun: 8:00 AM - 10:00 PM</div>
                      </>
                    ) : (restaurant.name.toLowerCase().includes('burger') || restaurant.supabaseId === '003') ? (
                      <>
                        <div className="font-medium">9:00 AM - 12:00 AM</div>
                        <div className="text-xs text-gray-500">Mon-Fri</div>
                        <div className="text-xs text-red-600 mt-1">Sat-Sun: Closed</div>
                      </>
                    ) : (restaurant.name.toLowerCase().includes('pizza') || restaurant.supabaseId === '002') ? (
                      <>
                        <div className="font-medium">12:00 PM - 12:00 AM</div>
                        <div className="text-xs text-gray-500">Mon-Thu</div>
                        <div className="text-xs text-red-600 mt-1">Fri: Closed</div>
                        <div className="text-xs text-gray-500 mt-1">Sat-Sun: 10:00 AM - 12:00 AM</div>
                      </>
                    ) : (
                      <div className="font-medium">{restaurant.openingTime} - {restaurant.closingTime}</div>
                    )}
                    <div className={`text-xs mt-1 ${isRestaurantOpen() ? 'text-green-600' : 'text-red-600'}`}>
                      {isRestaurantOpen() ? 'Open now' : 'Closed'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">
                {categories.find(c => c.id === selectedCategory)?.name || 'Featured'}
              </h2>
              <p className="text-gray-600">
                {filteredItems.length} {restaurant.id <= 10 ? 'dishes' : 'items'} available
              </p>
            </div>

            {/* Menu Items Grid */}
            {menuLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-600 mb-4" />
                <p className="text-gray-500 text-lg">Loading menu items...</p>
              </div>
            ) : menuError ? (
              <div className="text-center py-12">
                <p className="text-red-500 text-lg mb-2">Error loading menu items</p>
                <p className="text-gray-500 text-sm">{menuError}</p>
              </div>
            ) : filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredItems.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="flex">
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        {item.isPopular && (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-600 border-orange-200">
                            Popular
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">${item.price.toFixed(2)}</span>
                        <div className="flex items-center gap-2">
                          {getCartItemQuantity(item.id) > 0 ? (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRemoveFromCart(item.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="font-medium min-w-[1.5rem] text-center">
                                {getCartItemQuantity(item.id)}
                              </span>
                              <Button
                                size="sm"
                                onClick={() => handleAddToCart(item)}
                                className="h-8 w-8 p-0 bg-orange-500 hover:bg-orange-600"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleAddToCart(item)}
                              className="gap-1 bg-orange-500 hover:bg-orange-600"
                            >
                              <Plus className="h-3 w-3" />
                              Add
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="w-24 h-24 m-4">
                      <ImageWithFallback
                        src={item.image || restaurant.image}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  </div>
                </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No menu items available for this restaurant.</p>
              </div>
            )}
          </main>
        </div>

        {/* Fixed Cart Button */}
        {getTotalItems() > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20">
            <Button
              onClick={() => {
                if (getTotalItems() === 0) {
                  alert('Please select at least one food item before confirming/placing an order');
                  return;
                }
                if (!isRestaurantOpen()) {
                  alert(`${restaurant.name} is currently closed. Hours: ${restaurant.openingTime} - ${restaurant.closingTime}`);
                  return;
                }
                onOrderFood();
              }}
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg gap-3 px-8"
            >
              <ShoppingCart className="h-5 w-5" />
              <span>
                {getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''} • ${getCartTotal().toFixed(2)}
              </span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}