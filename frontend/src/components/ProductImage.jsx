import { useState } from 'react';

export default function ProductImage({ image, emoji, name, size = 'md', className = '' }) {
  const [failed, setFailed] = useState(false);

  if (!image || failed) {
    const fontSize = size === 'xs' ? '1.25rem' : size === 'sm' ? '2rem' : size === 'md' ? '3.5rem' : size === 'lg' ? '4rem' : '10rem';
    return <span className={className} style={{ fontSize, lineHeight: 1 }}>{emoji || '📦'}</span>;
  }

  const sizeMap = { xs: 32, sm: 56, md: '100%', lg: '100%', xl: '100%' };
  const dim = sizeMap[size] || '100%';
  const isFixed = typeof dim === 'number';

  return (
    <img
      src={image}
      alt={name || 'Product'}
      className={className}
      onError={() => setFailed(true)}
      loading="lazy"
      style={{
        width: isFixed ? dim : '100%',
        height: isFixed ? dim : '100%',
        objectFit: 'cover',
        borderRadius: isFixed ? 6 : undefined,
      }}
    />
  );
}
