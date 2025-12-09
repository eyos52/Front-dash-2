import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { validateEmail, validatePhone, formatPhone } from './utils/validation';
import { useMenuItems } from '../lib/utils/hooks';
import { getRestaurants, getOrdersByRestaurant, confirmOrder, createWithdrawalRequest, updateRestaurantOperatingHours } from '../lib/services/database';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner@2.0.3';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Order as SupabaseOrder } from '../lib/supabase';
import { parseOperatingHours, WeeklyHours } from '../lib/utils/operatingHours';
import { 
  Store, 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  Search,
  ClipboardList,
  Settings,
  Phone,
  Key,
  LogOut,
  UserX
} from 'lucide-react';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  description: string;
  availability: 'available' | 'unavailable';
}

interface Order {
  id: string;
  status: 'Arrived' | 'In transit' | 'Preparing' | 'Ready' | 'Pending' | 'Confirmed';
  date: string; // Kept for backward compatibility
  time: string; // Kept for backward compatibility
  placedAt?: string; // Combined date and time from placed_at column
  customer: string;
  deliverer: string;
  total: string;
  orderItems?: Array<{
    item_name: string;
    quantity: number;
    price: number;
  }>;
  originalOrderId?: string; // Store the order_id from database for confirmation
}

interface RestaurantData {
  name: string;
  address: string;
  phone: string;
  email: string;
  openingTime: string;
  closingTime: string;
  isRegistered: boolean;
  registrationStatus: 'pending' | 'approved' | 'rejected';
}

interface RestaurantInterfaceProps {
  onNavigateHome?: () => void;
  restaurantId?: string; // Restaurant ID from login
}

