import { useState } from 'react';
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
  status: 'Arrived' | 'In transit' | 'Preparing' | 'Ready';
  date: string;
  time: string;
  customer: string;
  deliverer: string;
  total: string;
}

interface DayHours {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface WeeklyHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
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
}

export function RestaurantInterface({ onNavigateHome }: RestaurantInterfaceProps = {}) {
  const [activeSection, setActiveSection] = useState('orders');
  const [activeOrderTab, setActiveOrderTab] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  
  // Weekly operating hours state
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHours>({
    monday: { isOpen: true, openTime: '11:00', closeTime: '22:00' },
    tuesday: { isOpen: true, openTime: '11:00', closeTime: '22:00' },
    wednesday: { isOpen: true, openTime: '11:00', closeTime: '22:00' },
    thursday: { isOpen: true, openTime: '11:00', closeTime: '22:00' },
    friday: { isOpen: true, openTime: '11:00', closeTime: '23:00' },
    saturday: { isOpen: true, openTime: '11:00', closeTime: '23:00' },
    sunday: { isOpen: true, openTime: '12:00', closeTime: '21:00' }
  });
  
  const [restaurant, setRestaurant] = useState<RestaurantData>({
    name: "Tony's Italian Bistro",
    address: '123 Main St, Downtown',
    phone: '5551234567',
    email: 'tony@tonys.com',
    openingTime: '11:00 AM',
    closingTime: '10:00 PM',
    isRegistered: true,
    registrationStatus: 'approved'
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { id: 1, name: 'Margherita Pizza', price: 18.99, description: 'Fresh tomatoes, mozzarella, basil', availability: 'available' },
    { id: 2, name: 'Caesar Salad', price: 12.99, description: 'Romaine lettuce, parmesan, croutons', availability: 'available' },
    { id: 3, name: 'Garlic Bread', price: 6.99, description: 'Crispy bread with garlic butter', availability: 'unavailable' }
  ]);

  const [orders, setOrders] = useState<Order[]>([
    {
      id: '1111111',
      status: 'Arrived',
      date: '07/30',
      time: '2:24 pm',
      customer: 'Alex',
      deliverer: 'Jim',
      total: '$15'
    },
    {
      id: '1111111',
      status: 'In transit',
      date: '07/30',
      time: '2:24 pm',
      customer: 'Conor',
      deliverer: 'Joseph',
      total: '$22'
    },
    {
      id: '1111111',
      status: 'Preparing',
      date: '07/30',
      time: '2:24 pm',
      customer: 'John',
      deliverer: '',
      total: '$18'
    },
    {
      id: '1111111',
      status: 'Ready',
      date: '07/30',
      time: '2:24 pm',
      customer: 'Sarah',
      deliverer: '',
      total: '$25'
    }
  ]);

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

  const withdrawFromFrontDash = () => {
    setShowWithdrawDialog(false);
    alert('Withdrawal request submitted. An administrator will review your request.');
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

  const handleUpdateWeeklyHours = () => {
    // Validate that open times are before close times
    const daysWithErrors: string[] = [];
    
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
      alert(`Invalid hours for: ${daysWithErrors.join(', ')}. Opening time must be before closing time.`);
      return;
    }

    alert('Operating hours updated successfully!');
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
      ? filtered.filter(order => order.status === 'Preparing' || order.status === 'In transit' || order.status === 'Ready')
      : filtered.filter(order => order.status === 'Arrived');
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
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Deliverer</TableHead>
                            <TableHead>Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredOrders().map((order, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{order.id}</TableCell>
                              <TableCell>
                                <Badge variant={
                                  order.status === 'Arrived' ? 'default' :
                                  order.status === 'In transit' ? 'secondary' :
                                  order.status === 'Preparing' ? 'destructive' : 'outline'
                                }>
                                  {order.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{order.date}</TableCell>
                              <TableCell>{order.time}</TableCell>
                              <TableCell>{order.customer}</TableCell>
                              <TableCell>{order.deliverer || 'Pending'}</TableCell>
                              <TableCell>{order.total}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history">
                <Card>
                  <CardContent className="pt-6">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Deliverer</TableHead>
                            <TableHead>Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredOrders().map((order, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{order.id}</TableCell>
                              <TableCell>
                                <Badge variant="default">
                                  {order.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{order.date}</TableCell>
                              <TableCell>{order.time}</TableCell>
                              <TableCell>{order.customer}</TableCell>
                              <TableCell>{order.deliverer}</TableCell>
                              <TableCell>{order.total}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
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

            <div className="grid gap-4">
              {menuItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold">{item.name}</h3>
                        <p className="text-gray-600 mb-2">{item.description}</p>
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
                  
                  <div className="pt-4">
                    <Button 
                      onClick={handleUpdateWeeklyHours}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      Update Hours
                    </Button>
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