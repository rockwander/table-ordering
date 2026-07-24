'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Checkbox,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ImageIcon from '@mui/icons-material/Image';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import { Category, MenuItem as MenuItemType } from '@/types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableRowProps {
  item: MenuItemType;
  onEdit: (item: MenuItemType) => void;
  onDelete: (id: string) => void;
  onToggleTopSelling: (id: string, currentStatus: boolean) => void;
  onImageClick: (item: MenuItemType) => void;
  selected: boolean;
  onToggleSelect: (id: string) => void;
}

function SortableRow({ item, onEdit, onDelete, onToggleTopSelling, onImageClick, selected, onToggleSelect }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} hover selected={selected}>
      <TableCell padding="checkbox">
        <Checkbox
          checked={selected}
          onChange={() => onToggleSelect(item.id)}
        />
      </TableCell>
      <TableCell {...attributes} {...listeners} sx={{ cursor: 'grab', width: 50 }}>
        <DragIndicatorIcon sx={{ color: 'action.disabled' }} />
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            src={item.image_url || ''}
            variant="rounded"
            sx={{ width: 40, height: 40, bgcolor: 'grey.300' }}
          >
            <ImageIcon />
          </Avatar>
          <Typography>{item.name}</Typography>
        </Box>
      </TableCell>
      <TableCell>₹{item.price.toFixed(2)}</TableCell>
      <TableCell align="center">
        <Chip
          label={item.is_vegetarian ? 'Veg' : 'Non-Veg'}
          size="small"
          color={item.is_vegetarian ? 'success' : 'error'}
        />
      </TableCell>
      <TableCell align="center">
        <Chip
          label={item.is_available ? 'Available' : 'Unavailable'}
          size="small"
          color={item.is_available ? 'success' : 'default'}
        />
      </TableCell>
      <TableCell align="center">
        <IconButton
          size="small"
          onClick={() => onToggleTopSelling(item.id, item.is_top_selling)}
          sx={{ color: item.is_top_selling ? 'warning.main' : 'action.disabled' }}
          title={item.is_top_selling ? 'Remove from top selling' : 'Mark as top selling'}
        >
          {item.is_top_selling ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
        </IconButton>
      </TableCell>
      <TableCell align="right">
        <IconButton size="small" onClick={() => onImageClick(item)} title="Add/Change Image">
          <ImageIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={() => onEdit(item)}>
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" color="error" onClick={() => onDelete(item.id)}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}

function MenuContent() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [availabilityFilter, setAvailabilityFilter] = useState<'active' | 'inactive'>('active');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Initialize sensors once for all drag-and-drop contexts
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Category Dialog State
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    display_order: 0,
    is_active: true,
  });

  // Menu Item Dialog State
  const [itemDialog, setItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemType | null>(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: 0,
    category_id: '',
    is_available: true,
    is_vegetarian: true,
    is_top_selling: false,
    image_url: '',
    display_order: 0,
  });

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Image Dialog State
  const [imageDialog, setImageDialog] = useState(false);
  const [editingImage, setEditingImage] = useState<MenuItemType | null>(null);
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Clear selections when changing availability filter
    setSelectedItems(new Set());
  }, [availabilityFilter]);

  const fetchData = async () => {
    try {
      const [categoriesRes, itemsRes] = await Promise.all([
        supabase.from('categories').select('*').order('display_order'),
        supabase.from('menu_items').select('*').order('display_order'),
      ]);

      if (categoriesRes.error) throw categoriesRes.error;
      if (itemsRes.error) throw itemsRes.error;

      setCategories(categoriesRes.data || []);
      setMenuItems(itemsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch menu data');
    } finally {
      setLoading(false);
    }
  };

  // Category Handlers
  const handleOpenCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        description: category.description || '',
        display_order: category.display_order,
        is_active: category.is_active,
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        description: '',
        display_order: categories.length,
        is_active: true,
      });
    }
    setCategoryDialog(true);
  };

  const handleSaveCategory = async () => {
    setSaving(true);
    setError('');

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update({ ...categoryForm, updated_at: new Date().toISOString() })
          .eq('id', editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categories').insert(categoryForm);
        if (error) throw error;
      }

      await fetchData();
      setCategoryDialog(false);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (error: any) {
      setError(error.message);
    }
  };

  // Menu Item Handlers
  const handleOpenItemDialog = (item?: MenuItemType) => {
    if (item) {
      setEditingItem(item);
      setItemForm({
        name: item.name,
        description: item.description || '',
        price: item.price,
        category_id: item.category_id || '',
        is_available: item.is_available,
        is_vegetarian: item.is_vegetarian,
        is_top_selling: item.is_top_selling,
        image_url: item.image_url || '',
        display_order: item.display_order,
      });
    } else {
      setEditingItem(null);
      setItemForm({
        name: '',
        description: '',
        price: 0,
        category_id: categories[0]?.id || '',
        is_available: true,
        is_vegetarian: true,
        is_top_selling: false,
        image_url: '',
        display_order: menuItems.length,
      });
    }
    setItemDialog(true);
  };

  const handleSaveItem = async () => {
    setSaving(true);
    setError('');

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('menu_items')
          .update({ ...itemForm, updated_at: new Date().toISOString() })
          .eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('menu_items').insert(itemForm);
        if (error) throw error;
      }

      await fetchData();
      setItemDialog(false);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDragEnd = async (event: DragEndEvent, categoryId: string) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const categoryItems = menuItems.filter(item => item.category_id === categoryId);
    const oldIndex = categoryItems.findIndex(item => item.id === active.id);
    const newIndex = categoryItems.findIndex(item => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedItems = arrayMove(categoryItems, oldIndex, newIndex);

    // Update display_order for all affected items
    try {
      const updates = reorderedItems.map((item, index) => ({
        id: item.id,
        display_order: index,
      }));

      await Promise.all(
        updates.map(update =>
          supabase
            .from('menu_items')
            .update({ display_order: update.display_order })
            .eq('id', update.id)
        )
      );

      await fetchData();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleToggleTopSelling = async (itemId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_top_selling: !currentStatus })
        .eq('id', itemId);

      if (error) throw error;
      await fetchData();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleOpenImageDialog = (item: MenuItemType) => {
    setEditingImage(item);
    setImageUrl(item.image_url || '');
    setImageDialog(true);
  };

  const handleSaveImage = async () => {
    if (!editingImage) return;

    setSaving(true);
    setError('');

    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ image_url: imageUrl || null })
        .eq('id', editingImage.id);

      if (error) throw error;
      await fetchData();
      setImageDialog(false);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSelect = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = (categoryId: string) => {
    const categoryItems = getFilteredMenuItems().filter(item => item.category_id === categoryId);
    const categoryItemIds = categoryItems.map(item => item.id);
    const allSelected = categoryItemIds.every(id => selectedItems.has(id));

    const newSelected = new Set(selectedItems);
    if (allSelected) {
      categoryItemIds.forEach(id => newSelected.delete(id));
    } else {
      categoryItemIds.forEach(id => newSelected.add(id));
    }
    setSelectedItems(newSelected);
  };

  const handleBulkUpdateAvailability = async (isAvailable: boolean) => {
    if (selectedItems.size === 0) {
      setError('No items selected');
      return;
    }

    const action = isAvailable ? 'activate' : 'deactivate';
    if (!confirm(`Are you sure you want to ${action} ${selectedItems.size} item(s)?`)) return;

    setSaving(true);
    setError('');

    try {
      const updates = Array.from(selectedItems).map(itemId =>
        supabase
          .from('menu_items')
          .update({ is_available: isAvailable })
          .eq('id', itemId)
      );

      const results = await Promise.all(updates);
      const errors = results.filter(result => result.error);

      if (errors.length > 0) {
        throw new Error(`Failed to update ${errors.length} item(s)`);
      }

      await fetchData();
      setSelectedItems(new Set());
    } catch (error: any) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const getFilteredMenuItems = () => {
    return menuItems.filter(item =>
      availabilityFilter === 'active' ? item.is_available : !item.is_available
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Menu Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage categories and menu items
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={(_, v) => setSelectedTab(v)}>
          <Tab label="Categories" />
          <Tab label="Menu Items" />
        </Tabs>
      </Box>

      {selectedTab === 0 && (
        <Box>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenCategoryDialog()}
            >
              Add Category
            </Button>
          </Box>

          <Grid container spacing={2}>
            {categories.map((category) => (
              <Grid item xs={12} sm={6} md={4} key={category.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                      <Typography variant="h6" fontWeight={600}>
                        {category.name}
                      </Typography>
                      <Box>
                        <IconButton size="small" onClick={() => handleOpenCategoryDialog(category)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteCategory(category.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    {category.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {category.description}
                      </Typography>
                    )}
                    <Chip
                      label={category.is_active ? 'Active' : 'Inactive'}
                      size="small"
                      color={category.is_active ? 'success' : 'default'}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {selectedTab === 1 && (
        <Box>
          <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenItemDialog()}
            >
              Add Menu Item
            </Button>

            {selectedItems.size > 0 && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip label={`${selectedItems.size} selected`} color="primary" />
                {availabilityFilter === 'active' ? (
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => handleBulkUpdateAvailability(false)}
                    disabled={saving}
                  >
                    Mark as Inactive
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    color="success"
                    size="small"
                    onClick={() => handleBulkUpdateAvailability(true)}
                    disabled={saving}
                  >
                    Mark as Active
                  </Button>
                )}
              </Box>
            )}
          </Box>

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={availabilityFilter} onChange={(_, v) => setAvailabilityFilter(v)}>
              <Tab label="Active Items" value="active" />
              <Tab label="Inactive Items" value="inactive" />
            </Tabs>
          </Box>

          {categories.map((category) => {
            const categoryItems = getFilteredMenuItems().filter(item => item.category_id === category.id);
            if (categoryItems.length === 0) return null;

            const allSelected = categoryItems.every(item => selectedItems.has(item.id));
            const someSelected = categoryItems.some(item => selectedItems.has(item.id)) && !allSelected;

            return (
              <Box key={category.id} sx={{ mb: 4 }}>
                <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
                  {category.name}
                </Typography>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleDragEnd(event, category.id)}
                >
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={allSelected}
                              indeterminate={someSelected}
                              onChange={() => handleSelectAll(category.id)}
                            />
                          </TableCell>
                          <TableCell sx={{ width: 50 }}></TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>Price</TableCell>
                          <TableCell align="center">Type</TableCell>
                          <TableCell align="center">Status</TableCell>
                          <TableCell align="center">Top Selling</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <SortableContext
                          items={categoryItems.map(item => item.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {categoryItems.map((item) => (
                            <SortableRow
                              key={item.id}
                              item={item}
                              onEdit={handleOpenItemDialog}
                              onDelete={handleDeleteItem}
                              onToggleTopSelling={handleToggleTopSelling}
                              onImageClick={handleOpenImageDialog}
                              selected={selectedItems.has(item.id)}
                              onToggleSelect={handleToggleSelect}
                            />
                          ))}
                        </SortableContext>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </DndContext>
              </Box>
            );
          })}

          {getFilteredMenuItems().length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                {availabilityFilter === 'active' ? 'No active menu items' : 'No inactive menu items'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {availabilityFilter === 'active'
                  ? 'Create your first menu item to get started'
                  : 'All items are currently active'}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Category Dialog */}
      <Dialog open={categoryDialog} onClose={() => setCategoryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Category Name"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />
            <TextField
              label="Display Order"
              type="number"
              value={categoryForm.display_order}
              onChange={(e) => setCategoryForm({ ...categoryForm, display_order: parseInt(e.target.value) })}
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={categoryForm.is_active}
                  onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveCategory} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Menu Item Dialog */}
      <Dialog open={itemDialog} onClose={() => setItemDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Item Name"
              value={itemForm.name}
              onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={itemForm.description}
              onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />
            <TextField
              label="Price"
              type="number"
              value={itemForm.price}
              onChange={(e) => setItemForm({ ...itemForm, price: parseFloat(e.target.value) })}
              required
              fullWidth
              inputProps={{ step: '0.01' }}
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={itemForm.category_id}
                label="Category"
                onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value })}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Image URL (Optional)"
              value={itemForm.image_url}
              onChange={(e) => setItemForm({ ...itemForm, image_url: e.target.value })}
              fullWidth
            />
            <TextField
              label="Display Order"
              type="number"
              value={itemForm.display_order}
              onChange={(e) => setItemForm({ ...itemForm, display_order: parseInt(e.target.value) })}
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={itemForm.is_vegetarian}
                  onChange={(e) => setItemForm({ ...itemForm, is_vegetarian: e.target.checked })}
                />
              }
              label="Vegetarian"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={itemForm.is_available}
                  onChange={(e) => setItemForm({ ...itemForm, is_available: e.target.checked })}
                />
              }
              label="Available"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={itemForm.is_top_selling}
                  onChange={(e) => setItemForm({ ...itemForm, is_top_selling: e.target.checked })}
                />
              }
              label="Top Selling"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setItemDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveItem} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={imageDialog} onClose={() => setImageDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add/Change Image for {editingImage?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Image URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              fullWidth
              helperText="Enter a valid image URL (e.g., https://example.com/image.jpg)"
              placeholder="https://example.com/image.jpg"
            />
            {imageUrl && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Preview:
                </Typography>
                <Box
                  component="img"
                  src={imageUrl}
                  alt="Preview"
                  sx={{
                    maxWidth: '100%',
                    maxHeight: 200,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                  onError={(e: any) => {
                    e.target.style.display = 'none';
                  }}
                  onLoad={(e: any) => {
                    e.target.style.display = 'block';
                  }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImageDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveImage} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function AdminMenu() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AdminLayout>
          <MenuContent />
        </AdminLayout>
      </ProtectedRoute>
    </AuthProvider>
  );
}
