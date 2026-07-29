import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type UserRole = 'admin' | 'executive' | null;

export function useUserRole() {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchUserRole() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!isMounted) return;

        if (!user) {
          setRole(null);
          setLoading(false);
          return;
        }

        setUserEmail(user.email || null);

        // Fetch user role from user_roles table
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (!isMounted) return;

        if (error) {
          console.error('Error fetching user role:', error);
          // Default to null if no role found
          setRole(null);
        } else {
          setRole(data.role as UserRole);
        }
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
        if (isMounted) {
          setRole(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    // Set timeout to force loading to false
    const loadingTimeout = setTimeout(() => {
      console.warn('useUserRole: Loading timeout - forcing loading to false');
      if (isMounted) {
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    fetchUserRole().finally(() => {
      clearTimeout(loadingTimeout);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      // Don't show loading spinner for subsequent auth changes
      fetchUserRole();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

  return { role, loading, userEmail, isAdmin: role === 'admin', isExecutive: role === 'executive' };
}
