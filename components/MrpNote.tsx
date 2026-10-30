'use client';

import { Typography } from '@mui/material';
import { useLanguage } from '@/contexts/LanguageContext';

// Tiny disclaimer shown under MRP items wherever their price is displayed
export default function MrpNote() {
  const { t } = useLanguage();

  return (
    <Typography
      variant="caption"
      component="div"
      sx={{
        color: 'text.secondary',
        fontSize: '0.7rem',
        fontStyle: 'italic',
        lineHeight: 1.3,
      }}
    >
      {t('mrp.note')}
    </Typography>
  );
}
