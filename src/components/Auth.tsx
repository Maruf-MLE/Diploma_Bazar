import { Auth as SupabaseAuth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase'

export function Auth() {
  return (
    <div className="w-full max-w-md mx-auto p-6">
      <SupabaseAuth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={['google', 'github']}
        redirectTo="http://localhost:8080/auth/callback"
        theme="dark"
        showLinks={true}
        view="magic_link"
      />
    </div>
  )
} 