import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Checkbox } from './ui/checkbox';
import { validateEmail, validatePhone, validateZipCode, formatPhone } from './utils/validation';
import { 
  ArrowLeft, 
  CreditCard, 
  MapPin, 
  Phone, 
  Gift,
  CheckCircle,
  Mail
} from 'lucide-react';

interface ShippingDetails {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}

interface PaymentDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  nameOnCard: string;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
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
}

interface CartState {
  items: CartItem[];
  restaurant: Restaurant | null;
}

interface OrderConfirmationProps {
  onOrderComplete?: (orderData: any) => void;
  cart: CartState;
  clearCart: () => void;
}

export function OrderConfirmation({ onOrderComplete, cart, clearCart }: OrderConfirmationProps) {
  const [deliveryMethod] = useState<'delivery'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'venmo'>('card');
  const [sendAsGift, setSendAsGift] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  
  const [customerEmail, setCustomerEmail] = useState('');

  const [shippingDetails, setShippingDetails] = useState<ShippingDetails>({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: ''
  });

  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: ''
  });

  // Check if cart is empty
  if (!cart.restaurant || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some items to your cart to proceed with checkout.</p>
          <Button onClick={() => window.history.back()} className="bg-orange-500 hover:bg-orange-600">
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  // Calculations
  const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 2.99;
  const serviceCharge = subtotal * 0.0825; // 8.25% service charge
  const taxAndFees = subtotal * 0.08;
  const total = subtotal + deliveryFee + serviceCharge + taxAndFees;

  const validateCreditCard = (cardNumber: string): boolean => {
    const cleanedNumber = cardNumber.replace(/\D/g, '');
    
    if (cleanedNumber.length !== 16 || cleanedNumber.charAt(0) === '0') {
      return false;
    }
    
    const validStartDigits = ['4', '2', '5', '3', '6'];
    const firstDigit = cleanedNumber.charAt(0);
    
    return validStartDigits.includes(firstDigit);
  };

  const validateExpiryDate = (expiryDate: string): boolean => {
    if (!expiryDate || !expiryDate.includes('/')) return false;
    
    const [month, year] = expiryDate.split('/');
    if (!month || !year) return false;
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    const expMonth = parseInt(month);
    const expYear = parseInt(year);
    
    if (expMonth < 1 || expMonth > 12) return false;
    
    if (expYear > currentYear || (expYear === currentYear && expMonth >= currentMonth)) {
      return true;
    }
    
    return false;
  };

  const validateCVV = (cvv: string): boolean => {
    const cleanedCVV = cvv.replace(/\D/g, '');
    return cleanedCVV.length === 3;
  };

  const formatCardNumber = (value: string): string => {
    const cleanedValue = value.replace(/\D/g, '');
    const formatted = cleanedValue.replace(/(.{4})/g, '$1 ').trim();
    return formatted.substring(0, 19);
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};
    
    // Validate customer email
    const emailValidation = validateEmail(customerEmail);
    if (!emailValidation.isValid) {
      errors.customerEmail = emailValidation.error || 'Please enter a valid email address';
    }
    
    // Validate shipping details
    if (!shippingDetails.firstName.trim()) errors.firstName = 'First name is required';
    if (!shippingDetails.lastName.trim()) errors.lastName = 'Last name is required';
    if (!shippingDetails.address.trim()) errors.address = 'Address is required';
    if (!shippingDetails.city.trim()) errors.city = 'City is required';
    if (!shippingDetails.state.trim()) errors.state = 'State is required';
    
    // Validate zip code with proper validation
    const zipCodeValidation = validateZipCode(shippingDetails.zipCode);
    if (!zipCodeValidation.isValid) {
      errors.zipCode = zipCodeValidation.error || 'Zip code must be exactly 5 digits';
    }
    
    // Validate phone
    const phoneValidation = validatePhone(shippingDetails.phone);
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.error || 'Phone number must be exactly 10 digits';
    }
    
    // Validate payment details if card is selected
    if (paymentMethod === 'card') {
      if (!paymentDetails.cardNumber.trim()) errors.cardNumber = 'Card number is required';
      if (!paymentDetails.nameOnCard.trim()) errors.nameOnCard = 'Name on card is required';
      if (!paymentDetails.expiryDate.trim()) errors.expiryDate = 'Expiry date is required';
      if (!paymentDetails.cvv.trim()) errors.cvv = 'CVV is required';
      
      if (paymentDetails.cardNumber && !validateCreditCard(paymentDetails.cardNumber)) {
        errors.cardNumber = 'Credit card number must be 16 digits long, start with 4, 2, 5, 3, or 6';
      }
      
      if (paymentDetails.expiryDate && !validateExpiryDate(paymentDetails.expiryDate)) {
        errors.expiryDate = 'Credit card expiry date must be in the future';
      }
      
      if (paymentDetails.cvv && !validateCVV(paymentDetails.cvv)) {
        errors.cvv = 'Security code must be exactly 3 digits';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePayment = () => {
    if (!validateForm()) {
      alert('Please fix the errors in the form before continuing');
      return;
    }
    
    // Create order data for tracking
    const orderData = {
      orderNumber: `FD${Date.now().toString().slice(-6)}`,
      email: customerEmail,
      deliveryAddress: {
        buildingNumber: shippingDetails.address.split(' ')[0] || '',
        streetName: shippingDetails.address.split(' ').slice(1).join(' ') || shippingDetails.address,
        unitNumber: '',
        city: shippingDetails.city,
        state: shippingDetails.state,
        zipCode: shippingDetails.zipCode
      },
      restaurant: {
        name: cart.restaurant.name,
        address: cart.restaurant.address || "123 Main St, Downtown"
      },
      items: cart.items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      total: total,
      estimatedDelivery: new Date(Date.now() + 35 * 60 * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };
    
    setOrderConfirmed(true);
    
    // Pass order data to parent component for tracking
    if (onOrderComplete) {
      onOrderComplete(orderData);
    }
  };

  const handleBackToStore = () => {
    window.history.back();
  };

  if (orderConfirmed) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleBackToStore} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Store
              </Button>
              <h1 className="text-2xl font-bold text-orange-600">FrontDash</h1>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Order Confirmed!</h2>
              <p className="text-gray-600 mb-6">
                Thank you for your order. You'll receive a confirmation email shortly.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="font-semibold">Order #FD{Date.now().toString().slice(-6)}</p>
                <p className="text-sm text-gray-600">Estimated delivery: 25-35 minutes</p>
              </div>
              <Button onClick={handleBackToStore} className="w-full bg-orange-500 hover:bg-orange-600">
                Continue Shopping
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBackToStore} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Store
            </Button>
            <h1 className="text-2xl font-bold text-orange-600">FrontDash</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Order Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Email */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="customerEmail" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    placeholder="Enter your email (e.g., user@example.com)"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className={validationErrors.customerEmail ? 'border-red-300 focus:border-red-500' : ''}
                  />
                  {validationErrors.customerEmail && (
                    <p className="text-sm text-red-600 mt-1">
                      {validationErrors.customerEmail}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                  Delivery Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="First name"
                      value={shippingDetails.firstName}
                      onChange={(e) => setShippingDetails({...shippingDetails, firstName: e.target.value})}
                      className={validationErrors.firstName ? 'border-red-300 focus:border-red-500' : ''}
                    />
                    {validationErrors.firstName && (
                      <p className="text-sm text-red-600 mt-1">{validationErrors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Last name"
                      value={shippingDetails.lastName}
                      onChange={(e) => setShippingDetails({...shippingDetails, lastName: e.target.value})}
                      className={validationErrors.lastName ? 'border-red-300 focus:border-red-500' : ''}
                    />
                    {validationErrors.lastName && (
                      <p className="text-sm text-red-600 mt-1">{validationErrors.lastName}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="Street address"
                    value={shippingDetails.address}
                    onChange={(e) => setShippingDetails({...shippingDetails, address: e.target.value})}
                    className={validationErrors.address ? 'border-red-300 focus:border-red-500' : ''}
                  />
                  {validationErrors.address && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.address}</p>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="City"
                      value={shippingDetails.city}
                      onChange={(e) => setShippingDetails({...shippingDetails, city: e.target.value})}
                      className={validationErrors.city ? 'border-red-300 focus:border-red-500' : ''}
                    />
                    {validationErrors.city && (
                      <p className="text-sm text-red-600 mt-1">{validationErrors.city}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="State"
                      value={shippingDetails.state}
                      onChange={(e) => setShippingDetails({...shippingDetails, state: e.target.value})}
                      className={validationErrors.state ? 'border-red-300 focus:border-red-500' : ''}
                    />
                    {validationErrors.state && (
                      <p className="text-sm text-red-600 mt-1">{validationErrors.state}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="zipCode">Zip Code</Label>
                    <Input
                      id="zipCode"
                      placeholder="12345"
                      value={shippingDetails.zipCode}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, '');
                        setShippingDetails({...shippingDetails, zipCode: cleaned});
                      }}
                      maxLength={5}
                      className={validationErrors.zipCode ? 'border-red-300 focus:border-red-500' : ''}
                    />
                    {validationErrors.zipCode && (
                      <p className="text-sm text-red-600 mt-1">{validationErrors.zipCode}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    placeholder="10 digit phone number"
                    value={shippingDetails.phone}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '');
                      setShippingDetails({...shippingDetails, phone: cleaned});
                    }}
                    maxLength={10}
                    className={validationErrors.phone ? 'border-red-300 focus:border-red-500' : ''}
                  />
                  {validationErrors.phone && (
                    <p className="text-sm text-red-600 mt-1">{validationErrors.phone}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Delivery Info */}
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 text-orange-800">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">Delivery Service</span>
                  </div>
                  <p className="text-sm text-orange-700 mt-1">
                    Your order will be delivered to the address provided above.
                  </p>
                </div>

                {/* Payment Method Buttons */}
                <div className="space-y-3">
                  <Label>Payment Method</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={paymentMethod === 'card' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('card')}
                      className={paymentMethod === 'card' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                    >
                      Card
                    </Button>
                    <Button
                      variant={paymentMethod === 'paypal' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('paypal')}
                      className={paymentMethod === 'paypal' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                    >
                      PayPal
                    </Button>
                    <Button
                      variant={paymentMethod === 'venmo' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('venmo')}
                      className={paymentMethod === 'venmo' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                    >
                      Venmo
                    </Button>
                  </div>
                </div>

                {/* Payment Form */}
                {paymentMethod === 'card' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cardNumber">Credit/Debit Card</Label>
                      <Input
                        id="cardNumber"
                        placeholder="4123 5678 9012 3456"
                        value={paymentDetails.cardNumber}
                        onChange={(e) => {
                          const formatted = formatCardNumber(e.target.value);
                          setPaymentDetails({...paymentDetails, cardNumber: formatted});
                        }}
                        className={validationErrors.cardNumber ? 'border-red-300 focus:border-red-500' : ''}
                      />
                      {validationErrors.cardNumber && (
                        <p className="text-sm text-red-600 mt-1">{validationErrors.cardNumber}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="nameOnCard">Name on Card</Label>
                      <Input
                        id="nameOnCard"
                        placeholder="Full name"
                        value={paymentDetails.nameOnCard}
                        onChange={(e) => setPaymentDetails({...paymentDetails, nameOnCard: e.target.value})}
                        className={validationErrors.nameOnCard ? 'border-red-300 focus:border-red-500' : ''}
                      />
                      {validationErrors.nameOnCard && (
                        <p className="text-sm text-red-600 mt-1">{validationErrors.nameOnCard}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiryDate">Expiry Date</Label>
                        <Input
                          id="expiryDate"
                          placeholder="MM/YY"
                          value={paymentDetails.expiryDate}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '');
                            if (value.length >= 2) {
                              value = value.substring(0, 2) + '/' + value.substring(2, 4);
                            }
                            setPaymentDetails({...paymentDetails, expiryDate: value});
                          }}
                          maxLength={5}
                          className={validationErrors.expiryDate ? 'border-red-300 focus:border-red-500' : ''}
                        />
                        {validationErrors.expiryDate && (
                          <p className="text-sm text-red-600 mt-1">{validationErrors.expiryDate}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          value={paymentDetails.cvv}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/\D/g, '');
                            setPaymentDetails({...paymentDetails, cvv: cleaned});
                          }}
                          maxLength={3}
                          className={validationErrors.cvv ? 'border-red-300 focus:border-red-500' : ''}
                        />
                        {validationErrors.cvv && (
                          <p className="text-sm text-red-600 mt-1">{validationErrors.cvv}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'paypal' && (
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <p className="text-sm text-blue-800">You will be redirected to PayPal to complete your payment.</p>
                  </div>
                )}

                {paymentMethod === 'venmo' && (
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <p className="text-sm text-blue-800">You will be redirected to Venmo to complete your payment.</p>
                  </div>
                )}

                {/* Send as Gift */}
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="sendAsGift" 
                    checked={sendAsGift}
                    onCheckedChange={(checked) => setSendAsGift(checked as boolean)}
                  />
                  <Label htmlFor="sendAsGift" className="flex items-center gap-2 text-sm">
                    <Gift className="h-4 w-4" />
                    Send as a gift
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Your cart from</CardTitle>
                <p className="text-sm text-gray-600">{cart.restaurant.name}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Items */}
                <div className="space-y-3">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>${deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Charge (8.25%)</span>
                    <span>${serviceCharge.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax & Fees</span>
                    <span>${taxAndFees.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <Button 
                  onClick={handlePayment} 
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  size="lg"
                >
                  Place Order • ${total.toFixed(2)}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}