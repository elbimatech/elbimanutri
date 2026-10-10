-- ====================================================================
-- SCHEMA ELBIMA NUTRI
-- Banco de Dados criado via MCP no Neon (Projeto: Elbima Nutri)
-- ====================================================================

-- 1. Helper function para autenticação e RLS
CREATE SCHEMA IF NOT EXISTS auth;

CREATE OR REPLACE FUNCTION auth.user_id() 
RETURNS uuid 
LANGUAGE sql 
STABLE
AS $$
  SELECT 
    COALESCE(
      NULLIF(current_setting('request.jwt.claim.sub', true), ''),
      NULLIF(current_setting('app.current_user_id', true), ''),
      NULLIF(current_setting('neon_auth.user_id', true), '')
    )::uuid;
$$;

-- 2. Tabela nutricionistas
CREATE TABLE IF NOT EXISTS public.nutricionistas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tabela pacientes
CREATE TABLE IF NOT EXISTS public.pacientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nutricionista_id UUID NOT NULL REFERENCES public.nutricionistas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    data_nascimento DATE,
    sexo TEXT,
    whatsapp TEXT,
    email TEXT,
    peso_inicial NUMERIC,
    altura NUMERIC,
    objetivos TEXT[],
    objetivo_texto TEXT,
    nivel_atividade TEXT,
    patologias TEXT[],
    restricoes_alimentares TEXT[],
    alergias TEXT[],
    medicamentos TEXT,
    suplementos TEXT,
    refeicoes_por_dia INTEGER,
    horario_acorda TEXT,
    horario_dorme TEXT,
    litros_agua NUMERIC,
    atividade_fisica BOOLEAN,
    atividade_fisica_descricao TEXT,
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tabela consultas
CREATE TABLE IF NOT EXISTS public.consultas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    data_consulta DATE NOT NULL,
    peso NUMERIC,
    cintura NUMERIC,
    quadril NUMERIC,
    percentual_gordura NUMERIC,
    observacoes TEXT,
    proximo_retorno DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Tabela planos_alimentares
CREATE TABLE IF NOT EXISTS public.planos_alimentares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    conteudo JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Índices para performance de consultas e joins
CREATE INDEX IF NOT EXISTS idx_pacientes_nutricionista_id ON public.pacientes(nutricionista_id);
CREATE INDEX IF NOT EXISTS idx_consultas_paciente_id ON public.consultas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_planos_alimentares_paciente_id ON public.planos_alimentares(paciente_id);

-- 7. Ativação de Row Level Security (RLS)
ALTER TABLE public.nutricionistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_alimentares ENABLE ROW LEVEL SECURITY;

-- 8. Policies de isolamento por nutricionista
CREATE POLICY nutricionistas_manage_own ON public.nutricionistas
    FOR ALL
    USING (id = auth.user_id())
    WITH CHECK (id = auth.user_id());

CREATE POLICY pacientes_manage_own ON public.pacientes
    FOR ALL
    USING (nutricionista_id = auth.user_id())
    WITH CHECK (nutricionista_id = auth.user_id());

CREATE POLICY consultas_manage_own ON public.consultas
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.pacientes
            WHERE public.pacientes.id = public.consultas.paciente_id
              AND public.pacientes.nutricionista_id = auth.user_id()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.pacientes
            WHERE public.pacientes.id = public.consultas.paciente_id
              AND public.pacientes.nutricionista_id = auth.user_id()
        )
    );

CREATE POLICY planos_alimentares_manage_own ON public.planos_alimentares
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.pacientes
            WHERE public.pacientes.id = public.planos_alimentares.paciente_id
              AND public.pacientes.nutricionista_id = auth.user_id()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.pacientes
            WHERE public.pacientes.id = public.planos_alimentares.paciente_id
              AND public.pacientes.nutricionista_id = auth.user_id()
        )
    );
