import { Box, Typography } from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export default function Logo({ size = 'medium', showText = true }: LogoProps) {
  const sizeMap = {
    small: { icon: 24, text: '1rem' },
    medium: { icon: 40, text: '1.5rem' },
    large: { icon: 60, text: '2rem' },
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: sizeMap[size].icon,
          height: sizeMap[size].icon,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #D4691A 0%, #A04D12 100%)',
          color: 'white',
          boxShadow: '0 2px 8px rgba(212, 105, 26, 0.3)',
        }}
      >
        <RestaurantIcon sx={{ fontSize: sizeMap[size].icon * 0.6 }} />
      </Box>
      {showText && (
        <Typography
          variant="h6"
          sx={{
            fontSize: sizeMap[size].text,
            fontWeight: 700,
            color: 'primary.main',
            letterSpacing: '-0.02em',
          }}
        >
          Ramani&apos;s Cafe
        </Typography>
      )}
    </Box>
  );
}
