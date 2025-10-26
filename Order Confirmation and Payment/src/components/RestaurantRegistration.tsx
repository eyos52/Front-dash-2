import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Upload, User, Mail, Phone, MapPin, Utensils, Clock, FileText, Image, CheckCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { validateEmailSimple as validateEmail, validatePasswordSimple as validatePassword, validatePhoneNumber, validateZipCodeSimple as validateZipCode } from './utils/validation';

interface RestaurantRegistrationProps {
  onNavigateHome: () => void;
  onNavigateLogin: () => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  restaurantName: string;
  cuisineType: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  description: string;
  openingTime: string;
  closingTime: string;
  smsOptIn: boolean;
}

interface FormErrors {
  [key: string]: string;
}

export function RestaurantRegistration({ onNavigateHome, onNavigateLogin }: RestaurantRegistrationProps) {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    restaurantName: '',
    cuisineType: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    description: '',
    openingTime: '09:00',
    closingTime: '22:00',
    smsOptIn: false
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [menuFile, setMenuFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const cuisineTypes = [
    'American', 'Italian', 'Chinese', 'Mexican', 'Indian', 'Japanese', 'Thai', 
    'Mediterranean', 'French', 'Greek', 'Korean', 'Vietnamese', 'Middle Eastern',
    'Pizza', 'Burgers', 'Seafood', 'Vegetarian', 'Bakery', 'Fast Food', 'Other'
  ];

  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 
    'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 
    'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePhoneNumberChange = (value: string) => {
    // Remove non-digits and limit to 10 digits
    const digits = value.replace(/\D/g, '').slice(0, 10);
    handleInputChange('phoneNumber', digits);
  };

  const handleZipCodeChange = (value: string) => {
    // Remove non-digits and limit to 5 digits
    const digits = value.replace(/\D/g, '').slice(0, 5);
    handleInputChange('zipCode', digits);
  };

  const handleFileUpload = (type: 'menu' | 'logo', file: File | null) => {
    if (type === 'menu') {
      setMenuFile(file);
    } else {
      setLogoFile(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields validation
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.restaurantName.trim()) newErrors.restaurantName = 'Restaurant name is required';
    if (!formData.cuisineType) newErrors.cuisineType = 'Cuisine type is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.description.trim()) newErrors.description = 'Restaurant description is required';

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must contain at least 8 characters with uppercase, lowercase, and numbers';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Phone number validation
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be exactly 10 digits';
    }

    // Zip code validation
    if (!formData.zipCode) {
      newErrors.zipCode = 'Zip code is required';
    } else if (!validateZipCode(formData.zipCode)) {
      newErrors.zipCode = 'Zip code must be exactly 5 digits';
    }

    // Menu file validation
    if (!menuFile) {
      newErrors.menu = 'Menu upload is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please correct the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setShowSuccess(true);
      toast.success('Registration submitted successfully! We will review your application and contact you within 2-3 business days.');
      
      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
          phoneNumber: '',
          restaurantName: '',
          cuisineType: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          description: '',
          openingTime: '09:00',
          closingTime: '22:00',
          smsOptIn: false
        });
        setMenuFile(null);
        setLogoFile(null);
        setShowSuccess(false);
      }, 3000);

    } catch (error) {
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for your interest in partnering with FrontDash. We'll review your application and contact you within 2-3 business days.
            </p>
            <Button onClick={onNavigateHome} className="bg-orange-600 hover:bg-orange-700">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Partner with FrontDash</h1>
          <p className="text-gray-600">Join thousands of restaurants growing their business with us</p>
        </div>

        {/* Login prompt */}
        <div className="text-center mb-8">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Button variant="link" onClick={onNavigateLogin} className="text-orange-600 hover:text-orange-700 p-0">
              Sign in here
            </Button>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Enter first name"
                    className={errors.firstName ? 'border-red-500' : ''}
                  />
                  {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Enter last name"
                    className={errors.lastName ? 'border-red-500' : ''}
                  />
                  {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Create password"
                    className={errors.password ? 'border-red-500' : ''}
                  />
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                  <p className="text-sm text-gray-500 mt-1">Must contain uppercase, lowercase, and numbers</p>
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Confirm password"
                    className={errors.confirmPassword ? 'border-red-500' : ''}
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => handlePhoneNumberChange(e.target.value)}
                  placeholder="Enter 10-digit phone number"
                  className={errors.phoneNumber ? 'border-red-500' : ''}
                  maxLength={10}
                />
                {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
                <p className="text-sm text-gray-500 mt-1">10 digits only</p>
              </div>
            </CardContent>
          </Card>

          {/* Restaurant Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                Restaurant Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="restaurantName">Restaurant Name *</Label>
                <Input
                  id="restaurantName"
                  value={formData.restaurantName}
                  onChange={(e) => handleInputChange('restaurantName', e.target.value)}
                  placeholder="Enter restaurant name"
                  className={errors.restaurantName ? 'border-red-500' : ''}
                />
                {errors.restaurantName && <p className="text-red-500 text-sm mt-1">{errors.restaurantName}</p>}
              </div>

              <div>
                <Label htmlFor="cuisineType">Cuisine Type *</Label>
                <Select value={formData.cuisineType} onValueChange={(value) => handleInputChange('cuisineType', value)}>
                  <SelectTrigger className={errors.cuisineType ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select cuisine type" />
                  </SelectTrigger>
                  <SelectContent>
                    {cuisineTypes.map(cuisine => (
                      <SelectItem key={cuisine} value={cuisine.toLowerCase()}>{cuisine}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.cuisineType && <p className="text-red-500 text-sm mt-1">{errors.cuisineType}</p>}
              </div>

              <div>
                <Label htmlFor="description">Restaurant Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Tell us about your restaurant..."
                  className={errors.description ? 'border-red-500' : ''}
                  rows={3}
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="openingTime">Opening Time</Label>
                  <Input
                    id="openingTime"
                    type="time"
                    value={formData.openingTime}
                    onChange={(e) => handleInputChange('openingTime', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="closingTime">Closing Time</Label>
                  <Input
                    id="closingTime"
                    type="time"
                    value={formData.closingTime}
                    onChange={(e) => handleInputChange('closingTime', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Restaurant Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter street address"
                  className={errors.address ? 'border-red-500' : ''}
                />
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Enter city"
                    className={errors.city ? 'border-red-500' : ''}
                  />
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                    <SelectTrigger className={errors.state ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
                </div>
                <div>
                  <Label htmlFor="zipCode">Zip Code *</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleZipCodeChange(e.target.value)}
                    placeholder="Enter zip code"
                    className={errors.zipCode ? 'border-red-500' : ''}
                    maxLength={5}
                  />
                  {errors.zipCode && <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>}
                  <p className="text-sm text-gray-500 mt-1">5 digits only</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Uploads */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="menuUpload">Upload Menu *</Label>
                <div className="mt-2">
                  <input
                    id="menuUpload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload('menu', e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('menuUpload')?.click()}
                    className="w-full justify-start gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    {menuFile ? menuFile.name : 'Choose menu file'}
                  </Button>
                  {errors.menu && <p className="text-red-500 text-sm mt-1">{errors.menu}</p>}
                  <p className="text-sm text-gray-500 mt-1">PDF, JPG, or PNG format</p>
                </div>
              </div>

              <div>
                <Label htmlFor="logoUpload">Upload Logo (Optional)</Label>
                <div className="mt-2">
                  <input
                    id="logoUpload"
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload('logo', e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('logoUpload')?.click()}
                    className="w-full justify-start gap-2"
                  >
                    <Image className="h-4 w-4" />
                    {logoFile ? logoFile.name : 'Choose logo file'}
                  </Button>
                  <p className="text-sm text-gray-500 mt-1">JPG or PNG format recommended</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SMS Opt-in */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="smsOptIn"
                  checked={formData.smsOptIn}
                  onCheckedChange={(checked) => handleInputChange('smsOptIn', checked as boolean)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="smsOptIn" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Opt in to SMS text messages
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Receive order notifications and promotional updates via SMS
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="text-center">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 text-lg font-medium min-w-[200px]"
            >
              {isSubmitting ? 'Submitting...' : 'Submit & Start Selling'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}