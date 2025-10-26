import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MapPin, Search } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface AddressInputProps {
  onAddressSubmit: (address: string) => void;
}

export function AddressInput({ onAddressSubmit }: AddressInputProps) {
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address.trim()) {
      toast.error('Please enter your delivery address');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate address validation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Delivery address saved!');
      onAddressSubmit(address.trim());
    } catch (error) {
      toast.error('Failed to save address. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
              <MapPin className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to FrontDash</h1>
          <p className="text-gray-600">Enter your delivery address to get started</p>
        </div>

        {/* Address Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Where should we deliver?</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="address">Delivery Address</Label>
                <div className="relative mt-2">
                  <Input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your street address, city, state, zip"
                    className="pl-10"
                    disabled={isLoading}
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={isLoading || !address.trim()}
              >
                {isLoading ? 'Saving...' : 'Continue to FrontDash'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            We'll use this address to show you nearby restaurants and calculate delivery times.
            You can change this address later in your account settings.
          </p>
        </div>
      </div>
    </div>
  );
}