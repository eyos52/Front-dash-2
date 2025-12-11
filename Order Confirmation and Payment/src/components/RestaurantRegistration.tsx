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
import { User, Mail, Phone, MapPin, Utensils, Clock, CheckCircle, Plus, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { validateEmailSimple as validateEmail, validatePasswordSimple as validatePassword, validatePhoneNumber, validateZipCodeSimple as validateZipCode } from './utils/validation';
import { createRestaurantRegistration } from '../lib/services/database';

interface RestaurantRegistrationProps {
  onNavigateHome: () => void;
  onNavigateLogin: () => void;
}

interface MenuItem {
  name: string;
  price: string;
  description: string;
  is_available: boolean;
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
  menuItems: MenuItem[];
  operatingHours: {
    monFri: string;
    sat: string;
    sun: string;
  };
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
    smsOptIn: false,
    menuItems: [],
    operatingHours: {
      monFri: '',
      sat: '',
      sun: ''
    }
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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

  const handleAddMenuItem = () => {
    setFormData(prev => ({
      ...prev,
      menuItems: [...prev.menuItems, { name: '', price: '', description: '', is_available: true }]
    }));
  };

  const handleRemoveMenuItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      menuItems: prev.menuItems.filter((_, i) => i !== index)
    }));
  };

  const handleMenuItemChange = (index: number, field: keyof MenuItem, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      menuItems: prev.menuItems.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
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

    // Menu file validation - removed requirement, now optional

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
      // Build full address string
      const fullAddress = `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`;

      // Prepare menu items and operating hours for JSON storage
      const menuItemsData = formData.menuItems
        .filter(item => item.name.trim() !== '') // Only include items with names
        .map(item => ({
          name: item.name.trim(),
          price: parseFloat(item.price) || 0,
          description: item.description.trim() || null,
          is_available: item.is_available
        }));

      const operatingHoursData = {
        monFri: formData.operatingHours.monFri.trim() || null,
        sat: formData.operatingHours.sat.trim() || null,
        sun: formData.operatingHours.sun.trim() || null
      };

      // Create JSON payload for note field
      const notePayload = {
        menuItems: menuItemsData,
        operatingHours: operatingHoursData
      };

      // Create registration request in database
      await createRestaurantRegistration({
        restaurant_name: formData.restaurantName,
        owner_first_name: formData.firstName,
        owner_last_name: formData.lastName,
        email: formData.email,
        phone: formData.phoneNumber,
        address: fullAddress,
        note: JSON.stringify(notePayload)
      });
      
      setShowSuccess(true);
      toast.success('Thanks! Your restaurant request has been submitted for review.');
      
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
          smsOptIn: false,
          menuItems: [],
          operatingHours: {
            monFri: '',
            sat: '',
            sun: ''
          }
        });
        setShowSuccess(false);
      }, 3000);

    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
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

          {/* Initial Menu (Optional) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                Initial Menu (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Add menu items that will be available when your restaurant is approved. You can add more items later.
              </p>
              
              {formData.menuItems.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-sm font-medium">Menu Item {index + 1}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMenuItem(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`menuName-${index}`}>Name *</Label>
                      <Input
                        id={`menuName-${index}`}
                        value={item.name}
                        onChange={(e) => handleMenuItemChange(index, 'name', e.target.value)}
                        placeholder="Item name"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`menuPrice-${index}`}>Price ($)</Label>
                      <Input
                        id={`menuPrice-${index}`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.price}
                        onChange={(e) => handleMenuItemChange(index, 'price', e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor={`menuDescription-${index}`}>Description</Label>
                    <Textarea
                      id={`menuDescription-${index}`}
                      value={item.description}
                      onChange={(e) => handleMenuItemChange(index, 'description', e.target.value)}
                      placeholder="Item description (optional)"
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`menuAvailability-${index}`}>Availability</Label>
                    <Select
                      value={item.is_available ? 'available' : 'not available'}
                      onValueChange={(value) => handleMenuItemChange(index, 'is_available', value === 'available')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="not available">Not Available</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={handleAddMenuItem}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Menu Item
              </Button>
            </CardContent>
          </Card>

          {/* Operating Hours (Optional) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Operating Hours (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Specify your restaurant's operating hours. You can update these later.
              </p>
              
              <div>
                <Label htmlFor="monFriHours">Mon–Fri Hours</Label>
                <Input
                  id="monFriHours"
                  value={formData.operatingHours.monFri}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    operatingHours: { ...prev.operatingHours, monFri: e.target.value }
                  }))}
                  placeholder="e.g., 9:00 AM - 10:00 PM"
                />
              </div>
              
              <div>
                <Label htmlFor="satHours">Saturday Hours</Label>
                <Input
                  id="satHours"
                  value={formData.operatingHours.sat}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    operatingHours: { ...prev.operatingHours, sat: e.target.value }
                  }))}
                  placeholder="e.g., 10:00 AM - 11:00 PM"
                />
              </div>
              
              <div>
                <Label htmlFor="sunHours">Sunday Hours</Label>
                <Input
                  id="sunHours"
                  value={formData.operatingHours.sun}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    operatingHours: { ...prev.operatingHours, sun: e.target.value }
                  }))}
                  placeholder="e.g., 11:00 AM - 9:00 PM"
                />
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