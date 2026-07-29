'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import { useUserRole } from '@/hooks/useUserRole';

interface AdminRouteGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

/**
 * Route guard component that protects admin routes based on user role
 *
 * @param requireAdmin - If true, only admins can access (executives will be redirected)
 */
export default function AdminRouteGuard({ children, requireAdmin = false }: AdminRouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { role, loading, isAdmin, isExecutive } = useUserRole();

  useEffect(() => {
    if (loading) return;

    // If no role found and not on login page, redirect to login
    if (!role && pathname !== '/admin/login') {
      router.push('/admin/login');
      return;
    }

    // If executive user tries to access admin-only page, redirect to live-orders
    if (requireAdmin && isExecutive) {
      router.push('/admin/live-orders');
      return;
    }
  }, [role, loading, isAdmin, isExecutive, pathname, router, requireAdmin]);

  // Show loading spinner while checking role
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // If executive trying to access admin page, show nothing (will redirect)
  if (requireAdmin && isExecutive) {
    return null;
  }

  // If no role and not on login page, show nothing (will redirect)
  if (!role && pathname !== '/admin/login') {
    return null;
  }

  return <>{children}</>;
}
