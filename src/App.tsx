import { Toaster } from "@/components/ui/toaster";
import NotificationToaster from "@/components/NotificationToaster";
import MessageToaster from "@/components/MessageToaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { CallProvider } from "@/contexts/CallContext";
import { PrivateRoute } from "@/components/PrivateRoute";
import { AdminRoute } from "@/components/AdminRoute";
import Index from "./pages/Index";
import MessagingPage from "./pages/MessagingPage";
import MessageRedirect from "./pages/MessageRedirect";
import BrowseBooksPage from "./pages/BrowseBooksPage";
import RegistrationPage from "./pages/RegistrationPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import UserProfilePage from "./pages/UserProfilePage";
import NotFound from "./pages/NotFound";
import AuthCallback from "./pages/AuthCallback";
import BookDetailPage from "./pages/BookDetailPage";
import BookPurchaseRequestPage from "./pages/BookPurchaseRequestPage";
import AllDepartmentsPage from "./pages/AllDepartmentsPage";
import NotAllowedPage from "./pages/NotAllowedPage";
import VerificationPage from "./pages/VerificationPage";
import VerificationStepTwo from "./pages/VerificationStepTwo";
import AdminDashboard from "./pages/AdminDashboard";
import AdminVerificationPage from "./pages/AdminVerificationPage";
import AdminVerificationDetailPage from "@/pages/AdminVerificationDetailPage";
import AdminReportsPage from "@/pages/AdminReportsPage";
import SellBookPage from "./pages/SellBookPage";
import VerificationDetailsPage from "@/pages/VerificationDetailsPage";
import VerificationApprovedPage from "@/pages/VerificationApprovedPage";
import BannedUserPage from "@/pages/BannedUserPage";
import SettingsPage from "@/pages/SettingsPage";
import HelpPage from "@/pages/HelpPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import EmailConfirmationPage from "./pages/EmailConfirmationPage";
import VerifyEmailConfirmPage from "./pages/VerifyEmailConfirmPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { useAuth } from "@/contexts/AuthContext";
import React, { useEffect } from "react";
import { useBanStatusListener } from "./hooks/useBanStatusListener";
import { usePushNotifications } from "./hooks/usePushNotifications";
import FallbackNotification from "@/components/FallbackNotification";
import { initSafariNotificationFix } from "@/lib/safariNotificationFix";

// Debug utility for development
if (process.env.NODE_ENV === 'development') {
  import('./utils/debugVerification');
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// Simple Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">কিছু সমস্যা হয়েছে</h1>
            <p className="text-gray-600 mb-4">অ্যাপ্লিকেশন লোড করতে সমস্যা হয়েছে।</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              পুনরায় চেষ্টা করুন
            </button>
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500">Technical Details</summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded text-red-600 overflow-auto">
                {this.state.error?.toString()}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// BannedUserCheck component to redirect banned users
const BannedUserCheck = ({ children }: { children: React.ReactNode }) => {
  const { user, isBanned, loading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Set up realtime listener for ban status changes
  useBanStatusListener();
  
  // Don't redirect on these paths
  const allowedPaths = ['/banned', '/login'];
  const isAllowedPath = allowedPaths.some(path => location.pathname.startsWith(path));
  
  useEffect(() => {
    // Redirect to banned page if user is banned and not already on an allowed path
    if (user && isBanned && !isAllowedPath && !loading) {
      // Store user ID to pass to banned page
      const userId = user.id;
      
      // Log out the user and redirect to banned page with auto_logout flag
      (async () => {
        await signOut();
        navigate(`/banned?user_id=${userId}&auto_logout=true`);
      })();
    }
  }, [user, isBanned, isAllowedPath, loading, navigate, signOut]);
  
  return <>{children}</>;
};

// AppContent component to use hooks inside the Routes
const AppContent = () => {
  const { user, isBanned, loading } = useAuth();
  
  // Initialize Safari notification fix on app startup
  useEffect(() => {
    initSafariNotificationFix();
  }, []);
  
  // Initialize push notifications when user logs in
  usePushNotifications(user?.id);
  
  // Show loading screen while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">লোড হচ্ছে...</h2>
          <p className="text-gray-600">অ্যাপ্লিকেশন প্রস্তুত করা হচ্ছে</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Toaster />
      <Sonner />
      {/* Toast realtime notifications */}
      <NotificationToaster />
      {/* Toast for incoming chat messages */}
      <MessageToaster />
      {/* Fallback notification for unsupported browsers */}
      <FallbackNotification show={!!user} />
      <BannedUserCheck>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/banned" element={<BannedUserPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/email-confirmation" element={<EmailConfirmationPage />} />
          <Route path="/verify-email-confirm" element={<VerifyEmailConfirmPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
              path="/messages"
              element={
                <PrivateRoute requireEmailVerification={false}>
                  <MessagingPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/message-redirect"
              element={
                <PrivateRoute requireEmailVerification={false}>
                  <MessageRedirect />
                </PrivateRoute>
              }
            />
          <Route path="/browse" element={<BrowseBooksPage />} />
          <Route path="/all-departments" element={<AllDepartmentsPage />} />
          <Route path="/not-allowed" element={<NotAllowedPage />} />
            <Route
              path="/profile"
              element={
                <PrivateRoute requireEmailVerification={false}>
                  <ProfilePage />
                </PrivateRoute>
              }
            />
          <Route path="/book/:id" element={<BookDetailPage />} />
          <Route path="/profile/:id" element={<UserProfilePage />} />
          <Route 
            path="/purchase-request/:id" 
            element={
              <PrivateRoute requireEmailVerification={false}>
                <BookPurchaseRequestPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/verification" 
            element={
              <PrivateRoute requireEmailVerification={false}>
                <VerificationPage />
              </PrivateRoute>
            }
          />
          <Route 
            path="/verification-step2" 
            element={
              <PrivateRoute requireEmailVerification={false}>
                <VerificationStepTwo />
              </PrivateRoute>
            }
          />
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route 
            path="/admin/verification" 
            element={
              <AdminRoute>
                <AdminVerificationPage />
              </AdminRoute>
            }
          />
          <Route 
            path="/admin/verification/:id" 
            element={
              <AdminRoute>
                <AdminVerificationDetailPage />
              </AdminRoute>
            }
          />
          <Route 
            path="/admin/reports" 
            element={
              <AdminRoute>
                <AdminReportsPage />
              </AdminRoute>
            }
          />
          <Route 
            path="/admin/users" 
            element={
              <AdminRoute>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">User Management</h1>
                    <p className="text-gray-600">This page is under development</p>
                  </div>
                </div>
              </AdminRoute>
            }
          />
          <Route 
            path="/admin/analytics" 
            element={
              <AdminRoute>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Analytics Dashboard</h1>
                    <p className="text-gray-600">This page is under development</p>
                  </div>
                </div>
              </AdminRoute>
            }
          />
          <Route path="/verification/details/:id" element={<VerificationDetailsPage />} />
          <Route path="/verification/approved/:id" element={<VerificationApprovedPage />} />
          <Route 
            path="/settings" 
            element={
              <PrivateRoute requireEmailVerification={false}>
                <SettingsPage />
              </PrivateRoute>
            }
          />
          <Route path="/sell-book" element={<SellBookPage />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BannedUserCheck>
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <CallProvider>
              <TooltipProvider>
                <AppContent />
              </TooltipProvider>
            </CallProvider>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;