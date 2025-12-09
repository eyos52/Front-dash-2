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
  
  // Debug: Log pendingOrders whenever it changes
  useEffect(() => {
    console.log('pendingOrders state updated:', pendingOrders.length, pendingOrders);
  }, [pendingOrders]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showAssignDriver, setShowAssignDriver] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [searchOrderId, setSearchOrderId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const getDriverName = (driverId?: string, driverNameFromOrder?: string) => {
    if (driverNameFromOrder) return driverNameFromOrder;
    if (!driverId) return '—';
    const driver = drivers.find(d => d.driver_id === driverId);
    return driver?.['Full name'] || (driver as any)?.full_name || (driver as any)?.name || driverId;
  };

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

  // Load data on mount and set up polling for new orders
  useEffect(() => {
    // Load orders even if staffId is missing (use empty string as fallback)
    // This ensures orders can load even if staff lookup fails
    const effectiveStaffId = staffId || '';
    
    // Always load orders - don't wait for staff member lookup
    loadData();
    
    // Try to load staff member (but don't block on it)
    loadStaffMember();
    
    // Poll for new orders every 5 seconds to catch confirmed orders from restaurant portal
    const interval = setInterval(() => {
      loadData();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [staffId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      console.log('Loading data for staff dashboard...');
      console.log('Calling getPendingOrders()...');
      
      let pending;
      try {
        pending = await getPendingOrders();
        console.log('getPendingOrders() completed successfully');
      } catch (pendingError: any) {
        console.error('ERROR in getPendingOrders():', pendingError);
        console.error('Error details:', pendingError.message, pendingError.stack);
        pending = [];
      }
      
      // Always load all orders (functions no longer filter by staff_id)
      // Always load pending orders, active orders, delivered orders, and drivers
      const [active, delivered, driversList] = await Promise.all([
        getStaffActiveOrders(staffId || '').catch((err) => {
          console.error('Error loading active orders:', err);
          return [];
        }),
        getStaffDeliveredOrders(staffId || '').catch((err) => {
          console.error('Error loading delivered orders:', err);
          return [];
        }),
        getDrivers().catch(() => [])
      ]);
      
      console.log('=== PENDING ORDERS RESULT ===');
      console.log('Pending orders received:', pending?.length || 0);
      console.log('Pending orders type:', typeof pending);
      console.log('Pending orders is array?', Array.isArray(pending));
      if (pending && pending.length > 0) {
        console.log('Pending orders data:', pending);
        console.log('First pending order:', pending[0]);
        console.log('First pending order status:', pending[0].status);
      } else {
        console.warn('⚠️ No pending orders returned from getPendingOrders()');
        console.warn('pending value:', pending);
        console.warn('pending === null?', pending === null);
        console.warn('pending === undefined?', pending === undefined);
      }
      console.log('=== END PENDING ORDERS RESULT ===');
      console.log('Active orders received:', active?.length || 0);
      console.log('Delivered orders received:', delivered?.length || 0);
      
      // Ensure orders have the right structure for display
      const formattedPending = (pending || []).map((order: any) => ({
        ...order,
        id: order.id || order.order_id, // Ensure id exists for key prop
        order_number: order.order_number || order.order_id, // Map order_id to order_number for display
      }));
      
      // Format active orders to ensure order_id is preserved
      const formattedActive = (active || []).map((order: any) => ({
        ...order,
        id: order.id || order.order_id,
        order_number: order.order_number || order.order_id,
        order_id: order.order_id || order.order_number, // Ensure order_id exists
      }));
      
      // Format delivered orders to ensure order_id is preserved
      const formattedDelivered = (delivered || []).map((order: any) => ({
        ...order,
        id: order.id || order.order_id,
        order_number: order.order_number || order.order_id,
        order_id: order.order_id || order.order_number, // Ensure order_id exists
      }));
      
      console.log('Formatted pending orders:', formattedPending.length, formattedPending);
      console.log('Setting pendingOrders state with:', formattedPending);
      setPendingOrders(formattedPending as OrderWithDetails[]);
      
      // Force a re-render check
      setTimeout(() => {
        console.log('State after setPendingOrders:', formattedPending.length);
      }, 100);
      setActiveOrders(formattedActive as OrderWithDetails[]);
      setDeliveredOrders(formattedDelivered as OrderWithDetails[]);
      // getDrivers() already filters to only active and available drivers
      setDrivers(driversList);
    } catch (error: any) {
      console.error('Error loading data:', error);
      console.error('Error stack:', error.stack);
      toast.error('Failed to load data: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadStaffMember = async () => {
    if (!staffUser?.username) return;
    try {
      const member = await getStaffByUsername(staffUser.username);
      if (member) {
        setStaffMember(member);
        if (member.first_time_login) {
          setShowChangePassword(true);
          toast.info('Please change your password on first login');
        }
      } else {
        console.warn('⚠️ Staff member not found in database, using demo account data');
        // Continue without setting staffMember - orders can still load
      }
    } catch (error) {
      console.error('Error loading staff member:', error);
      // Don't throw - allow orders to load even if staff lookup fails
    }
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
      // Use order_id if available, otherwise use id
      const orderIdToUse = firstOrder.order_id || firstOrder.id;
      if (!orderIdToUse) {
        toast.error('Order ID not found');
        return;
      }
      // Assign order to staff - this will set staff_id but keep status as Confirmed (Queued)
      await assignOrderToStaff(orderIdToUse, staffId);
      toast.success(`Order ${firstOrder.order_id || firstOrder.order_number} retrieved. You can now assign a driver.`);
      await loadData();
    } catch (error: any) {
      console.error('Error retrieving order:', error);
      toast.error(error.message || 'Failed to retrieve order');
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
      
      // Use order_id if available, otherwise use id
      const orderIdToUse = selectedOrder.order_id || selectedOrder.id;
      if (!orderIdToUse) {
        toast.error('Order ID not found');
        return;
      }
      
      await assignDriverToOrder(orderIdToUse, selectedDriverId, staffId);
      toast.success('Driver assigned successfully. Order moved to Active Orders.');
      setShowAssignDriver(false);
      setSelectedOrder(null);
      setSelectedDriverId('');
      await loadData();
    } catch (error: any) {
      console.error('Error assigning driver:', error);
      toast.error(error.message || 'Failed to assign driver');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelivery = async (order: OrderWithDetails) => {
    const orderIdToUse = order.order_id || order.id;
    if (!orderIdToUse) {
      toast.error('Order ID not found');
      return;
    }

    if (!confirm(`Are you sure you want to confirm delivery for order ${orderIdToUse}?`)) {
      return;
    }

    try {
      setIsLoading(true);
      const deliveredAt = new Date().toISOString();
      await confirmDelivery(orderIdToUse, deliveredAt);
      toast.success('Delivery confirmed successfully. Driver is now available again.');
      await loadData();
    } catch (error: any) {
      console.error('Error confirming delivery:', error);
      toast.error(error.message || 'Failed to confirm delivery');
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

  // Calculate stats based on current data from database
  const stats = {
    ordersInQueue: pendingOrders.length, // Orders with status Pending/Confirmed and no driver
    myActiveOrders: activeOrders.length, // Orders with status Active assigned to this staff
    deliveredToday: deliveredOrders.length, // Already filtered to today's deliveries by getStaffDeliveredOrders
    driversAvailable: drivers.filter(d => d.employment_status === 'active' && d.is_available === true).length
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
          <div className="flex items-center gap-2">
            <CardTitle>Order Queue (Preview)</CardTitle>
            <span className="text-sm text-gray-500">({pendingOrders.length} orders)</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setActiveView('orders')}>
            View All <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Restaurant</TableHead>
                <TableHead>Placed At</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                console.log('Rendering Order Queue table. pendingOrders.length:', pendingOrders.length);
                console.log('pendingOrders data:', pendingOrders);
                if (pendingOrders.length > 0) {
                  return pendingOrders.slice(0, 5).map((order, index) => {
                    console.log(`Rendering order ${index}:`, order);
                    const orderTotal = order.total || order.subtotal || 0;
                    return (
                      <TableRow key={order.id || order.order_id || `order-${index}`}>
                        <TableCell className="font-medium">{order.order_id || order.order_number || 'N/A'}</TableCell>
                        <TableCell>{order.restaurants?.name || 'Unknown'}</TableCell>
                        <TableCell>{order.placed_at ? new Date(order.placed_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        }) : (order.created_at ? new Date(order.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        }) : '—')}</TableCell>
                        <TableCell>${orderTotal.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderDetails(true);
                          }}>
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  });
                } else {
                  return (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        No orders in queue
                      </TableCell>
                    </TableRow>
                  );
                }
              })()}
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
                  <TableHead>Driver</TableHead>
                  <TableHead>Delivered (HH:MM)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_id || order.order_number || 'N/A'}</TableCell>
                    <TableCell>{order.restaurants?.name || 'Unknown'}</TableCell>
                    <TableCell>
                      {order.driver_id 
                        ? (() => {
                            const driver = drivers.find(d => d.driver_id === order.driver_id);
                            return driver ? driver['Full name'] : order.driver_id;
                          })()
                        : 'Not assigned'}
                    </TableCell>
                    <TableCell>
                      {order.status === 'Active' ? (
                        <Button 
                          size="sm" 
                          onClick={() => handleConfirmDelivery(order)}
                          disabled={isLoading}
                          className="!bg-green-600 hover:!bg-green-700 !text-white border-0"
                        >
                          Mark as Delivered
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
                  <TableHead>Driver</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveredOrders.slice(0, 3).map((order) => (
                  <TableRow key={order.id || order.order_id}>
                    <TableCell className="font-medium">{order.order_id || order.order_number || 'N/A'}</TableCell>
                    <TableCell>{order.restaurants?.name || 'Unknown'}</TableCell>
                    <TableCell>
                      {order.delivered_at 
                        ? new Date(order.delivered_at).toLocaleString()
                        : new Date(order.updated_at).toLocaleString()}
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
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle>Order Queue</CardTitle>
            <span className="text-sm text-gray-500">({pendingOrders.length} orders)</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              console.log('🔄 Manual refresh triggered');
              loadData();
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Restaurant</TableHead>
                <TableHead>Placed At</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                console.log('Rendering full Order Queue. pendingOrders.length:', pendingOrders.length);
                if (pendingOrders.length > 0) {
                  return pendingOrders.map((order, index) => {
                    console.log(`Rendering order ${index}:`, order);
                    const orderTotal = order.total || order.subtotal || 0;
                    const displayStatus = order.status === 'Confirmed' || order.status === 'confirmed' ? 'Queued' : order.status;
                    return (
                      <TableRow key={order.id || order.order_id || `order-${index}`}>
                        <TableCell className="font-medium">{order.order_id || order.order_number || 'N/A'}</TableCell>
                        <TableCell>{order.restaurants?.name || 'Unknown'}</TableCell>
                        <TableCell>{order.placed_at ? new Date(order.placed_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        }) : (order.created_at ? new Date(order.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        }) : '—')}</TableCell>
                        <TableCell>${orderTotal.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{displayStatus}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowAssignDriver(true);
                              }}
                            >
                              Assign Driver
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowOrderDetails(true);
                              }}
                            >
                              Details
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  });
                } else {
                  return (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        No orders in queue
                      </TableCell>
                    </TableRow>
                  );
                }
              })()}
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
                <TableHead>Driver</TableHead>
                <TableHead>Delivered (HH:MM)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeOrders.map((order) => (
                <TableRow key={order.id || order.order_id}>
                  <TableCell className="font-medium">{order.order_id || order.order_number || 'N/A'}</TableCell>
                  <TableCell>{order.restaurants?.name || 'Unknown'}</TableCell>
                  <TableCell>
                    {order.driver_id 
                      ? (() => {
                            const name = getDriverName(order.driver_id, (order as any)?.driver_name);
                          return name ? `${name} (On trip)` : order.driver_id;
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
                    {order.status === 'Active' ? (
                      <Button 
                        size="sm" 
                        onClick={() => handleConfirmDelivery(order)}
                        disabled={isLoading}
                        className="!bg-green-600 hover:!bg-green-700 !text-white border-0"
                      >
                        Mark as Delivered
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

      {/* Order History */}
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <span className="text-sm text-gray-500">({deliveredOrders.length} delivered today)</span>
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
                {deliveredOrders.length > 0 ? (
                  deliveredOrders.map((order) => (
                    <TableRow key={order.id || order.order_id}>
                      <TableCell className="font-medium">{order.order_id || order.order_number || 'N/A'}</TableCell>
                      <TableCell>{order.restaurants?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        {order.delivered_at 
                          ? new Date(order.delivered_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })
                          : (order.updated_at ? new Date(order.updated_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            }) : '—')}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleViewOrderDetails(order)}>
                          View details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                      No delivered orders today
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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
                  <p className="font-semibold">{selectedOrder.order_id || selectedOrder.order_number || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Restaurant</Label>
                  <p className="font-semibold">{selectedOrder.restaurants?.name || 'Unknown'}</p>
                </div>
                {(selectedOrder.customer_first_name || selectedOrder.customer_last_name) && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Customer</Label>
                    <p className="font-semibold">
                      {selectedOrder.customer_first_name || ''} {selectedOrder.customer_last_name || ''}
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-500">Placed At</Label>
                  <p>{selectedOrder.placed_at ? new Date(selectedOrder.placed_at).toLocaleString() : (selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString() : 'N/A')}</p>
                </div>
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
                        const driver = drivers.find(d => d.driver_id === selectedOrder.driver_id);
                        return driver ? driver['Full name'] : selectedOrder.driver_id;
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
                      {selectedOrder.order_items.map((item: any, idx: number) => {
                        // Get item name from menu_items join, or fallback to item_name_snapshot, or item_name
                        const itemName = item.menu_items?.name || 
                                       item.item_name_snapshot || 
                                       item.item_name || 
                                       'Unknown Item';
                        // Get price from unit_price_snapshot, menu_items join, or item.price
                        const itemPrice = item.unit_price_snapshot || 
                                        item.menu_items?.price || 
                                        item.price || 
                                        0;
                        return (
                          <TableRow key={item.id || item.order_item_id || idx}>
                            <TableCell>{itemName}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>${itemPrice.toFixed(2)}</TableCell>
                            <TableCell>${(itemPrice * item.quantity).toFixed(2)}</TableCell>
                          </TableRow>
                        );
                      })}
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
            {selectedOrder && !selectedOrder.driver_id && (selectedOrder.status === 'Confirmed' || selectedOrder.status === 'confirmed' || selectedOrder.status === 'Pending' || selectedOrder.status === 'pending') && (
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
                key={driver.driver_id}
                onClick={() => setSelectedDriverId(driver.driver_id)}
                className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                  selectedDriverId === driver.driver_id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {driver['Full name']}
                  </span>
                  <Badge variant={driver.employment_status === 'active' && driver.is_available ? 'default' : 'secondary'}>
                    {driver.is_available ? 'Available' : 'Unavailable'}
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
