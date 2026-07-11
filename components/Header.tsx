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
  outstandingOrdersCount?: number;
  outstandingTotal?: number;
}

export default function Header({
  tableNumber,
  showCart = false,
  cartItemCount = 0,
  isAdmin = false,
  outstandingOrdersCount = 0,
  outstandingTotal = 0
}: HeaderProps) {
  const router = useRouter();

  return (
    <AppBar position="sticky" color="default" elevation={1}>
      <Container maxWidth="lg">
        <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
          <Logo size="small" showText={true} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {tableNumber && (
              <Box
                onClick={() => {
                  if (outstandingOrdersCount > 0) {
                    router.push(`/settle?table=${tableNumber}`);
                  }
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 0.75,
                  borderRadius: 2,
                  bgcolor: outstandingOrdersCount > 0 ? 'success.main' : 'primary.main',
                  color: 'white',
                  cursor: outstandingOrdersCount > 0 ? 'pointer' : 'default',
                  '&:hover': outstandingOrdersCount > 0 ? {
                    bgcolor: 'success.dark',
                  } : {},
                }}
              >
                {outstandingOrdersCount > 0 ? (
                  <Typography variant="body2" fontWeight={600}>
                    Settle Bill
                  </Typography>
                ) : (
                  <Typography variant="body2" fontWeight={600}>
                    Table {tableNumber}
                  </Typography>
                )}
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
