import { Typography } from '@mui/material';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export default function Logo({ size = 'medium', showText = true }: LogoProps) {
  const sizeMap = {
    small: '1.6rem',
    medium: '2rem',
    large: '2.75rem',
  };

  if (!showText) return null;

  return (
    <Typography
      component="span"
      sx={{
        display: 'block',
        fontSize: sizeMap[size],
        fontWeight: 400,
        fontFamily: 'var(--font-bree-serif), serif',
        color: '#000',
        lineHeight: 1.2,
        letterSpacing: '-0.01em',
        whiteSpace: 'nowrap',
      }}
    >
      Ramani&apos;s Cafe
    </Typography>
  );
}
