'use client';

import { Box, Typography } from '@mui/material';
import { useLanguage } from '@/contexts/LanguageContext';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  onDark?: boolean; // Light text with a soft shadow, for burgundy headers
  showTagline?: boolean;
  collapsed?: boolean; // Smoothly hides the tagline (e.g. when the header shrinks on scroll)
}

const sizeMap = {
  small: { title: '1.6rem', tagline: '0.55rem' },
  medium: { title: '2rem', tagline: '0.65rem' },
  large: { title: '2.75rem', tagline: '0.85rem' },
};

export default function Logo({
  size = 'medium',
  showText = true,
  onDark = false,
  showTagline = true,
  collapsed = false,
}: LogoProps) {
  const { t } = useLanguage();

  if (!showText) return null;

  return (
    <Box sx={{ display: 'inline-flex', flexDirection: 'column' }}>
      <Typography
        component="span"
        sx={{
          display: 'block',
          fontSize: sizeMap[size].title,
          fontWeight: 400,
          fontFamily: 'var(--font-bree-serif), serif',
          color: onDark ? 'background.paper' : '#000',
          textShadow: onDark ? '0 2px 4px rgba(0, 0, 0, 0.35)' : 'none',
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
        }}
      >
        Ramani&apos;s Café
      </Typography>
      {showTagline && (
        <Typography
          component="span"
          sx={{
            display: 'block',
            fontSize: sizeMap[size].tagline,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            lineHeight: 1.4,
            color: onDark ? 'rgba(251, 247, 240, 0.85)' : 'text.secondary',
            overflow: 'hidden',
            maxHeight: collapsed ? 0 : '1.4em',
            opacity: collapsed ? 0 : 1,
            transition: 'max-height 0.25s ease, opacity 0.2s ease',
          }}
        >
          {t('brand.tagline')}
        </Typography>
      )}
    </Box>
  );
}
