import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { Dashboard } from './components/Dashboard';
import { Loader2 } from 'lucide-react';
import { Logo } from './components/Logo';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [view, setView] = useState<'login' | 'register'>('login');

  // Tela de carregamento elegante enquanto verifica a sessão persistida no Neon Auth
  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors">
        <Logo size="lg" className="mb-6 animate-pulse" />
        <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400 font-medium text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600 dark:text-emerald-500" />
          <span>Carregando sua sessão segura...</span>
        </div>
      </div>
    );
  }

  // Regra: "Se já estiver logado e tentar acessar a tela de login, redirecionar direto para o dashboard"
  if (user) {
    return <Dashboard />;
  }

  // Telas públicas de Autenticação
  return (
    <>
      {view === 'login' ? (
        <LoginForm 
          onNavigateToRegister={() => setView('register')} 
        />
      ) : (
        <RegisterForm 
          onNavigateToLogin={() => setView('login')} 
        />
      )}
    </>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
