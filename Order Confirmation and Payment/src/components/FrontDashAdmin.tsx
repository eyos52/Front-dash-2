import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner@2.0.3';
import { getDrivers, getStaffMembers, deleteStaffMember } from '../lib/services/database';
import { 
  Search, 
  FileText,
  LogOut,
  Users,
  Truck,
  ClipboardList,
  UserX,
  Trash2,
  UserPlus,
  Check,
  X,
  Plus
} from 'lucide-react';

interface RestaurantRegistration {
  id: string;
  restaurantName: string;
  contactInfo: string;
  submissionDate: string;
  status: 'Approved' | 'Rejected' | 'Pending';
  decisionDate: string;
}

interface Driver {
  driver_id: string;
  'Full name': string;
  phone: string;
  employment_status: string;
  is_available: boolean;
}

interface StaffMember {
  id: string;
  firstname: string;
  lastname: string;
  status: string;
}

interface FrontDashAdminProps {
  onNavigateHome?: () => void;
}

export function FrontDashAdmin({ onNavigateHome }: FrontDashAdminProps = {}) {
  const [activeSection, setActiveSection] = useState('registration-queue');
  const [activeTab, setActiveTab] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showAddStaffDialog, setShowAddStaffDialog] = useState(false);
  const [showAddDriverDialog, setShowAddDriverDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [deleteType, setDeleteType] = useState<'driver' | 'staff' | 'restaurant'>('driver');
  const [newStaffForm, setNewStaffForm] = useState({ firstName: '', lastName: '' });
  const [newDriverForm, setNewDriverForm] = useState({ firstName: '', lastName: '' });

  // Data will be loaded from database
  const [registrations, setRegistrations] = useState<RestaurantRegistration[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);

  // Load drivers from database
  useEffect(() => {
    const loadDrivers = async () => {
      try {
        const driversData = await getDrivers();
        setDrivers(driversData);
      } catch (error) {
        console.error('Error loading drivers:', error);
        toast.error('Failed to load drivers from database');
      }
    };

    if (activeSection === 'driver-management') {
      loadDrivers();
    }
  }, [activeSection]);

  // Load staff from database
  useEffect(() => {
    const loadStaff = async () => {
      try {
        const staffData = await getStaffMembers();
        setStaffMembers(staffData);
      } catch (error) {
        console.error('Error loading staff:', error);
        toast.error('Failed to load staff from database');
      }
    };

    if (activeSection === 'staff-management') {
      loadStaff();
    }
  }, [activeSection]);

  // Action handlers
  const handleApproveRegistration = (id: string) => {
    if (confirm('Are you sure you want to approve this restaurant registration?')) {
      setRegistrations(registrations.map(reg => 
        reg.id === id 
          ? { ...reg, status: 'Approved' as const, decisionDate: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }) }
          : reg
      ));
      toast.success('Restaurant registration approved successfully!');
    }
  };

  const handleRejectRegistration = (id: string) => {
    if (confirm('Are you sure you want to reject this restaurant registration?')) {
      setRegistrations(registrations.map(reg => 
        reg.id === id 
          ? { ...reg, status: 'Rejected' as const, decisionDate: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }) }
          : reg
      ));
      toast.success('Restaurant registration rejected.');
    }
  };

  const handleApproveWithdrawal = (id: string) => {
    if (confirm('Are you sure you want to approve this withdrawal request?')) {
      setWithdrawalRequests(withdrawalRequests.filter(req => req.id !== id));
      toast.success('Withdrawal request approved. Restaurant has been removed from the platform.');
    }
  };

  const handleRejectWithdrawal = (id: string) => {
    if (confirm('Are you sure you want to reject this withdrawal request?')) {
      setWithdrawalRequests(withdrawalRequests.filter(req => req.id !== id));
      toast.success('Withdrawal request rejected.');
    }
  };

  const handleAddStaff = () => {
    if (!newStaffForm.firstName.trim() || !newStaffForm.lastName.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newStaff: StaffMember = {
      id: Date.now().toString(),
      firstname: newStaffForm.firstName,
      lastname: newStaffForm.lastName,
      status: 'active'
    };

    setStaffMembers([...staffMembers, newStaff]);
    setNewStaffForm({ firstName: '', lastName: '' });
    setShowAddStaffDialog(false);
    toast.success(`Staff member ${newStaff.firstname} ${newStaff.lastname} added successfully!`);
  };

  const handleAddDriver = () => {
    if (!newDriverForm.firstName.trim() || !newDriverForm.lastName.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const username = '@' + newDriverForm.lastName.toLowerCase() + String(Math.floor(Math.random() * 90) + 10);
    const newDriver: Driver = {
      firstName: newDriverForm.firstName,
      lastName: newDriverForm.lastName,
      username: username,  
      startDate: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
      autoPWD: '********'
    };

    setDrivers([...drivers, newDriver]);
    setNewDriverForm({ firstName: '', lastName: '' });
    setShowAddDriverDialog(false);
    toast.success(`Driver ${newDriver.firstName} ${newDriver.lastName} hired successfully!`);
  };

  const handleDelete = (item: any, type: 'driver' | 'staff' | 'restaurant') => {
    setItemToDelete(item);
    setDeleteType(type);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (deleteType === 'driver' && itemToDelete) {
      setDrivers(drivers.filter(d => d.driver_id !== itemToDelete.driver_id));
      toast.success(`Driver ${itemToDelete['Full name']} has been removed.`);
    } else if (deleteType === 'staff' && itemToDelete) {
      // Validate ID before attempting to update
      if (!itemToDelete.id || itemToDelete.id.trim() === '') {
        toast.error('Cannot deactivate staff member: Invalid ID');
        setShowConfirmDialog(false);
        setItemToDelete(null);
        return;
      }

      try {
        // Update status to false in database instead of deleting
        await deleteStaffMember(itemToDelete.id);
        // Reload staff list from database
        const staffData = await getStaffMembers();
        setStaffMembers(staffData);
        toast.success(`Staff member ${itemToDelete.firstname} ${itemToDelete.lastname} has been deactivated.`);
      } catch (error: any) {
        console.error('Error deactivating staff member:', error);
        toast.error(`Failed to deactivate staff member: ${error.message || 'Unknown error'}`);
      }
    }
    setShowConfirmDialog(false);
    setItemToDelete(null);
  };

  const filteredItems = () => {
    switch (activeSection) {
      case 'registration-queue':
        let regItems = activeTab === 'active' 
          ? registrations.filter(r => r.status === 'Pending')
          : registrations;
        
        if (searchTerm) {
          regItems = regItems.filter(r => 
            r.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.contactInfo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.id.includes(searchTerm)
          );
        }
        return regItems;
        
      case 'withdrawal-queue':
        let withdrawItems = withdrawalRequests;
        if (searchTerm) {
          withdrawItems = withdrawItems.filter(r => 
            r.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.contactInfo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.id.includes(searchTerm)
          );
        }
        return withdrawItems;
        
      case 'driver-management':
        return drivers.filter(d => 
          d['Full name']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.employment_status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.driver_id?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
      case 'staff-management':
        return staffMembers.filter(s =>
          s.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          `${s.firstname} ${s.lastname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.id?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
      default:
        return [];
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'registration-queue':
        return (
          <div className="flex-1 p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">Registration Queue</h1>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-40 grid-cols-2">
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
                
                <div className="mt-4 mb-4">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search restaurant"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-gray-800 text-white placeholder-gray-400"
                    />
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Registration ID</TableHead>
                      <TableHead>Restaurant Name</TableHead>
                      <TableHead>Contact Info</TableHead>
                      <TableHead>Submission Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Documents</TableHead>
                      <TableHead>Decision Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems().length > 0 ? (
                      filteredItems().map((registration: any, index: number) => (
                        <TableRow key={registration.id || `registration-${index}`}>
                          <TableCell>{registration.id}</TableCell>
                          <TableCell>{registration.restaurantName}</TableCell>
                          <TableCell>{registration.contactInfo}</TableCell>
                          <TableCell>{registration.submissionDate}</TableCell>
                          <TableCell>
                            <Badge variant={
                              registration.status === 'Approved' ? 'default' :
                              registration.status === 'Rejected' ? 'destructive' : 'secondary'
                            }>
                              {registration.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost" onClick={() => toast.info('Document viewer would open here')}>
                              <FileText className="h-4 w-4 text-gray-600" />
                            </Button>
                          </TableCell>
                          <TableCell>{registration.decisionDate}</TableCell>
                          <TableCell>
                            {registration.status === 'Pending' && (
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleApproveRegistration(registration.id)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleRejectRegistration(registration.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                          No registrations found. Data will be loaded from the database.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Tabs>
            </div>
          </div>
        );

      case 'withdrawal-queue':
        return (
          <div className="flex-1 p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">Withdrawal Queue</h1>
              <p className="text-gray-600 mb-4">Review restaurant withdrawal requests</p>
              
              <div className="mb-4">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search withdrawals"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Restaurant Name</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems().length > 0 ? (
                    filteredItems().map((request: any, index: number) => (
                      <TableRow key={request.id || `withdrawal-${index}`}>
                        <TableCell>{request.id}</TableCell>
                        <TableCell>{request.restaurantName}</TableCell>
                        <TableCell>{request.contactInfo}</TableCell>
                        <TableCell>{request.submissionDate}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{request.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleApproveWithdrawal(request.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleRejectWithdrawal(request.id)}
                            >
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        No withdrawal requests found. Data will be loaded from the database.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        );

      case 'staff-management':
        return (
          <div className="flex-1 p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">Staff Management</h1>
              <p className="text-gray-600 mb-4">Manage system administrators and staff</p>
              
              <div className="flex gap-4 mb-4">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search staff"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={() => setShowAddStaffDialog(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Staff
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>First Name</TableHead>
                    <TableHead>Last Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems().length > 0 ? (
                    filteredItems().map((staff: StaffMember, index: number) => (
                      <TableRow key={staff.id || `staff-${index}`}>
                        <TableCell>{staff.firstname}</TableCell>
                        <TableCell>{staff.lastname}</TableCell>
                        <TableCell>
                          <Badge variant={staff.status === 'active' ? 'default' : 'secondary'}>
                            {staff.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(staff, 'staff')}
                            disabled={!staff.id || staff.id.trim() === ''}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                        No staff members found. Data will be loaded from the database.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        );

      case 'driver-management':
        return (
          <div className="flex-1 p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">Driver Management</h1>
              
              <div className="flex gap-4 mb-4">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search Driver"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={() => setShowAddDriverDialog(true)} className="bg-gray-600 hover:bg-gray-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Driver
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver ID</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Employment Status</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems().length > 0 ? (
                    filteredItems().map((driver: Driver, index: number) => (
                      <TableRow key={driver.driver_id || `driver-${index}`}>
                        <TableCell>{driver.driver_id}</TableCell>
                        <TableCell>{driver['Full name']}</TableCell>
                        <TableCell>{driver.phone}</TableCell>
                        <TableCell>
                          <Badge variant={driver.employment_status === 'active' ? 'default' : 'secondary'}>
                            {driver.employment_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={driver.is_available ? 'default' : 'secondary'}>
                            {driver.is_available ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(driver, 'driver')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        No drivers found. Data will be loaded from the database.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex-1 p-6">
            <h1 className="text-2xl font-bold">FrontDash Administration</h1>
            <p className="text-gray-600 mt-2">Select a section from the sidebar to get started.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-10">
        <div className="px-6 py-4">
          <button 
            onClick={onNavigateHome}
            className="text-xl font-bold text-orange-600 hover:text-orange-700 transition-colors cursor-pointer"
          >
            FrontDash
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-64 bg-gray-200 min-h-screen pt-16 fixed left-0">
        <nav className="p-0">
          <div className="space-y-0">
            <button
              onClick={() => setActiveSection('registration-queue')}
              className={`w-full text-left px-6 py-4 border-b border-gray-300 hover:bg-gray-300 transition-colors ${
                activeSection === 'registration-queue' ? 'bg-gray-300' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <ClipboardList className="h-4 w-4" />
                Registration Queue
              </div>
            </button>
            <button
              onClick={() => setActiveSection('withdrawal-queue')}
              className={`w-full text-left px-6 py-4 border-b border-gray-300 hover:bg-gray-300 transition-colors ${
                activeSection === 'withdrawal-queue' ? 'bg-gray-300' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <ClipboardList className="h-4 w-4" />
                Withdrawal Queue
              </div>
            </button>
            <button
              onClick={() => setActiveSection('staff-management')}
              className={`w-full text-left px-6 py-4 border-b border-gray-300 hover:bg-gray-300 transition-colors ${
                activeSection === 'staff-management' ? 'bg-gray-300' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4" />
                Staff Management
              </div>
            </button>
            <button
              onClick={() => setActiveSection('driver-management')}
              className={`w-full text-left px-6 py-4 border-b border-gray-300 hover:bg-gray-300 transition-colors ${
                activeSection === 'driver-management' ? 'bg-gray-300' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <Truck className="h-4 w-4" />
                Driver Management
              </div>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full text-left px-6 py-4 border-b border-gray-300 hover:bg-gray-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                <LogOut className="h-4 w-4" />
                Logout
              </div>
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 pt-16">
        {renderContent()}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this {deleteType}?
              {itemToDelete && (deleteType === 'staff' ? ` (${itemToDelete.firstname} ${itemToDelete.lastname})` : ` (${itemToDelete['Full name']})`)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              No
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Staff Dialog */}
      <Dialog open={showAddStaffDialog} onOpenChange={setShowAddStaffDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Staff Member</DialogTitle>
            <DialogDescription>
              Enter the details for the new staff member
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="staffFirstName">First Name</Label>
              <Input
                id="staffFirstName"
                value={newStaffForm.firstName}
                onChange={(e) => setNewStaffForm({...newStaffForm, firstName: e.target.value})}
                placeholder="Enter first name"
              />
            </div>
            <div>
              <Label htmlFor="staffLastName">Last Name</Label>
              <Input
                id="staffLastName"
                value={newStaffForm.lastName}
                onChange={(e) => setNewStaffForm({...newStaffForm, lastName: e.target.value})}
                placeholder="Enter last name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddStaffDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStaff}>
              Add Staff Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Driver Dialog */}
      <Dialog open={showAddDriverDialog} onOpenChange={setShowAddDriverDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hire New Driver</DialogTitle>
            <DialogDescription>
              Enter the details for the new driver
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="driverFirstName">First Name</Label>
              <Input
                id="driverFirstName"
                value={newDriverForm.firstName}
                onChange={(e) => setNewDriverForm({...newDriverForm, firstName: e.target.value})}
                placeholder="Enter first name"
              />
            </div>
            <div>
              <Label htmlFor="driverLastName">Last Name</Label>
              <Input
                id="driverLastName"
                value={newDriverForm.lastName}
                onChange={(e) => setNewDriverForm({...newDriverForm, lastName: e.target.value})}
                placeholder="Enter last name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDriverDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDriver}>
              Hire Driver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}