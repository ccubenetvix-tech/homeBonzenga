import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Users, 
  Building, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Eye,
  Settings,
  BarChart3,
  UserPlus,
  Package,
  CreditCard,
  Activity,
  Loader2,
  UserCheck,
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
  Target,
  Shield,
  TrendingDown,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminStats {
  totalUsers: number;
  totalVendors: number;
  totalManagers: number;
  pendingApprovals: number;
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayouts: number;
  refundRequests: number;
  activeUsers: number;
  suspendedUsers: number;
  activeVendors: number;
  pendingVendors: number;
  totalBookings: number;
  completedBookings: number;
  atHomeBookings: number;
  salonBookings: number;
  totalCommissions: number;
  pendingDisputes: number;
  averageRating: number;
}

interface RecentActivity {
  id: string;
  type: 'user_registration' | 'vendor_approval' | 'booking_completed' | 'payment_processed' | 'dispute_created';
  description: string;
  timestamp: string;
  user?: {
    name: string;
    email: string;
  };
  amount?: number;
}


interface TopVendor {
  id: string;
  shopname: string;
  businessType: string;
  totalRevenue: number;
  totalBookings: number;
  averageRating: number;
  status: string;
}

const AdminDashboard = () => {
  const { user } = useSupabaseAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [topVendors, setTopVendors] = useState<TopVendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Use mock data instead of API calls
      const mockData = await import('@/mockData/admin.json');
      
      // Set stats from mock data
      setStats({
        totalUsers: mockData.default.analytics.totalUsers,
        totalVendors: mockData.default.analytics.totalVendors,
        totalManagers: mockData.default.analytics.totalManagers,
        pendingApprovals: mockData.default.analytics.pendingApprovals,
        totalRevenue: mockData.default.analytics.totalRevenue,
        monthlyRevenue: mockData.default.analytics.monthlyRevenue,
        pendingPayouts: mockData.default.financials.pendingPayouts,
        refundRequests: mockData.default.financials.refunds,
        activeUsers: mockData.default.analytics.totalUsers - 3, // Assuming some inactive
        suspendedUsers: 3,
        activeVendors: mockData.default.analytics.totalVendors - 1,
        pendingVendors: 1,
        totalBookings: mockData.default.analytics.activeBookings + mockData.default.analytics.completedBookings,
        completedBookings: mockData.default.analytics.completedBookings,
        atHomeBookings: Math.floor((mockData.default.analytics.activeBookings + mockData.default.analytics.completedBookings) * 0.6),
        salonBookings: Math.floor((mockData.default.analytics.activeBookings + mockData.default.analytics.completedBookings) * 0.4),
        totalCommissions: mockData.default.analytics.totalRevenue * 0.15, // 15% commission
        pendingDisputes: 2,
        averageRating: 4.7
      });
      
      // Set recent activity from mock data
      setRecentActivity([
        {
          id: '1',
          type: 'user_registration',
          description: 'New user registered',
          timestamp: '2024-12-20T10:30:00Z',
          user: { name: 'Marie Kabila', email: 'marie.kabila@example.com' }
        },
        {
          id: '2',
          type: 'vendor_approval',
          description: 'Vendor approved by manager',
          timestamp: '2024-12-20T09:15:00Z',
          user: { name: 'Belle Époque Salon', email: 'grace@bellepoque.com' }
        },
        {
          id: '3',
          type: 'booking_completed',
          description: 'Booking completed',
          timestamp: '2024-12-20T08:45:00Z',
          amount: 150000
        },
        {
          id: '4',
          type: 'payment_processed',
          description: 'Payment processed',
          timestamp: '2024-12-20T08:30:00Z',
          amount: 85000
        }
      ]);
      
      // Set top vendors from mock data
      setTopVendors(mockData.default.reports.topVendors.map(vendor => ({
        id: vendor.name.toLowerCase().replace(/\s+/g, '-'),
        shopname: vendor.name,
        businessType: 'salon',
        totalRevenue: vendor.revenue,
        totalBookings: vendor.bookings,
        averageRating: 4.8,
        status: 'APPROVED'
      })));
      
    } catch (error) {
      console.error('Error loading mock data:', error);
      // Fallback to empty data
      setStats({
        totalUsers: 0,
        totalVendors: 0,
        totalManagers: 0,
        pendingApprovals: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        pendingPayouts: 0,
        refundRequests: 0,
        activeUsers: 0,
        suspendedUsers: 0,
        activeVendors: 0,
        pendingVendors: 0,
        totalBookings: 0,
        completedBookings: 0,
        atHomeBookings: 0,
        salonBookings: 0,
        totalCommissions: 0,
        pendingDisputes: 0,
        averageRating: 0
      });
      setRecentActivity([]);
      setTopVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'user_registered':
        return <UserPlus className="w-4 h-4" />;
      case 'booking_confirmed':
        return <Calendar className="w-4 h-4" />;
      case 'payment_received':
        return <CreditCard className="w-4 h-4" />;
      case 'vendor_approved':
        return <Building className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };


  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading admin dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold text-[#4e342e] mb-2">Admin Dashboard</h1>
              <p className="text-[#6d4c41]">Welcome back, {user?.firstName}! Here's your platform overview.</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" className="border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6d4c41]">Total Users</p>
                    <p className="text-2xl font-bold text-[#4e342e]">{stats.totalUsers.toLocaleString()}</p>
                    <div className="flex items-center mt-2">
                      <Badge className="bg-[#f8d7da]/30 text-[#4e342e] text-xs">
                        {stats.activeUsers} Active
                      </Badge>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-[#4e342e] to-[#6d4c41] rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6d4c41]">Total Vendors</p>
                    <p className="text-2xl font-bold text-[#4e342e]">{stats.totalVendors.toLocaleString()}</p>
                    <div className="flex items-center mt-2">
                      <Badge className="bg-[#6d4c41]/20 text-[#6d4c41] text-xs">
                        {stats.pendingVendors} Pending
                      </Badge>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-[#4e342e] to-[#6d4c41] rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6d4c41]">Total Managers</p>
                    <p className="text-2xl font-bold text-[#4e342e]">{stats.totalManagers.toLocaleString()}</p>
                    <div className="flex items-center mt-2">
                      <Badge className="bg-[#f8d7da]/30 text-[#4e342e] text-xs">
                        {stats.totalManagers} Active
                      </Badge>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-[#4e342e] to-[#6d4c41] rounded-lg flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6d4c41]">Total Revenue</p>
                    <p className="text-2xl font-bold text-[#4e342e]">${stats.totalRevenue.toLocaleString()}</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="w-4 h-4 text-[#6d4c41] mr-1" />
                      <span className="text-sm text-[#6d4c41]">${stats.monthlyRevenue} this month</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-[#4e342e] to-[#6d4c41] rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Additional Stats Row */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6d4c41]">Pending Approvals</p>
                    <p className="text-2xl font-bold text-[#4e342e]">{stats.pendingApprovals}</p>
                    <div className="flex items-center mt-2">
                      <Badge className="bg-[#6d4c41]/20 text-[#6d4c41] text-xs">
                        Requires Action
                      </Badge>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-[#4e342e] to-[#6d4c41] rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6d4c41]">Total Bookings</p>
                    <p className="text-2xl font-bold text-[#4e342e]">{stats.totalBookings.toLocaleString()}</p>
                    <div className="flex items-center mt-2">
                      <CheckCircle className="w-4 h-4 text-[#6d4c41] mr-1" />
                      <span className="text-sm text-[#6d4c41]">{stats.completedBookings} completed</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-[#4e342e] to-[#6d4c41] rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6d4c41]">Pending Payouts</p>
                    <p className="text-2xl font-bold text-[#4e342e]">${stats.pendingPayouts.toLocaleString()}</p>
                    <div className="flex items-center mt-2">
                      <Badge className="bg-[#6d4c41]/20 text-[#6d4c41] text-xs">
                        Awaiting Approval
                      </Badge>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-[#4e342e] to-[#6d4c41] rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6d4c41]">Refund Requests</p>
                    <p className="text-2xl font-bold text-[#4e342e]">{stats.refundRequests}</p>
                    <div className="flex items-center mt-2">
                      <Badge className="bg-[#6d4c41]/20 text-[#6d4c41] text-xs">
                        Needs Review
                      </Badge>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-[#4e342e] to-[#6d4c41] rounded-lg flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        


        {/* Recent Activity */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-serif font-bold text-[#4e342e]">Recent Activity</h2>
            <Link to="/admin/activities">
              <Button variant="outline" className="border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white">
                <Eye className="w-4 h-4 mr-2" />
                View All Activity
              </Button>
            </Link>
          </div>

          <Card className="border-0 bg-white shadow-lg">
            <CardContent className="p-0">
              <div className="divide-y divide-[#f8d7da]">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="p-4 hover:bg-[#fdf6f0] transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-[#4e342e] rounded-full flex items-center justify-center">
                        {getStatusIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#4e342e]">{activity.description}</p>
                        <p className="text-xs text-[#6d4c41]">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                        {activity.user && (
                          <p className="text-xs text-[#6d4c41]">
                            {activity.user.name} ({activity.user.email})
                          </p>
                        )}
                        {activity.amount && (
                          <p className="text-xs text-[#4e342e] font-semibold">
                            ${activity.amount}
                          </p>
                        )}
                      </div>
                      <Badge className="bg-[#4e342e] text-white">
                        {activity.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        

        {/* System Health */}
        <div className="mb-8">
          <h2 className="text-2xl font-serif font-bold text-[#4e342e] mb-4">System Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-0 bg-white shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                <p className="text-sm font-medium text-[#4e342e]">Database</p>
                <p className="text-xs text-[#6d4c41]">Healthy</p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                <p className="text-sm font-medium text-[#4e342e]">API Services</p>
                <p className="text-xs text-[#6d4c41]">Operational</p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white shadow-lg">
              <CardContent className="p-4 text-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                <p className="text-sm font-medium text-[#4e342e]">Payment Gateway</p>
                <p className="text-xs text-[#6d4c41]">Connected</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
