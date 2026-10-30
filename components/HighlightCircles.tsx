'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { createClient } from '@supabase/supabase-js';
import { useLanguage } from '@/contexts/LanguageContext';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface HighlightCategory {
  id: string;
  name: string;
  gujarati_name: string | null;
  cover_image_url: string | null;
  display_order: number;
  is_active: boolean;
  highlight_stories?: Story[];
}

interface Story {
  id: string;
  category_id: string;
  image_url: string;
  caption: string | null;
  gujarati_caption: string | null;
  display_order: number;
  duration: number;
}

interface HighlightCirclesProps {
  onHighlightClick: (category: HighlightCategory) => void;
}

export default function HighlightCircles({ onHighlightClick }: HighlightCirclesProps) {
  const [categories, setCategories] = useState<HighlightCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { language, t } = useLanguage();

  useEffect(() => {
    fetchHighlights();
  }, []);

  async function fetchHighlights() {
    try {
      const { data, error } = await supabase
        .from('highlight_categories')
        .select(`
          id,
          name,
          gujarati_name,
          cover_image_url,
          display_order,
          is_active,
          highlight_stories (
            id,
            category_id,
            image_url,
            caption,
            gujarati_caption,
            display_order,
            duration
          )
        `)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;

      // Sort stories within each category
      const categoriesWithSortedStories = (data || []).map(cat => ({
        ...cat,
        highlight_stories: (cat.highlight_stories || []).sort(
          (a, b) => a.display_order - b.display_order
        )
      }));

      setCategories(categoriesWithSortedStories);
    } catch (error) {
      console.error('Error fetching highlights:', error);
    } finally {
      setLoading(false);
    }
  }

  const getCategoryName = (category: HighlightCategory) => {
    if (language === 'gu' && category.gujarati_name) {
      return category.gujarati_name;
    }
    return category.name;
  };

  if (loading) {
    return null;
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        overflowX: 'auto',
        py: 2,
        px: 1,
        '&::-webkit-scrollbar': {
          height: 4,
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: 2,
        },
      }}
    >
      {categories.map((category) => {
        // Use cover image or first story's image
        const coverImage = category.cover_image_url ||
          (category.highlight_stories && category.highlight_stories[0]?.image_url);

        return (
          <Box
            key={category.id}
            onClick={() => onHighlightClick(category)}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: 80,
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }}
          >
            <Box
              sx={{
                p: 0.5,
                background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Avatar
                src={coverImage || undefined}
                alt={getCategoryName(category)}
                sx={{
                  width: 64,
                  height: 64,
                  border: '3px solid white',
                  backgroundColor: '#f0f0f0',
                }}
              >
                {!coverImage && getCategoryName(category).charAt(0)}
              </Avatar>
            </Box>
            <Typography
              variant="caption"
              sx={{
                mt: 0.5,
                fontSize: '0.75rem',
                textAlign: 'center',
                maxWidth: 80,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {getCategoryName(category)}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
