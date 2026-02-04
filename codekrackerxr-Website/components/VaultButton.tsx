
import React from 'react';

interface VaultButtonProps {
  // Fixed: Changed from () => void to accept React.MouseEvent to allow stopping propagation and handle event arguments
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
  icon?: React.ReactNode;
  // Added disabled prop to satisfy TypeScript and provide button disabling functionality
  disabled?: boolean;
}

export const VaultButton: React.FC<VaultButtonProps> = ({ 
  onClick, 
  children, 
  className = '', 
  variant = 'primary',
  icon,
  // Destructure disabled from props with default value
  disabled = false
}) => {
  const baseStyles = "relative px-6 py-3 font-display font-bold uppercase tracking-widest text-sm transition-all duration-300 clip-path-slant group overflow-hidden";
  
  const variants = {
    // Updated primary to White bg, Black text. Added disabled styles for both variants.
    primary: "bg-white text-black hover:bg-vault-gold hover:text-black shadow-[0_0_15px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white",
    secondary: "bg-transparent border border-vault-gold/50 text-vault-gold hover:border-vault-gold hover:bg-vault-gold/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
  };

  return (
    <button 
      // Pass the disabled prop to the HTML button element
      disabled={disabled}
      // Fixed: Pass the event to the onClick handler prop
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-vault-gold/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
      <div className="flex items-center justify-center gap-2 relative z-10">
        {icon}
        {children}
      </div>
    </button>
  );
};
