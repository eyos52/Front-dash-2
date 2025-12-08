import { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useRestaurants } from '../lib/utils/hooks';
import { 
  Search, 
  MapPin, 
  Clock,
  Utensils,
  Home,
  Loader2
} from 'lucide-react';

interface Restaurant {
  id: number;
  supabaseId?: string; // Store the Supabase UUID for fetching menu items
  name: string;
  rating: number;
  deliveryTime: string;
  distance: string;
  category: string;
  image: string;
  promo?: string;
  openingTime: string;
  closingTime: string;
}

interface CartState {
  items: Array<{ id: number; name: string; price: number; quantity: number; image?: string; }>;
  restaurant: Restaurant | null;
}

interface LandingPageProps {
  onNavigate: (view: 'customer' | 'restaurant' | 'admin' | 'staff' | 'login') => void;
  onOrderFood: () => void;
  onRestaurantSelect: (restaurant: Restaurant) => void;
  cart: CartState;
  getTotalItems: () => number;
  deliveryAddress: string;
  onDeliveryAddressChange: (address: string) => void;
}

export function LandingPage({ onNavigate, onOrderFood, onRestaurantSelect, cart, getTotalItems, deliveryAddress, onDeliveryAddressChange }: LandingPageProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { restaurants: supabaseRestaurants, loading, error } = useRestaurants();

  const categories = [
    { id: 'all', name: 'All', icon: Home },
    { id: 'search', name: 'Search', icon: Search },
    { id: 'restaurants', name: 'Restaurants', icon: Utensils },
  ];

  // Helper function to convert 24-hour time to 12-hour format
  const formatTime = (time24: string): string => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Map Supabase restaurants to component format
  const mappedRestaurants: Restaurant[] = useMemo(() => {
    return supabaseRestaurants
      .filter(r => !r.status || r.status === 'active') // Only show active restaurants if status exists
      .map((r, index) => ({
        id: index + 1, // Use index as numeric ID for component compatibility
        supabaseId: r.restaurant_id || r.id || '', // Use restaurant_id (text) first, fallback to id (UUID)
        name: r.name || 'Restaurant',
        rating: r.rating ?? 0,
        deliveryTime: r.delivery_time || '30-45 min',
        distance: r.distance || '0.5 mi',
        category: r.cuisine_type || 'Restaurant',
        image: r.image_url || '',
        promo: r.promo,
        openingTime: formatTime(r.opening_time || '09:00'),
        closingTime: formatTime(r.closing_time || '21:00')
      }));
  }, [supabaseRestaurants]);

  // Store data for all categories - populated from database
  const allStores: { [key: string]: Restaurant[] } = useMemo(() => {
    // For now, all restaurants go into the restaurants category
    // You can add logic later to categorize based on cuisine_type
    return {
      restaurants: mappedRestaurants
    };
  }, [mappedRestaurants]);

  // Get current stores based on selected category
  const getCurrentStores = () => {
    if (selectedCategory === 'all') {
      // Show all restaurants
      return allStores.restaurants;
    }
    return allStores[selectedCategory] || allStores.restaurants;
  };

  const currentStores = getCurrentStores();

  const handleSearch = () => {
    if (deliveryAddress.trim()) {
      onOrderFood();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Bar Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-center">
            <div className="w-full max-w-2xl">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Enter delivery address"
                  value={deliveryAddress}
                  onChange={(e) => onDeliveryAddressChange(e.target.value)}
                  className="pl-10 pr-12"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button
                  onClick={handleSearch}
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-8 p-0"
                >
                  <Search className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex max-w-7xl mx-auto">
        {/* Left Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-6">
          <nav className="space-y-2">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-orange-50 text-orange-600 border border-orange-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <IconComponent className="h-5 w-5" />
                  <span className="font-medium">{category.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Promo Section */}
          <div className="mt-8">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-lg p-4 text-white">
              <h3 className="font-bold mb-2">Free Delivery</h3>
              <p className="text-sm text-white/90 mb-3">
                Get free delivery on your first 3 orders!
              </p>
              <Button variant="secondary" size="sm" className="w-full">
                Learn More
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">
                  {selectedCategory === 'all' ? 'Fastest near you' : 
                   selectedCategory === 'search' ? 'Search Results' :
                   categories.find(c => c.id === selectedCategory)?.name}
                </h2>
                <p className="text-gray-600">
                  {currentStores.length} {selectedCategory === 'all' ? 'stores' : selectedCategory === 'restaurants' ? 'restaurants' : 'stores'} delivering to you
                </p>
              </div>
              
              {/* Sort/Filter Options */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Sort by: Fastest
                </Button>
                <Button variant="outline" size="sm">
                  Filters
                </Button>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex gap-2 mb-6">
              <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                Under 30 min
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                Free delivery
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                Promotions
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                Highest rated
              </Badge>
            </div>
          </div>

          {/* Restaurant Grid */}
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-600 mb-4" />
              <p className="text-gray-500 text-lg">Loading restaurants...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 text-lg mb-2">Error loading restaurants</p>
              <p className="text-gray-500 text-sm">{error}</p>
            </div>
          ) : currentStores.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentStores.map((restaurant) => (
                  <Card 
                    key={restaurant.id} 
                    className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
                    onClick={() => onRestaurantSelect(restaurant)}
                  >
                    <div className="relative">
                      <div className="aspect-[4/3] w-full">
                        <ImageWithFallback
                          src={restaurant.image}
                          alt={restaurant.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      {restaurant.promo && (
                        <Badge className="absolute top-2 left-2 bg-orange-500 text-white">
                          {restaurant.promo}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-1">{restaurant.name}</h3>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{restaurant.deliveryTime}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-gray-600">{restaurant.category}</p>
                        <p className="text-sm text-gray-600">{restaurant.distance}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        {(restaurant.name.toLowerCase().includes('chicken') || restaurant.supabaseId === '001') ? (
                          <div className="text-xs text-gray-500">
                            <p>9:00 AM - 9:00 PM (Mon-Fri)</p>
                            <p className="mt-0.5">8:00 AM - 10:00 PM (Sat-Sun)</p>
                          </div>
                        ) : (restaurant.name.toLowerCase().includes('burger') || restaurant.supabaseId === '003') ? (
                          <div className="text-xs text-gray-500">
                            <p>9:00 AM - 12:00 AM (Mon-Fri)</p>
                            <p className="mt-0.5 text-red-600">Sat-Sun: Closed</p>
                          </div>
                        ) : (restaurant.name.toLowerCase().includes('pizza') || restaurant.supabaseId === '002') ? (
                          <div className="text-xs text-gray-500">
                            <p>12:00 PM - 12:00 AM (Mon-Thu)</p>
                            <p className="mt-0.5 text-red-600">Fri: Closed</p>
                            <p className="mt-0.5">10:00 AM - 12:00 AM (Sat-Sun)</p>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">Open {restaurant.openingTime} - {restaurant.closingTime}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No restaurants available. Check back later!</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}