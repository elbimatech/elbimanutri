import { sql } from '../lib/auth';

export interface PacienteSemRetorno {
  paciente_id: string;
  paciente_nome: string;
  paciente_email: string | null;
  paciente_whatsapp: string | null;
  ultima_consulta_data: string;
  maior_proximo_retorno: string | null;
  dias_sem_consulta: number;
}

export interface DashboardStats {
  totalPacientes: number;
  consultasSemana: number;
  pacientesSemRetorno: PacienteSemRetorno[];
}

export interface Paciente {
  id: string;
  nutricionista_id: string;
  nome: string;
  data_nascimento?: string | null;
  sexo?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  peso_inicial?: number | null;
  altura?: number | null;
  objetivos?: string[] | null;
  objetivo_texto?: string | null;
  nivel_atividade?: string | null;
  patologias?: string[] | null;
  restricoes_alimentares?: string[] | null;
  alergias?: string[] | null;
  medicamentos?: string | null;
  suplementos?: string | null;
  refeicoes_por_dia?: number | null;
  horario_acorda?: string | null;
  horario_dorme?: string | null;
  litros_agua?: number | null;
  atividade_fisica?: boolean | null;
  atividade_fisica_descricao?: string | null;
  observacoes?: string | null;
  created_at?: string;
  // Campos calculados
  ultima_consulta?: string | null;
  proximo_retorno?: string | null;
  total_consultas?: number;
}

export interface Consulta {
  id: string;
  paciente_id: string;
  data_consulta: string;
  peso?: number | null;
  cintura?: number | null;
  quadril?: number | null;
  percentual_gordura?: number | null;
  observacoes?: string | null;
  proximo_retorno?: string | null;
  created_at?: string;
}

export interface PlanoAlimentar {
  id: string;
  paciente_id: string;
  conteudo: any;
  created_at: string;
}

/**
 * Carrega todas as métricas do Dashboard em tempo real diretamente do Neon DB
 */
export async function getDashboardStats(nutricionistaId: string): Promise<DashboardStats> {
  try {
    // 1. Total de pacientes cadastrados pela nutricionista logada
    const totalPacientesQuery = await sql.query(
      `SELECT COUNT(*)::int as count 
       FROM public.pacientes 
       WHERE nutricionista_id = $1`,
      [nutricionistaId]
    );
    const totalPacientes = Number(totalPacientesQuery[0]?.count || 0);

    // 2. Consultas da semana atual (segunda a domingo)
    const consultasSemanaQuery = await sql.query(
      `SELECT COUNT(*)::int as count 
       FROM public.consultas c
       JOIN public.pacientes p ON p.id = c.paciente_id
       WHERE p.nutricionista_id = $1
         AND c.data_consulta >= date_trunc('week', CURRENT_DATE)::date
         AND c.data_consulta <= (date_trunc('week', CURRENT_DATE) + interval '6 days')::date`,
      [nutricionistaId]
    );
    const consultasSemana = Number(consultasSemanaQuery[0]?.count || 0);

    // 3. Pacientes sem retorno: última consulta há mais de 30 dias e sem próximo retorno agendado
    const pacientesSemRetornoQuery = await sql.query(
      `WITH ultimas_consultas AS (
         SELECT 
           p.id AS paciente_id,
           p.nome AS paciente_nome,
           p.email AS paciente_email,
           p.whatsapp AS paciente_whatsapp,
           MAX(c.data_consulta) AS ultima_consulta_data,
           MAX(c.proximo_retorno) AS maior_proximo_retorno
         FROM public.pacientes p
         LEFT JOIN public.consultas c ON c.paciente_id = p.id
         WHERE p.nutricionista_id = $1
         GROUP BY p.id, p.nome, p.email, p.whatsapp
       )
       SELECT 
         paciente_id,
         paciente_nome,
         paciente_email,
         paciente_whatsapp,
         ultima_consulta_data,
         maior_proximo_retorno,
         (CURRENT_DATE - ultima_consulta_data)::int AS dias_sem_consulta
       FROM ultimas_consultas
       WHERE ultima_consulta_data IS NOT NULL
         AND ultima_consulta_data < (CURRENT_DATE - INTERVAL '30 days')
         AND (maior_proximo_retorno IS NULL OR maior_proximo_retorno < CURRENT_DATE)
       ORDER BY dias_sem_consulta DESC;`,
      [nutricionistaId]
    );

    const pacientesSemRetorno: PacienteSemRetorno[] = (pacientesSemRetornoQuery || []).map((row: any) => ({
      paciente_id: row.paciente_id,
      paciente_nome: row.paciente_nome,
      paciente_email: row.paciente_email,
      paciente_whatsapp: row.paciente_whatsapp,
      ultima_consulta_data: row.ultima_consulta_data ? new Date(row.ultima_consulta_data).toISOString().split('T')[0] : '',
      maior_proximo_retorno: row.maior_proximo_retorno ? new Date(row.maior_proximo_retorno).toISOString().split('T')[0] : null,
      dias_sem_consulta: Number(row.dias_sem_consulta || 0),
    }));

    return {
      totalPacientes,
      consultasSemana,
      pacientesSemRetorno,
    };
  } catch (error) {
    console.error('Erro ao buscar métricas do dashboard no Neon:', error);
    return {
      totalPacientes: 0,
      consultasSemana: 0,
      pacientesSemRetorno: [],
    };
  }
}

