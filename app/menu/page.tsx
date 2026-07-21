'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';
import { Category, MenuItem } from '@/types';
import { useCart } from '@/contexts/CartContext';

function MenuContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tableNumber = searchParams.get('table');

  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [outstandingOrdersCount, setOutstandingOrdersCount] = useState(0);
  const [outstandingTotal, setOutstandingTotal] = useState(0);
  const [buzzerSending, setBuzzerSending] = useState(false);
  const [buzzerSuccess, setBuzzerSuccess] = useState(false);

  const { cartItems, addToCart, updateQuantity, removeFromCart, getCartItemCount } = useCart();

  useEffect(() => {
    if (!tableNumber) {
      router.push('/');
      return;
    }
    fetchMenuData();
    fetchOutstandingOrders();
  }, [tableNumber, router]);

  const fetchMenuData = async () => {
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (categoriesError) throw categoriesError;

      // Fetch menu items
      const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('display_order');

      if (itemsError) throw itemsError;

      setCategories(categoriesData || []);
      setMenuItems(itemsData || []);
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOutstandingOrders = async () => {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, total')
        .eq('table_number', parseInt(tableNumber!))
        .neq('status', 'paid')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (orders && orders.length > 0) {
        setOutstandingOrdersCount(orders.length);
        const total = orders.reduce((sum, order) => sum + order.total, 0);
        setOutstandingTotal(total);
      } else {
        setOutstandingOrdersCount(0);
        setOutstandingTotal(0);
      }
    } catch (error) {
      console.error('Error fetching outstanding orders:', error);
    }
  };

  const filteredItems =
    selectedCategory === 'all'
      ? menuItems
      : menuItems.filter((item) => item.category_id === selectedCategory);

  const getItemQuantityInCart = (itemId: string) => {
    const cartItem = cartItems.find((ci) => ci.menuItem.id === itemId);
    return cartItem?.quantity || 0;
  };

  const handleQuantityChange = (item: MenuItem, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(item.id);
    } else {
      updateQuantity(item.id, newQuantity);
    }
  };

  const handleBuzzer = async () => {
    if (buzzerSending || !tableNumber) return;

    console.log('📞 Calling waiter for table:', tableNumber);
    setBuzzerSending(true);
    try {
      const { data, error } = await supabase
        .from('buzzer_notifications')
        .insert({
          table_number: parseInt(tableNumber),
          status: 'active',
          notification_type: 'service_call',
        })
        .select();

      if (error) {
        console.error('❌ Error inserting buzzer notification:', error);
        throw error;
      }

      console.log('✅ Buzzer notification sent:', data);
      setBuzzerSuccess(true);
      setTimeout(() => {
        setBuzzerSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('❌ Error sending buzzer notification:', error);
      alert('Failed to call waiter. Please check the console for errors.');
    } finally {
      setBuzzerSending(false);
    }
  };

  if (!tableNumber) {
    return null;
  }

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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
      <Header
        tableNumber={parseInt(tableNumber)}
        showCart={false}
        outstandingOrdersCount={outstandingOrdersCount}
        outstandingTotal={outstandingTotal}
      />

      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom fontWeight={700}>
            Our Menu
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Choose your favorites and add them to your cart
          </Typography>
        </Box>

        {/* Category Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={selectedCategory}
            onChange={(_, value) => setSelectedCategory(value)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="All Items" value="all" />
            {categories.map((category) => (
              <Tab key={category.id} label={category.name} value={category.id} />
            ))}
          </Tabs>
        </Box>

        {/* Menu Items Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 3,
          }}
        >
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
              }}
            >
                {item.image_url && (
                  <CardMedia
                    component="img"
                    height="180"
                    image={item.image_url}
                    alt={item.name}
                    sx={{ objectFit: 'cover' }}
                  />
                )}
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'start', gap: 1, mb: 1, minWidth: 0 }}>
                    <Typography
                      variant="h6"
                      component="div"
                      sx={{
                        flexGrow: 1,
                        fontSize: '1rem',
                        fontWeight: 600,
                        lineHeight: 1.3,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        wordBreak: 'break-word',
                      }}
                    >
                      {item.name}
                    </Typography>
                    {item.is_vegetarian && (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="Veg"
                        size="small"
                        color="success"
                        sx={{ height: 24, flexShrink: 0 }}
                      />
                    )}
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 2,
                      flexGrow: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      minHeight: '2.5rem',
                    }}
                  >
                    {item.description || '\u00A0'}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto', gap: 1 }}>
                    <Typography variant="h6" color="primary" fontWeight={700} sx={{ whiteSpace: 'nowrap' }}>
                      ₹{item.price.toFixed(2)}
                    </Typography>
                    {getItemQuantityInCart(item.id) === 0 ? (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => addToCart(item, 1)}
                        sx={{ flexShrink: 0 }}
                      >
                        Add
                      </Button>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleQuantityChange(item, getItemQuantityInCart(item.id) - 1)}
                          color="primary"
                          sx={{
                            bgcolor: 'primary.main',
                            color: 'white',
                            '&:hover': { bgcolor: 'primary.dark' },
                            width: 28,
                            height: 28,
                          }}
                        >
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                        <Typography
                          variant="body1"
                          sx={{
                            minWidth: 32,
                            textAlign: 'center',
                            fontWeight: 600,
                          }}
                        >
                          {getItemQuantityInCart(item.id)}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleQuantityChange(item, getItemQuantityInCart(item.id) + 1)}
                          color="primary"
                          sx={{
                            bgcolor: 'primary.main',
                            color: 'white',
                            '&:hover': { bgcolor: 'primary.dark' },
                            width: 28,
                            height: 28,
                          }}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
          ))}
        </Box>

        {filteredItems.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              No items available in this category
            </Typography>
          </Box>
        )}
      </Container>

      {/* Floating Buzzer Button */}
      <Button
        variant="contained"
        size="large"
        color={buzzerSuccess ? 'success' : 'error'}
        onClick={handleBuzzer}
        disabled={buzzerSending}
        startIcon={buzzerSuccess ? <CheckCircleIcon /> : <NotificationsActiveIcon />}
        sx={{
          position: 'fixed',
          top: { xs: 80, sm: 24 },
          right: 24,
          zIndex: 1000,
          px: 3,
          py: 1.5,
          fontSize: { xs: '0.95rem', sm: '1.1rem' },
          fontWeight: 700,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          minWidth: { xs: 'auto', sm: 180 },
          whiteSpace: 'nowrap',
        }}
      >
        {buzzerSuccess ? 'Called!' : 'Call Waiter'}
      </Button>

      {/* Floating Place Order Button */}
      {getCartItemCount() > 0 && (
        <Button
          variant="contained"
          size="large"
          color="primary"
          onClick={() => router.push(`/cart?table=${tableNumber}`)}
          sx={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            px: 4,
            py: 1.5,
            fontSize: { xs: '1rem', sm: '1.1rem' },
            fontWeight: 700,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            minWidth: 200,
            whiteSpace: 'nowrap',
          }}
        >
          Place Order • {getCartItemCount()} {getCartItemCount() === 1 ? 'item' : 'items'}
        </Button>
      )}
    </Box>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<CircularProgress />}>
      <MenuContent />
    </Suspense>
  );
}
