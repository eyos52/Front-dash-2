import { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { AddressInput } from './components/AddressInput';
import { RestaurantDetail } from './components/RestaurantDetail';
import { OrderConfirmation } from './components/OrderConfirmation';
import { OrderTracking } from './components/OrderTracking';
import { RestaurantInterface } from './components/RestaurantInterface';
import { RestaurantRegistration } from './components/RestaurantRegistration';
import { FrontDashAdmin } from './components/FrontDashAdmin';
import { FrontDashStaff } from './components/FrontDashStaff';
import { LoginPage } from './components/LoginPage';
import { AppHeader } from './components/AppHeader';
import { Toaster } from './components/ui/sonner';

type AppView = 'address-input' | 'home' | 'restaurant-detail' | 'customer' | 'order-tracking' | 'restaurant' | 'restaurant-registration' | 'admin' | 'staff' | 'login';

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

interface AuthUser {
  username: string;
  name: string;
  role?: string;
  email?: string;
  userType: 'restaurant' | 'admin' | 'staff';
}

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(() => {
    // Check if user has a saved delivery address
    try {
      const savedAddress = localStorage.getItem('frontdash-delivery-address');
      return savedAddress && savedAddress.trim() ? 'home' : 'address-input';
    } catch {
      return 'address-input';
    }
  });
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [cart, setCart] = useState<CartState>({
    items: [],
    restaurant: null
  });
  const [deliveryAddress, setDeliveryAddress] = useState<string>(() => {
    // Load saved address from localStorage on initialization
    try {
      return localStorage.getItem('frontdash-delivery-address') || '';
    } catch {
      return '';
    }
  });



  const handleRestaurantSelect = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setCurrentView('restaurant-detail');
    // Clear cart when selecting a different restaurant
    if (cart.restaurant && cart.restaurant.id !== restaurant.id) {
      setCart({ items: [], restaurant: null });
    }
  };

  const handleOrderComplete = (data: any) => {
    setOrderData(data);
    setCurrentView('order-tracking');
    // Clear cart after order completion
    setCart({ items: [], restaurant: null });
  };

  const handleLogin = (userType: 'restaurant' | 'admin' | 'staff', userInfo: any) => {
    const authUser: AuthUser = {
      username: userInfo.username,
      name: userInfo.name,
      role: userInfo.role,
      email: userInfo.email,
      userType: userType
    };
    
    setAuthUser(authUser);
    setCurrentView(userType);
  };

  const handleLogout = () => {
    setAuthUser(null);
    setCurrentView('home');
  };

  const requireAuth = (targetView: 'restaurant' | 'admin' | 'staff') => {
    if (!authUser || authUser.userType !== targetView) {
      setCurrentView('login');
      return false;
    }
    return true;
  };

  // Cart management functions
  const addToCart = (item: { id: number; name: string; price: number; image?: string }, restaurant: Restaurant) => {
    setCart(prevCart => {
      // If this is the first item or from the same restaurant
      if (!prevCart.restaurant || prevCart.restaurant.id === restaurant.id) {
        const existingItemIndex = prevCart.items.findIndex(cartItem => cartItem.id === item.id);
        
        if (existingItemIndex >= 0) {
          // Update quantity of existing item
          const updatedItems = [...prevCart.items];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + 1
          };
          return {
            ...prevCart,
            items: updatedItems,
            restaurant: restaurant
          };
        } else {
          // Add new item to cart
          return {
            ...prevCart,
            items: [...prevCart.items, { ...item, quantity: 1 }],
            restaurant: restaurant
          };
        }
      }
      return prevCart;
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart(prevCart => {
      const existingItemIndex = prevCart.items.findIndex(cartItem => cartItem.id === itemId);
      
      if (existingItemIndex >= 0) {
        const updatedItems = [...prevCart.items];
        const currentQuantity = updatedItems[existingItemIndex].quantity;
        
        if (currentQuantity > 1) {
          // Decrease quantity
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: currentQuantity - 1
          };
        } else {
          // Remove item completely
          updatedItems.splice(existingItemIndex, 1);
        }
        
        return {
          ...prevCart,
          items: updatedItems,
          restaurant: updatedItems.length > 0 ? prevCart.restaurant : null
        };
      }
      
      return prevCart;
    });
  };

  const getCartItemQuantity = (itemId: number): number => {
    const item = cart.items.find(cartItem => cartItem.id === itemId);
    return item ? item.quantity : 0;
  };

  const getCartTotal = (): number => {
    return cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = (): number => {
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  };

  const clearCart = () => {
    setCart({ items: [], restaurant: null });
  };

  const updateDeliveryAddress = (address: string) => {
    setDeliveryAddress(address);
    // Save to localStorage for persistence
    try {
      localStorage.setItem('frontdash-delivery-address', address);
    } catch (error) {
      console.error('Failed to save delivery address to localStorage:', error);
    }
  };

  const handleAddressSubmit = (address: string) => {
    updateDeliveryAddress(address);
    setCurrentView('home');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'address-input':
        return <AddressInput onAddressSubmit={handleAddressSubmit} />;
      case 'home':
        return (
          <LandingPage 
            onNavigate={(view) => {
              if (view === 'restaurant') {
                setCurrentView('restaurant-registration');
              } else if (view === 'admin') {
                if (!requireAuth(view)) return;
                setCurrentView(view);
              } else {
                setCurrentView(view);
              }
            }}
            onOrderFood={() => setCurrentView('customer')}
            onRestaurantSelect={handleRestaurantSelect}
            cart={cart}
            getTotalItems={getTotalItems}
            deliveryAddress={deliveryAddress}
            onDeliveryAddressChange={updateDeliveryAddress}
          />
        );
      case 'restaurant-detail':
        return selectedRestaurant ? (
          <RestaurantDetail 
            restaurant={selectedRestaurant}
            onBack={() => setCurrentView('home')}
            onOrderFood={() => setCurrentView('customer')}
            cart={cart}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            getCartItemQuantity={getCartItemQuantity}
            getCartTotal={getCartTotal}
            getTotalItems={getTotalItems}
          />
        ) : null;
      case 'customer':
        return <OrderConfirmation 
          onOrderComplete={handleOrderComplete}
          cart={cart}
          clearCart={clearCart}
        />;
      case 'order-tracking':
        return orderData ? (
          <OrderTracking 
            orderData={orderData} 
            onBackToHome={() => setCurrentView('home')} 
          />
        ) : null;
      case 'restaurant-registration':
        return <RestaurantRegistration onNavigateHome={() => setCurrentView('home')} onNavigateLogin={() => setCurrentView('login')} />;
      case 'restaurant':
        return authUser?.userType === 'restaurant' ? <RestaurantInterface onNavigateHome={() => setCurrentView('home')} /> : null;
      case 'admin':
        return authUser?.userType === 'admin' ? <FrontDashAdmin onNavigateHome={() => setCurrentView('home')} /> : null;
      case 'staff':
        return authUser?.userType === 'staff' ? <FrontDashStaff onNavigateHome={() => setCurrentView('home')} /> : null;
      case 'login':
        return <LoginPage onLogin={handleLogin} onBackToHome={() => setCurrentView('home')} />;
      default:
        return (
          <LandingPage 
            onNavigate={(view) => {
              if (view === 'restaurant') {
                setCurrentView('restaurant-registration');
              } else if (view === 'admin') {
                if (!requireAuth(view)) return;
                setCurrentView(view);
              } else {
                setCurrentView(view);
              }
            }}
            onOrderFood={() => setCurrentView('customer')}
            onRestaurantSelect={handleRestaurantSelect}
            cart={cart}
            getTotalItems={getTotalItems}
            deliveryAddress={deliveryAddress}
            onDeliveryAddressChange={updateDeliveryAddress}
          />
        );
    }
  };

  const getHeaderProps = () => {
    const baseProps = {
      currentView,
      authUser,
      cart,
      getTotalItems,
      onNavigate: setCurrentView,
      onLogout: handleLogout,
      requireAuth
    };

    switch (currentView) {
      case 'restaurant-detail':
        return {
          ...baseProps,
          showBackButton: true,
          onBack: () => setCurrentView('home'),
          backButtonText: 'Back'
        };
      case 'restaurant-registration':
        return {
          ...baseProps,
          showBackButton: true,
          onBack: () => setCurrentView('home'),
          backButtonText: 'Back to Home'
        };
      case 'order-tracking':
        return {
          ...baseProps,
          showBackButton: true,
          onBack: () => setCurrentView('home'),
          backButtonText: 'Back to Home'
        };
      case 'login':
        return {
          ...baseProps,
          showBackButton: true,
          onBack: () => setCurrentView('home'),
          backButtonText: 'Back to Home'
        };
      default:
        return baseProps;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Consistent Header for all pages except address input */}
      {currentView !== 'address-input' && <AppHeader {...getHeaderProps()} />}

      {/* Main Content */}
      <main className={currentView === 'home' || currentView === 'address-input' ? '' : 'max-w-7xl mx-auto px-4 py-6'}>
        {renderCurrentView()}
      </main>
      
      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}