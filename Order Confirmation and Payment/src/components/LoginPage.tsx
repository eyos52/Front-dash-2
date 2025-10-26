import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner@2.0.3';
import { Shield, Store, Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
  onLogin: (userType: 'restaurant' | 'admin' | 'staff', userInfo: any) => void;
  onBackToHome: () => void;
}

interface LoginCredentials {
  username: string;
  password: string;
  role: 'restaurant' | 'admin' | 'staff' | '';
}

export function LoginPage({ onLogin, onBackToHome }: LoginPageProps) {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
    role: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Demo accounts for testing
  const demoAccounts = {
    restaurant: [
      { username: 'tony.bistro', password: 'TonyPass123!', name: "Tony's Italian Bistro", email: 'tony@tonys.com' },
      { username: 'burger.palace', password: 'BurgerPass123!', name: 'Burger Palace', email: 'info@burgerpalace.com' },
      { username: 'dragon.sushi', password: 'DragonPass123!', name: 'Dragon Sushi', email: 'info@dragonsushi.com' },
      { username: 'maria.tacos', password: 'MariaPass123!', name: "Maria's Authentic Tacos", email: 'maria@mariatacos.com' },
      { username: 'pizza.corner', password: 'PizzaPass123!', name: 'Pizza Corner', email: 'owner@pizzacorner.com' }
    ],
    admin: [
      { username: 'admin', password: 'Admin123!', name: 'System Administrator', role: 'Super Admin' },
      { username: 'alice.johnson', password: 'Alice123!', name: 'Alice Johnson', role: 'Manager' },
      { username: 'bob.smith', password: 'Bob123!', name: 'Bob Smith', role: 'Support' },
      { username: 'carol.davis', password: 'Carol123!', name: 'Carol Davis', role: 'Operations Manager' },
      { username: 'david.wilson', password: 'David123!', name: 'David Wilson', role: 'Customer Success' }
    ],
    staff: [
      { username: 'dispatch1', password: 'Staff123!', name: 'Emma Rodriguez', role: 'Dispatcher' },
      { username: 'dispatch2', password: 'Staff123!', name: 'Michael Chen', role: 'Lead Dispatcher' },
      { username: 'operations.staff', password: 'Staff123!', name: 'Sarah Thompson', role: 'Operations Staff' },
      { username: 'driver.manager', password: 'Staff123!', name: 'James Wilson', role: 'Driver Manager' }
    ]
  };

  const validatePassword = (password: string): boolean => {
    // Password must contain at least one uppercase, one lowercase, one number, and one special character
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    return hasUpper && hasLower && hasNumber && hasSpecial && isLongEnough;
  };

  const validateForm = (): boolean => {
    const formErrors: string[] = [];

    if (!credentials.role) {
      formErrors.push('Please select whether you are a Restaurant Owner or Administrator');
    }

    if (!credentials.username.trim()) {
      formErrors.push('Username is required');
    } else if (credentials.username.trim().length < 3) {
      formErrors.push('Username must be at least 3 characters long');
    }

    if (!credentials.password.trim()) {
      formErrors.push('Password is required');
    } else if (!validatePassword(credentials.password)) {
      formErrors.push('Password must contain at least 8 characters with uppercase, lowercase, number, and special character (!@#$%^&*)');
    }

    setErrors(formErrors);
    return formErrors.length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const accountList = demoAccounts[credentials.role as 'restaurant' | 'admin' | 'staff'];
    const account = accountList.find(acc => 
      acc.username === credentials.username && acc.password === credentials.password
    );

    if (account) {
      toast.success(`Welcome back, ${account.name}!`);
      onLogin(credentials.role as 'restaurant' | 'admin' | 'staff', account);
    } else {
      toast.error('Invalid credentials. Please check your username and password.');
      setErrors(['Invalid username or password']);
    }

    setIsLoading(false);
  };

  const handleDemoLogin = (role: 'restaurant' | 'admin' | 'staff') => {
    const demoAccount = demoAccounts[role][0];
    setCredentials({
      username: demoAccount.username,
      password: demoAccount.password,
      role: role
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'restaurant':
        return <Store className="h-5 w-5" />;
      case 'admin':
        return <Shield className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center">
          <button 
            onClick={onBackToHome}
            className="text-3xl font-bold text-orange-600 hover:text-orange-700 transition-colors mb-2"
          >
            FrontDash
          </button>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-gray-900">Business Portal Sign In</h1>
            <p className="text-gray-600">Access your restaurant management or administrative dashboard</p>
          </div>
        </div>

        {/* Login Form */}
        <Card className="shadow-lg border-2">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100">
            <CardTitle className="text-center flex items-center justify-center gap-2 text-orange-800">
              {getRoleIcon(credentials.role)}
              {credentials.role === 'restaurant' ? 'Restaurant Owner Sign In' : 
               credentials.role === 'admin' ? 'Administrator Sign In' : 
               credentials.role === 'staff' ? 'FrontDash Staff Sign In' :
               'Business Portal Sign In'}
            </CardTitle>
            {credentials.role && (
              <p className="text-center text-sm text-orange-600 mt-2">
                {credentials.role === 'restaurant' 
                  ? 'Manage your restaurant, menu, and orders'
                  : credentials.role === 'admin'
                  ? 'Access administrative tools and platform management'
                  : 'Manage pending orders and delivery assignments'
                }
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Role Selection */}
            <div>
              <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                I am signing in as a:
              </Label>
              <Select 
                value={credentials.role} 
                onValueChange={(value: 'restaurant' | 'admin' | 'staff') => setCredentials({...credentials, role: value})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose your account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restaurant">
                    <div className="flex items-center gap-3 py-2">
                      <Store className="h-5 w-5 text-orange-600" />
                      <div>
                        <div className="font-medium">Restaurant Owner</div>
                        <div className="text-xs text-gray-500">Manage your restaurant operations</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-3 py-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium">FrontDash Administrator</div>
                        <div className="text-xs text-gray-500">Platform management and oversight</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="staff">
                    <div className="flex items-center gap-3 py-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-medium">FrontDash Staff</div>
                        <div className="text-xs text-gray-500">Order management and delivery coordination</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Username */}
            <div>
              <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                Business Username
              </Label>
              <Input
                id="username"
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                placeholder={credentials.role === 'restaurant' ? 'e.g., tony.bistro' : credentials.role === 'admin' ? 'e.g., admin' : credentials.role === 'staff' ? 'e.g., dispatch1' : 'Enter your username'}
                className="w-full mt-1"
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  placeholder="Enter your secure password"
                  className="w-full pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Must include uppercase, lowercase, number, and special character
              </p>
            </div>

            {/* Error Messages */}
            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <ul className="list-disc pl-4">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Login Button */}
            <Button 
              onClick={handleLogin} 
              className={`w-full transition-all duration-200 ${
                credentials.role === 'restaurant' 
                  ? 'bg-orange-600 hover:bg-orange-700' 
                  : credentials.role === 'admin' 
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
              disabled={isLoading || !credentials.role}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </div>
              ) : (
                `Sign In${credentials.role ? ` as ${credentials.role === 'restaurant' ? 'Restaurant Owner' : 'Administrator'}` : ''}`
              )}
            </Button>

            {/* Demo Accounts */}
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 text-center mb-3">Quick Demo Access:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                  onClick={() => handleDemoLogin('restaurant')}
                >
                  <Store className="h-4 w-4 mr-1" />
                  Restaurant
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  onClick={() => handleDemoLogin('admin')}
                >
                  <Shield className="h-4 w-4 mr-1" />
                  Admin
                </Button>
              </div>
            </div>

            {/* Demo Credentials Info */}
            <Alert className="bg-gradient-to-r from-orange-50 to-blue-50 border-orange-200">
              <AlertDescription className="text-sm">
                <div className="space-y-2">
                  <div className="font-medium text-gray-800">Available Demo Accounts:</div>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-orange-700 font-medium">Restaurant:</span>
                      <span className="font-mono">tony.bistro / TonyPass123!</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 font-medium">Admin:</span>
                      <span className="font-mono">admin / Admin123!</span>
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {/* Back to Home */}
            <Button 
              variant="ghost" 
              onClick={onBackToHome}
              className="w-full"
            >
              ← Back to Home
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-2">
          <div className="text-sm text-gray-500">
            <p>Need access to the business portal?</p>
          </div>
          <div className="flex justify-center gap-4 text-xs text-gray-400">
            <span>Restaurant Owners: Contact FrontDash support</span>
            <span>•</span>
            <span>Staff Access: Contact your manager</span>
          </div>
        </div>
      </div>
    </div>
  );
}