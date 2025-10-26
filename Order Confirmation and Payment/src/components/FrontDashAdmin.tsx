import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner@2.0.3';
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
  firstName: string;
  lastName: string;
  username: string;
  startDate: string;
  autoPWD: string;
}

interface StaffMember {
  id: string;
  name: string;
  username: string;
  role: string;
  dateAdded: string;
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
  const [newStaffForm, setNewStaffForm] = useState({ firstName: '', lastName: '', role: 'Support' });
  const [newDriverForm, setNewDriverForm] = useState({ firstName: '', lastName: '' });

  // Mock data
  const [registrations, setRegistrations] = useState<RestaurantRegistration[]>([
    {
      id: '1111111',
      restaurantName: "Jim's Hotdogs",
      contactInfo: 'j@gmail.com',
      submissionDate: '06/11',
      status: 'Approved',
      decisionDate: '06/19'
    },
    {
      id: '232323',
      restaurantName: "Tim's Pizza",
      contactInfo: 't@gmail.com',
      submissionDate: '06/09',
      status: 'Rejected',
      decisionDate: '06/25'
    },
    {
      id: '344444',
      restaurantName: "Mario's Italian Kitchen",
      contactInfo: 'mario@kitchen.com',
      submissionDate: '07/20',
      status: 'Pending',
      decisionDate: ''
    },
    {
      id: '455555',
      restaurantName: "Dragon Sushi",
      contactInfo: 'info@dragonsushi.com',
      submissionDate: '07/22',
      status: 'Pending',
      decisionDate: ''
    }
  ]);

  const [withdrawalRequests, setWithdrawalRequests] = useState([
    {
      id: '1111112',
      restaurantName: "Tony's Bistro",
      contactInfo: 'tony@gmail.com',
      submissionDate: '07/15',
      status: 'Pending',
      decisionDate: ''
    },
    {
      id: '666666',
      restaurantName: "Burger King Downtown",
      contactInfo: 'manager@bkdowntown.com',
      submissionDate: '07/18',
      status: 'Pending',
      decisionDate: ''
    }
  ]);

  const [drivers, setDrivers] = useState<Driver[]>([
    {
      firstName: 'Colby',
      lastName: 'Papanatuski',
      username: '@papanak1',
      startDate: '06/11',
      autoPWD: '********'
    },
    {
      firstName: 'Jonathan',
      lastName: 'Pyne',
      username: '@jonathan1',
      startDate: '06/09',
      autoPWD: '********'
    }
  ]);

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([
    {
      id: '1',
      name: 'Alice Johnson',
      username: 'alice01',
      role: 'Manager',
      dateAdded: '2024-01-15'
    },
    {
      id: '2',
      name: 'Bob Smith',
      username: 'bob02',
      role: 'Support',
      dateAdded: '2024-02-20'  
    },
    {
      id: '3',
      name: 'Carol Davis',
      username: 'carol03',
      role: 'Admin',
      dateAdded: '2024-03-10'
    },
    {
      id: '4',
      name: 'David Wilson',
      username: 'david04',
      role: 'Support',
      dateAdded: '2024-04-05'
    }
  ]);

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

    const username = newStaffForm.lastName.toLowerCase() + String(Math.floor(Math.random() * 90) + 10);
    const newStaff: StaffMember = {
      id: Date.now().toString(),
      name: `${newStaffForm.firstName} ${newStaffForm.lastName}`,
      username: username,
      role: newStaffForm.role,
      dateAdded: new Date().toLocaleDateString()
    };

    setStaffMembers([...staffMembers, newStaff]);
    setNewStaffForm({ firstName: '', lastName: '', role: 'Support' });
    setShowAddStaffDialog(false);
    toast.success(`Staff member ${newStaff.name} added successfully! Username: ${username}`);
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

  const confirmDelete = () => {
    if (deleteType === 'driver' && itemToDelete) {
      setDrivers(drivers.filter(d => d.username !== itemToDelete.username));
      toast.success(`Driver ${itemToDelete.firstName} ${itemToDelete.lastName} has been removed.`);
    } else if (deleteType === 'staff' && itemToDelete) {
      setStaffMembers(staffMembers.filter(s => s.id !== itemToDelete.id));
      toast.success(`Staff member ${itemToDelete.name} has been removed.`);
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
          d.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.username.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
      case 'staff-management':
        return staffMembers.filter(s =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.role.toLowerCase().includes(searchTerm.toLowerCase())
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
                    {filteredItems().map((registration: any) => (
                      <TableRow key={registration.id}>
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
                    ))}
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
                  {filteredItems().map((request: any) => (
                    <TableRow key={request.id}>
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
                  ))}
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
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Date Added</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems().map((staff: any) => (
                    <TableRow key={staff.id}>
                      <TableCell>{staff.name}</TableCell>
                      <TableCell>{staff.username}</TableCell>
                      <TableCell>{staff.role}</TableCell>
                      <TableCell>{staff.dateAdded}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(staff, 'staff')}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
                    <TableHead>First Name</TableHead>
                    <TableHead>Last Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Auto PWD</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems().map((driver: any, index) => (
                    <TableRow key={index}>
                      <TableCell>{driver.firstName}</TableCell>
                      <TableCell>{driver.lastName}</TableCell>
                      <TableCell>{driver.username}</TableCell>
                      <TableCell>{driver.startDate}</TableCell>
                      <TableCell>{driver.autoPWD}</TableCell>
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
                  ))}
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
              {itemToDelete && (deleteType === 'staff' ? ` (${itemToDelete.name})` : ` (${itemToDelete.firstName} ${itemToDelete.lastName})`)}
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
            <div>
              <Label htmlFor="staffRole">Role</Label>
              <select 
                id="staffRole"
                value={newStaffForm.role}
                onChange={(e) => setNewStaffForm({...newStaffForm, role: e.target.value})}
                className="w-full p-2 border rounded-md"
              >
                <option value="Support">Support</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
              </select>
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