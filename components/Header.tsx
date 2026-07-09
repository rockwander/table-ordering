'use client';

import { AppBar, Toolbar, Container, Typography, Box, IconButton, Badge } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import Logo from './Logo';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  tableNumber?: number;
  showCart?: boolean;
  cartItemCount?: number;
  isAdmin?: boolean;
}

export default function Header({ tableNumber, showCart = false, cartItemCount = 0, isAdmin = false }: HeaderProps) {
  const router = useRouter();

  return (
    <AppBar position="sticky" color="default" elevation={1}>
      <Container maxWidth="lg">
        <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
          <Logo size="small" showText={true} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {tableNumber && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 0.75,
                  borderRadius: 2,
                  bgcolor: 'primary.main',
                  color: 'white',
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  Table {tableNumber}
                </Typography>
              </Box>
            )}

            {isAdmin && (
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                Admin Dashboard
              </Typography>
            )}

            {showCart && (
              <IconButton
                color="primary"
                onClick={() => router.push(`/menu?table=${tableNumber}`)}
                sx={{
                  bgcolor: 'primary.light',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.main',
                  },
                }}
              >
                <Badge badgeContent={cartItemCount} color="error">
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
