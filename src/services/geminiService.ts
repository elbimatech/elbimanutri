import { Paciente } from './dashboardService';
import { calculateAge, calculateIMC } from '../lib/patientHelpers';

export interface RefeicoesDia {
  cafe_da_manha: string[];
  lanche_manha: string[];
  almoco: string[];
  lanche_tarde: string[];
  jantar: string[];
}

export interface DiaPlano {
  dia: string;
  refeicoes: RefeicoesDia;
}

export interface PlanoSemanal {
  plano_semanal: DiaPlano[];
}

export const DIAS_DA_SEMANA = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
] as const;

export const REFEICOES_NOMES: Record<keyof RefeicoesDia, { label: string; iconName: string; descricao: string }> = {
  cafe_da_manha: { label: 'Café da Manhã', iconName: 'Coffee', descricao: 'Primeira refeição do dia para quebra do jejum' },
  lanche_manha: { label: 'Lanche da Manhã', iconName: 'Apple', descricao: 'Lanche intermediário pré-almoço' },
  almoco: { label: 'Almoço', iconName: 'Utensils', descricao: 'Refeição principal rica em proteínas e micronutrientes' },
  lanche_tarde: { label: 'Lanche da Tarde', iconName: 'Sandwich', descricao: 'Aporte de energia vespertino' },
  jantar: { label: 'Jantar', iconName: 'Salad', descricao: 'Refeição noturna nutritiva de fácil digestão' },
};

/**
 * Converte os dados do paciente em um texto estruturado para alimentar o prompt do Gemini
 */
export function formatPacienteParaPrompt(p: Partial<Paciente>): string {
  const idade = calculateAge(p.data_nascimento);
  const imc = calculateIMC(p.peso_inicial, p.altura);

  const linhas: string[] = [
    `- Nome: ${p.nome || 'Não informado'}`,
    `- Sexo: ${p.sexo || 'Não informado'}`,
    `- Idade: ${idade !== null ? `${idade} anos` : 'Não informada'}`,
    `- Peso atual / inicial: ${p.peso_inicial ? `${p.peso_inicial} kg` : 'Não informado'}`,
    `- Altura: ${p.altura ? `${p.altura} cm` : 'Não informada'}`,
    `- IMC: ${imc ? `${imc.imc} kg/m² (${imc.classificacao})` : 'Não informado'}`,
    `- Objetivos Clínicos: ${p.objetivos && p.objetivos.length > 0 ? p.objetivos.join(', ') : 'Saúde geral'}`,
    `- Detalhe do Objetivo: ${p.objetivo_texto || 'Não especificado'}`,
    `- Nível de Atividade Física: ${p.nivel_atividade || 'Sedentário'}`,
    `- Atividade Praticada: ${p.atividade_fisica_descricao || (p.atividade_fisica ? 'Sim' : 'Não')}`,
    `- Patologias / Condições de Saúde: ${p.patologias && p.patologias.length > 0 ? p.patologias.join(', ') : 'Nenhuma'}`,
    `- Restrições Alimentares: ${p.restricoes_alimentares && p.restricoes_alimentares.length > 0 ? p.restricoes_alimentares.join(', ') : 'Nenhuma'}`,
    `- Alergias Alimentares: ${p.alergias && p.alergias.length > 0 ? p.alergias.join(', ') : 'Nenhuma'}`,
    `- Medicamentos em Uso: ${p.medicamentos || 'Nenhum'}`,
    `- Suplementos em Uso: ${p.suplementos || 'Nenhum'}`,
    `- Refeições diárias habituais: ${p.refeicoes_por_dia ? `${p.refeicoes_por_dia} refeições` : '4 refeições'}`,
    `- Horário de acordar: ${p.horario_acorda || '07:00'} | Horário de dormir: ${p.horario_dorme || '22:30'}`,
    `- Ingestão de água: ${p.litros_agua ? `${p.litros_agua} L/dia` : '2 L/dia'}`,
    `- Observações clínicas adicionais: ${p.observacoes || 'Nenhuma'}`,
  ];

  return linhas.join('\n');
}

/**
 * Garante que a estrutura retornada pelo JSON tenha exatamente 7 dias e 5 opções por refeição
 */
