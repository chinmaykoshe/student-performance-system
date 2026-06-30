import React from 'react';

const GlassCard = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`glass-card rounded-2xl p-6 transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

export default GlassCard;
