import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leadingIcon?: React.ReactNode;
  isPassword?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type = 'text', 
    label, 
    error, 
    helperText, 
    leadingIcon, 
    isPassword = false, 
    id, 
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label 
            htmlFor={inputId} 
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide"
          >
            {label}
            {props.required && <span className="text-emerald-600 dark:text-emerald-400 ml-0.5">*</span>}
          </label>
        )}
        
        <div className="relative rounded-xl shadow-xs">
          {leadingIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              {leadingIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            type={inputType}
            className={cn(
              "w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm transition-all duration-200 outline-none",
              "focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-3 focus:ring-emerald-500/15 dark:focus:ring-emerald-400/20",
              leadingIcon ? "pl-10" : "pl-3.5",
              isPassword ? "pr-10" : "pr-3.5",
              "py-2.5 h-11",
              error && "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-red-500/15 bg-red-50/20 dark:bg-red-950/20",
              className
            )}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none transition-colors"
              aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              ) : (
                <Eye className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              )}
            </button>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1 mt-1">
            <span className="inline-block w-1 h-1 rounded-full bg-red-500"></span>
            {error}
          </p>
        )}

        {!error && helperText && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
