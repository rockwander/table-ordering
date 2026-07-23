'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';
import Logo from '@/components/Logo';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to counter menu by default
    const timer = setTimeout(() => {
      router.push('/menu?table=counter');
    }, 1000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        gap: 3,
      }}
    >
      <Logo size="large" showText={true} />
      <CircularProgress />
      <Typography variant="body2" color="text.secondary">
        Loading menu...
      </Typography>
    </Box>
  );
}
