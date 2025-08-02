import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

type Profile = {
  id: string
  name: string | null
  institute_name: string | null
  department: string | null
  semester: string | null
  shift: string | null
  roll_number: string | null
  avatar_url: string | null
}

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(null)

  // Fetch profile data and setup realtime subscription
  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    const fetchProfile = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) throw error

        console.log("Profile data fetched in useProfile:", data);
        setProfile(data)
        
        // Setup realtime subscription
        const profileSubscription = supabase
          .channel(`profile-${user.id}`)
          .on('postgres_changes', 
            { 
              event: 'UPDATE', 
              schema: 'public', 
              table: 'profiles', 
              filter: `id=eq.${user.id}` 
            }, 
            (payload) => {
              console.log('Profile update received:', payload)
              setProfile(payload.new as Profile)
            }
          )
          .subscribe()
        
        setSubscription(profileSubscription)
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
    
    // Cleanup subscription when component unmounts or user changes
    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [user])

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!user) throw new Error('No user')

      const { data, error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...updates })
        .select()
        .single()

      if (error) throw error

      // We don't need to manually update state here as the realtime subscription will handle it
      return { data, error: null }
    } catch (err) {
      console.error('Error updating profile:', err)
      return { data: null, error: err instanceof Error ? err.message : 'An error occurred' }
    }
  }
  
  // Upload avatar function
  const uploadAvatar = async (file: File) => {
    try {
      if (!user) throw new Error('No user')
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('File size cannot exceed 2MB')
      }
      
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
        throw new Error('Only JPEG, PNG, and WebP files are allowed')
      }
      
      // Upload file
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)
      
      if (uploadError) throw uploadError
      
      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)
        
      const publicUrl = data.publicUrl
      
      // Update profile with new avatar URL
      const { data: profileData, error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)
        .select()
        .single()
        
      if (updateError) throw updateError
      
      // Again, no need to manually update state, realtime subscription will handle it
      return { data: publicUrl, error: null }
    } catch (err) {
      console.error('Error uploading avatar:', err)
      return { data: null, error: err instanceof Error ? err.message : 'An error occurred' }
    }
  }

  return {
    profile,
    loading,
    error,
    updateProfile,
    uploadAvatar
  }
} 