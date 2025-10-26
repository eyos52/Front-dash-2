import { Button } from './ui/button';
import { ShoppingCart, LogOut, User, ArrowLeft } from 'lucide-react';

interface CartState {
  items: Array<{ id: number; name: string; price: number; quantity: number; image?: string; }>;
  restaurant: any;
}

interface AuthUser {
  username: string;
  name: string;
  role?: string;
  email?: string;
  userType: 'restaurant' | 'admin';
}

interface AppHeaderProps {
  currentView: string;
  authUser: AuthUser | null;
  cart: CartState;
  getTotalItems: () => number;
  onNavigate: (view: any) => void;
  onLogout: () => void;
  requireAuth: (view: 'restaurant' | 'admin') => boolean;
  showBackButton?: boolean;
  onBack?: () => void;
  backButtonText?: string;
}

export function AppHeader({ 
  currentView, 
  authUser, 
  cart, 
  getTotalItems, 
  onNavigate, 
  onLogout, 
  requireAuth,
  showBackButton,
  onBack,
  backButtonText = "Back"
}: AppHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showBackButton && onBack && (
              <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                {backButtonText}
              </Button>
            )}
            <button 
              onClick={() => onNavigate('home')}
              className="text-2xl font-bold text-orange-600 hover:text-orange-700 transition-colors"
            >
              FrontDash
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Cart Icon - Always visible */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onNavigate('customer')}
              className="relative gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">
                Cart
              </span>
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </Button>

            {/* Navigation Links */}
            <Button
              variant="ghost" 
              onClick={() => onNavigate('restaurant')}
              size="sm"
            >
              Partner with us
            </Button>
            
            {/* Auth Section */}
            {authUser ? (
              <div className="flex items-center gap-2 ml-2 pl-2 border-l">
                <div className="flex items-center gap-1 text-sm">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{authUser.name}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onLogout}
                  className="gap-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('login')}
                className="ml-2 pl-2 border-l"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}