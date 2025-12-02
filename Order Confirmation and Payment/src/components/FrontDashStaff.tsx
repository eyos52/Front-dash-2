import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';
import { 
  LayoutDashboard, 
  Package, 
  Settings, 
  LogOut, 
  Download, 
  ArrowRight, 
  Clock, 
  MapPin, 
  User, 
  Truck,
  CheckCircle,
  Eye,
  EyeOff,
  Search,
  X
} from 'lucide-react';
import { 
  getPendingOrders, 
  getStaffActiveOrders, 
  getStaffDeliveredOrders,
  assignOrderToStaff,
  assignDriverToOrder,
  confirmDelivery,
  getDrivers,
  updateStaffPassword,
  getStaffByUsername
} from '../lib/services/database';
import { supabase, Order, Driver, StaffMember } from '../lib/supabase';

interface FrontDashStaffProps {
  onNavigateHome?: () => void;
  staffUser?: {
    username: string;
    name: string;
    id?: string;
    email?: string;
    firstTimeLogin?: boolean;
  };
}

interface OrderWithDetails extends Order {
  restaurants?: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
  };
  order_items?: Array<{
    id: string;
    item_name: string;
    price: number;
    quantity: number;
  }>;
}

export function FrontDashStaff({ onNavigateHome, staffUser }: FrontDashStaffProps) {
  const [activeView, setActiveView] = useState<'dashboard' | 'orders' | 'settings'>('dashboard');
  const [pendingOrders, setPendingOrders] = useState<OrderWithDetails[]>([]);
  const [activeOrders, setActiveOrders] = useState<OrderWithDetails[]>([]);
  const [deliveredOrders, setDeliveredOrders] = useState<OrderWithDetails[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showAssignDriver, setShowAssignDriver] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [searchOrderId, setSearchOrderId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Settings state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [staffMember, setStaffMember] = useState<StaffMember | null>(null);

  const staffId = staffUser?.id || '';

  // Load data on mount
  useEffect(() => {
    if (staffId) {
      loadData();
      loadStaffMember();
    }
  }, [staffId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [pending, active, delivered, driversList] = await Promise.all([
        getPendingOrders(),
        getStaffActiveOrders(staffId),
        getStaffDeliveredOrders(staffId),
        getDrivers()
      ]);
      
      setPendingOrders(pending as OrderWithDetails[]);
      setActiveOrders(active as OrderWithDetails[]);
      setDeliveredOrders(delivered as OrderWithDetails[]);
      setDrivers(driversList.filter(d => d.status === 'active'));
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStaffMember = async () => {
    if (!staffUser?.username) return;
    try {
      const member = await getStaffByUsername(staffUser.username);
      setStaffMember(member);
      if (member.first_time_login) {
        setShowChangePassword(true);
        toast.info('Please change your password on first login');
      }
    } catch (error) {
      console.error('Error loading staff member:', error);
    }
  };

  // Calculate estimated delivery time (simple distance-based calculation)
  const calculateEstimatedDelivery = (restaurantAddress: string, customerAddress: string): string => {
    // Simple calculation: assume 1 minute per mile, average 30 mph
    // This is a placeholder - in production, use a mapping service API
    const baseMinutes = 25; // Base delivery time
    const randomVariation = Math.floor(Math.random() * 20) + 1; // 1-20 minutes variation
    const totalMinutes = baseMinutes + randomVariation;
    
    const deliveryTime = new Date();
    deliveryTime.setMinutes(deliveryTime.getMinutes() + totalMinutes);
    
    return deliveryTime.toISOString();
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffHours > 0) {
      return `${diffHours}h ago`;
    }
    return `${diffMins}m ago`;
  };

  const formatETA = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    return `${diffMins} min`;
  };

  const handleRetrieveFirstOrder = async () => {
    if (pendingOrders.length === 0) {
      toast.error('No orders in queue');
      return;
    }

    const firstOrder = pendingOrders[0];
    
    try {
      setIsLoading(true);
      await assignOrderToStaff(firstOrder.id, staffId);
      toast.success(`Order ${firstOrder.order_number} retrieved successfully`);
      await loadData();
    } catch (error: any) {
      console.error('Error retrieving order:', error);
      toast.error('Failed to retrieve order');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewOrderDetails = (order: OrderWithDetails) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleAssignDriver = async () => {
    if (!selectedOrder || !selectedDriverId) {
      toast.error('Please select a driver');
      return;
    }

    try {
      setIsLoading(true);
      const restaurant = selectedOrder.restaurants;
      const restaurantAddress = restaurant ? `${restaurant.address}, ${restaurant.city}, ${restaurant.state}` : '';
      const customerAddress = `${selectedOrder.delivery_address}, ${selectedOrder.city}, ${selectedOrder.state}`;
      
      const estimatedDelivery = calculateEstimatedDelivery(restaurantAddress, customerAddress);
      
      await assignDriverToOrder(selectedOrder.id, selectedDriverId, estimatedDelivery);
      toast.success('Driver assigned successfully');
      setShowAssignDriver(false);
      setSelectedOrder(null);
      setSelectedDriverId('');
      await loadData();
    } catch (error: any) {
      console.error('Error assigning driver:', error);
      toast.error('Failed to assign driver');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelivery = async (orderId: string) => {
    if (!confirm(`Are you sure you want to confirm delivery for order ${orderId}?`)) {
      return;
    }

    try {
      setIsLoading(true);
      const deliveredAt = new Date().toISOString();
      await confirmDelivery(orderId, deliveredAt);
      toast.success('Delivery confirmed successfully');
      await loadData();
    } catch (error: any) {
      console.error('Error confirming delivery:', error);
      toast.error('Failed to confirm delivery');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchOrder = () => {
    if (!searchOrderId.trim()) {
      toast.error('Please enter an order ID');
      return;
    }

    const order = [...activeOrders, ...deliveredOrders].find(
      o => o.order_number.toLowerCase().includes(searchOrderId.toLowerCase())
    );

    if (order) {
      handleViewOrderDetails(order);
      setSearchOrderId('');
    } else {
      toast.error('Order not found');
    }
  };

  const validatePassword = (password: string): boolean => {
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const isLongEnough = password.length >= 6;
    return hasUpper && hasLower && hasNumber && isLongEnough;
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (!validatePassword(newPassword)) {
      toast.error('Password must be at least 6 characters with uppercase, lowercase, and number');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      // Hash password (in production, use proper hashing like bcrypt)
      const passwordHash = btoa(newPassword); // Simple encoding for demo
      
      await updateStaffPassword(staffId, passwordHash);
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePassword(false);
      await loadStaffMember();
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    if (onNavigateHome) {
      onNavigateHome();
    }
  };

  const stats = {
    ordersInQueue: pendingOrders.length,
    myActiveOrders: activeOrders.length,
    deliveredToday: deliveredOrders.filter(o => {
      const delivered = new Date(o.delivered_at || o.updated_at);
      const today = new Date();
      return delivered.toDateString() === today.toDateString();
    }).length,
    driversAvailable: drivers.length
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Staff Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Logged in: {staffUser?.username || 'staff'}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Orders in Queue</p>
                <p className="text-2xl font-bold">{stats.ordersInQueue}</p>
              </div>
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">My Active Orders</p>
                <p className="text-2xl font-bold">{stats.myActiveOrders}</p>
              </div>
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Delivered Today</p>
                <p className="text-2xl font-bold">{stats.deliveredToday}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Drivers Available</p>
                <p className="text-2xl font-bold">{stats.driversAvailable}</p>
              </div>
              <Truck className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={handleRetrieveFirstOrder} disabled={pendingOrders.length === 0 || isLoading}>
              <Download className="h-4 w-4 mr-2" />
              Retrieve First
            </Button>
            <Button variant="outline" onClick={() => setActiveView('orders')}>
              <ArrowRight className="h-4 w-4 mr-2" />
              View Orders
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Take the first order from the queue and start processing. Assign a driver and confirm delivery from 'My Active Orders.'
          </p>
        </CardContent>
      </Card>

      {/* Order Queue Preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Order Queue (Preview)</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setActiveView('orders')}>
            View All <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Restaurant</TableHead>
                <TableHead>Placed</TableHead>
                <TableHead>ETA</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingOrders.slice(0, 5).map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>{order.restaurants?.name || 'Unknown'}</TableCell>
                  <TableCell>{formatTimeAgo(order.created_at)}</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleViewOrderDetails(order)}>
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {pendingOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">
                    No orders in queue
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* My Active Orders */}
      {activeOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>My Active Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Estimated</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Delivered (HH:MM)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>{order.restaurants?.name || 'Unknown'}</TableCell>
                    <TableCell>
                      {order.estimated_delivery 
                        ? new Date(order.estimated_delivery).toLocaleString()
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {order.driver_id 
                        ? drivers.find(d => d.id === order.driver_id)?.first_name + ' ' + 
                          drivers.find(d => d.id === order.driver_id)?.last_name
                        : 'Not assigned'}
                    </TableCell>
                    <TableCell>
                      {order.status === 'out_for_delivery' ? (
                        <Button 
                          size="sm" 
                          onClick={() => handleConfirmDelivery(order.id)}
                          disabled={isLoading}
                        >
                          Confirm delivery
                        </Button>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recent Delivered */}
      {deliveredOrders.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Delivered</CardTitle>
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Delivered At</TableHead>
                  <TableHead>Estimated</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveredOrders.slice(0, 3).map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>{order.restaurants?.name || 'Unknown'}</TableCell>
                    <TableCell>
                      {order.delivered_at 
                        ? new Date(order.delivered_at).toLocaleString()
                        : new Date(order.updated_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {order.estimated_delivery 
                        ? new Date(order.estimated_delivery).toLocaleString()
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {order.driver_id 
                        ? drivers.find(d => d.id === order.driver_id)?.first_name + ' ' + 
                          drivers.find(d => d.id === order.driver_id)?.last_name
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleViewOrderDetails(order)}>
                        View details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Logged in: {staffUser?.username || 'staff'}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Find Assigned Order */}
      <Card>
        <CardHeader>
          <CardTitle>Find Assigned/Out-for-Delivery Order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Enter an Order ID (e.g., ORD-30241)"
                value={searchOrderId}
                onChange={(e) => setSearchOrderId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchOrder()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearchOrder}>Search</Button>
          </div>
          <p className="text-sm text-gray-600">
            Enter an Order ID to manage an order that already has an assigned driver.
          </p>
        </CardContent>
      </Card>

      {/* Order Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Order Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Restaurant</TableHead>
                <TableHead>Placed</TableHead>
                <TableHead>ETA</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>{order.restaurants?.name || 'Unknown'}</TableCell>
                  <TableCell>{formatTimeAgo(order.created_at)}</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleViewOrderDetails(order)}>
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {pendingOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">
                    No orders in queue
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* My Active Orders */}
      <Card>
        <CardHeader>
          <CardTitle>My Active Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Restaurant</TableHead>
                <TableHead>Estimated</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Delivered (HH:MM)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>{order.restaurants?.name || 'Unknown'}</TableCell>
                  <TableCell>
                    {order.estimated_delivery 
                      ? new Date(order.estimated_delivery).toLocaleString()
                      : '—'}
                  </TableCell>
                  <TableCell>
                    {order.driver_id 
                      ? (() => {
                          const driver = drivers.find(d => d.id === order.driver_id);
                          return driver ? `${driver.first_name} ${driver.last_name} (On trip)` : 'Not assigned';
                        })()
                      : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowAssignDriver(true);
                          }}
                        >
                          Assign Driver
                        </Button>
                      )}
                  </TableCell>
                  <TableCell>
                    {order.status === 'out_for_delivery' ? (
                      <Button 
                        size="sm" 
                        onClick={() => handleConfirmDelivery(order.id)}
                        disabled={isLoading}
                      >
                        Confirm delivery
                      </Button>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {activeOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">
                    No active orders
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delivered Orders */}
      {deliveredOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Delivered Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Delivered At</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>{order.restaurants?.name || 'Unknown'}</TableCell>
                    <TableCell>
                      {order.delivered_at 
                        ? new Date(order.delivered_at).toLocaleString()
                        : new Date(order.updated_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleViewOrderDetails(order)}>
                        View details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Logged in: {staffUser?.username || 'staff'}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* My Profile */}
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Username</Label>
            <Input value={staffUser?.username || ''} disabled />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={staffUser?.email || staffUser?.username + '@frontdash.app'} disabled />
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">Current password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="newPassword">New password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button onClick={handleChangePassword} disabled={isLoading}>
            Update password
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-600 text-white rounded flex items-center justify-center font-bold">
              FD
            </div>
            <span className="font-bold text-lg">FrontDash</span>
          </div>
        </div>
        <nav className="p-4 space-y-2">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeView === 'dashboard' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveView('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeView === 'orders' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Package className="h-5 w-5" />
            Orders
          </button>
          <button
            onClick={() => setActiveView('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeView === 'settings' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Settings className="h-5 w-5" />
            Settings
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {activeView === 'dashboard' && renderDashboard()}
        {activeView === 'orders' && renderOrders()}
        {activeView === 'settings' && renderSettings()}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Order ID</Label>
                  <p className="font-semibold">{selectedOrder.order_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Restaurant</Label>
                  <p className="font-semibold">{selectedOrder.restaurants?.name || 'Unknown'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Placed At</Label>
                  <p>{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
                {selectedOrder.estimated_delivery && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Estimated Delivery</Label>
                    <p>{new Date(selectedOrder.estimated_delivery).toLocaleString()}</p>
                  </div>
                )}
                {selectedOrder.delivered_at && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Delivered At</Label>
                    <p>{new Date(selectedOrder.delivered_at).toLocaleString()}</p>
                  </div>
                )}
                {selectedOrder.driver_id && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Driver</Label>
                    <p>
                      {(() => {
                        const driver = drivers.find(d => d.id === selectedOrder.driver_id);
                        return driver ? `${driver.first_name} ${driver.last_name}` : 'Unknown';
                      })()}
                    </p>
                  </div>
                )}
              </div>
              
              {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-500 mb-2 block">Order Items</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.order_items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.item_name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>${item.price.toFixed(2)}</TableCell>
                          <TableCell>${(item.price * item.quantity).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>${selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOrderDetails(false)}>
              Close
            </Button>
            {selectedOrder && !selectedOrder.driver_id && selectedOrder.status !== 'pending' && (
              <Button onClick={() => {
                setShowOrderDetails(false);
                setShowAssignDriver(true);
              }}>
                Assign Driver
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Driver Dialog */}
      <Dialog open={showAssignDriver} onOpenChange={setShowAssignDriver}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Driver</DialogTitle>
            <DialogDescription>
              Select a driver to assign to order {selectedOrder?.order_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {drivers.map((driver) => (
              <button
                key={driver.id}
                onClick={() => setSelectedDriverId(driver.id)}
                className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                  selectedDriverId === driver.id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {driver.first_name} {driver.last_name}
                  </span>
                  <Badge variant={driver.status === 'active' ? 'default' : 'secondary'}>
                    {driver.status}
                  </Badge>
                </div>
              </button>
            ))}
            {drivers.length === 0 && (
              <p className="text-center text-gray-500 py-4">No drivers available</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAssignDriver(false);
              setSelectedDriverId('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleAssignDriver} disabled={!selectedDriverId || isLoading}>
              Assign Driver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog (First Time Login) */}
      <Dialog open={showChangePassword} onOpenChange={(open) => {
        if (!open && staffMember?.first_time_login) {
          toast.warning('You must change your password on first login');
          return;
        }
        setShowChangePassword(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              You must change your password on first login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPasswordDialog">New password</Label>
              <div className="relative">
                <Input
                  id="newPasswordDialog"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirmPasswordDialog">Confirm new password</Label>
              <div className="relative">
                <Input
                  id="confirmPasswordDialog"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleChangePassword} disabled={isLoading || !newPassword || !confirmPassword}>
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
