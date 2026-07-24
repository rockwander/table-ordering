'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MobileAdmin() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to mobile dashboard
    router.replace('/mobile/dashboard');
  }, [router]);

  return null;
}