/**
 * Busca a lista completa de pacientes do nutricionista logado
 */
export async function getPacientes(nutricionistaId: string): Promise<Paciente[]> {
  try {
    const rows = await sql.query(
      `SELECT 
         p.*,
         (SELECT MAX(c.data_consulta) FROM public.consultas c WHERE c.paciente_id = p.id) as ultima_consulta,
         (SELECT MAX(c.proximo_retorno) FROM public.consultas c WHERE c.paciente_id = p.id) as proximo_retorno,
         (SELECT COUNT(*)::int FROM public.consultas c WHERE c.paciente_id = p.id) as total_consultas
       FROM public.pacientes p
       WHERE p.nutricionista_id = $1
       ORDER BY p.nome ASC`,
      [nutricionistaId]
    );

    return (rows || []).map((r: any) => {
      let dataNasc = r.data_nascimento;
      if (dataNasc instanceof Date) {
        dataNasc = dataNasc.toISOString().split('T')[0];
      } else if (typeof dataNasc === 'string') {
        dataNasc = dataNasc.split('T')[0];
      }
      return {
        ...r,
        data_nascimento: dataNasc || '',
        peso_inicial: r.peso_inicial !== null && r.peso_inicial !== undefined ? Number(r.peso_inicial) : null,
        altura: r.altura !== null && r.altura !== undefined ? Number(r.altura) : null,
        litros_agua: r.litros_agua !== null && r.litros_agua !== undefined ? Number(r.litros_agua) : null,
        refeicoes_por_dia: r.refeicoes_por_dia !== null && r.refeicoes_por_dia !== undefined ? Number(r.refeicoes_por_dia) : null,
        total_consultas: Number(r.total_consultas || 0),
      };
    });
  } catch (error) {
    console.error('Erro ao buscar pacientes:', error);
    return [];
  }
}

/**
 * Busca detalhes completos de um paciente e suas consultas
 */
