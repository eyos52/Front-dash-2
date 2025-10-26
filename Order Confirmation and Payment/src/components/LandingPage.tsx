import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { 
  Search, 
  MapPin, 
  Star, 
  Clock,
  ShoppingCart,
  Utensils,
  Coffee,
  Wine,
  Home
} from 'lucide-react';

interface Restaurant {
  id: number;
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

  const categories = [
    { id: 'all', name: 'All', icon: Home },
    { id: 'search', name: 'Search', icon: Search },
    { id: 'grocery', name: 'Grocery', icon: ShoppingCart },
    { id: 'retail', name: 'Retail', icon: ShoppingCart },
    { id: 'alcohol', name: 'Alcohol', icon: Wine },
    { id: 'restaurants', name: 'Restaurants', icon: Utensils },
    { id: 'coffee', name: 'Coffee & Tea', icon: Coffee },
  ];

  // Store data for all categories
  const allStores: { [key: string]: Restaurant[] } = {
    restaurants: [
      {
        id: 1,
        name: "Tony's Italian Bistro",
        rating: 4.8,
        deliveryTime: "25-35 min",
        distance: "0.3 mi",
        category: "Italian",
        image: "https://images.unsplash.com/photo-1662197480393-2a82030b7b83?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpdGFsaWFuJTIwcGFzdGElMjByZXN0YXVyYW50fGVufDF8fHx8MTc1ODYwMzMyMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        promo: "$0 delivery fee",
        openingTime: "11:00 AM",
        closingTime: "10:00 PM"
      },
      {
        id: 2,
        name: "Burger Palace",
        rating: 4.6,
        deliveryTime: "15-25 min",
        distance: "0.5 mi",
        category: "American",
        image: "https://images.unsplash.com/photo-1634674599370-bec0babedb8a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXJnZXIlMjBmcmllcyUyMGZhc3QlMjBmb29kfGVufDF8fHx8MTc1ODU1ODA3NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        openingTime: "10:00 AM",
        closingTime: "11:00 PM"
      },
      {
        id: 3,
        name: "Sakura Sushi",
        rating: 4.9,
        deliveryTime: "30-40 min",
        distance: "0.8 mi",
        category: "Japanese",
        image: "https://images.unsplash.com/photo-1608731002466-057222dc4989?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMGZvb2QlMjBzdXNoaSUyMGRlbGl2ZXJ5fGVufDF8fHx8MTc1ODY3ODc1OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        promo: "20% off $30+",
        openingTime: "12:00 PM",
        closingTime: "9:30 PM"
      },
      {
        id: 4,
        name: "Taco Fiesta",
        rating: 4.7,
        deliveryTime: "20-30 min",
        distance: "0.4 mi",
        category: "Mexican",
        image: "https://images.unsplash.com/photo-1700625915031-d2c7d472ea7b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZXhpY2FuJTIwdGFjb3MlMjByZXN0YXVyYW50fGVufDF8fHx8MTc1ODYyMzQxOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        openingTime: "11:00 AM",
        closingTime: "10:30 PM"
      },
      {
        id: 5,
        name: "Spice Garden",
        rating: 4.5,
        deliveryTime: "35-45 min",
        distance: "1.2 mi",
        category: "Indian",
        image: "https://images.unsplash.com/photo-1690915475414-9aaecfd3ba74?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBjdXJyeSUyMHJlc3RhdXJhbnR8ZW58MXx8fHwxNzU4NjIzNDEzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        promo: "Free appetizer",
        openingTime: "5:00 PM",
        closingTime: "11:00 PM"
      },
      {
        id: 6,
        name: "Golden Dragon",
        rating: 4.4,
        deliveryTime: "25-35 min",
        distance: "0.7 mi",
        category: "Chinese",
        image: "https://images.unsplash.com/photo-1593472329313-cebb35f2f3fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGluZXNlJTIwdGFrZW91dCUyMHJlc3RhdXJhbnR8ZW58MXx8fHwxNzU4Njc5MjUwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        openingTime: "11:30 AM",
        closingTime: "9:00 PM"
      }
    ],
    grocery: [
      {
        id: 101,
        name: "Fresh Market",
        rating: 4.7,
        deliveryTime: "30-45 min",
        distance: "0.4 mi",
        category: "Grocery",
        image: "https://images.unsplash.com/photo-1611871962581-33f9120a7ebb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncm9jZXJ5JTIwc3RvcmUlMjBzdXBlcm1hcmtldHxlbnwxfHx8fDE3NTg2Nzk3NzV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        promo: "Free delivery on $35+",
        openingTime: "7:00 AM",
        closingTime: "10:00 PM"
      },
      {
        id: 102,
        name: "Organic Valley",
        rating: 4.6,
        deliveryTime: "45-60 min",
        distance: "0.8 mi",
        category: "Organic Grocery",
        image: "https://images.unsplash.com/photo-1598217475213-268e8ec0126e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwcHJvZHVjZSUyMGdyb2Nlcnl8ZW58MXx8fHwxNzU4Njc5Nzg0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        promo: "20% off produce",
        openingTime: "8:00 AM",
        closingTime: "9:00 PM"
      },
      {
        id: 103,
        name: "Corner Market",
        rating: 4.3,
        deliveryTime: "20-30 min",
        distance: "0.2 mi",
        category: "Convenience Store",
        image: "https://images.unsplash.com/photo-1611871962581-33f9120a7ebb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncm9jZXJ5JTIwc3RvcmUlMjBzdXBlcm1hcmtldHxlbnwxfHx8fDE3NTg2Nzk3NzV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        openingTime: "6:00 AM",
        closingTime: "12:00 AM"
      },
      {
        id: 104,
        name: "Whole Foods Plus",
        rating: 4.8,
        deliveryTime: "40-55 min",
        distance: "1.1 mi",
        category: "Premium Grocery",
        image: "https://images.unsplash.com/photo-1598217475213-268e8ec0126e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwcHJvZHVjZSUyMGdyb2Nlcnl8ZW58MXx8fHwxNzU4Njc5Nzg0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        promo: "Free samples available",
        openingTime: "7:00 AM",
        closingTime: "11:00 PM"
      },
      {
        id: 105,
        name: "24/7 Express Market",
        rating: 4.6,
        deliveryTime: "25-40 min",
        distance: "0.6 mi",
        category: "24-Hour Grocery",
        image: "https://images.unsplash.com/photo-1611871962581-33f9120a7ebb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncm9jZXJ5JTIwc3RvcmUlMjBzdXBlcm1hcmtldHxlbnwxfHx8fDE3NTg2Nzk3NzV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        promo: "Always open for you!",
        openingTime: "12:00 AM",
        closingTime: "11:59 PM"
      }
    ],
    retail: [
      {
        id: 201,
        name: "Style Boutique",
        rating: 4.5,
        deliveryTime: "60-90 min",
        distance: "0.6 mi",
        category: "Fashion",
        image: "https://images.unsplash.com/photo-1641440615976-d4bc4eb7dab8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXRhaWwlMjBjbG90aGluZyUyMHN0b3JlfGVufDF8fHx8MTc1ODYxNTM1NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        promo: "30% off new arrivals",
        openingTime: "10:00 AM",
        closingTime: "8:00 PM"
      },
      {
        id: 202,
        name: "Tech Zone",
        rating: 4.7,
        deliveryTime: "45-60 min",
        distance: "0.9 mi",
        category: "Electronics",
        image: "https://images.unsplash.com/photo-1703165552745-37e85f0273cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJvbmljcyUyMHJldGFpbCUyMHN0b3JlfGVufDF8fHx8MTc1ODY3OTc4N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        promo: "Free setup service",
        openingTime: "9:00 AM",
        closingTime: "9:00 PM"
      },
      {
        id: 203,
        name: "Home & Garden",
        rating: 4.4,
        deliveryTime: "90-120 min",
        distance: "1.5 mi",
        category: "Home Goods",
        image: "https://images.unsplash.com/photo-1641440615976-d4bc4eb7dab8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXRhaWwlMjBjbG90aGluZyUyMHN0b3JlfGVufDF8fHx8MTc1ODYxNTM1NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        openingTime: "8:00 AM",
        closingTime: "7:00 PM"
      },
      {
        id: 204,
        name: "City Pharmacy",
        rating: 4.9,
        deliveryTime: "30-45 min",
        distance: "0.3 mi",
        category: "Health & Wellness",
        image: "https://images.unsplash.com/photo-1648091856225-dd091d7e5075?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaGFybWFjeSUyMGRydWdzdG9yZXxlbnwxfHx8fDE3NTg2Nzk3ODl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        promo: "Free health consultations",
        openingTime: "8:00 AM",
        closingTime: "10:00 PM"
      }
    ],
    alcohol: [
      {
        id: 301,
        name: "Wine & Spirits Co.",
        rating: 4.6,
        deliveryTime: "45-60 min",
        distance: "0.7 mi",
        category: "Wine & Liquor",
        image: "https://images.unsplash.com/photo-1684159890786-5406275a5ebf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aW5lJTIwbGlxdW9yJTIwc3RvcmV8ZW58MXx8fHwxNzU4Njc5NzgwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        promo: "Buy 2 get 10% off",
        openingTime: "12:00 PM",
        closingTime: "10:00 PM"
      },
      {
        id: 302,
        name: "Craft Beer Heaven",
        rating: 4.8,
        deliveryTime: "30-45 min",
        distance: "0.5 mi",
        category: "Craft Beer",
        image: "https://images.unsplash.com/photo-1545287072-469f3761413c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmFmdCUyMGJlZXIlMjBicmV3ZXJ5fGVufDF8fHx8MTc1ODY3OTc5Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        promo: "Free tasting notes",
        openingTime: "2:00 PM",
        closingTime: "11:00 PM"
      },
      {
        id: 303,
        name: "Premium Liquors",
        rating: 4.5,
        deliveryTime: "60-75 min",
        distance: "1.2 mi",
        category: "Premium Spirits",
        image: "https://images.unsplash.com/photo-1684159890786-5406275a5ebf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aW5lJTIwbGlxdW9yJTIwc3RvcmV8ZW58MXx8fHwxNzU4Njc5NzgwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        openingTime: "1:00 PM",
        closingTime: "9:00 PM"
      }
    ],
    coffee: [
      {
        id: 401,
        name: "Roasted Bean Co.",
        rating: 4.9,
        deliveryTime: "15-25 min",
        distance: "0.2 mi",
        category: "Coffee Shop",
        image: "https://images.unsplash.com/photo-1642647916129-3909c75c0267?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBzaG9wJTIwY2FmZXxlbnwxfHx8fDE3NTg2NTE2NjB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        promo: "Free pastry with coffee",
        openingTime: "6:00 AM",
        closingTime: "8:00 PM"
      },
      {
        id: 402,
        name: "Tea Garden Café",
        rating: 4.7,
        deliveryTime: "20-30 min",
        distance: "0.4 mi",
        category: "Tea House",
        image: "https://images.unsplash.com/photo-1642647916129-3909c75c0267?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBzaG9wJTIwY2FmZXxlbnwxfHx8fDE3NTg2NTE2NjB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        promo: "20% off loose leaf teas",
        openingTime: "7:00 AM",
        closingTime: "7:00 PM"
      },
      {
        id: 403,
        name: "Espresso Express",
        rating: 4.4,
        deliveryTime: "10-20 min",
        distance: "0.1 mi",
        category: "Quick Coffee",
        image: "https://images.unsplash.com/photo-1642647916129-3909c75c0267?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBzaG9wJTIwY2FmZXxlbnwxfHx8fDE3NTg2NTE2NjB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        openingTime: "5:30 AM",
        closingTime: "9:00 PM"
      },
      {
        id: 404,
        name: "Artisan Coffee House",
        rating: 4.8,
        deliveryTime: "25-35 min",
        distance: "0.6 mi",
        category: "Specialty Coffee",
        image: "https://images.unsplash.com/photo-1642647916129-3909c75c0267?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBzaG9wJTIwY2FmZXxlbnwxfHx8fDE3NTg2NTE2NjB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        promo: "Bean subscription available",
        openingTime: "6:30 AM",
        closingTime: "6:00 PM"
      }
    ]
  };

  // Get current stores based on selected category
  const getCurrentStores = () => {
    if (selectedCategory === 'all') {
      // Show a mix from all categories
      return [
        ...allStores.restaurants.slice(0, 2),
        ...allStores.grocery.slice(0, 2),
        ...allStores.retail.slice(0, 2),
        ...allStores.coffee.slice(0, 2)
      ];
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
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{restaurant.rating}</span>
                    </div>
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
                    <p className="text-xs text-gray-500">Open {restaurant.openingTime} - {restaurant.closingTime}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-8">
            <Button variant="outline" className="px-8">
              Load More Restaurants
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}