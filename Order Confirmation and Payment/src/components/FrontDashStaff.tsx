import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { Clock, MapPin, User, Truck, CheckCircle, Circle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface PendingOrder {
  id: string;
  restaurantName: string;
  price: number;
  orderTime: string;
  status: 'Queued' | 'Pending' | 'Assigned';
  customer: string;
  pickupAddress: string;
  dropoffAddress: string;
  eta: string;
}

interface Driver {
  id: string;
  name: string;
  distance: number;
  isAvailable: boolean;
  avatar?: string;
  currentLocation: string;
}

interface FrontDashStaffProps {
  onNavigateHome: () => void;
}

export function FrontDashStaff({ onNavigateHome }: FrontDashStaffProps) {
  const [currentView, setCurrentView] = useState<'dashboard' | 'assign-driver'>('dashboard');
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  // Data will be loaded from database
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [drivers] = useState<Driver[]>([]);

  const availableDrivers = drivers.filter(driver => driver.isAvailable);
  const queuedOrders = pendingOrders.filter(order => order.status === 'Queued');

  const handleRetrieveFirstOrder = () => {
    const firstQueuedOrder = queuedOrders[0];
    if (firstQueuedOrder) {
      setSelectedOrder(firstQueuedOrder);
      setCurrentView('assign-driver');
    } else {
      toast.error('No queued orders available');
    }
  };

  const handleAssignDriver = () => {
    if (!selectedDriverId || !selectedOrder) {
      toast.error('Please select a driver');
      return;
    }

    const driver = drivers.find(d => d.id === selectedDriverId);
    if (driver) {
      // Update order status
      setPendingOrders(prev => 
        prev.map(order => 
          order.id === selectedOrder.id 
            ? { ...order, status: 'Assigned' as const }
            : order
        )
      );

      toast.success(`Order ${selectedOrder.id} assigned to ${driver.name}`);
      setCurrentView('dashboard');
      setSelectedOrder(null);
      setSelectedDriverId('');
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-2 border-gray-800 p-4">
        <h1 className="text-xl font-bold text-gray-700">FRONTDASH STAFF</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center border-2 border-gray-300">
            <div className="text-lg text-gray-600">Pending Orders: {pendingOrders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center border-2 border-gray-300">
            <div className="text-lg text-gray-600">Drivers Available: {availableDrivers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center border-2 border-gray-300">
            <div className="text-lg text-gray-600">Queued: {queuedOrders.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Orders Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-gray-800">Pending Orders</h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order Number</TableHead>
                <TableHead>Restaurant Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Order Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingOrders.length > 0 ? (
                pendingOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.restaurantName}</TableCell>
                    <TableCell>${order.price.toFixed(2)}</TableCell>
                    <TableCell>{order.orderTime}</TableCell>
                    <TableCell>
                      <Badge variant={
                        order.status === 'Assigned' ? 'default' :
                        order.status === 'Pending' ? 'secondary' :
                        'outline'
                      }>
                        Status: {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    No pending orders found. Orders will be loaded from the database.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Retrieve Order Button */}
        <div className="pt-4">
          <Button 
            variant="outline" 
            onClick={handleRetrieveFirstOrder}
            disabled={queuedOrders.length === 0}
            className="border-2 border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            Retrieve First Order From Queued
          </Button>
        </div>
      </div>
    </div>
  );

  const renderAssignDriver = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-2 border-gray-800 p-4">
        <h1 className="text-xl font-bold text-gray-700">FRONTDASH STAFF</h1>
      </div>

      {/* Order Details */}
      {selectedOrder && (
        <Card>
          <CardContent className="p-6 border-2 border-gray-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Order #:</span>
                  <span>{selectedOrder.id.replace('#', '')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Current Pickup:</span>
                  <span>{selectedOrder.pickupAddress}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Dropoff:</span>
                  <span>{selectedOrder.dropoffAddress}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">ETA:</span>
                  <span>{selectedOrder.eta}</span>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="border-2 border-gray-300 text-gray-600"
              >
                Assign Available Driver ▼
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Driver Selection */}
      <Card>
        <CardContent className="p-6 border-4 border-gray-800">
          {drivers.length > 0 ? (
            <div className="space-y-4">
              {drivers.map((driver) => (
                <div 
                  key={driver.id}
                  className={`flex items-center justify-between p-3 rounded cursor-pointer border-2 ${
                    selectedDriverId === driver.id 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-transparent hover:bg-gray-50'
                  }`}
                  onClick={() => driver.isAvailable ? setSelectedDriverId(driver.id) : null}
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 bg-gray-300">
                      <AvatarFallback>
                        {driver.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{driver.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Circle className="h-3 w-3 fill-gray-800" />
                    <span>{driver.distance} Miles</span>
                    <Circle className="h-3 w-3 fill-gray-800" />
                    <span className={driver.isAvailable ? 'text-green-600' : 'text-red-600'}>
                      {driver.isAvailable ? 'Available' : 'Not Available'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No drivers available. Driver data will be loaded from the database.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button 
          variant="outline" 
          onClick={() => setCurrentView('dashboard')}
          className="border-2 border-gray-300 text-gray-600"
        >
          Back to Dashboard
        </Button>
        <Button 
          onClick={handleAssignDriver}
          disabled={!selectedDriverId}
          className="bg-orange-600 hover:bg-orange-700 border-2 border-gray-300"
        >
          Assign Selected Driver
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {currentView === 'dashboard' ? renderDashboard() : renderAssignDriver()}
      </div>
    </div>
  );
}