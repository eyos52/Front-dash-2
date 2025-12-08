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
import { getDrivers, getStaffMembers, deleteStaffMember, createStaffMember, createDriver, deleteDriver, getRestaurantRegistrations, updateRestaurantRegistrationStatus, getWithdrawalRequests, updateWithdrawalRequestStatus, processApprovedRegistrationRequests } from '../lib/services/database';
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
  username?: string;
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
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [driverError, setDriverError] = useState<string | null>(null);
  const [isLoadingRegistrations, setIsLoadingRegistrations] = useState(false);
  const [isLoadingWithdrawals, setIsLoadingWithdrawals] = useState(false);

  // Load drivers from database
  useEffect(() => {
    const loadDrivers = async () => {
      setIsLoadingDrivers(true);
      setDriverError(null);
      try {
        const driversData = await getDrivers();
        setDrivers(driversData);
      } catch (error: any) {
        console.error('Error loading drivers:', error);
        const errorMessage = error.message || 'Failed to load drivers from database';
        setDriverError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoadingDrivers(false);
      }
    };

    if (activeSection === 'driver-management') {
      loadDrivers();
    }
  }, [activeSection]);

  // Load staff from database
  useEffect(() => {
    const loadStaff = async () => {
      setIsLoadingStaff(true);
      setStaffError(null);
      try {
        const staffData = await getStaffMembers();
        setStaffMembers(staffData);
      } catch (error: any) {
        console.error('Error loading staff:', error);
        const errorMessage = error.message || 'Failed to load staff from database';
        setStaffError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoadingStaff(false);
      }
    };

    if (activeSection === 'staff-management') {
      loadStaff();
    }
  }, [activeSection]);

  // Load registrations from database
  useEffect(() => {
    const loadRegistrations = async () => {
      setIsLoadingRegistrations(true);
      try {
        // First, process any approved requests that haven't been moved to restaurants table
        try {
          const result = await processApprovedRegistrationRequests();
          if (result.processed > 0) {
            console.log(`Processed ${result.processed} approved registration(s) into restaurants table`);
            if (result.errors.length > 0) {
              console.warn('Some requests had errors:', result.errors);
            }
          }
        } catch (processError) {
          console.error('Error processing approved requests:', processError);
          // Continue loading registrations even if processing fails
        }

        const registrationsData = await getRestaurantRegistrations();
        setRegistrations(registrationsData);
      } catch (error: any) {
        console.error('Error loading registrations:', error);
        toast.error(error.message || 'Failed to load registrations from database');
      } finally {
        setIsLoadingRegistrations(false);
      }
    };

    if (activeSection === 'registration-queue') {
      loadRegistrations();
    }
  }, [activeSection]);

  // Load withdrawal requests from database
  useEffect(() => {
    const loadWithdrawals = async () => {
      setIsLoadingWithdrawals(true);
      try {
        const withdrawalsData = await getWithdrawalRequests();
        setWithdrawalRequests(withdrawalsData);
      } catch (error: any) {
        console.error('Error loading withdrawal requests:', error);
        toast.error(error.message || 'Failed to load withdrawal requests from database');
      } finally {
        setIsLoadingWithdrawals(false);
      }
    };

    if (activeSection === 'withdrawal-queue') {
      loadWithdrawals();
    }
  }, [activeSection]);

  // Action handlers
  const handleApproveRegistration = async (id: string) => {
    if (!confirm('Are you sure you want to approve this restaurant registration?')) {
      return;
    }

    setIsLoadingRegistrations(true);
    try {
      // Use 'system' as reviewerId since we don't have auth set up
      await updateRestaurantRegistrationStatus(id, 'approved', 'system');
      
      // Reload registrations
      const registrationsData = await getRestaurantRegistrations();
      setRegistrations(registrationsData);
      
      toast.success('Restaurant registration approved successfully!');
    } catch (error: any) {
      console.error('Error approving registration:', error);
      toast.error(error.message || 'Failed to approve registration');
    } finally {
      setIsLoadingRegistrations(false);
    }
  };

  const handleRejectRegistration = async (id: string) => {
    if (!confirm('Are you sure you want to reject this restaurant registration?')) {
      return;
    }

    setIsLoadingRegistrations(true);
    try {
      await updateRestaurantRegistrationStatus(id, 'rejected', 'system');
      
      // Reload registrations
      const registrationsData = await getRestaurantRegistrations();
      setRegistrations(registrationsData);
      
      toast.success('Restaurant registration rejected.');
    } catch (error: any) {
      console.error('Error rejecting registration:', error);
      toast.error(error.message || 'Failed to reject registration');
    } finally {
      setIsLoadingRegistrations(false);
    }
  };

  const handleApproveWithdrawal = async (id: string) => {
    if (!confirm('Are you sure you want to approve this withdrawal request?')) {
      return;
    }

    setIsLoadingWithdrawals(true);
    try {
      await updateWithdrawalRequestStatus(id, 'approved', 'system');
      
      // Reload withdrawal requests
      const withdrawalsData = await getWithdrawalRequests();
      setWithdrawalRequests(withdrawalsData);
      
      toast.success('Withdrawal request approved. Restaurant has been removed from the platform.');
    } catch (error: any) {
      console.error('Error approving withdrawal:', error);
      toast.error(error.message || 'Failed to approve withdrawal request');
    } finally {
      setIsLoadingWithdrawals(false);
    }
  };

  const handleRejectWithdrawal = async (id: string) => {
    if (!confirm('Are you sure you want to reject this withdrawal request?')) {
      return;
    }

    setIsLoadingWithdrawals(true);
    try {
      await updateWithdrawalRequestStatus(id, 'rejected', 'system');
      
      // Reload withdrawal requests
      const withdrawalsData = await getWithdrawalRequests();
      setWithdrawalRequests(withdrawalsData);
      
      toast.success('Withdrawal request rejected.');
    } catch (error: any) {
      console.error('Error rejecting withdrawal:', error);
      toast.error(error.message || 'Failed to reject withdrawal request');
    } finally {
      setIsLoadingWithdrawals(false);
    }
  };

  const handleAddStaff = async () => {
    if (!newStaffForm.firstName.trim() || !newStaffForm.lastName.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoadingStaff(true);
    try {
      const newStaff = await createStaffMember(
        newStaffForm.firstName.trim(),
        newStaffForm.lastName.trim()
      );
      
      // Reload staff list to get the updated data
      const staffData = await getStaffMembers();
      setStaffMembers(staffData);
      
      setNewStaffForm({ firstName: '', lastName: '' });
      setShowAddStaffDialog(false);
      toast.success(`Staff member ${newStaff.firstname} ${newStaff.lastname} added successfully!`);
    } catch (error: any) {
      console.error('Error adding staff member:', error);
      const errorMessage = error.message || 'Failed to add staff member';
      toast.error(errorMessage);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const handleAddDriver = async () => {
    if (!newDriverForm.firstName.trim() || !newDriverForm.lastName.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoadingDrivers(true);
    try {
      const newDriver = await createDriver(
        newDriverForm.firstName.trim(),
        newDriverForm.lastName.trim()
      );
      
      // Reload drivers list to get the updated data
      const driversData = await getDrivers();
      setDrivers(driversData);
      
      setNewDriverForm({ firstName: '', lastName: '' });
      setShowAddDriverDialog(false);
      toast.success(`Driver ${newDriver['Full name']} hired successfully!`);
    } catch (error: any) {
      console.error('Error adding driver:', error);
      const errorMessage = error.message || 'Failed to add driver';
      toast.error(errorMessage);
    } finally {
      setIsLoadingDrivers(false);
    }
  };

  const handleDelete = (item: any, type: 'driver' | 'staff' | 'restaurant') => {
    setItemToDelete(item);
    setDeleteType(type);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (deleteType === 'driver' && itemToDelete) {
      const driverId = itemToDelete.driver_id;
      
      if (!driverId || driverId.trim() === '') {
        toast.error('Cannot deactivate driver: Invalid driver ID');
        setShowConfirmDialog(false);
        setItemToDelete(null);
        return;
      }

      setIsLoadingDrivers(true);
      try {
        // Soft delete: set employment_status to 'inactive' and is_available to false
        await deleteDriver(driverId);
        // Reload drivers list from database
        const driversData = await getDrivers();
        setDrivers(driversData);
        toast.success(`Driver ${itemToDelete['Full name']} has been deactivated.`);
      } catch (error: any) {
        console.error('Error deactivating driver:', error);
        toast.error(`Failed to deactivate driver: ${error.message || 'Unknown error'}`);
      } finally {
        setIsLoadingDrivers(false);
      }
    } else if (deleteType === 'staff' && itemToDelete) {
      // Use username if available, otherwise use id
      const identifier = (itemToDelete as any).username || itemToDelete.id;
      
      if (!identifier || identifier.trim() === '') {
        toast.error('Cannot deactivate staff member: Invalid identifier');
        setShowConfirmDialog(false);
        setItemToDelete(null);
        return;
      }

      setIsLoadingStaff(true);
      try {
        // Update status to false in database (soft delete)
        await deleteStaffMember(identifier);
        // Reload staff list from database
        const staffData = await getStaffMembers();
        setStaffMembers(staffData);
        toast.success(`Staff member ${itemToDelete.firstname} ${itemToDelete.lastname} has been deactivated.`);
      } catch (error: any) {
        console.error('Error deactivating staff member:', error);
        toast.error(`Failed to deactivate staff member: ${error.message || 'Unknown error'}`);
      } finally {
        setIsLoadingStaff(false);
      }
    }
    setShowConfirmDialog(false);
    setItemToDelete(null);
  };

  const filteredItems = () => {
    switch (activeSection) {
      case 'registration-queue':
        let regItems = activeTab === 'active' 
          ? registrations.filter((r: any) => r.status === 'pending')
          : registrations.filter((r: any) => r.status === 'approved' || r.status === 'rejected');
        
        if (searchTerm) {
          regItems = regItems.filter((r: any) => 
            r.proposed_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.proposed_contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.proposed_contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.proposed_phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.restaurant_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.id?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        return regItems;
        
      case 'withdrawal-queue':
        let withdrawItems = activeTab === 'active'
          ? withdrawalRequests.filter((r: any) => r.status === 'pending')
          : withdrawalRequests.filter((r: any) => r.status === 'approved' || r.status === 'rejected');
        
        if (searchTerm) {
          withdrawItems = withdrawItems.filter((r: any) => 
            r.restaurant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.contact_info?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
                    {isLoadingRegistrations && registrations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                          Loading registrations...
                        </TableCell>
                      </TableRow>
                    ) : filteredItems().length > 0 ? (
                      filteredItems().map((registration: any, index: number) => (
                        <TableRow key={registration.id || `registration-${index}`}>
                          <TableCell>{registration.id}</TableCell>
                          <TableCell>{registration.proposed_name || 'N/A'}</TableCell>
                          <TableCell>
                            {registration.proposed_contact_name || 'N/A'}<br />
                            {registration.proposed_contact_email && <span className="text-sm text-gray-500">{registration.proposed_contact_email}</span>}<br />
                            {registration.proposed_phone && <span className="text-sm text-gray-500">{registration.proposed_phone}</span>}
                          </TableCell>
                          <TableCell>{registration.created_at ? new Date(registration.created_at).toLocaleDateString() : '—'}</TableCell>
                          <TableCell>
                            <Badge variant={
                              registration.status === 'approved' ? 'default' :
                              registration.status === 'rejected' ? 'destructive' : 'secondary'
                            }>
                              {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost" disabled>
                              <FileText className="h-4 w-4 text-gray-400" />
                            </Button>
                          </TableCell>
                          <TableCell>{registration.decided_at ? new Date(registration.decided_at).toLocaleDateString() : '—'}</TableCell>
                          <TableCell>
                            {registration.status === 'pending' && (
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleApproveRegistration(registration.id)}
                                  disabled={isLoadingRegistrations}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleRejectRegistration(registration.id)}
                                  disabled={isLoadingRegistrations}
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
                          No registrations found.
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
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-40 grid-cols-2">
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
                
                <div className="mt-4 mb-4">
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
                    {isLoadingWithdrawals && withdrawalRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                          Loading withdrawal requests...
                        </TableCell>
                      </TableRow>
                    ) : filteredItems().length > 0 ? (
                      filteredItems().map((request: any, index: number) => (
                        <TableRow key={request.id || `withdrawal-${index}`}>
                          <TableCell>{request.id.substring(0, 8)}...</TableCell>
                          <TableCell>{request.restaurant_name}</TableCell>
                          <TableCell>{request.contact_info}</TableCell>
                          <TableCell>{new Date(request.submission_date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant={
                              request.status === 'approved' ? 'default' :
                              request.status === 'rejected' ? 'destructive' : 'secondary'
                            }>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {request.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleApproveWithdrawal(request.id)}
                                  disabled={isLoadingWithdrawals}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleRejectWithdrawal(request.id)}
                                  disabled={isLoadingWithdrawals}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                          No withdrawal requests found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Tabs>
            </div>
          </div>
        );

      case 'staff-management':
        return (
          <div className="flex-1 p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">Staff Management</h1>
              <p className="text-gray-600 mb-4">Manage system administrators and staff</p>
              
              {staffError && (
                <Alert className="mb-4">
                  <AlertDescription>{staffError}</AlertDescription>
                </Alert>
              )}
              
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
                <Button onClick={() => setShowAddStaffDialog(true)} disabled={isLoadingStaff}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Staff
                </Button>
              </div>

              {isLoadingStaff && staffMembers.length === 0 ? (
                <div className="text-center text-gray-500 py-8">Loading staff members...</div>
              ) : (
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
                              disabled={!staff.id || staff.id.trim() === '' || isLoadingStaff}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                          {isLoadingStaff ? 'Loading...' : 'No staff members found.'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        );

      case 'driver-management':
        return (
          <div className="flex-1 p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">Driver Management</h1>
              
              {driverError && (
                <Alert className="mb-4">
                  <AlertDescription>{driverError}</AlertDescription>
                </Alert>
              )}
              
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
                <Button onClick={() => setShowAddDriverDialog(true)} disabled={isLoadingDrivers} className="bg-gray-600 hover:bg-gray-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Driver
                </Button>
              </div>

              {isLoadingDrivers && drivers.length === 0 ? (
                <div className="text-center text-gray-500 py-8">Loading drivers...</div>
              ) : (
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
                          <TableCell>{driver.phone || '—'}</TableCell>
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
                                disabled={!driver.driver_id || driver.driver_id.trim() === '' || isLoadingDrivers}
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
                          {isLoadingDrivers ? 'Loading...' : 'No drivers found.'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
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
            <Button onClick={handleAddStaff} disabled={isLoadingStaff}>
              {isLoadingStaff ? 'Adding...' : 'Add Staff Member'}
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
            <Button onClick={handleAddDriver} disabled={isLoadingDrivers}>
              {isLoadingDrivers ? 'Adding...' : 'Hire Driver'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}