export async function getPacienteDetalhes(pacienteId: string, nutricionistaId: string): Promise<{ paciente: Paciente | null; consultas: Consulta[] }> {
  try {
    const pacienteRows = await sql.query(
      `SELECT * FROM public.pacientes WHERE id = $1 AND nutricionista_id = $2 LIMIT 1`,
      [pacienteId, nutricionistaId]
    );

    if (!pacienteRows || pacienteRows.length === 0) {
      return { paciente: null, consultas: [] };
    }

    const raw = pacienteRows[0] as any;
    let dataNascimento = raw.data_nascimento;
    if (dataNascimento instanceof Date) {
      dataNascimento = dataNascimento.toISOString().split('T')[0];
    } else if (typeof dataNascimento === 'string') {
      dataNascimento = dataNascimento.split('T')[0];
    }

    const paciente = {
      ...raw,
      data_nascimento: dataNascimento || '',
      peso_inicial: raw.peso_inicial !== null && raw.peso_inicial !== undefined ? Number(raw.peso_inicial) : null,
      altura: raw.altura !== null && raw.altura !== undefined ? Number(raw.altura) : null,
      litros_agua: raw.litros_agua !== null && raw.litros_agua !== undefined ? Number(raw.litros_agua) : null,
      refeicoes_por_dia: raw.refeicoes_por_dia !== null && raw.refeicoes_por_dia !== undefined ? Number(raw.refeicoes_por_dia) : null,
      objetivos: Array.isArray(raw.objetivos) ? raw.objetivos : [],
      patologias: Array.isArray(raw.patologias) ? raw.patologias : [],
      restricoes_alimentares: Array.isArray(raw.restricoes_alimentares) ? raw.restricoes_alimentares : [],
      alergias: Array.isArray(raw.alergias) ? raw.alergias : [],
    } as unknown as Paciente;

    const consultasRows = await sql.query(
      `SELECT * FROM public.consultas WHERE paciente_id = $1 ORDER BY data_consulta DESC`,
      [pacienteId]
    );

    const consultas = (consultasRows || []).map((c: any) => {
      let dataCons = c.data_consulta;
      if (dataCons instanceof Date) {
        dataCons = dataCons.toISOString().split('T')[0];
      } else if (typeof dataCons === 'string') {
        dataCons = dataCons.split('T')[0];
      }

      let proxRetorno = c.proximo_retorno;
      if (proxRetorno instanceof Date) {
        proxRetorno = proxRetorno.toISOString().split('T')[0];
      } else if (typeof proxRetorno === 'string') {
        proxRetorno = proxRetorno.split('T')[0];
      }

      return {
        ...c,
        data_consulta: dataCons || '',
        proximo_retorno: proxRetorno || null,
        peso: c.peso !== null && c.peso !== undefined ? Number(c.peso) : null,
        cintura: c.cintura !== null && c.cintura !== undefined ? Number(c.cintura) : null,
        quadril: c.quadril !== null && c.quadril !== undefined ? Number(c.quadril) : null,
        percentual_gordura: c.percentual_gordura !== null && c.percentual_gordura !== undefined ? Number(c.percentual_gordura) : null,
      };
    }) as unknown as Consulta[];

    return { paciente, consultas };
  } catch (error) {
    console.error('Erro ao buscar detalhes do paciente:', error);
    return { paciente: null, consultas: [] };
  }
}

/**
 * Cadastra um novo paciente no banco Neon
 */
export async function createPaciente(nutricionistaId: string, data: Partial<Paciente>): Promise<Paciente | null> {
  try {
    const rows = await sql.query(
      `INSERT INTO public.pacientes (
         nutricionista_id,
         nome,
         data_nascimento,
         sexo,
         whatsapp,
         email,
         peso_inicial,
         altura,
         objetivos,
         objetivo_texto,
         nivel_atividade,
         patologias,
         restricoes_alimentares,
         alergias,
         medicamentos,
         suplementos,
         refeicoes_por_dia,
         horario_acorda,
         horario_dorme,
         litros_agua,
         atividade_fisica,
         atividade_fisica_descricao,
         observacoes
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
       ) RETURNING *`,
      [
        nutricionistaId,
        data.nome || 'Paciente sem nome',
        data.data_nascimento || null,
        data.sexo || null,
        data.whatsapp || null,
        data.email || null,
        data.peso_inicial || null,
        data.altura || null,
        data.objetivos || [],
        data.objetivo_texto || null,
        data.nivel_atividade || null,
        data.patologias || [],
        data.restricoes_alimentares || [],
        data.alergias || [],
        data.medicamentos || null,
        data.suplementos || null,
        data.refeicoes_por_dia || null,
        data.horario_acorda || null,
        data.horario_dorme || null,
        data.litros_agua || null,
        data.atividade_fisica ?? false,
        data.atividade_fisica_descricao || null,
        data.observacoes || null,
      ]
    );

    return rows && rows.length > 0 ? (rows[0] as unknown as Paciente) : null;
  } catch (error) {
    console.error('Erro ao cadastrar paciente no Neon:', error);
    throw error;
  }
}

