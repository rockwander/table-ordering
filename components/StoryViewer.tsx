'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, Typography, IconButton, LinearProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useLanguage } from '@/contexts/LanguageContext';

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

interface StoryViewerProps {
  category: HighlightCategory | null;
  onClose: () => void;
}

export default function StoryViewer({ category, onClose }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { language } = useLanguage();
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const storyTimeout = useRef<NodeJS.Timeout | null>(null);

  const stories = category?.highlight_stories || [];
  const currentStory = stories[currentIndex];

  // Reset index if stories change and current index is out of bounds
  useEffect(() => {
    if (stories.length > 0 && currentIndex >= stories.length) {
      setCurrentIndex(0);
    }
  }, [stories.length, currentIndex]);

  useEffect(() => {
    if (!category || stories.length === 0 || !currentStory) return;

    // Reset progress when story changes
    setProgress(0);

    if (isPaused) return;

    const duration = currentStory.duration || 5000;
    const progressStep = 100 / (duration / 50); // Update every 50ms

    // Progress bar animation
    progressInterval.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 100;
        }
        return prev + progressStep;
      });
    }, 50);

    // Auto-advance to next story
    storyTimeout.current = setTimeout(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        if (nextIndex >= stories.length) {
          // Close viewer when reaching the end
          setTimeout(() => onClose(), 100);
          return prevIndex;
        }
        return nextIndex;
      });
    }, duration);

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
      if (storyTimeout.current) clearTimeout(storyTimeout.current);
    };
  }, [currentIndex, category, isPaused, currentStory, stories.length]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  const getCaption = (story: Story) => {
    if (language === 'gu' && story.gujarati_caption) {
      return story.gujarati_caption;
    }
    return story.caption || '';
  };

  const getCategoryName = () => {
    if (!category) return '';
    if (language === 'gu' && category.gujarati_name) {
      return category.gujarati_name;
    }
    return category.name;
  };

  if (!category || stories.length === 0) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={handlePauseResume}
    >
      {/* Close button */}
      <IconButton
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          color: 'white',
          zIndex: 10001,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
        }}
      >
        <CloseIcon />
      </IconButton>

      {/* Progress bars */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          right: 64,
          display: 'flex',
          gap: 0.5,
          zIndex: 10001,
        }}
      >
        {stories.map((_, index) => (
          <Box
            key={index}
            sx={{
              flex: 1,
              height: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            <LinearProgress
              variant="determinate"
              value={
                index < currentIndex ? 100 :
                index === currentIndex ? progress :
                0
              }
              sx={{
                height: '100%',
                backgroundColor: 'transparent',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: 'white',
                },
              }}
            />
          </Box>
        ))}
      </Box>

      {/* Category name */}
      <Typography
        variant="subtitle1"
        sx={{
          position: 'absolute',
          top: 32,
          left: 16,
          color: 'white',
          fontWeight: 'bold',
          zIndex: 10001,
          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
        }}
      >
        {getCategoryName()}
      </Typography>

      {/* Navigation arrows */}
      {currentIndex > 0 && (
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            handlePrevious();
          }}
          sx={{
            position: 'absolute',
            left: 16,
            color: 'white',
            zIndex: 10001,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            },
          }}
        >
          <ArrowBackIosNewIcon />
        </IconButton>
      )}

      {currentIndex < stories.length - 1 && (
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          sx={{
            position: 'absolute',
            right: 16,
            color: 'white',
            zIndex: 10001,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            },
          }}
        >
          <ArrowForwardIosIcon />
        </IconButton>
      )}

      {/* Story content */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 500,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Story image */}
        {currentStory && currentStory.image_url && (
          <Box
            component="img"
            src={currentStory.image_url}
            alt={getCaption(currentStory)}
            sx={{
              maxWidth: '100%',
              maxHeight: '85vh',
              objectFit: 'contain',
              userSelect: 'none',
            }}
          />
        )}

        {/* Caption */}
        {currentStory && getCaption(currentStory) && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 40,
              left: 16,
              right: 16,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              borderRadius: 2,
              p: 2,
            }}
          >
            <Typography
              variant="body1"
              sx={{
                color: 'white',
                textAlign: 'center',
              }}
            >
              {getCaption(currentStory)}
            </Typography>
          </Box>
        )}

        {/* Pause indicator */}
        {isPaused && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '50%',
              width: 80,
              height: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <Typography variant="h4" sx={{ color: 'white' }}>
              ⏸
            </Typography>
          </Box>
        )}
      </Box>

      {/* Story counter */}
      <Typography
        variant="caption"
        sx={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          px: 2,
          py: 0.5,
          borderRadius: 2,
        }}
      >
        {currentIndex + 1} / {stories.length}
      </Typography>
    </Box>
  );
}
