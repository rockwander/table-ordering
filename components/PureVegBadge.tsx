'use client';

import { Box, Typography } from '@mui/material';
import { useLanguage } from '@/contexts/LanguageContext';

// "Pure Vegetarian" mark (leaf sprig + label) shown beside the café name on the burgundy header
export default function PureVegBadge() {
  const { t } = useLanguage();

  return (
    <Box
      role="img"
      aria-label={`${t('brand.pureVeg.line1')} ${t('brand.pureVeg.line2')}`}
      sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0, mt: '2px' }}
    >
      <Box
        component="svg"
        viewBox="0 0 30 28"
        aria-hidden
        sx={{ width: 18, height: 17, overflow: 'visible', ml: '2px', mb: '1px' }}
      >
        {/* Stem */}
        <path d="M6 27 C13 26 18 22 19 15" fill="none" stroke="#7CB342" strokeWidth="2" strokeLinecap="round" />
        {/* Left leaf */}
        <path d="M18 16 C10 17 4 12 3 5 C10 4 17 8 18 16 Z" fill="#7CB342" />
        {/* Middle leaf (light) */}
        <path d="M19 15 C14 10 15 3 21 0 C25 5 24 12 19 15 Z" fill="#FBF7F0" />
        {/* Right leaf */}
        <path d="M19 15 C21 8 26 5 30 6 C30 12 25 16 19 15 Z" fill="#558B2F" />
      </Box>
      <Typography
        component="span"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          color: 'background.paper',
          fontWeight: 800,
          fontSize: '0.5rem',
          lineHeight: 1.1,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.35)',
        }}
      >
        <span style={{ fontSize: '0.62rem' }}>{t('brand.pureVeg.line1')}</span>
        <span>{t('brand.pureVeg.line2')}</span>
      </Typography>
    </Box>
  );
}