export function RestaurantInterface({ onNavigateHome, restaurantId }: RestaurantInterfaceProps = {}) {
  const [activeSection, setActiveSection] = useState('orders');
  const [activeOrderTab, setActiveOrderTab] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [hoursStatus, setHoursStatus] = useState<{ type: 'success' | 'error' | null; message?: string }>({ type: null });
  const [hoursSaving, setHoursSaving] = useState(false);
  
  // Get initial hours based on restaurantId (will be overridden by database data if available)
  const getInitialHours = (): WeeklyHours => {
    if (restaurantId === '003') {
      // Best Burgers: Mon-Fri: 9am-12am, Sat-Sun: Closed
      return {
        monday: { isOpen: true, openTime: '09:00', closeTime: '00:00' },
        tuesday: { isOpen: true, openTime: '09:00', closeTime: '00:00' },
        wednesday: { isOpen: true, openTime: '09:00', closeTime: '00:00' },
        thursday: { isOpen: true, openTime: '09:00', closeTime: '00:00' },
        friday: { isOpen: true, openTime: '09:00', closeTime: '00:00' },
        saturday: { isOpen: false, openTime: '09:00', closeTime: '00:00' },
        sunday: { isOpen: false, openTime: '09:00', closeTime: '00:00' }
      };
    } else if (restaurantId === '001') {
      // All Chicken Meals: Mon-Fri: 9am-9pm, Sat-Sun: 8am-10pm
      return {
        monday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
        tuesday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
        wednesday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
        thursday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
        friday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
        saturday: { isOpen: true, openTime: '08:00', closeTime: '22:00' },
        sunday: { isOpen: true, openTime: '08:00', closeTime: '22:00' }
      };
    } else if (restaurantId === '002') {
      // Pizza Only: Mon-Thu: 12pm-12am, Fri: Closed, Sat-Sun: 10am-12am
      return {
        monday: { isOpen: true, openTime: '12:00', closeTime: '00:00' },
        tuesday: { isOpen: true, openTime: '12:00', closeTime: '00:00' },
        wednesday: { isOpen: true, openTime: '12:00', closeTime: '00:00' },
        thursday: { isOpen: true, openTime: '12:00', closeTime: '00:00' },
        friday: { isOpen: false, openTime: '12:00', closeTime: '00:00' },
        saturday: { isOpen: true, openTime: '10:00', closeTime: '00:00' },
        sunday: { isOpen: true, openTime: '10:00', closeTime: '00:00' }
      };
    }
    // Default hours for other restaurants
    return {
      monday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
      tuesday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
      wednesday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
      thursday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
      friday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
      saturday: { isOpen: true, openTime: '08:00', closeTime: '22:00' },
      sunday: { isOpen: true, openTime: '08:00', closeTime: '22:00' }
    };
  };

  // Weekly operating hours state
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHours>(getInitialHours());
  
  const [restaurant, setRestaurant] = useState<RestaurantData>({
    name: '',
    address: '',
    phone: '',
    email: '',
    openingTime: '',
    closingTime: '',
    isRegistered: false,
    registrationStatus: 'pending'
  });

  // Fetch menu items from database
  const { menuItems: supabaseMenuItems, loading: menuLoading, error: menuError } = useMenuItems(restaurantId || null);
  
  // Fetch restaurant data from database
  useEffect(() => {
    async function fetchRestaurantData() {
      if (!restaurantId) return;
      
      try {
        const restaurants = await getRestaurants();
        const restaurantData = restaurants.find(r => r.restaurant_id === restaurantId || r.id === restaurantId);
        
        if (restaurantData) {
          // Helper function to convert 24-hour time to 12-hour format
          const formatTime = (time24: string): string => {
            if (!time24) return '';
            const [hours, minutes] = time24.split(':');
            const hour = parseInt(hours, 10);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 || 12;
            return `${hour12}:${minutes} ${ampm}`;
          };
          
          setRestaurant({
            name: restaurantData.name || '',
            address: restaurantData.address || '',
            phone: restaurantData.phone || '',
            email: restaurantData.email || '',
            openingTime: formatTime(restaurantData.opening_time || '09:00'),
            closingTime: formatTime(restaurantData.closing_time || '21:00'),
            isRegistered: true,
            registrationStatus: 'approved'
          });

          // Parse and set operating hours
          if (restaurantData.operating_hours) {
            const parsedHours = parseOperatingHours(restaurantData.operating_hours, restaurantData.restaurant_id, restaurantData.name);
            setWeeklyHours(parsedHours);
          } else {
            // Set default hours based on restaurant
            const defaultHours = parseOperatingHours(undefined, restaurantData.restaurant_id, restaurantData.name);
            setWeeklyHours(defaultHours);
          }
        }
      } catch (error) {
        console.error('Error fetching restaurant data:', error);
      }
    }
    
    fetchRestaurantData();
  }, [restaurantId]);

  // Map Supabase menu items to component format
  const mappedMenuItems: MenuItem[] = useMemo(() => {
    return supabaseMenuItems.map((item, index) => ({
      id: index + 1, // Use index for component compatibility
      name: item.name || 'Menu Item',
      price: item.price || 0,
      description: item.description || '',
      availability: item.is_available !== false ? 'available' : 'unavailable'
    }));
  }, [supabaseMenuItems]);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
  // Update menu items when Supabase data loads
  useEffect(() => {
    setMenuItems(mappedMenuItems);
  }, [mappedMenuItems]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Helper function to map database orders to component format
  const mapOrderToComponent = (order: any, driverNameMap: Record<string, string> = {}): Order => {
    const orderId = order.order_id || order.order_number || order.id?.substring(0, 8) || 'Unknown';
    let placedAtStr = 'N/A';
    // Use placed_at from orders table, fallback to created_at if placed_at is not available
    const placedAtDate = order.placed_at || order.created_at;
    if (placedAtDate) {
      const orderDate = new Date(placedAtDate);
      placedAtStr = orderDate.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });
    }
    let displayStatus: 'Arrived' | 'In transit' | 'Preparing' | 'Ready' | 'Pending' | 'Confirmed' = 'Pending';
    if (order.status === 'Completed') {
      displayStatus = 'Arrived';
    } else if (order.status === 'Pending') {
      displayStatus = 'Pending';
    } else if (order.status === 'confirmed' || order.status === 'Confirmed') {
      displayStatus = 'Confirmed'; // Confirmed orders show as "Confirmed"
    } else if (order.status === 'out_for_delivery') {
      displayStatus = 'In transit';
    } else if (order.status === 'ready') {
      displayStatus = 'Ready';
    } else if (order.status === 'preparing') {
      displayStatus = 'Preparing';
    }
    // Use customer_first_name and customer_last_name from orders table
    const customerName = order.customer_first_name || order.customer_last_name
      ? `${order.customer_first_name || ''} ${order.customer_last_name || ''}`.trim()
      : (order.email ? order.email.split('@')[0] : 'Unknown');
    
    // Extract order_items - handle both array format and nested format
    let orderItems: any[] = [];
    if (order.order_items) {
      if (Array.isArray(order.order_items)) {
        orderItems = order.order_items;
      } else {
        orderItems = [order.order_items];
      }
    }
    
    console.log(`Order ${orderId} has ${orderItems.length} items:`, orderItems);
    
    // Use subtotal from orders table if available, otherwise calculate from order items
    let orderTotal = order.subtotal || order.total;
    if (!orderTotal && orderItems.length > 0) {
      const calculatedTotal = orderItems.reduce((sum: number, item: any) => {
        // Use unit_price_snapshot if available, otherwise use price from menu_items join, or fallback to item.price
        const price = item.unit_price_snapshot || 
                     item.menu_items?.price || 
                     item.price || 
                     0;
        const qty = item.quantity || 0;
        return sum + (price * qty);
      }, 0);
      orderTotal = calculatedTotal;
    }
    
    return {
      id: orderId,
      status: displayStatus,
      date: placedAtStr, // Store placed_at as date for compatibility
      time: placedAtStr, // Store placed_at as time for compatibility
      placedAt: placedAtStr, // New field for combined date/time
      customer: customerName,
    deliverer: driverNameMap[order.driver_id] || order.driver_id || 'N/A',
      total: orderTotal ? `$${orderTotal.toFixed(2)}` : 'N/A',
      orderItems: orderItems,
      originalOrderId: order.order_id || orderId
    };
  };

  // Fetch all orders from database (both pending and completed)
  useEffect(() => {
    async function fetchOrders() {
      if (!restaurantId) return;
      
      try {
        setOrdersLoading(true);
        setOrdersError(null);
        
        // Fetch all orders (no status filter)
        const allOrders = await getOrdersByRestaurant(restaurantId);

        // Fetch driver names for the driver_ids present in these orders
        const driverIds = Array.from(
          new Set(
            (allOrders || [])
              .map((o: any) => o.driver_id)
              .filter(Boolean)
          )
        );

        let driverNameMap: Record<string, string> = {};
        if (driverIds.length > 0) {
          try {
            const { data: driverData, error: driverError } = await supabase
              .from('drivers')
              .select('driver_id, full_name, name')
              .in('driver_id', driverIds);

            if (!driverError && driverData) {
              console.log('🔍 Drivers fetched for restaurant view:', driverData);
              driverNameMap = driverData.reduce((acc: Record<string, string>, d: any) => {
                acc[d.driver_id] = d.full_name || d.name || d['Full name'] || d.driver_id;
                return acc;
              }, {});
            } else if (driverError) {
              console.error('Error fetching driver names:', driverError);
            }
          } catch (err) {
            console.error('Exception fetching driver names:', err);
          }
        }
        
        // Map Supabase orders to component format
        const mappedOrders: Order[] = allOrders.map((o: any) => mapOrderToComponent(o, driverNameMap));
        
        setOrders(mappedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setOrdersError(error instanceof Error ? error.message : 'Failed to fetch orders');
      } finally {
        setOrdersLoading(false);
      }
    }
    
    fetchOrders();
  }, [restaurantId]);

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '',
    price: 0,
    description: '',
    availability: 'available'
  });

  // Menu item validation
  const validateMenuItem = (item: Partial<MenuItem>): boolean => {
    return !!(item.name && item.name.trim() && 
              item.price && item.price > 0 && 
              item.description && item.description.trim());
  };

  const addMenuItem = () => {
    if (editingItem && editingItem.id === 0 && validateMenuItem(editingItem)) {
      const id = Math.max(...menuItems.map(item => item.id), 0) + 1;
      setMenuItems([...menuItems, { ...editingItem, id } as MenuItem]);
      setEditingItem(null);
      alert('Menu item added successfully!');
    } else {
      alert('Please fill in all required fields (Name, Price, Description)');
    }
  };

  const updateMenuItem = () => {
    if (editingItem && editingItem.id !== 0 && validateMenuItem(editingItem)) {
      setMenuItems(menuItems.map(item => 
        item.id === editingItem.id ? editingItem : item
      ));
      setEditingItem(null);
      alert('Menu item updated successfully!');
    } else {
      alert('Please fill in all required fields (Name, Price, Description)');
    }
  };

  const deleteMenuItem = (id: number) => {
    const item = menuItems.find(item => item.id === id);
    if (confirm(`Are you sure you want to delete "${item?.name}"? This action cannot be undone.`)) {
      setMenuItems(menuItems.filter(item => item.id !== id));
    }
  };

  const toggleAvailability = (id: number) => {
    setMenuItems(menuItems.map(item => 
      item.id === id 
        ? { ...item, availability: item.availability === 'available' ? 'unavailable' : 'available' }
        : item
    ));
  };

  const withdrawFromFrontDash = async () => {
    try {
      // Get restaurant information for the withdrawal request
      const restaurantName = restaurant.name || 'Unknown Restaurant';
      const contactInfo = `${restaurant.email || ''}${restaurant.phone ? ` / ${restaurant.phone}` : ''}`.trim();
      
      if (!restaurantId) {
        toast.error('Restaurant ID not found. Cannot submit withdrawal request.');
        setShowWithdrawDialog(false);
        return;
      }

      // Note: restaurant_id in withdrawal_requests expects UUID, but restaurantId might be text ID
      // For now, we'll use restaurantId as-is. If it's a text ID, we may need to look up the UUID
      // This will work if restaurantId is already a UUID, otherwise the database will reject it
      await createWithdrawalRequest({
        restaurant_id: restaurantId, // This should be the UUID from restaurants.id
        restaurant_name: restaurantName,
        contact_info: contactInfo || restaurant.email || restaurant.phone || 'No contact info'
      });

      setShowWithdrawDialog(false);
      toast.success('Withdrawal request submitted. An administrator will review your request.');
    } catch (error: any) {
      console.error('Error submitting withdrawal request:', error);
      toast.error(error.message || 'Failed to submit withdrawal request. Please try again.');
    }
  };

  const validateContactInfo = () => {
    const errors: { [key: string]: string } = {};
    
    if (!restaurant.name.trim()) {
      errors.name = 'Restaurant name is required';
    }
    if (!restaurant.address.trim()) {
      errors.address = 'Address is required';
    }
    
    const emailValidation = validateEmail(restaurant.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error || 'Please enter a valid email address';
    }
    
    const phoneValidation = validatePhone(restaurant.phone);
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.error || 'Please enter a valid phone number';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateInfo = () => {
    if (validateContactInfo()) {
      alert('Contact information updated successfully!');
      setValidationErrors({});
    } else {
      alert('Please fix the errors in the form');
    }
  };

  // Weekly hours management
  const updateDayHours = (day: keyof WeeklyHours, field: keyof DayHours, value: boolean | string) => {
    setWeeklyHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleUpdateWeeklyHours = async () => {
    // Validate that open times are before close times
    const daysWithErrors: string[] = [];
    setHoursStatus({ type: null });
    
    Object.entries(weeklyHours).forEach(([day, hours]) => {
      if (hours.isOpen) {
        const openTime = hours.openTime.split(':').map(Number);
        const closeTime = hours.closeTime.split(':').map(Number);
        
        const openMinutes = openTime[0] * 60 + openTime[1];
        const closeMinutes = closeTime[0] * 60 + closeTime[1];
        
        if (openMinutes >= closeMinutes) {
          daysWithErrors.push(day);
        }
      }
    });

    if (daysWithErrors.length > 0) {
      setHoursStatus({ type: 'error', message: `Invalid hours for: ${daysWithErrors.join(', ')}. Opening time must be before closing time.` });
      return;
    }
    if (!restaurantId) {
      setHoursStatus({ type: 'error', message: 'Missing restaurant id. Please log in again.' });
      return;
    }

    try {
      setHoursSaving(true);
      await updateRestaurantOperatingHours(restaurantId, weeklyHours);
      setHoursStatus({ type: 'success', message: 'Operating hours updated successfully.' });
    } catch (err) {
      console.error('Failed to update operating hours', err);
      const message = err instanceof Error ? err.message : 'Failed to update hours.';
      setHoursStatus({ type: 'error', message });
    } finally {
      setHoursSaving(false);
    }
  };

  const copyHoursToAll = (day: keyof WeeklyHours) => {
    const hoursTemplate = weeklyHours[day];
    const updatedHours = Object.keys(weeklyHours).reduce((acc, dayKey) => {
      acc[dayKey as keyof WeeklyHours] = { ...hoursTemplate };
      return acc;
    }, {} as WeeklyHours);
    
    setWeeklyHours(updatedHours);
  };

  const filteredOrders = () => {
    const filtered = orders.filter(order =>
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.includes(searchTerm) ||
      order.deliverer.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return activeOrderTab === 'active' 
      ? filtered.filter(order => order.status === 'Pending') // Only pending orders in Active tab
      : filtered.filter(order => order.status !== 'Pending'); // Everything else in History
  };

  const handleConfirmOrder = async (orderId: string) => {
    try {
      await confirmOrder(orderId);
      alert('Order confirmed successfully!');
      // Refresh orders
      const allOrders = await getOrdersByRestaurant(restaurantId || '');
      const mappedOrders: Order[] = allOrders.map(mapOrderToComponent);
      setOrders(mappedOrders);
      // Order stays in Active tab until status is "Completed"
    } catch (error) {
      console.error('Error confirming order:', error);
      alert('Failed to confirm order. Please try again.');
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'orders':
        return (
          <div className="flex-1 p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Order Management</h1>
              <div className="flex gap-4 items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>

            <Tabs value={activeOrderTab} onValueChange={setActiveOrderTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="active">Active Orders</TabsTrigger>
                <TabsTrigger value="history">Order History</TabsTrigger>
              </TabsList>

              <TabsContent value="active">
                <Card>
                  <CardContent className="pt-6">
                    {ordersLoading ? (
                      <div className="text-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
                        <p className="text-gray-600">Loading active orders...</p>
                      </div>
                    ) : ordersError ? (
                      <div className="text-center py-12">
                        <p className="text-red-500 text-lg mb-2">Error loading orders</p>
                        <p className="text-gray-500 text-sm">{ordersError}</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Order ID</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Placed At</TableHead>
                              <TableHead>Customer Name</TableHead>
                              <TableHead>Order Items</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredOrders().length > 0 ? (
                              filteredOrders().map((order, index) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">{order.id}</TableCell>
                                  <TableCell>
                                    <Badge variant={
                                      order.status === 'Confirmed' ? 'default' :
                                      order.status === 'Preparing' ? 'secondary' :
                                      order.status === 'In transit' ? 'secondary' :
                                      order.status === 'Ready' ? 'secondary' :
                                      'outline'
                                    }>
                                      {order.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{order.placedAt || order.date}</TableCell>
                                  <TableCell>{order.customer}</TableCell>
                                  <TableCell>
                                    <div className="max-w-xs">
                                      {order.orderItems && order.orderItems.length > 0 ? (
                                        <div className="space-y-1">
                                          {order.orderItems.map((item: any, idx: number) => {
                                            // Get item name from menu_items join, or fallback to item_name_snapshot, or item_name
                                            const itemName = item.menu_items?.name || 
                                                           item.item_name_snapshot || 
                                                           item.item_name || 
                                                           'Unknown Item';
                                            return (
                                              <div key={idx} className="text-sm">
                                                {itemName} × {item.quantity}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <span className="text-gray-400 text-sm">No items</span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-semibold">{order.total}</TableCell>
                                  <TableCell>
                                    {order.status === 'Pending' && (
                                      <Button
                                        size="sm"
                                        onClick={() => handleConfirmOrder(order.originalOrderId || order.id)}
                                        className="bg-green-600 hover:bg-green-700 text-white border border-green-700 font-semibold shadow-sm"
                                        style={{ backgroundColor: '#16a34a', color: 'white' }}
                                      >
                                        <CheckCircle2 className="h-4 w-4 mr-1" />
                                        Confirm
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                                  No active orders found.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history">
                <Card>
                  <CardContent className="pt-6">
                    {ordersLoading ? (
                      <div className="text-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
                        <p className="text-gray-600">Loading order history...</p>
                      </div>
                    ) : ordersError ? (
                      <div className="text-center py-12">
                        <p className="text-red-500 text-lg mb-2">Error loading orders</p>
                        <p className="text-gray-500 text-sm">{ordersError}</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Order ID</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Placed At</TableHead>
                              <TableHead>Customer</TableHead>
                              <TableHead>Deliverer</TableHead>
                              <TableHead>Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredOrders().length > 0 ? (
                              filteredOrders().map((order, index) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">{order.id}</TableCell>
                                  <TableCell>
                                    <Badge variant="default">
                                      {order.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{order.placedAt || order.date}</TableCell>
                                  <TableCell>{order.customer}</TableCell>
                                  <TableCell>{order.deliverer}</TableCell>
                                  <TableCell>{order.total}</TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                                  No completed orders found.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        );

      case 'menu':
        return (
          <div className="flex-1 p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Menu Management</h1>
              <Button 
                onClick={() => setEditingItem({ id: 0, name: '', price: 0, description: '', availability: 'available' })}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            {menuLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
                <p className="text-gray-600">Loading menu items...</p>
              </div>
            ) : menuError ? (
              <div className="text-center py-12">
                <p className="text-red-500 text-lg mb-2">Error loading menu items</p>
                <p className="text-gray-500 text-sm">{menuError}</p>
              </div>
            ) : menuItems.length > 0 ? (
              <div className="grid gap-4">
                {menuItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-bold">{item.name}</h3>
                          <p className="text-gray-600 mb-2">{item.description || 'No description'}</p>
                          <p className="font-semibold">${item.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={item.availability === 'available' ? 'default' : 'secondary'}>
                            {item.availability}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleAvailability(item.id)}
                          >
                            Toggle
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingItem(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteMenuItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No menu items found. Add items using the "Add Item" button above.</p>
              </div>
            )}

            {/* Add/Edit Item Dialog */}
            <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingItem?.id === 0 ? 'Add New Item' : 'Edit Item'}</DialogTitle>
                  <DialogDescription>
                    {editingItem?.id === 0 ? 'Add a new item to your menu' : 'Update the item details'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="itemName">
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="itemName"
                      placeholder="Enter item name"
                      value={editingItem?.name || ''}
                      onChange={(e) => setEditingItem(prev => prev ? {...prev, name: e.target.value} : null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="itemPrice">
                      Price <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <Input
                        id="itemPrice"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        className="pl-8"
                        value={editingItem?.price || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setEditingItem(prev => prev ? {...prev, price: value === '' ? 0 : parseFloat(value)} : null);
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="itemDescription">
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="itemDescription"
                      placeholder="Describe your menu item"
                      value={editingItem?.description || ''}
                      onChange={(e) => setEditingItem(prev => prev ? {...prev, description: e.target.value} : null)}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="itemAvailability">Availability</Label>
                    <Select
                      value={editingItem?.availability || 'available'}
                      onValueChange={(value: 'available' | 'unavailable') => setEditingItem(prev => prev ? {...prev, availability: value} : null)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="unavailable">Unavailable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    <span className="text-red-500">*</span> Required fields
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingItem(null)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={editingItem?.id === 0 ? addMenuItem : updateMenuItem}
                    className="bg-orange-600 hover:bg-orange-700"
                    disabled={!editingItem?.name?.trim() || !editingItem?.description?.trim() || !editingItem?.price || editingItem?.price <= 0}
                  >
                    {editingItem?.id === 0 ? 'Add Item' : 'Update Item'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        );

      case 'hours':
        return (
          <div className="flex-1 p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-4">Operating Hours</h1>
              <Card>
                <CardContent className="pt-6 space-y-6">
                  {Object.entries(weeklyHours).map(([day, hours]) => (
                    <div key={day} className="border-b border-gray-100 pb-4 last:border-b-0">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium capitalize text-lg">{day}</h3>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyHoursToAll(day as keyof WeeklyHours)}
                            className="text-xs"
                          >
                            Copy to All Days
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`${day}-open`}
                            checked={hours.isOpen}
                            onChange={(e) => updateDayHours(day as keyof WeeklyHours, 'isOpen', e.target.checked)}
                            className="h-4 w-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                          />
                          <Label htmlFor={`${day}-open`} className="text-sm">
                            Open
                          </Label>
                        </div>
                        
                        {hours.isOpen ? (
                          <>
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`${day}-open-time`} className="text-sm whitespace-nowrap">
                                Open:
                              </Label>
                              <Input
                                id={`${day}-open-time`}
                                type="time"
                                value={hours.openTime}
                                onChange={(e) => updateDayHours(day as keyof WeeklyHours, 'openTime', e.target.value)}
                                className="w-32"
                              />
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`${day}-close-time`} className="text-sm whitespace-nowrap">
                                Close:
                              </Label>
                              <Input
                                id={`${day}-close-time`}
                                type="time"
                                value={hours.closeTime}
                                onChange={(e) => updateDayHours(day as keyof WeeklyHours, 'closeTime', e.target.value)}
                                className="w-32"
                              />
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-500 text-sm">Closed</span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-4 flex items-center gap-3">
                    <Button 
                      onClick={handleUpdateWeeklyHours}
                      className="bg-orange-600 hover:bg-orange-700"
                      disabled={hoursSaving}
                    >
                      {hoursSaving ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Updating...
                        </span>
                      ) : (
                        'Update Hours'
                      )}
                    </Button>
                    {hoursStatus.type === 'success' && (
                      <span className="text-green-600 text-sm flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> {hoursStatus.message}
                      </span>
                    )}
                    {hoursStatus.type === 'error' && (
                      <span className="text-red-600 text-sm">{hoursStatus.message}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="flex-1 p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-4">Contact Information</h1>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label htmlFor="restaurantName">Restaurant Name</Label>
                    <Input
                      id="restaurantName"
                      value={restaurant.name}
                      onChange={(e) => setRestaurant({...restaurant, name: e.target.value})}
                      className={validationErrors.name ? 'border-red-300 focus:border-red-500' : ''}
                    />
                    {validationErrors.name && (
                      <p className="text-sm text-red-600 mt-1">{validationErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={restaurant.address}
                      onChange={(e) => setRestaurant({...restaurant, address: e.target.value})}
                      className={validationErrors.address ? 'border-red-300 focus:border-red-500' : ''}
                    />
                    {validationErrors.address && (
                      <p className="text-sm text-red-600 mt-1">{validationErrors.address}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="10 digit phone number"
                      value={restaurant.phone}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, '');
                        setRestaurant({...restaurant, phone: cleaned});
                      }}
                      maxLength={10}
                      className={validationErrors.phone ? 'border-red-300 focus:border-red-500' : ''}
                    />
                    {validationErrors.phone && (
                      <p className="text-sm text-red-600 mt-1">{validationErrors.phone}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="restaurant@example.com"
                      value={restaurant.email}
                      onChange={(e) => setRestaurant({...restaurant, email: e.target.value})}
                      className={validationErrors.email ? 'border-red-300 focus:border-red-500' : ''}
                    />
                    {validationErrors.email && (
                      <p className="text-sm text-red-600 mt-1">{validationErrors.email}</p>
                    )}
                  </div>
                  <Button onClick={handleUpdateInfo}>Update Information</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'password':
        return (
          <div className="flex-1 p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-4">Change Password</h1>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                  <Button>Update Password</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'withdraw':
        return (
          <div className="flex-1 p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-4 text-red-600">Withdraw from FrontDash</h1>
              <Alert className="mb-6">
                <AlertDescription>
                  <strong>Warning:</strong> Withdrawing from FrontDash will remove your restaurant from the platform. 
                  This action requires administrator approval and may take time to process.
                </AlertDescription>
              </Alert>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-gray-600 mb-4">
                    If you wish to withdraw your restaurant from the FrontDash platform, please click the button below. 
                    An administrator will review your request and contact you regarding the withdrawal process.
                  </p>
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowWithdrawDialog(true)}
                    className="gap-2"
                  >
                    <UserX className="h-4 w-4" />
                    Request Withdrawal
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={onNavigateHome}
              className="text-2xl font-bold text-orange-600 hover:text-orange-700 transition-colors"
            >
              FrontDash
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Store className="h-4 w-4" />
              <span>Restaurant Portal</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <nav className="w-64 bg-white border-r h-screen fixed left-0 top-16 overflow-y-auto">
          <div className="p-4">
            <div className="space-y-1">
              <button
                onClick={() => setActiveSection('orders')}
                className={`w-full text-left px-6 py-4 border-b border-gray-300 hover:bg-gray-300 transition-colors ${
                  activeSection === 'orders' ? 'bg-gray-300' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <ClipboardList className="h-4 w-4" />
                  Order Management
                </div>
              </button>
              <button
                onClick={() => setActiveSection('menu')}
                className={`w-full text-left px-6 py-4 border-b border-gray-300 hover:bg-gray-300 transition-colors ${
                  activeSection === 'menu' ? 'bg-gray-300' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Store className="h-4 w-4" />
                  Menu Management
                </div>
              </button>
              <button
                onClick={() => setActiveSection('hours')}
                className={`w-full text-left px-6 py-4 border-b border-gray-300 hover:bg-gray-300 transition-colors ${
                  activeSection === 'hours' ? 'bg-gray-300' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4" />
                  Operating Hours
                </div>
              </button>
              <button
                onClick={() => setActiveSection('contact')}
                className={`w-full text-left px-6 py-4 border-b border-gray-300 hover:bg-gray-300 transition-colors ${
                  activeSection === 'contact' ? 'bg-gray-300' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4" />
                  Contact Information
                </div>
              </button>
              <button
                onClick={() => setActiveSection('password')}
                className={`w-full text-left px-6 py-4 border-b border-gray-300 hover:bg-gray-300 transition-colors ${
                  activeSection === 'password' ? 'bg-gray-300' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Key className="h-4 w-4" />
                  Change Password
                </div>
              </button>
              <button
                onClick={() => setActiveSection('withdraw')}
                className={`w-full text-left px-6 py-4 border-b border-gray-300 hover:bg-red-100 text-red-600 transition-colors ${
                  activeSection === 'withdraw' ? 'bg-red-100' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <UserX className="h-4 w-4" />
                  Withdraw from FrontDash
                </div>
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex-1 ml-64">
          {renderContent()}
        </div>
      </div>

      {/* Withdrawal Confirmation Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Withdrawal Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit a withdrawal request? This action will notify administrators 
              that you wish to remove your restaurant from the FrontDash platform.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdrawDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={withdrawFromFrontDash}>
              Submit Withdrawal Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}