import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { 
  ArrowLeft, 
  User, 
  MapPin, 
  Clock,
  CheckCircle,
  Package,
  Truck,
  Home
} from 'lucide-react';

interface OrderTrackingProps {
  orderData: {
    orderNumber: string;
    email: string;
    deliveryAddress: {
      buildingNumber: string;
      streetName: string;
      unitNumber?: string;
      city: string;
      state: string;
      zipCode: string;
    };
    restaurant: {
      name: string;
      address: string;
    };
    items: Array<{
      id: number;
      name: string;
      price: number;
      quantity: number;
    }>;
    total: number;
    estimatedDelivery: string;
  };
  onBackToHome: () => void;
}

export function OrderTracking({ orderData, onBackToHome }: OrderTrackingProps) {
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 0: Order received, 1: Preparing, 2: On the way, 3: Delivered

  const steps = [
    { icon: CheckCircle, label: 'Order Confirmed', completed: true },
    { icon: Package, label: 'Preparing', completed: currentStep >= 1, active: currentStep === 1 },
    { icon: Truck, label: 'On the way', completed: currentStep >= 2, active: currentStep === 2 },
    { icon: Home, label: 'Delivered', completed: currentStep >= 3, active: currentStep === 3 }
  ];

  const formatAddress = () => {
    const { buildingNumber, streetName, unitNumber, city, state, zipCode } = orderData.deliveryAddress;
    const unit = unitNumber ? ` Unit ${unitNumber}` : '';
    return `${buildingNumber} ${streetName}${unit}, ${city}, ${state} ${zipCode}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBackToHome} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-orange-600 tracking-wide">FRONTDASH</h1>
            </div>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Order Status */}
          <div className="lg:col-span-2">
            <Card className="border-2">
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-2 rounded-full">
                    <User className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Account Details</CardTitle>
                    <p className="text-sm text-gray-600">{orderData.email}</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Order Status Header */}
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Confirming your order</h2>
                  </div>

                  {/* Delivery Address */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin className="h-5 w-5 text-orange-500" />
                      <span className="font-semibold">Delivery Address</span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-800">{formatAddress()}</p>
                      <p className="text-sm text-gray-600 mt-1">United States</p>
                    </div>
                  </div>

                  {/* Progress Tracker */}
                  <div className="py-8">
                    <div className="flex items-center justify-between relative">
                      {/* Progress Line */}
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2">
                        <div 
                          className="h-full bg-orange-500 transition-all duration-500"
                          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                        />
                      </div>
                      
                      {/* Step Icons */}
                      {steps.map((step, index) => {
                        const Icon = step.icon;
                        return (
                          <div key={index} className="relative z-10 flex flex-col items-center">
                            <div className={`
                              w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300
                              ${step.completed 
                                ? 'bg-orange-500 border-orange-500 text-white' 
                                : 'bg-white border-gray-300 text-gray-400'
                              }
                              ${step.active ? 'ring-4 ring-orange-200' : ''}
                            `}>
                              <Icon className="h-6 w-6" />
                            </div>
                            <p className={`
                              text-xs mt-2 text-center max-w-16
                              ${step.completed ? 'text-orange-600 font-semibold' : 'text-gray-500'}
                            `}>
                              {step.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Status Message */}
                  <div className="text-center py-4">
                    <p className="text-gray-700">
                      We sent your order to <span className="font-semibold text-orange-600">{orderData.restaurant.name}</span> for final confirmation
                    </p>
                  </div>

                  {/* Order Details Button */}
                  <div className="text-center">
                    <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
                      <DialogTrigger asChild>
                        <Button 
                          className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-2"
                          size="lg"
                        >
                          Show Order Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-xl">Order Details - #{orderData.orderNumber}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          {/* Restaurant Info */}
                          <div>
                            <h4 className="font-semibold text-lg">{orderData.restaurant.name}</h4>
                            <p className="text-sm text-gray-600">{orderData.restaurant.address}</p>
                          </div>
                          
                          <Separator />
                          
                          {/* Order Items */}
                          <div className="space-y-3">
                            <h4 className="font-semibold">Items Ordered</h4>
                            {orderData.items.map((item) => (
                              <div key={item.id} className="flex justify-between items-center">
                                <div className="flex-1">
                                  <p className="font-medium">{item.name}</p>
                                  <p className="text-sm text-gray-500">
                                    ${item.price.toFixed(2)} × {item.quantity}
                                  </p>
                                </div>
                                <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                              </div>
                            ))}
                          </div>
                          
                          <Separator />
                          
                          {/* Total */}
                          <div className="flex justify-between items-center text-lg font-bold">
                            <span>Total</span>
                            <span>${orderData.total.toFixed(2)}</span>
                          </div>
                          
                          {/* Delivery Info */}
                          <div className="bg-orange-50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 text-orange-800 mb-2">
                              <Clock className="h-4 w-4" />
                              <span className="font-semibold">Estimated Delivery</span>
                            </div>
                            <p className="text-orange-700">{orderData.estimatedDelivery}</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary Image Placeholder */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardContent className="p-0 h-full min-h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Package className="h-12 w-12" />
                  </div>
                  <p className="text-sm">Order Tracking</p>
                  <p className="text-xs">Live updates</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Simulate order progress for demo */}
        <div className="mt-8 text-center">
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => setCurrentStep(0)}
              variant="outline"
              size="sm"
              className={currentStep === 0 ? 'bg-orange-100' : ''}
            >
              Order Received
            </Button>
            <Button
              onClick={() => setCurrentStep(1)}
              variant="outline"
              size="sm"
              className={currentStep === 1 ? 'bg-orange-100' : ''}
            >
              Preparing
            </Button>
            <Button
              onClick={() => setCurrentStep(2)}
              variant="outline"
              size="sm"
              className={currentStep === 2 ? 'bg-orange-100' : ''}
            >
              On the Way
            </Button>
            <Button
              onClick={() => setCurrentStep(3)}
              variant="outline"
              size="sm"
              className={currentStep === 3 ? 'bg-orange-100' : ''}
            >
              Delivered
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Demo: Click buttons to simulate order progress</p>
        </div>
      </div>
    </div>
  );
}