import React from 'react';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  LogOut, 
  ShieldCheck, 
  Database,
  UserCheck,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';

export type NavigationTab = 'dashboard' | 'pacientes' | 'novo-paciente';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  pacientesCount?: number;
  isOpenMobile?: boolean;
  onToggleMobile?: () => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  pacientesCount = 0,
  isOpenMobile = false,
  onToggleMobile,
  onCloseMobile,
}) => {
  const { user, nutricionista, logout } = useAuth();

  const displayName = nutricionista?.nome || user?.name || 'Nutricionista';
  const displayEmail = nutricionista?.email || user?.email || '';

  const navItems = [
    {
      id: 'dashboard' as NavigationTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Visão geral e métricas',
    },
    {
      id: 'pacientes' as NavigationTab,
      label: 'Pacientes',
      icon: Users,
      badge: pacientesCount > 0 ? pacientesCount : undefined,
      description: 'Gestão e acompanhamento',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 z-50 w-72 bg-white border-r border-slate-200/90 shadow-lg shadow-slate-100/50 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Top: Logotipo "Elbima Nutri" */}
        <div>
          <div className="h-20 px-6 border-b border-slate-100 flex items-center justify-between">
            <Logo size="md" subtitle="Gestão Nutricional" />
            
            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Status do Neon DB */}
          <div className="px-6 py-3 bg-emerald-50/60 border-b border-emerald-100/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-emerald-800 tracking-tight">Neon PostgreSQL</span>
            </div>
            <span className="text-[10px] font-medium uppercase px-1.5 py-0.5 rounded bg-emerald-200/60 text-emerald-800">
              Conectado
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5" aria-label="Menu Principal">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Menu Principal
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || (item.id === 'pacientes' && activeTab === 'novo-paciente');
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-150 group text-left",
                    isActive
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "w-5 h-5 transition-transform group-hover:scale-110",
                        isActive ? "text-white" : "text-slate-400 group-hover:text-emerald-600"
                      )}
                    />
                    <div>
                      <span className="block leading-tight">{item.label}</span>
                    </div>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-semibold",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-emerald-100 text-emerald-700"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Nutricionista Profile & Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800 truncate leading-tight">
                  {displayName}
                </p>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {displayEmail}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50/80 border border-slate-200/70 hover:border-red-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>
    </>
  );
};
