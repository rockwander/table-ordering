'use client';

import { Box } from '@mui/material';
import { useLanguage } from '@/contexts/LanguageContext';

// "Pure Vegetarian" mark shown at the top right of the café name on the diner header
export default function PureVegBadge() {
  const { t } = useLanguage();

  return (
    <Box
      component="img"
      src="/pure-veg.png"
      alt={`${t('brand.pureVeg.line1')} ${t('brand.pureVeg.line2')}`}
      sx={{
        width: 40,
        height: 'auto',
        flexShrink: 0,
        alignSelf: 'flex-start',
        mt: '-4px',
        filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35))',
      }}
    />
  );
}
