import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { Mail, Lock, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface LoginFormProps {
  onNavigateToRegister: () => void;
  onLoginSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ 
  onNavigateToRegister,
  onLoginSuccess 
}) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, password);
      if (!result.success) {
        setErrorMessage(result.error || 'Não foi possível entrar. Verifique seu e-mail e senha.');
      } else {
        setSuccessMessage('Login efetuado com sucesso! Redirecionando...');
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }
    } catch (err: any) {
      setErrorMessage('Ocorreu um erro inesperado ao conectar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-emerald-50/60 via-slate-50 to-teal-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-6 transition-colors relative">
      {/* Botão de alternância de tema no canto superior */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Elementos decorativos de fundo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 overflow-hidden pointer-events-none -z-10 opacity-70">
        <div className="absolute -top-24 left-1/4 w-80 h-80 rounded-full bg-emerald-200/35 dark:bg-emerald-600/10 blur-3xl" />
        <div className="absolute -top-20 right-1/4 w-96 h-96 rounded-full bg-teal-200/30 dark:bg-teal-600/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        {/* Card Principal */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/60 dark:shadow-slate-950/60 border border-slate-200/80 dark:border-slate-800 p-8 sm:p-10 transition-all">
          {/* Logo no Topo */}
          <div className="mb-8">
            <Logo size="lg" />
          </div>

          <div className="text-center mb-7">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Acesse sua conta
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              Entre com suas credenciais para acessar o painel
            </p>
          </div>

          {/* Alerta de Erro */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-50/90 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="text-left font-medium leading-relaxed">
                {errorMessage}
              </div>
            </div>
          )}

          {/* Alerta de Sucesso */}
          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-3 animate-in fade-in duration-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="text-left font-medium">
                {successMessage}
              </div>
            </div>
          )}

          {/* Formulário de Login */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Input
              id="login-email"
              type="email"
              label="E-mail profissional"
              placeholder="seu.email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leadingIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              required
            />

            <div>
              <Input
                id="login-password"
                type="password"
                isPassword
                label="Sua senha"
                placeholder="•••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leadingIcon={<Lock className="w-4 h-4" />}
                autoComplete="current-password"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              className="mt-2 text-base group"
            >
              <span>Entrar</span>
              {!loading && (
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              )}
            </Button>
          </form>

          {/* Rodapé / Link de Cadastro */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Não tem conta?{' '}
              <button
                type="button"
                onClick={onNavigateToRegister}
                className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded"
              >
                Cadastre-se
              </button>
            </p>
          </div>
        </div>

        {/* Rodapé institucional sutil */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6 font-medium">
          Plataforma de Alta Performance &bull; Segurança de Ponta
        </p>
      </div>
    </div>
  );
};
