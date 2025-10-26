import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
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

  // Check if restaurant is currently open
  const isRestaurantOpen = (): boolean => {
    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes(); // Convert to HHMM format
    
    // Parse opening and closing times
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

  // Generate menu based on store type
  const getMenuForStore = () => {
    const storeType = restaurant.category.toLowerCase();
    
    // Restaurant menus
    if (restaurant.id <= 10) {
      return [
        {
          id: 1,
          name: restaurant.name === "Tony's Italian Bistro" ? "Margherita Pizza" : 
               restaurant.name === "Burger Palace" ? "Classic Burger" :
               restaurant.name === "Sakura Sushi" ? "California Roll" :
               restaurant.name === "Taco Fiesta" ? "Beef Tacos" :
               restaurant.name === "Spice Garden" ? "Butter Chicken" :
               restaurant.name === "Golden Dragon" ? "Kung Pao Chicken" :
               restaurant.name === "Bangkok Street" ? "Pad Thai" : "House Special",
          description: "Our signature dish made with the finest ingredients",
          price: 18.99,
          image: restaurant.image,
          category: 'featured',
          isPopular: true
        },
        {
          id: 2,
          name: restaurant.name === "Tony's Italian Bistro" ? "Caesar Salad" : 
               restaurant.name === "Burger Palace" ? "Double Burger" :
               restaurant.name === "Sakura Sushi" ? "Spicy Tuna Roll" :
               restaurant.name === "Taco Fiesta" ? "Chicken Quesadilla" :
               restaurant.name === "Spice Garden" ? "Chicken Curry" :
               restaurant.name === "Golden Dragon" ? "Sweet & Sour Pork" :
               restaurant.name === "Bangkok Street" ? "Green Curry" : "Premium Special",
          description: "Fresh and delicious, perfect for sharing",
          price: 12.99,
          image: restaurant.image,
          category: 'featured',
          isPopular: true
        },
        {
          id: 3,
          name: restaurant.name === "Tony's Italian Bistro" ? "Garlic Bread" : 
               restaurant.name === "Burger Palace" ? "Cheese Burger Jr" :
               restaurant.name === "Sakura Sushi" ? "Salmon Roll" :
               restaurant.name === "Taco Fiesta" ? "Guacamole & Chips" :
               restaurant.name === "Spice Garden" ? "Samosas" :
               restaurant.name === "Golden Dragon" ? "Spring Rolls" :
               restaurant.name === "Bangkok Street" ? "Tom Yum Soup" : "Appetizer Special",
          description: "Perfect start to your meal",
          price: 6.99,
          image: restaurant.image,
          category: 'appetizers'
        }
      ];
    }
    
    // Grocery store items
    if (restaurant.id >= 101 && restaurant.id <= 200) {
      return [
        {
          id: 1,
          name: "Fresh Organic Bananas",
          description: "Premium organic bananas, perfect for snacking",
          price: 3.99,
          image: restaurant.image,
          category: 'featured',
          isPopular: true
        },
        {
          id: 2,
          name: "Farm Fresh Eggs",
          description: "Cage-free eggs from local farms",
          price: 5.49,
          image: restaurant.image,
          category: 'featured',
          isPopular: true
        },
        {
          id: 3,
          name: "Artisan Bread",
          description: "Freshly baked sourdough bread",
          price: 4.99,
          image: restaurant.image,
          category: 'bakery'
        },
        {
          id: 4,
          name: "Greek Yogurt",
          description: "Creamy, protein-rich Greek yogurt",
          price: 6.99,
          image: restaurant.image,
          category: 'dairy'
        },
        {
          id: 5,
          name: "Organic Spinach",
          description: "Fresh baby spinach leaves",
          price: 3.49,
          image: restaurant.image,
          category: 'produce'
        },
        {
          id: 6,
          name: "Pasta & Sauce Combo",
          description: "Premium pasta with marinara sauce",
          price: 8.99,
          image: restaurant.image,
          category: 'pantry'
        }
      ];
    }
    
    // Retail store items
    if (restaurant.id >= 201 && restaurant.id <= 300) {
      return [
        {
          id: 1,
          name: "Designer T-Shirt",
          description: "Premium cotton t-shirt with modern fit",
          price: 29.99,
          image: restaurant.image,
          category: 'featured',
          isPopular: true
        },
        {
          id: 2,
          name: "Wireless Headphones",
          description: "High-quality wireless headphones with noise cancellation",
          price: 199.99,
          image: restaurant.image,
          category: 'featured',
          isPopular: true
        },
        {
          id: 3,
          name: "Skincare Set",
          description: "Complete skincare routine in one package",
          price: 89.99,
          image: restaurant.image,
          category: 'beauty'
        },
        {
          id: 4,
          name: "Smartphone Case",
          description: "Protective case with wireless charging support",
          price: 24.99,
          image: restaurant.image,
          category: 'accessories'
        },
        {
          id: 5,
          name: "Home Diffuser",
          description: "Aromatherapy diffuser with essential oils",
          price: 49.99,
          image: restaurant.image,
          category: 'home'
        },
        {
          id: 6,
          name: "Fitness Tracker",
          description: "Smart fitness tracker with heart rate monitor",
          price: 149.99,
          image: restaurant.image,
          category: 'electronics'
        }
      ];
    }
    
    // Alcohol store items
    if (restaurant.id >= 301 && restaurant.id <= 400) {
      return [
        {
          id: 1,
          name: "Craft IPA 6-Pack",
          description: "Local brewery's signature IPA",
          price: 12.99,
          image: restaurant.image,
          category: 'featured',
          isPopular: true
        },
        {
          id: 2,
          name: "Premium Red Wine",
          description: "Full-bodied Cabernet Sauvignon",
          price: 24.99,
          image: restaurant.image,
          category: 'featured',
          isPopular: true
        },
        {
          id: 3,
          name: "Artisan Gin",
          description: "Small-batch botanical gin",
          price: 39.99,
          image: restaurant.image,
          category: 'spirits'
        },
        {
          id: 4,
          name: "Champagne",
          description: "Sparkling wine for special occasions",
          price: 89.99,
          image: restaurant.image,
          category: 'wine'
        },
        {
          id: 5,
          name: "Local Lager",
          description: "Crisp and refreshing local lager",
          price: 8.99,
          image: restaurant.image,
          category: 'beer'
        },
        {
          id: 6,
          name: "Whiskey Flight",
          description: "Selection of premium whiskeys",
          price: 45.99,
          image: restaurant.image,
          category: 'spirits'
        }
      ];
    }
    
    // Coffee shop items
    if (restaurant.id >= 401) {
      return [
        {
          id: 1,
          name: "Signature Latte",
          description: "House blend espresso with steamed milk",
          price: 4.99,
          image: restaurant.image,
          category: 'featured',
          isPopular: true
        },
        {
          id: 2,
          name: "Artisan Cold Brew",
          description: "Smooth, cold-brewed coffee served over ice",
          price: 3.99,
          image: restaurant.image,
          category: 'featured',
          isPopular: true
        },
        {
          id: 3,
          name: "Fresh Croissant",
          description: "Buttery, flaky croissant baked daily",
          price: 2.99,
          image: restaurant.image,
          category: 'pastries'
        },
        {
          id: 4,
          name: "Herbal Tea Blend",
          description: "Calming chamomile and lavender tea",
          price: 3.49,
          image: restaurant.image,
          category: 'teas'
        },
        {
          id: 5,
          name: "Avocado Toast",
          description: "Fresh avocado on multigrain bread",
          price: 8.99,
          image: restaurant.image,
          category: 'food'
        },
        {
          id: 6,
          name: "Coffee Beans (1lb)",
          description: "Take home our signature roast",
          price: 16.99,
          image: restaurant.image,
          category: 'retail'
        }
      ];
    }
    
    return [];
  };

  const menuItems = getMenuForStore();

  // Dynamic categories based on store type
  const getCategoriesForStore = () => {
    if (restaurant.id <= 10) {
      // Restaurant categories
      return [
        { id: 'featured', name: 'Featured Items', count: menuItems.filter(item => item.category === 'featured').length },
        { id: 'appetizers', name: 'Appetizers', count: menuItems.filter(item => item.category === 'appetizers').length },
        { id: 'mains', name: 'Main Dishes', count: menuItems.filter(item => item.category === 'mains').length },
        { id: 'sides', name: 'Sides', count: menuItems.filter(item => item.category === 'sides').length },
        { id: 'desserts', name: 'Desserts', count: menuItems.filter(item => item.category === 'desserts').length }
      ];
    } else if (restaurant.id >= 101 && restaurant.id <= 200) {
      // Grocery categories
      return [
        { id: 'featured', name: 'Featured', count: menuItems.filter(item => item.category === 'featured').length },
        { id: 'produce', name: 'Fresh Produce', count: menuItems.filter(item => item.category === 'produce').length },
        { id: 'dairy', name: 'Dairy & Eggs', count: menuItems.filter(item => item.category === 'dairy').length },
        { id: 'bakery', name: 'Bakery', count: menuItems.filter(item => item.category === 'bakery').length },
        { id: 'pantry', name: 'Pantry Staples', count: menuItems.filter(item => item.category === 'pantry').length }
      ];
    } else if (restaurant.id >= 201 && restaurant.id <= 300) {
      // Retail categories
      return [
        { id: 'featured', name: 'Featured', count: menuItems.filter(item => item.category === 'featured').length },
        { id: 'electronics', name: 'Electronics', count: menuItems.filter(item => item.category === 'electronics').length },
        { id: 'beauty', name: 'Beauty & Health', count: menuItems.filter(item => item.category === 'beauty').length },
        { id: 'home', name: 'Home & Garden', count: menuItems.filter(item => item.category === 'home').length },
        { id: 'accessories', name: 'Accessories', count: menuItems.filter(item => item.category === 'accessories').length }
      ];
    } else if (restaurant.id >= 301 && restaurant.id <= 400) {
      // Alcohol categories
      return [
        { id: 'featured', name: 'Featured', count: menuItems.filter(item => item.category === 'featured').length },
        { id: 'beer', name: 'Beer & Cider', count: menuItems.filter(item => item.category === 'beer').length },
        { id: 'wine', name: 'Wine', count: menuItems.filter(item => item.category === 'wine').length },
        { id: 'spirits', name: 'Spirits', count: menuItems.filter(item => item.category === 'spirits').length }
      ];
    } else {
      // Coffee shop categories
      return [
        { id: 'featured', name: 'Featured', count: menuItems.filter(item => item.category === 'featured').length },
        { id: 'coffee', name: 'Coffee & Espresso', count: menuItems.filter(item => item.category === 'coffee').length },
        { id: 'teas', name: 'Teas', count: menuItems.filter(item => item.category === 'teas').length },
        { id: 'food', name: 'Food', count: menuItems.filter(item => item.category === 'food').length },
        { id: 'pastries', name: 'Pastries', count: menuItems.filter(item => item.category === 'pastries').length },
        { id: 'retail', name: 'Retail', count: menuItems.filter(item => item.category === 'retail').length }
      ];
    }
  };

  const categories = getCategoriesForStore().filter(cat => cat.count > 0);

  const filteredItems = selectedCategory === 'featured' 
    ? menuItems.filter(item => item.category === 'featured')
    : menuItems.filter(item => item.category === selectedCategory);

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
                    <div className="font-medium">{restaurant.openingTime} - {restaurant.closingTime}</div>
                    <div className={`text-xs ${isRestaurantOpen() ? 'text-green-600' : 'text-red-600'}`}>
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