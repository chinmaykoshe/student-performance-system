import React, { memo } from 'react';

const GlassCard = memo(({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`glass-card transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]' : ''} ${className}`}
    >
      {children}
    </div>
  );
});

export default GlassCard;
