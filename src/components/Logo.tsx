import React from 'react';
import { Leaf } from 'lucide-react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  subtitle?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  className, 
  size = 'md',
  subtitle = "Gestão Nutricional Inteligente"
}) => {
  const iconSizes = {
    sm: "w-8 h-8 p-1.5",
    md: "w-11 h-11 p-2.5",
    lg: "w-14 h-14 p-3",
  };

  const titleSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/25 ring-4 ring-emerald-50",
          iconSizes[size]
        )}>
          <Leaf className="w-full h-full transform -rotate-12 fill-white/20 stroke-white stroke-[2.2]" />
        </div>
        
        <div className="text-left">
          <span className={cn(
            "font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5",
            titleSizes[size]
          )}>
            Elbima <span className="text-emerald-600">Nutri</span>
          </span>
          {subtitle && (
            <span className="block text-[11px] font-medium text-emerald-700/80 uppercase tracking-wider -mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
