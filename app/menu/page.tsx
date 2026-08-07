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
  TextField,
  InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import Header from '@/components/Header';
import HighlightCircles from '@/components/HighlightCircles';
import StoryViewer from '@/components/StoryViewer';
import { supabase } from '@/lib/supabase';
import { Category, MenuItem } from '@/types';
import { useCart } from '@/contexts/CartContext';

interface Story {
  id: string;
  category_id: string;
  image_url: string;
  caption: string | null;
  gujarati_caption: string | null;
  display_order: number;
  duration: number;
}

interface HighlightCategory {
  id: string;
  name: string;
  gujarati_name: string | null;
  cover_image_url: string | null;
  display_order: number;
  is_active: boolean;
  highlight_stories?: Story[];
}

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHighlight, setSelectedHighlight] = useState<HighlightCategory | null>(null);

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
        .eq('table_number', tableNumber!)
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
      ? // For "All Items", show top selling items first
        [...menuItems]
          .filter((item) =>
            searchQuery === '' ||
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .sort((a, b) => {
            // Top selling items come first
            if (a.is_top_selling && !b.is_top_selling) return -1;
            if (!a.is_top_selling && b.is_top_selling) return 1;
            // If both are top selling or both are not, maintain display_order
            return a.display_order - b.display_order;
          })
      : // For specific categories, use display_order as-is
        menuItems.filter((item) =>
          item.category_id === selectedCategory &&
          (searchQuery === '' || item.name.toLowerCase().includes(searchQuery.toLowerCase()))
        );

  // Separate top selling items for "All Items" view
  const topSellingItems = selectedCategory === 'all'
    ? filteredItems.filter(item => item.is_top_selling)
    : [];

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

  // Group top 5 items per category for "All Items" view
  // Include ALL items (including top-selling) in the top 5 of each category
  const top5ByCategory = selectedCategory === 'all'
    ? categories.map(category => ({
        category,
        items: filteredItems
          .filter(item => item.category_id === category.id)
          .slice(0, 5), // Take only top 5, including top-selling items
      })).filter(group => group.items.length > 0)
    : [];

  // Regular items for "All Items" complete list (exclude top-selling)
  const regularItems = selectedCategory === 'all'
    ? filteredItems.filter(item => !item.is_top_selling)
    : filteredItems;

  const handleBuzzer = async () => {
    if (buzzerSending || !tableNumber) return;

    console.log('📞 Calling waiter for table:', tableNumber);
    setBuzzerSending(true);
    try {
      const { data, error } = await supabase
        .from('buzzer_notifications')
        .insert({
          table_number: tableNumber,
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
        tableNumber={tableNumber}
        showCart={false}
        outstandingOrdersCount={outstandingOrdersCount}
        outstandingTotal={outstandingTotal}
      />

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* Story Highlights */}
        <Box sx={{ mb: 3, mx: -1 }}>
          <HighlightCircles onHighlightClick={setSelectedHighlight} />
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom fontWeight={700}>
            Our Menu
          </Typography>
          <Box
            sx={{
              bgcolor: 'success.main',
              px: 2,
              py: 1.5,
              borderRadius: 1,
              display: 'inline-block',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                fontSize: '0.95rem',
                color: 'white',
              }}
            >
              10% off on all orders placed via this app
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontStyle: 'italic',
                display: 'block',
                mt: 0.5,
                color: 'white',
                opacity: 0.9,
              }}
            >
              Offer will be auto-applied while settling bill
            </Typography>
          </Box>
        </Box>

        {/* Search Bar */}
        {selectedCategory === 'all' && (
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchQuery('')}
                      edge="end"
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                bgcolor: 'background.paper',
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
          </Box>
        )}

        {/* Category Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={selectedCategory}
            onChange={(_, value) => {
              setSelectedCategory(value);
              setSearchQuery(''); // Clear search when changing tabs
            }}
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
        <Box>
          {/* Top Selling Items Group */}
          {topSellingItems.length > 0 && (
            <Box
              sx={{
                mb: 4,
                p: 2,
                background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #FFD700, #FFA500, #FF6B6B, #FF1493) border-box',
                border: '3px solid transparent',
                borderRadius: 2,
              }}
            >
              <Typography variant="h5" fontWeight={700} sx={{ mb: 2, color: 'text.primary' }}>
                Top Selling
              </Typography>
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
                {topSellingItems.map((item) => (
                  <Card
                    key={item.id}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      maxWidth: 360,
                      mx: 'auto',
                      width: '100%',
                    }}
                  >
                    {item.image_url && (
                  <CardMedia
                    component="img"
                    height="140"
                    image={item.image_url}
                    alt={item.name}
                    sx={{ objectFit: 'cover', objectPosition: 'center' }}
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
            </Box>
          )}

          {/* Regular Items - Top 5 per Category + Complete List in All Items view */}
          {selectedCategory === 'all' ? (
            <>
              {/* Top 5 from each category */}
              {top5ByCategory.map(({ category, items }) => (
                <Box key={category.id} sx={{ mb: 4 }}>
                  {/* Category Header */}
                  <Typography
                    variant="h5"
                    fontWeight={700}
                    sx={{
                      mb: 2,
                      p: 2,
                      bgcolor: 'grey.100',
                      borderRadius: 1
                    }}
                  >
                    {category.name}
                  </Typography>

                  {/* Category Items Grid - Top 5 only */}
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
                    {items.map((item) => (
                      <Card
                        key={item.id}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          height: '100%',
                          maxWidth: 360,
                          mx: 'auto',
                          width: '100%',
                        }}
                      >
                        {item.image_url && (
                          <CardMedia
                            component="img"
                            height="140"
                            image={item.image_url}
                            alt={item.name}
                            sx={{ objectFit: 'cover', objectPosition: 'center' }}
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
                </Box>
              ))}

              {/* Complete list of all regular items */}
              {regularItems.length > 0 && (
                <Box sx={{ mt: 6 }}>
                  <Typography
                    variant="h5"
                    fontWeight={700}
                    sx={{
                      mb: 2,
                      p: 2,
                      bgcolor: 'grey.100',
                      borderRadius: 1
                    }}
                  >
                    All Items
                  </Typography>
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
                    {regularItems.map((item) => (
                      <Card
                        key={item.id}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          height: '100%',
                          maxWidth: 360,
                          mx: 'auto',
                          width: '100%',
                        }}
                      >
                        {item.image_url && (
                          <CardMedia
                            component="img"
                            height="140"
                            image={item.image_url}
                            alt={item.name}
                            sx={{ objectFit: 'cover', objectPosition: 'center' }}
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
                </Box>
              )}
            </>
          ) : (
            /* Regular Items - Flat view for specific categories */
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
              {regularItems.map((item) => (
              <Card
                key={item.id}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  maxWidth: 360,
                  mx: 'auto',
                  width: '100%',
                }}
              >
                {item.image_url && (
                  <CardMedia
                    component="img"
                    height="140"
                    image={item.image_url}
                    alt={item.name}
                    sx={{ objectFit: 'cover', objectPosition: 'center' }}
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
          )}
        </Box>

        {(topSellingItems.length === 0 && regularItems.length === 0) && (
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
          top: { xs: 160, sm: 24 },
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

      {/* Story Viewer Modal */}
      <StoryViewer
        category={selectedHighlight}
        onClose={() => setSelectedHighlight(null)}
      />
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
