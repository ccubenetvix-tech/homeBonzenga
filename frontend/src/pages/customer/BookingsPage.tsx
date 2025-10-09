import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Search, 
  Filter,
  Eye,
  Loader2,
  Scissors,
  Palette,
  Sparkles,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';

interface Booking {
  id: string;
  bookingNumber: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  paymentStatus: 'paid' | 'unpaid' | 'refunded';
  scheduledDate: string;
  scheduledTime: string;
  total: number;
  serviceType: 'hair' | 'face' | 'extras';
  beautician?: {
    id: string;
    firstName: string;
    lastName: string;
    skills: string[];
  };
  vendor?: {
    id: string;
    shopname: string;
    address: string;
  };
  services: Array<{
    id: string;
    name: string;
    price: number;
    duration: number;
  }>;
  createdAt: string;
  notes?: string;
}

const CustomerBookingsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, statusFilter, paymentFilter]);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/customer/bookings/${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      } else {
        // Use mock data if API is not available
        setBookings(getMockBookingsData());
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      // Use mock data on error
      setBookings(getMockBookingsData());
    } finally {
      setIsLoading(false);
    }
  };

  const getMockBookingsData = (): Booking[] => [
    {
      id: '1',
      bookingNumber: 'HB-2024-001',
      status: 'confirmed',
      paymentStatus: 'paid',
      scheduledDate: '2024-01-15',
      scheduledTime: '10:00',
      total: 150000,
      serviceType: 'hair',
      beautician: {
        id: '1',
        firstName: 'Marie',
        lastName: 'Kabila',
        skills: ['Hair Styling', 'Coloring', 'Braids']
      },
      services: [
        { id: '1', name: 'Hair Cut & Style', price: 100000, duration: 60 },
        { id: '2', name: 'Hair Coloring', price: 50000, duration: 120 }
      ],
      createdAt: '2024-01-10T10:00:00Z',
      notes: 'Please use organic products'
    },
    {
      id: '2',
      bookingNumber: 'HB-2024-002',
      status: 'completed',
      paymentStatus: 'paid',
      scheduledDate: '2024-01-10',
      scheduledTime: '14:00',
      total: 75000,
      serviceType: 'face',
      beautician: {
        id: '2',
        firstName: 'Grace',
        lastName: 'Mukendi',
        skills: ['Facial Treatments', 'Skincare', 'Makeup']
      },
      services: [
        { id: '3', name: 'Deep Cleansing Facial', price: 75000, duration: 90 }
      ],
      createdAt: '2024-01-08T14:00:00Z'
    },
    {
      id: '3',
      bookingNumber: 'HB-2024-003',
      status: 'pending',
      paymentStatus: 'unpaid',
      scheduledDate: '2024-01-20',
      scheduledTime: '16:00',
      total: 120000,
      serviceType: 'extras',
      beautician: {
        id: '3',
        firstName: 'Sarah',
        lastName: 'Lukaku',
        skills: ['Manicure', 'Pedicure', 'Nail Art']
      },
      services: [
        { id: '4', name: 'Manicure & Pedicure', price: 120000, duration: 120 }
      ],
      createdAt: '2024-01-12T16:00:00Z'
    },
    {
      id: '4',
      bookingNumber: 'HB-2024-004',
      status: 'cancelled',
      paymentStatus: 'refunded',
      scheduledDate: '2024-01-05',
      scheduledTime: '11:00',
      total: 80000,
      serviceType: 'hair',
      services: [
        { id: '5', name: 'Hair Treatment', price: 80000, duration: 60 }
      ],
      createdAt: '2024-01-03T11:00:00Z',
      notes: 'Customer requested cancellation'
    }
  ];

  const filterBookings = () => {
    let filtered = bookings;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.beautician?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.beautician?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.services.some(service => 
          service.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(booking => booking.paymentStatus === paymentFilter);
    }

    setFilteredBookings(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      confirmed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      unpaid: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      refunded: { color: 'bg-blue-100 text-blue-800', icon: DollarSign }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getServiceIcon = (type: string) => {
    const iconConfig = {
      hair: { icon: Scissors, color: 'text-purple-600' },
      face: { icon: Palette, color: 'text-pink-600' },
      extras: { icon: Sparkles, color: 'text-blue-600' }
    };

    const config = iconConfig[type as keyof typeof iconConfig];
    const Icon = config.icon;

    return <Icon className={`w-4 h-4 ${config.color}`} />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#4e342e]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#fdf6f0] p-3 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#4e342e]">
                  My Bookings
                </h1>
                <p className="text-base sm:text-lg text-[#6d4c41] mt-1 sm:mt-2">
                  View and manage all your beauty service appointments
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs sm:text-sm text-[#6d4c41]">Total Bookings</p>
                <p className="text-xl sm:text-2xl font-bold text-[#4e342e]">{bookings.length}</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <Card className="border-0 bg-white shadow-lg mb-4 sm:mb-6">
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6d4c41] w-4 h-4" />
                  <Input
                    placeholder="Search bookings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-[#4e342e]/20 focus:border-[#4e342e] text-sm sm:text-base"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="border-[#4e342e]/20 focus:border-[#4e342e]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="border-[#4e342e]/20 focus:border-[#4e342e]">
                    <SelectValue placeholder="Filter by payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setPaymentFilter('all');
                  }}
                  variant="outline"
                  className="border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bookings Table */}
          {filteredBookings.length > 0 ? (
            <Card className="border-0 bg-white shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg sm:text-xl font-serif font-bold text-[#4e342e] flex items-center">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Booking History ({filteredBookings.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#4e342e]/10">
                        <TableHead className="text-[#4e342e] font-semibold text-xs sm:text-sm">Booking ID</TableHead>
                        <TableHead className="text-[#4e342e] font-semibold text-xs sm:text-sm">Service</TableHead>
                        <TableHead className="text-[#4e342e] font-semibold text-xs sm:text-sm">Beautician</TableHead>
                        <TableHead className="text-[#4e342e] font-semibold text-xs sm:text-sm">Date & Time</TableHead>
                        <TableHead className="text-[#4e342e] font-semibold text-xs sm:text-sm">Status</TableHead>
                        <TableHead className="text-[#4e342e] font-semibold text-xs sm:text-sm">Payment</TableHead>
                        <TableHead className="text-[#4e342e] font-semibold text-xs sm:text-sm">Total</TableHead>
                        <TableHead className="text-[#4e342e] font-semibold text-xs sm:text-sm">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.map((booking) => (
                        <TableRow key={booking.id} className="border-[#4e342e]/10 hover:bg-[#fdf6f0]/50">
                          <TableCell className="font-medium text-[#4e342e] text-xs sm:text-sm">
                            <span className="hidden sm:inline">{booking.bookingNumber}</span>
                            <span className="sm:hidden">{booking.bookingNumber.slice(-6)}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              {getServiceIcon(booking.serviceType)}
                              <div>
                                <p className="font-medium text-[#4e342e] capitalize text-xs sm:text-sm">
                                  {booking.serviceType}
                                </p>
                                <p className="text-xs text-[#6d4c41]">
                                  {booking.services.length} service{booking.services.length > 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {booking.beautician ? (
                              <div className="flex items-center space-x-1 sm:space-x-2">
                                <User className="w-3 h-3 sm:w-4 sm:h-4 text-[#6d4c41]" />
                                <div>
                                  <p className="font-medium text-[#4e342e] text-xs sm:text-sm">
                                    {booking.beautician.firstName} {booking.beautician.lastName}
                                  </p>
                                  <p className="text-xs text-[#6d4c41] hidden sm:block">
                                    {booking.beautician.skills.slice(0, 2).join(', ')}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-[#6d4c41] text-xs sm:text-sm">Not assigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-[#6d4c41]" />
                              <div>
                                <p className="font-medium text-[#4e342e] text-xs sm:text-sm">
                                  {formatDate(booking.scheduledDate)}
                                </p>
                                <p className="text-xs text-[#6d4c41] flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {booking.scheduledTime}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="scale-75 sm:scale-100">
                              {getStatusBadge(booking.status)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="scale-75 sm:scale-100">
                              {getPaymentStatusBadge(booking.paymentStatus)}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-[#4e342e] text-xs sm:text-sm">
                            {formatCurrency(booking.total)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white text-xs sm:text-sm px-2 sm:px-3"
                            >
                              <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 bg-white shadow-lg">
              <CardContent className="p-12 text-center">
                <Calendar className="w-16 h-16 text-[#6d4c41] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[#4e342e] mb-2">
                  No bookings found
                </h3>
                <p className="text-[#6d4c41] mb-6">
                  {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all'
                    ? 'No bookings match your current filters. Try adjusting your search criteria.'
                    : 'You haven\'t made any bookings yet. Start by booking a beauty service!'
                  }
                </p>
                <Button className="bg-[#4e342e] hover:bg-[#3b2c26] text-white">
                  Book a Service
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomerBookingsPage;
