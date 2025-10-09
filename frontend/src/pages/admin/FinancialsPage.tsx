import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Eye,
  Settings,
  Users,
  Building,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  Download,
  Percent,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

interface Commission {
  id: string;
  type: 'GLOBAL' | 'VENDOR_SPECIFIC';
  vendorId?: string;
  vendorName?: string;
  percentage: number;
  isActive: boolean;
  createdAt: string;
}

interface Payout {
  id: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
  requestedAt: string;
  processedAt?: string;
  description: string;
}

interface Refund {
  id: string;
  bookingId: string;
  customerName: string;
  amount: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
  requestedAt: string;
  processedAt?: string;
}

interface Dispute {
  id: string;
  type: 'CUSTOMER_VS_VENDOR' | 'CUSTOMER_VS_BEAUTICIAN';
  customerName: string;
  vendorName?: string;
  beauticianName?: string;
  amount: number;
  description: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  resolvedAt?: string;
}

const FinancialsPage = () => {
  const { user } = useSupabaseAuth();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('commissions');

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/admin/financials', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCommissions(data.commissions || []);
        setPayouts(data.payouts || []);
        setRefunds(data.refunds || []);
        setDisputes(data.disputes || []);
      } else {
        // Fallback to mock data
        setCommissions([
          {
            id: '1',
            type: 'GLOBAL',
            percentage: 15,
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z'
          },
          {
            id: '2',
            type: 'VENDOR_SPECIFIC',
            vendorId: '1',
            vendorName: 'Elegant Beauty Salon',
            percentage: 12,
            isActive: true,
            createdAt: '2024-02-15T10:00:00Z'
          }
        ]);

        setPayouts([
          {
            id: '1',
            vendorId: '1',
            vendorName: 'Elegant Beauty Salon',
            amount: 850,
            status: 'PENDING',
            requestedAt: '2024-12-20T10:00:00Z',
            description: 'Weekly payout for completed services'
          },
          {
            id: '2',
            vendorId: '2',
            vendorName: 'Zen Spa & Wellness',
            amount: 420,
            status: 'APPROVED',
            requestedAt: '2024-12-19T15:30:00Z',
            processedAt: '2024-12-20T09:00:00Z',
            description: 'Monthly payout'
          }
        ]);

        setRefunds([
          {
            id: '1',
            bookingId: 'BK001',
            customerName: 'Emily Davis',
            amount: 120,
            reason: 'Service not as described',
            status: 'PENDING',
            requestedAt: '2024-12-20T14:00:00Z'
          },
          {
            id: '2',
            bookingId: 'BK002',
            customerName: 'Lisa Wilson',
            amount: 85,
            reason: 'Cancelled appointment',
            status: 'APPROVED',
            requestedAt: '2024-12-19T16:00:00Z',
            processedAt: '2024-12-20T10:00:00Z'
          }
        ]);

        setDisputes([
          {
            id: '1',
            type: 'CUSTOMER_VS_VENDOR',
            customerName: 'Sarah Johnson',
            vendorName: 'Nail Art Studio',
            amount: 65,
            description: 'Customer claims service was not completed properly',
            status: 'INVESTIGATING',
            createdAt: '2024-12-20T11:00:00Z'
          },
          {
            id: '2',
            type: 'CUSTOMER_VS_BEAUTICIAN',
            customerName: 'Mike Brown',
            beauticianName: 'Jennifer Lee',
            amount: 95,
            description: 'Beautician arrived late and service was rushed',
            status: 'RESOLVED',
            createdAt: '2024-12-18T09:00:00Z',
            resolvedAt: '2024-12-19T15:00:00Z'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const updateCommission = async (commissionId: string, percentage: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/admin/commissions/${commissionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ percentage })
      });

      if (response.ok) {
        toast.success('Commission updated successfully!');
        fetchFinancialData();
      } else {
        toast.error('Failed to update commission');
      }
    } catch (error) {
      console.error('Error updating commission:', error);
      toast.error('Failed to update commission');
    }
  };

  const updatePayoutStatus = async (payoutId: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/admin/payouts/${payoutId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        toast.success(`Payout ${status.toLowerCase()} successfully!`);
        fetchFinancialData();
      } else {
        toast.error(`Failed to ${status.toLowerCase()} payout`);
      }
    } catch (error) {
      console.error('Error updating payout status:', error);
      toast.error(`Failed to ${status.toLowerCase()} payout`);
    }
  };

  const updateRefundStatus = async (refundId: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/admin/refunds/${refundId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        toast.success(`Refund ${status.toLowerCase()} successfully!`);
        fetchFinancialData();
      } else {
        toast.error(`Failed to ${status.toLowerCase()} refund`);
      }
    } catch (error) {
      console.error('Error updating refund status:', error);
      toast.error(`Failed to ${status.toLowerCase()} refund`);
    }
  };

  const updateDisputeStatus = async (disputeId: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/admin/disputes/${disputeId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        toast.success(`Dispute ${status.toLowerCase()} successfully!`);
        fetchFinancialData();
      } else {
        toast.error(`Failed to ${status.toLowerCase()} dispute`);
      }
    } catch (error) {
      console.error('Error updating dispute status:', error);
      toast.error(`Failed to ${status.toLowerCase()} dispute`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
      case 'PAID':
      case 'PROCESSED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
      case 'CLOSED':
        return 'bg-red-100 text-red-800';
      case 'INVESTIGATING':
        return 'bg-blue-100 text-blue-800';
      case 'RESOLVED':
        return 'bg-purple-100 text-purple-800';
      case 'OPEN':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const tabs = [
    { id: 'commissions', label: 'Commissions', icon: Percent },
    { id: 'payouts', label: 'Payouts', icon: CreditCard },
    { id: 'refunds', label: 'Refunds', icon: TrendingDown },
    { id: 'disputes', label: 'Disputes', icon: AlertCircle }
  ];

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <motion.div {...fadeInUp}>
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
              <h1 className="text-3xl font-serif font-bold text-[#4e342e] mb-2">Financial Management</h1>
              <p className="text-[#6d4c41]">Manage commissions, payouts, refunds, and disputes</p>
            </div>
            <div className="flex items-center space-x-2 mt-4 sm:mt-0">
              <Button
                variant="outline"
                className="border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-[#f8d7da]/20 p-1 rounded-lg">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-[#4e342e] text-white shadow-md'
                      : 'text-[#6d4c41] hover:bg-[#f8d7da]/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-[#4e342e]" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Commissions Tab */}
              {activeTab === 'commissions' && (
                <Card className="border-0 bg-white shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-[#4e342e] flex items-center">
                      <Percent className="w-5 h-5 mr-2" />
                      Commission Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {commissions.map((commission) => (
                        <div key={commission.id} className="flex items-center justify-between p-4 bg-[#f8d7da]/20 rounded-lg">
                          <div>
                            <h4 className="font-semibold text-[#4e342e]">
                              {commission.type === 'GLOBAL' ? 'Global Commission' : commission.vendorName}
                            </h4>
                            <p className="text-sm text-[#6d4c41]">
                              {commission.type === 'GLOBAL' ? 'Applied to all vendors' : 'Vendor-specific override'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <div className="text-2xl font-bold text-[#4e342e]">{commission.percentage}%</div>
                              <div className="text-sm text-[#6d4c41]">Commission Rate</div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-[#4e342e] text-[#4e342e] hover:bg-[#4e342e] hover:text-white"
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payouts Tab */}
              {activeTab === 'payouts' && (
                <Card className="border-0 bg-white shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-[#4e342e] flex items-center">
                      <CreditCard className="w-5 h-5 mr-2" />
                      Vendor Payouts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {payouts.map((payout) => (
                        <div key={payout.id} className="flex items-center justify-between p-4 bg-[#f8d7da]/20 rounded-lg">
                          <div>
                            <h4 className="font-semibold text-[#4e342e]">{payout.vendorName}</h4>
                            <p className="text-sm text-[#6d4c41]">{payout.description}</p>
                            <p className="text-xs text-[#6d4c41]">Requested: {formatDate(payout.requestedAt)}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <div className="text-xl font-bold text-[#4e342e]">{formatCurrency(payout.amount)}</div>
                              <Badge className={getStatusColor(payout.status)}>
                                {payout.status}
                              </Badge>
                            </div>
                            {payout.status === 'PENDING' && (
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => updatePayoutStatus(payout.id, 'APPROVED')}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updatePayoutStatus(payout.id, 'REJECTED')}
                                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                >
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Refunds Tab */}
              {activeTab === 'refunds' && (
                <Card className="border-0 bg-white shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-[#4e342e] flex items-center">
                      <TrendingDown className="w-5 h-5 mr-2" />
                      Refund Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {refunds.map((refund) => (
                        <div key={refund.id} className="flex items-center justify-between p-4 bg-[#f8d7da]/20 rounded-lg">
                          <div>
                            <h4 className="font-semibold text-[#4e342e]">{refund.customerName}</h4>
                            <p className="text-sm text-[#6d4c41]">Booking: {refund.bookingId}</p>
                            <p className="text-sm text-[#6d4c41]">Reason: {refund.reason}</p>
                            <p className="text-xs text-[#6d4c41]">Requested: {formatDate(refund.requestedAt)}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <div className="text-xl font-bold text-[#4e342e]">{formatCurrency(refund.amount)}</div>
                              <Badge className={getStatusColor(refund.status)}>
                                {refund.status}
                              </Badge>
                            </div>
                            {refund.status === 'PENDING' && (
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => updateRefundStatus(refund.id, 'APPROVED')}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateRefundStatus(refund.id, 'REJECTED')}
                                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                >
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Disputes Tab */}
              {activeTab === 'disputes' && (
                <Card className="border-0 bg-white shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-[#4e342e] flex items-center">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      Dispute Resolution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {disputes.map((dispute) => (
                        <div key={dispute.id} className="flex items-center justify-between p-4 bg-[#f8d7da]/20 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-semibold text-[#4e342e]">{dispute.customerName}</h4>
                            <p className="text-sm text-[#6d4c41]">
                              vs {dispute.vendorName || dispute.beauticianName}
                            </p>
                            <p className="text-sm text-[#6d4c41] mt-1">{dispute.description}</p>
                            <p className="text-xs text-[#6d4c41]">Created: {formatDate(dispute.createdAt)}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <div className="text-xl font-bold text-[#4e342e]">{formatCurrency(dispute.amount)}</div>
                              <Badge className={getStatusColor(dispute.status)}>
                                {dispute.status}
                              </Badge>
                            </div>
                            {dispute.status === 'OPEN' && (
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => updateDisputeStatus(dispute.id, 'INVESTIGATING')}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Investigate
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => updateDisputeStatus(dispute.id, 'RESOLVED')}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Resolve
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default FinancialsPage;
