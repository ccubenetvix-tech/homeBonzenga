import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SupabaseAuthProvider, useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { CartProvider } from "@/contexts/CartContext";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import SupabaseConfigStatus from "@/components/SupabaseConfigStatus";
import { supabaseConfig } from "@/config/supabase";

import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import CustomerDashboard from "@/pages/customer/Dashboard";
import CustomerProfilePage from "@/pages/customer/ProfilePage";
import CustomerBookingsPage from "@/pages/customer/BookingsPage";
import AtHomeServicesPage from "@/pages/AtHomeServicesPage";
import SalonVisitPage from "@/pages/SalonVisitPage";
import BookingConfirmationPage from "@/pages/customer/BookingConfirmationPage";
import PaymentPage from "@/pages/customer/PaymentPage";
import PaymentSuccessPage from "@/pages/customer/PaymentSuccessPage";
import VendorDashboard from "@/pages/vendor/Dashboard";
import VendorServicesManagement from "@/pages/vendor/ServicesManagementPage";
import VendorAppointmentsManagement from "@/pages/vendor/AppointmentsManagementPage";
import VendorRevenue from "@/pages/vendor/RevenuePage";
import VendorProfile from "@/pages/vendor/ProfilePage";
import VendorRegistrationPage from "@/pages/auth/VendorRegistrationPage";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminActivitiesPage from "@/pages/admin/ActivitiesPage";
import SearchPage from "@/pages/customer/SearchPage";
import VendorDetailsPage from "@/pages/customer/VendorDetailsPage";
import BookingCheckoutPage from "@/pages/customer/BookingCheckoutPage";
import BookingSuccessPage from "@/pages/customer/BookingSuccessPage";
import ManagerDashboard from "@/pages/manager/Dashboard";
import VendorRegisterPage from "@/pages/vendor/RegisterPage";
import VendorServicesPage from "@/pages/vendor/ServicesPage";
import VendorAppointmentsPage from "@/pages/vendor/AppointmentsPage";
import VendorRevenuePage from "@/pages/vendor/RevenuePage";
import VendorProfilePage from "@/pages/vendor/ProfilePage";
import PendingVendorsPage from "@/pages/manager/PendingVendorsPage";
import AllVendorsPage from "@/pages/manager/AllVendorsPage";
import ManagerAppointmentsPage from "@/pages/manager/AppointmentsPage";
import ManagerReportsPage from "@/pages/manager/ReportsPage";
import AdminUsersPage from "@/pages/admin/UsersPage";
import AdminVendorsPage from "@/pages/admin/VendorsPage";
import AdminManagersPage from "@/pages/admin/ManagersPage";
import AdminFinancialsPage from "@/pages/admin/FinancialsPage";
import AdminReportsPage from "@/pages/admin/ReportsPage";
import AdminSettingsPage from "@/pages/admin/SettingsPage";
import AuthTest from "@/pages/AuthTest";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import SearchPage1 from "@/pages/SearchPage1";
import OAuthCallbackPage from "@/pages/auth/OAuthCallbackPage";

import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

// Loading spinner
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Protected Route component
const ProtectedRoute = ({
  children,
  allowedRoles = ["CUSTOMER", "VENDOR", "ADMIN", "MANAGER"],
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) => {
  const { user, isLoading } = useSupabaseAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <LoginPage />;
  if (!allowedRoles.includes(user.role)) return <NotFound />;

  return <>{children}</>;
};

const App = () => {
  // Show configuration status if Supabase is not configured
  if (!supabaseConfig.isConfigured) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <SupabaseConfigStatus />
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <ScrollToTop />
          <SupabaseAuthProvider>
            <CartProvider>
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/index" element={<Index />} />
                <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/vendor/register" element={<VendorRegisterPage />} />
                    <Route path="/auth-test" element={<AuthTest />} />
                    <Route path="/auth/callback" element={<OAuthCallbackPage />} />
              <Route path="/at-home-services" element={<AtHomeServicesPage />} />
              <Route path="/salon-visit" element={<SalonVisitPage />} />
              <Route path="/vendor/:id" element={<VendorDetailsPage />} />
              <Route path="/booking/checkout" element={<BookingCheckoutPage />} />
              <Route path="/booking/success" element={<BookingSuccessPage />} />

              {/* Protected routes */}
                <Route
                  path="/customer"
                  element={
                    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
                      <CustomerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer/profile"
                  element={
                    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
                      <CustomerProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer/bookings"
                  element={
                    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
                      <CustomerBookingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer/at-home-services"
                  element={
                    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
                      <AtHomeServicesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer/salon-visit"
                  element={
                    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
                      <SalonVisitPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer/booking-confirmation"
                  element={
                    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
                      <BookingConfirmationPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer/payment"
                  element={
                    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
                      <PaymentPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer/payment-success"
                  element={
                    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
                      <PaymentSuccessPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/search" element={<SearchPage />} />

                    <Route
                      path="/vendor"
                      element={
                        <ProtectedRoute allowedRoles={["VENDOR"]}>
                          <VendorDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/vendor/services"
                      element={
                        <ProtectedRoute allowedRoles={["VENDOR"]}>
                          <VendorServicesPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/vendor/appointments"
                      element={
                        <ProtectedRoute allowedRoles={["VENDOR"]}>
                          <VendorAppointmentsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/vendor/revenue"
                      element={
                        <ProtectedRoute allowedRoles={["VENDOR"]}>
                          <VendorRevenuePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/vendor/profile"
                      element={
                        <ProtectedRoute allowedRoles={["VENDOR"]}>
                          <VendorProfilePage />
                        </ProtectedRoute>
                      }
                    />
                <Route
                  path="/manager"
                  element={
                    <ProtectedRoute allowedRoles={["MANAGER"]}>
                      <ManagerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/manager/pending-vendors"
                  element={
                    <ProtectedRoute allowedRoles={["MANAGER"]}>
                      <PendingVendorsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/manager/vendors"
                  element={
                    <ProtectedRoute allowedRoles={["MANAGER"]}>
                      <AllVendorsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/manager/appointments"
                  element={
                    <ProtectedRoute allowedRoles={["MANAGER"]}>
                      <ManagerAppointmentsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/manager/reports"
                  element={
                    <ProtectedRoute allowedRoles={["MANAGER"]}>
                      <ManagerReportsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={["ADMIN"]}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/activities"
                  element={
                    <ProtectedRoute allowedRoles={["ADMIN"]}>
                      <AdminActivitiesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute allowedRoles={["ADMIN"]}>
                      <AdminUsersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/vendors"
                  element={
                    <ProtectedRoute allowedRoles={["ADMIN"]}>
                      <AdminVendorsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/managers"
                  element={
                    <ProtectedRoute allowedRoles={["ADMIN"]}>
                      <AdminManagersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/financials"
                  element={
                    <ProtectedRoute allowedRoles={["ADMIN"]}>
                      <AdminFinancialsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/reports"
                  element={
                    <ProtectedRoute allowedRoles={["ADMIN"]}>
                      <AdminReportsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/settings"
                  element={
                    <ProtectedRoute allowedRoles={["ADMIN"]}>
                      <AdminSettingsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Footer />
            </Suspense>
          </CartProvider>
        </SupabaseAuthProvider>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
