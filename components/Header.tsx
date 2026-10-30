'use client';

import { AppBar, Toolbar, Container, Typography, Box, IconButton, Badge, Button } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import Logo from './Logo';
import OrderStatusToast from './OrderStatusToast';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  tableNumber?: string;
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
    <>
    {tableNumber && !isAdmin && <OrderStatusToast tableNumber={tableNumber} />}
    <AppBar position="sticky" color="primary" elevation={1}>
      <Container maxWidth="lg">
        <Toolbar sx={{ justifyContent: 'space-between', gap: 1, py: 1, px: { xs: 0, sm: 2 } }}>
          <Logo size="small" showText={true} onDark showVegBadge />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {tableNumber && (
              <>
                {outstandingOrdersCount > 0 ? (
                  <Button
                    variant="contained"
                    onClick={() => router.push(`/settle?table=${tableNumber}`)}
                    sx={{
                      px: { xs: 2, sm: 3 },
                      py: 1.25,
                      borderRadius: 1,
                      minWidth: { xs: 0, sm: 120 },
                      flexShrink: 0,
                      boxShadow: 2,
                      fontWeight: 700,
                      fontSize: '1rem',
                      bgcolor: 'background.paper',
                      color: 'primary.main',
                      textTransform: 'none',
                      userSelect: 'none',
                      WebkitTapHighlightColor: 'transparent',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: 'background.default',
                        boxShadow: 3,
                        transform: 'translateY(-1px)',
                      },
                      '&:active': {
                        transform: 'translateY(0)',
                      },
                    }}
                  >
                    Settle Bill
                  </Button>
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 1.5,
                      py: 0.75,
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                      color: 'primary.main',
                    }}
                  >
                    <Typography variant="body2" fontWeight={600} color="inherit" sx={{ whiteSpace: 'nowrap' }}>
                      Table {tableNumber}
                    </Typography>
                  </Box>
                )}
              </>
            )}

            {isAdmin && (
              <Typography variant="body2" fontWeight={600} sx={{ color: 'background.paper' }}>
                Admin Dashboard
              </Typography>
            )}

            {showCart && (
              <IconButton
                color="primary"
                onClick={() => router.push(`/menu?table=${tableNumber}`)}
                sx={{
                  bgcolor: 'background.paper',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'background.default',
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
    </>
  );
}
