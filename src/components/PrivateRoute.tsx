import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

type PrivateRouteProps = {
  children: React.ReactNode;
  requireEmailVerification?: boolean;
}

export function PrivateRoute({ children, requireEmailVerification = false }: PrivateRouteProps) {
  const { user, loading, emailVerified } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" />
  }
  
  // ইমেইল ভেরিফিকেশন চেক করি যদি requireEmailVerification true হয়
  if (requireEmailVerification && !emailVerified) {
    return <Navigate to="/verify-email" />
  }

  return <>{children}</>
} 