/**
 * Cria uma consulta para um paciente no Neon
 */
export async function createConsulta(pacienteId: string, data: Partial<Consulta>): Promise<Consulta | null> {
  try {
    const rows = await sql.query(
      `INSERT INTO public.consultas (
         paciente_id,
         data_consulta,
         peso,
         cintura,
         quadril,
         percentual_gordura,
         observacoes,
         proximo_retorno
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        pacienteId,
        data.data_consulta || new Date().toISOString().split('T')[0],
        data.peso || null,
        data.cintura || null,
        data.quadril || null,
        data.percentual_gordura || null,
        data.observacoes || null,
        data.proximo_retorno || null,
      ]
    );

    return rows && rows.length > 0 ? (rows[0] as unknown as Consulta) : null;
  } catch (error) {
    console.error('Erro ao criar consulta:', error);
    throw error;
  }
}

/**
 * Atualiza os dados cadastrais do paciente diretamente no banco de dados
 */
export async function updatePaciente(
  pacienteId: string,
  nutricionistaId: string,
  data: Partial<Paciente>
): Promise<Paciente | null> {
  try {
    const rows = await sql.query(
      `UPDATE public.pacientes SET
         nome = COALESCE($3, nome),
         data_nascimento = $4,
         sexo = $5,
         whatsapp = $6,
         email = $7,
         peso_inicial = $8,
         altura = $9,
         objetivos = $10,
         objetivo_texto = $11,
         nivel_atividade = $12,
         patologias = $13,
         restricoes_alimentares = $14,
         alergias = $15,
         medicamentos = $16,
         suplementos = $17,
         refeicoes_por_dia = $18,
         horario_acorda = $19,
         horario_dorme = $20,
         litros_agua = $21,
         atividade_fisica = $22,
         atividade_fisica_descricao = $23,
         observacoes = $24
       WHERE id = $1 AND nutricionista_id = $2
       RETURNING *`,
      [
        pacienteId,
        nutricionistaId,
        data.nome,
        data.data_nascimento || null,
        data.sexo || null,
        data.whatsapp || null,
        data.email || null,
        data.peso_inicial !== undefined && data.peso_inicial !== null ? data.peso_inicial : null,
        data.altura !== undefined && data.altura !== null ? data.altura : null,
        data.objetivos || [],
        data.objetivo_texto || null,
        data.nivel_atividade || null,
        data.patologias || [],
        data.restricoes_alimentares || [],
        data.alergias || [],
        data.medicamentos || null,
        data.suplementos || null,
        data.refeicoes_por_dia !== undefined && data.refeicoes_por_dia !== null ? data.refeicoes_por_dia : null,
        data.horario_acorda || null,
        data.horario_dorme || null,
        data.litros_agua !== undefined && data.litros_agua !== null ? data.litros_agua : null,
        data.atividade_fisica ?? false,
        data.atividade_fisica_descricao || null,
        data.observacoes || null,
      ]
    );

    return rows && rows.length > 0 ? (rows[0] as unknown as Paciente) : null;
  } catch (error) {
    console.error('Erro ao atualizar paciente:', error);
    throw error;
  }
}

/**
 * Exclui uma consulta do histórico do paciente
 */
export async function deleteConsulta(consultaId: string): Promise<boolean> {
  try {
    await sql.query(`DELETE FROM public.consultas WHERE id = $1`, [consultaId]);
    return true;
  } catch (error) {
    console.error('Erro ao excluir consulta:', error);
    return false;
  }
}

/**
 * Busca todos os planos alimentares salvos do paciente
 */
export async function getPlanosAlimentares(pacienteId: string): Promise<PlanoAlimentar[]> {
  try {
    const rows = await sql.query(
      `SELECT * FROM public.planos_alimentares WHERE paciente_id = $1 ORDER BY created_at DESC`,
      [pacienteId]
    );
    return (rows || []) as unknown as PlanoAlimentar[];
  } catch (error) {
    console.error('Erro ao buscar planos alimentares:', error);
    return [];
  }
}

/**
 * Salva um novo plano alimentar para o paciente no banco Neon
 */
export async function createPlanoAlimentar(
  pacienteId: string,
  conteudo: any
): Promise<PlanoAlimentar | null> {
  try {
    const jsonStr = typeof conteudo === 'string' ? conteudo : JSON.stringify(conteudo);
    const rows = await sql.query(
      `INSERT INTO public.planos_alimentares (paciente_id, conteudo)
       VALUES ($1, $2::jsonb)
       RETURNING *`,
      [pacienteId, jsonStr]
    );

    return rows && rows.length > 0 ? (rows[0] as unknown as PlanoAlimentar) : null;
  } catch (error) {
    console.error('Erro ao salvar plano alimentar no Neon:', error);
    throw error;
  }
}

/**
 * Exclui um plano alimentar do histórico do paciente
 */
export async function deletePlanoAlimentar(planoId: string): Promise<boolean> {
  try {
    await sql.query(`DELETE FROM public.planos_alimentares WHERE id = $1`, [planoId]);
    return true;
  } catch (error) {
    console.error('Erro ao excluir plano alimentar no Neon:', error);
    return false;
  }
}

/**
 * Popula dados de exemplo realistas para o nutricionista poder testar e visualizar o dashboard imediatamente
 */
export async function seedDemoData(nutricionistaId: string): Promise<boolean> {
  try {
    // 1. Paciente 1: Consulta essa semana (Card 2)
    const p1 = await createPaciente(nutricionistaId, {
      nome: 'Camila Santos Rodrigues',
      email: 'camila.santos@email.com',
      whatsapp: '(11) 98765-4321',
      data_nascimento: '1995-04-12',
      sexo: 'Feminino',
      peso_inicial: 68.5,
      altura: 1.65,
      objetivos: ['Emagrecimento', 'Hipertrofia'],
      objetivo_texto: 'Redução de gordura corporal mantendo massa magra',
      nivel_atividade: 'Moderado',
      patologias: [],
      restricoes_alimentares: ['Sem lactose'],
      alergias: [],
      medicamentos: 'Nenhum',
      suplementos: 'Whey protein, Creatina',
      refeicoes_por_dia: 4,
      horario_acorda: '06:30',
      horario_dorme: '22:30',
      litros_agua: 2.5,
      atividade_fisica: true,
      atividade_fisica_descricao: 'Musculação 4x na semana',
      observacoes: 'Excelente adesão ao plano nutricional.',
    });

    if (p1?.id) {
      // Data de hoje (consulta da semana)
      const hoje = new Date().toISOString().split('T')[0];
      const daquiA30Dias = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      await createConsulta(p1.id, {
        data_consulta: hoje,
        peso: 66.8,
        cintura: 74,
        quadril: 98,
        percentual_gordura: 23.5,
        observacoes: 'Consulta de acompanhamento semanal. Perda de 1.7kg de gordura.',
        proximo_retorno: daquiA30Dias,
      });
    }

    // 2. Paciente 2: Consulta há 45 dias SEM RETORNO AGENDADO (Card 3 - Pacientes sem retorno)
    const p2 = await createPaciente(nutricionistaId, {
      nome: 'Lucas Mendes Oliveira',
      email: 'lucas.mendes@email.com',
      whatsapp: '(11) 97654-3210',
      data_nascimento: '1988-11-20',
      sexo: 'Masculino',
      peso_inicial: 94.0,
      altura: 1.78,
      objetivos: ['Controle glicêmico', 'Perda de peso'],
      objetivo_texto: 'Melhorar exames de sangue e condicionamento',
      nivel_atividade: 'Sedentário',
      patologias: ['Pré-diabetes'],
      restricoes_alimentares: [],
      alergias: ['Amendoim'],
      medicamentos: 'Metformina 500mg',
      suplementos: 'Ômega 3',
      refeicoes_por_dia: 3,
      horario_acorda: '07:00',
      horario_dorme: '23:30',
      litros_agua: 1.8,
      atividade_fisica: false,
      atividade_fisica_descricao: '',
      observacoes: 'Necessita reforço na ingestão hídrica e retorno urgente.',
    });

    if (p2?.id) {
      // Data de 45 dias atrás
      const data45DiasAtras = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      await createConsulta(p2.id, {
        data_consulta: data45DiasAtras,
        peso: 93.2,
        cintura: 99,
        quadril: 104,
        percentual_gordura: 28.0,
        observacoes: 'Primeira consulta realizada. Não agendou retorno no encerramento.',
        proximo_retorno: null, // Sem próximo retorno agendado!
      });
    }

    // 3. Paciente 3: Consulta há 60 dias SEM RETORNO AGENDADO (Card 3 - Pacientes sem retorno)
    const p3 = await createPaciente(nutricionistaId, {
      nome: 'Beatriz Costa Alcantara',
      email: 'beatriz.costa@email.com',
      whatsapp: '(21) 99887-6543',
      data_nascimento: '1992-07-15',
      sexo: 'Feminino',
      peso_inicial: 62.0,
      altura: 1.60,
      objetivos: ['Reeducação alimentar', 'Saúde intestinal'],
      objetivo_texto: 'Tratar constipação e melhorar disposição diária',
      nivel_atividade: 'Leve',
      patologias: ['Síndrome do Intestino Irritável'],
      restricoes_alimentares: ['FODMAPs na fase inicial'],
      alergias: [],
      medicamentos: 'Nenhum',
      suplementos: 'Probióticos, Psyllium',
      refeicoes_por_dia: 5,
      horario_acorda: '06:00',
      horario_dorme: '22:00',
      litros_agua: 2.2,
      atividade_fisica: true,
      atividade_fisica_descricao: 'Pilates 2x na semana',
      observacoes: 'Paciente relatou melhora clínica na época, convém enviar mensagem de reativação.',
    });

    if (p3?.id) {
      // Data de 60 dias atrás
      const data60DiasAtras = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      await createConsulta(p3.id, {
        data_consulta: data60DiasAtras,
        peso: 61.2,
        cintura: 71,
        quadril: 94,
        percentual_gordura: 22.0,
        observacoes: 'Reajuste do plano com foco em fibras. Sem retorno marcado.',
        proximo_retorno: null,
      });
    }

    // 4. Paciente 4: Paciente ativo com retorno futuro
    const p4 = await createPaciente(nutricionistaId, {
      nome: 'Rodrigo Ferreira Lima',
      email: 'rodrigo.ferreira@email.com',
      whatsapp: '(31) 98456-1234',
      data_nascimento: '1985-02-28',
      sexo: 'Masculino',
      peso_inicial: 82.0,
      altura: 1.75,
      objetivos: ['Hipertrofia', 'Performance esportiva'],
      objetivo_texto: 'Aumentar carga calórica para treino de corrida e academia',
      nivel_atividade: 'Intenso',
      patologias: [],
      restricoes_alimentares: [],
      alergias: [],
      medicamentos: 'Nenhum',
      suplementos: 'Beta alanina, Creatina, Whey',
      refeicoes_por_dia: 5,
      horario_acorda: '05:30',
      horario_dorme: '22:00',
      litros_agua: 3.5,
      atividade_fisica: true,
      atividade_fisica_descricao: 'Musculação 5x + Corrida 3x',
      observacoes: 'Atleta amador, alta taxa metabólica.',
    });

    if (p4?.id) {
      // Consulta da semana
      const hoje = new Date().toISOString().split('T')[0];
      const proximo = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      await createConsulta(p4.id, {
        data_consulta: hoje,
        peso: 82.8,
        cintura: 81,
        quadril: 99,
        percentual_gordura: 14.5,
        observacoes: 'Ganho de massa muscular verificado nas dobras cutâneas.',
        proximo_retorno: proximo,
      });
    }

    return true;
  } catch (error) {
    console.error('Erro ao popular dados de exemplo:', error);
    return false;
  }
}
