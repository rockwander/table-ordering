'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');

  const { addToCart, getCartItemCount } = useCart();

  useEffect(() => {
    if (!tableNumber) {
      router.push('/');
      return;
    }
    fetchMenuData();
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

  const filteredItems =
    selectedCategory === 'all'
      ? menuItems
      : menuItems.filter((item) => item.category_id === selectedCategory);

  const handleOpenDialog = (item: MenuItem) => {
    setSelectedItem(item);
    setQuantity(1);
    setSpecialInstructions('');
  };

  const handleCloseDialog = () => {
    setSelectedItem(null);
    setQuantity(1);
    setSpecialInstructions('');
  };

  const handleAddToCart = () => {
    if (selectedItem) {
      addToCart(selectedItem, quantity, specialInstructions || undefined);
      handleCloseDialog();
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
      <Header tableNumber={parseInt(tableNumber)} showCart={false} />

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
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                height: '100%',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                },
              }}
              onClick={() => handleOpenDialog(item)}
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
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDialog(item);
                      }}
                      sx={{ flexShrink: 0 }}
                    >
                      Add
                    </Button>
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

      {/* Add to Cart Dialog */}
      <Dialog open={!!selectedItem} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        {selectedItem && (
          <>
            <DialogTitle>{selectedItem.name}</DialogTitle>
            <DialogContent>
              {selectedItem.image_url && (
                <Box
                  component="img"
                  src={selectedItem.image_url}
                  alt={selectedItem.name}
                  sx={{
                    width: '100%',
                    height: 200,
                    objectFit: 'cover',
                    borderRadius: 2,
                    mb: 2,
                  }}
                />
              )}
              {selectedItem.description && (
                <Typography variant="body1" paragraph>
                  {selectedItem.description}
                </Typography>
              )}
              <Typography variant="h5" color="primary" fontWeight={700} sx={{ mb: 3 }}>
                ₹{selectedItem.price.toFixed(2)}
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Quantity
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <IconButton
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    color="primary"
                  >
                    <RemoveIcon />
                  </IconButton>
                  <Typography variant="h6" sx={{ minWidth: 40, textAlign: 'center' }}>
                    {quantity}
                  </Typography>
                  <IconButton onClick={() => setQuantity(quantity + 1)} color="primary">
                    <AddIcon />
                  </IconButton>
                </Box>
              </Box>

              <TextField
                fullWidth
                label="Special Instructions (Optional)"
                multiline
                rows={3}
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g., Less spicy, No onions..."
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button variant="contained" onClick={handleAddToCart} startIcon={<AddIcon />}>
                Add to Cart - ₹{(selectedItem.price * quantity).toFixed(2)}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

export default function MenuPage() {
  return <MenuContent />;
}
