import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  authClient, 
  syncNutricionistaProfile, 
  getNutricionistaProfile, 
  type AuthUser, 
  type NutricionistaProfile 
} from '../lib/auth';

interface AuthContextType {
  user: AuthUser | null;
  nutricionista: NutricionistaProfile | null;
  session: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (nome: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [nutricionista, setNutricionista] = useState<NutricionistaProfile | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Carrega e sincroniza o perfil do nutricionista
  const loadProfile = async (userData: AuthUser) => {
    try {
      const profile = await getNutricionistaProfile(userData.id);
      if (profile) {
        setNutricionista(profile);
      } else {
        // Se ainda não existir no public.nutricionistas, garante a sincronização
        await syncNutricionistaProfile(userData.id, userData.name || 'Nutricionista', userData.email);
        const newProfile = await getNutricionistaProfile(userData.id);
        setNutricionista(newProfile || {
          id: userData.id,
          nome: userData.name,
          email: userData.email,
        });
      }
    } catch (e) {
      console.error('Erro ao carregar perfil:', e);
    }
  };

  // Restaura sessão existente na inicialização para manter o usuário logado
  useEffect(() => {
    let isMounted = true;

    async function checkCurrentSession() {
      try {
        const result = await authClient.getSession();
        if (result.data?.session && result.data?.user) {
          const authUser = result.data.user as unknown as AuthUser;
          if (isMounted) {
            setUser(authUser);
            setSession(result.data.session);
            await loadProfile(authUser);
          }
        }
      } catch (err) {
        console.warn('Nenhuma sessão ativa encontrada ou erro ao verificar sessão:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    checkCurrentSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const trimmedEmail = email.trim();
      const result = await authClient.signIn.email({
        email: trimmedEmail,
        password: password,
      });

      if (result.error) {
        let errorMsg = result.error.message || 'Credenciais inválidas. Verifique seu e-mail e senha.';
        if (errorMsg.toLowerCase().includes('invalid') || errorMsg.toLowerCase().includes('not found') || errorMsg.toLowerCase().includes('credential')) {
          errorMsg = 'E-mail ou senha incorretos. Por favor, tente novamente.';
        } else if (errorMsg.toLowerCase().includes('network') || errorMsg.toLowerCase().includes('failed to fetch')) {
          errorMsg = 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.';
        }
        return { success: false, error: errorMsg };
      }

      // Obtém dados da sessão recém-criada
      const sessionResult = await authClient.getSession();
      if (sessionResult.data?.session && sessionResult.data?.user) {
        const authUser = sessionResult.data.user as unknown as AuthUser;
        setUser(authUser);
        setSession(sessionResult.data.session);
        await loadProfile(authUser);
        return { success: true };
      }

      return { success: true };
    } catch (err: any) {
      console.error('Erro inesperado no login:', err);
      return { 
        success: false, 
        error: err?.message || 'Ocorreu um erro ao fazer login. Tente novamente mais tarde.' 
      };
    }
  };

  const register = async (nome: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const trimmedNome = nome.trim();
      const trimmedEmail = email.trim();

      const result = await authClient.signUp.email({
        name: trimmedNome,
        email: trimmedEmail,
        password: password,
      });

      if (result.error) {
        let errorMsg = result.error.message || 'Erro ao realizar cadastro.';
        if (errorMsg.toLowerCase().includes('already') || errorMsg.toLowerCase().includes('exists')) {
          errorMsg = 'Este e-mail já está cadastrado no sistema. Tente fazer login.';
        }
        return { success: false, error: errorMsg };
      }

      // Obtém usuário criado
      const sessionResult = await authClient.getSession();
      const authUser = (sessionResult.data?.user || result.data?.user) as unknown as AuthUser;

      if (authUser?.id) {
        // Salva explicitamente o nome e e-mail do nutricionista na tabela public.nutricionistas
        await syncNutricionistaProfile(authUser.id, trimmedNome, trimmedEmail);
        setUser(authUser);
        if (sessionResult.data?.session) {
          setSession(sessionResult.data.session);
        }
        await loadProfile(authUser);
      }

      return { success: true };
    } catch (err: any) {
      console.error('Erro inesperado no cadastro:', err);
      return { 
        success: false, 
        error: err?.message || 'Ocorreu um erro inesperado ao criar sua conta. Tente novamente.' 
      };
    }
  };

  const logout = async () => {
    try {
      await authClient.signOut();
    } catch (e) {
      console.warn('Erro ao deslogar no cliente Neon:', e);
    } finally {
      setUser(null);
      setNutricionista(null);
      setSession(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        nutricionista,
        session,
        loading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
