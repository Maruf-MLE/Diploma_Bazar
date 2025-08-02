import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

type AdminRouteProps = {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && !authLoading) {
      checkAdminStatus()
    } else if (!authLoading && !user) {
      setLoading(false)
    }
  }, [user, authLoading])

  const checkAdminStatus = async () => {
    try {
      console.log('AdminRoute: Checking admin status for user:', user?.id)
      
      if (!user?.id) {
        console.log('AdminRoute: No user ID found')
        setIsAdmin(false)
        setLoading(false)
        return
      }
      
      // RPC ফাংশন দিয়ে এডমিন স্ট্যাটাস চেক করি
      const { data: isAdminUser, error: rpcError } = await supabase.rpc('is_admin', { 
        user_id_param: user.id 
      })
      
      console.log('AdminRoute: Admin RPC result:', { isAdminUser, rpcError })
      
      if (rpcError) {
        console.error('AdminRoute: Error checking admin status:', rpcError)
        setIsAdmin(false)
      } else {
        setIsAdmin(!!isAdminUser)
      }
      
    } catch (error) {
      console.error('AdminRoute: Error in admin check:', error)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  // যদি auth loading বা admin check loading চলে
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">লোড হচ্ছে...</p>
        </div>
      </div>
    )
  }

  // যদি user না থাকে
  if (!user) {
    return <Navigate to="/login" />
  }

  // যদি admin না হয়
  if (!isAdmin) {
    return <Navigate to="/not-allowed" />
  }

  return <>{children}</>
}