export function normalizarPlanoSemanal(data: any): PlanoSemanal {
  if (!data || !Array.isArray(data.plano_semanal)) {
    throw new Error('Formato inválido: objeto esperado com array "plano_semanal"');
  }

  const planoNormalizado: DiaPlano[] = DIAS_DA_SEMANA.map((diaNome) => {
    const diaEncontrado = data.plano_semanal.find(
      (d: any) => d && typeof d.dia === 'string' && d.dia.toLowerCase().includes(diaNome.toLowerCase().slice(0, 3))
    ) || {};

    const refeicoesRaw = diaEncontrado.refeicoes || {};

    const formatarOpcoes = (opcoes: any): string[] => {
      let lista: string[] = [];
      if (Array.isArray(opcoes)) {
        lista = opcoes.map((item) => (typeof item === 'string' ? item.trim() : JSON.stringify(item)));
      } else if (typeof opcoes === 'string') {
        lista = [opcoes];
      }

      // Preencher até 5 opções se vier menos
      while (lista.length < 5) {
        lista.push(`Opção adicional ${lista.length + 1}`);
      }
      return lista.slice(0, 5);
    };

    return {
      dia: diaNome,
      refeicoes: {
        cafe_da_manha: formatarOpcoes(refeicoesRaw.cafe_da_manha),
        lanche_manha: formatarOpcoes(refeicoesRaw.lanche_manha),
        almoco: formatarOpcoes(refeicoesRaw.almoco),
        lanche_tarde: formatarOpcoes(refeicoesRaw.lanche_tarde),
        jantar: formatarOpcoes(refeicoesRaw.jantar),
      },
    };
  });

  return { plano_semanal: planoNormalizado };
}

/**
 * Constrói um plano alimentar manual saudável e adaptado ao paciente
 * utilizado como fallback caso a IA falhe ou quando o nutricionista opta por montagem manual
 */
export function gerarPlanoManualPadrao(p: Partial<Paciente>): PlanoSemanal {
  const restricoes = (p.restricoes_alimentares || []).map((r) => r.toLowerCase());
  const semLactose = restricoes.some((r) => r.includes('lactose'));
  const semGluten = restricoes.some((r) => r.includes('glúten') || r.includes('gluten'));

  const leiteTexto = semLactose ? 'bebida vegetal (amêndoas ou aveia)' : 'leite desnatado ou iogurte natural';
  const queijoTexto = semLactose ? 'tofu temperado ou queijo zero lactose' : 'queijo branco minas frescal';
  const paoTexto = semGluten ? 'tapioca ou pão sem glúten' : 'pão 100% integral';

  return {
    plano_semanal: DIAS_DA_SEMANA.map((dia) => ({
      dia,
      refeicoes: {
        cafe_da_manha: [
          `2 fatias de ${paoTexto} com 2 ovos mexidos e café sem açúcar`,
          `1 copo de ${leiteTexto} batido com 1 banana e 2 colheres de aveia`,
          `1 tapioca média recheada com ${queijoTexto} e tomate com orégano`,
          `1 tigela de iogurte natural com morangos picados, chia e mel`,
          `Cuscuz nordestino com 1 ovo pochê e fatia de ${queijoTexto}`,
        ],
        lanche_manha: [
          `1 maçã média com 1 punhado (30g) de mix de castanhas`,
          `1 fatia de mamão papaia com 1 colher de sopa de sementes de abóbora`,
          `1 banana com canela e 1 colher de pasta de amendoim`,
          `1 pera média acompanhada de 4 nozes`,
          `1 taça de salada de frutas com lascas de coco seco`,
        ],
        almoco: [
          `150g de peito de frango grelhado + 4 colheres de arroz integral + concha de feijão carioca + salada verde à vontade`,
          `150g de filé de tilápia assada com azeite + purê de mandioquinha + brócolis e cenoura ao vapor`,
          `140g de patinho moído refogado + 100g de batata-doce assada + salada de folhas com tomate e azeite extravirgem`,
          `150g de peito de frango desfiado com legumes + 4 colheres de quinoa cozida + salada colorida`,
          `150g de lombo suíno magro grelhado + arroz integral + feijão preto + couve refogada no alho`,
        ],
        lanche_tarde: [
          `1 copo de iogurte desnatado com 1 colher de aveia em flocos e mirtilos`,
          `1 fatia de ${paoTexto} com pasta de ricota ou homus e peito de peru`,
          `Vitamina com 200ml de ${leiteTexto}, 1/2 maçã, 1 colher de aveia e canela`,
          `2 ovos cozidos com azeite de oliva e orégano + 1 tangerina`,
          `Crepioca leve (1 ovo + 1 colher de goma de tapioca) com sementes de linhaça`,
        ],
        jantar: [
          `150g de filé de frango em tiras grelhado + mix de legumes salteados (abobrinha, cenoura, vagem)`,
          `Omelete com 2 ovos, espinafre, tomate e ervas frescas + salada de folhas verdes`,
          `Sopa nutritiva de legumes com carne magra desfiada e gengibre`,
          `150g de peixe assado com crosta de ervas + purê de abóbora cabotiá`,
          `Salada caesar leve com peito de frango grelhado, alface romana, croutons e azeite`,
        ],
      },
    })),
  };
}

/**
 * Chamada segura à Serverless Function backend `/api/gerar-plano`
 * Nunca expõe chaves no cliente.
 */
export async function chamarApiGerarPlano(paciente: Partial<Paciente>): Promise<PlanoSemanal> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 segundos de timeout

  try {
    const response = await fetch('/api/gerar-plano', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paciente }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Erro no servidor: ${response.status}`);
    }

    const json = await response.json();
    return normalizarPlanoSemanal(json);
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('Falha ao gerar plano com IA:', error);
    throw error;
  }
}
