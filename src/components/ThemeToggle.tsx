import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { cn } from '../lib/utils';

interface ThemeToggleProps {
  className?: string;
  variant?: 'icon' | 'pill' | 'sidebar';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className,
  variant = 'icon',
}) => {
  const { theme, toggleTheme, isDark } = useTheme();

  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={cn(
          "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border",
          isDark
            ? "bg-slate-800/80 border-slate-700 text-amber-300 hover:bg-slate-800 hover:text-amber-200"
            : "bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:text-slate-900",
          className
        )}
        title={isDark ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
        aria-label="Alternar tema"
      >
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "w-6 h-6 rounded-lg flex items-center justify-center transition-transform",
            isDark ? "bg-amber-400/20 text-amber-300" : "bg-emerald-100 text-emerald-800"
          )}>
            {isDark ? <Sun className="w-3.5 h-3.5 animate-spin-slow" /> : <Moon className="w-3.5 h-3.5" />}
          </div>
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {isDark ? "Modo Escuro" : "Modo Claro"}
          </span>
        </div>

        {/* Switch visual pill */}
        <div className={cn(
          "w-8 h-4 rounded-full p-0.5 transition-colors relative",
          isDark ? "bg-emerald-600" : "bg-slate-300"
        )}>
          <div className={cn(
            "w-3 h-3 rounded-full bg-white shadow-xs transition-transform transform",
            isDark ? "translate-x-4" : "translate-x-0"
          )} />
        </div>
      </button>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border shadow-2xs",
          isDark
            ? "bg-slate-800/90 border-slate-700 text-amber-300 hover:bg-slate-800"
            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
          className
        )}
        title={isDark ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
      >
        {isDark ? (
          <>
            <Sun className="w-3.5 h-3.5 text-amber-400 animate-in spin-in-90 duration-300" />
            <span className="hidden sm:inline">Modo Claro</span>
          </>
        ) : (
          <>
            <Moon className="w-3.5 h-3.5 text-slate-600 animate-in spin-in-90 duration-300" />
            <span className="hidden sm:inline">Modo Escuro</span>
          </>
        )}
      </button>
    );
  }

  // Variant 'icon' padrão
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "relative p-2 rounded-xl transition-all duration-200 border focus:outline-none focus:ring-2 focus:ring-emerald-500",
        isDark
          ? "bg-slate-800/80 border-slate-700/80 text-amber-300 hover:bg-slate-700 hover:text-amber-200"
          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs",
        className
      )}
      title={isDark ? "Alternar para Modo Claro" : "Alternar para Modo Escuro"}
      aria-label="Alternar tema"
    >
      {isDark ? (
        <Sun className="w-4 h-4 transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 transition-transform duration-300 rotate-0 hover:-rotate-12" />
      )}
    </button>
  );
};
