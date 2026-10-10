import { createAuthClient } from '@neondatabase/neon-js/auth';
import { neon } from '@neondatabase/serverless';

// Obter URL do Neon Auth e Neon Database a partir das variáveis de ambiente
const authUrl = import.meta.env.VITE_NEON_AUTH_URL || '';
const dbUrl = import.meta.env.VITE_DATABASE_URL || '';

// Inicializa o cliente oficial do Neon Auth
export const authClient = createAuthClient(authUrl);

// Inicializa cliente serverless do Neon para sincronização direta do banco
export const sql = neon(dbUrl);

export interface NutricionistaProfile {
  id: string;
  nome: string;
  email: string;
  created_at?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  createdAt?: Date | string;
  [key: string]: any;
}

/**
 * Salva ou atualiza os dados do nutricionista na tabela public.nutricionistas
 */
export async function syncNutricionistaProfile(userId: string, nome: string, email: string) {
  try {
    await sql.query(
      `INSERT INTO public.nutricionistas (id, nome, email)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE 
       SET nome = EXCLUDED.nome, email = EXCLUDED.email`,
      [userId, nome, email]
    );
  } catch (error) {
    console.error('Erro ao sincronizar perfil do nutricionista no banco:', error);
  }
}

/**
 * Busca perfil do nutricionista na tabela public.nutricionistas
 */
export async function getNutricionistaProfile(userId: string): Promise<NutricionistaProfile | null> {
  try {
    const rows = await sql.query(
      `SELECT id, nome, email, created_at FROM public.nutricionistas WHERE id = $1 LIMIT 1`,
      [userId]
    );
    if (rows && rows.length > 0) {
      const row = rows[0] as unknown as NutricionistaProfile;
      return row;
    }
  } catch (error) {
    console.warn('Erro ao consultar public.nutricionistas:', error);
  }
  return null;
}
