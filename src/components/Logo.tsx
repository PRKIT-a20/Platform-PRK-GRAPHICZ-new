import React from 'react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'icon';
}

const Logo: React.FC<LogoProps> = ({ className, variant = 'full' }) => {
  // Using the provided logo URL
  const logoUrl = "https://image2url.com/r2/default/images/1772558796525-44d8bb57-cd76-4403-93ac-740bfe6261b0.png"; 

  if (variant === 'icon') {
    return (
      <div className={cn("w-40 h-40 flex items-center justify-center overflow-hidden", className)}>
        <img 
          src={logoUrl} 
          alt="PRK" 
          className="h-full w-auto object-contain"
          onError={(e) => {
            // Fallback to text if image fails
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            if (target.parentElement) {
              target.parentElement.innerHTML = '<div class="w-40 h-40 bg-brand-primary text-brand-secondary rounded-lg flex items-center justify-center font-bold text-xl">P</div>';
            }
          }}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", className)}>
      <img 
        src={logoUrl} 
        alt="PRK Graphicz" 
        className="h-24 w-auto object-contain"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          if (target.parentElement) {
            target.parentElement.innerHTML = `
              <div class="flex items-center gap-2">
                <div class="w-16 h-16 bg-brand-primary text-brand-secondary rounded-lg flex items-center justify-center font-bold text-2xl">P</div>
                <span class="font-bold text-2xl tracking-tight text-brand-primary uppercase font-display">PRK GRAPHICZ</span>
              </div>
            `;
          }
        }}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export default Logo;
