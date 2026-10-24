import { GoogleGenerativeAI } from '@google/generative-ai';

// Vercel Serverless Function Handler
export default async function handler(req: any, res: any) {
  // Configurar headers CORS básicos para segurança
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY não configurada no servidor');
    return res.status(500).json({ 
      error: 'Chave de API do Gemini não configurada no servidor. Verifique as variáveis de ambiente.' 
    });
  }

  try {
    const { paciente } = req.body || {};
    if (!paciente) {
      return res.status(400).json({ error: 'Dados do paciente não informados no corpo da requisição.' });
    }

    // Monta o resumo clínico do paciente para o prompt
    const dadosPacienteTexto = [
      `- Nome: ${paciente.nome || 'Paciente'}`,
      `- Sexo: ${paciente.sexo || 'Não informado'}`,
      `- Peso atual / inicial: ${paciente.peso_inicial ? `${paciente.peso_inicial} kg` : 'Não informado'}`,
      `- Altura: ${paciente.altura ? `${paciente.altura} cm` : 'Não informada'}`,
      `- Objetivos: ${paciente.objetivos && paciente.objetivos.length > 0 ? paciente.objetivos.join(', ') : 'Saúde geral'}`,
      `- Detalhes do Objetivo: ${paciente.objetivo_texto || 'Sem observações adicionais'}`,
      `- Nível de Atividade: ${paciente.nivel_atividade || 'Sedentário'}`,
      `- Exercícios: ${paciente.atividade_fisica_descricao || (paciente.atividade_fisica ? 'Sim' : 'Não')}`,
      `- Patologias: ${paciente.patologias && paciente.patologias.length > 0 ? paciente.patologias.join(', ') : 'Nenhuma'}`,
      `- Restrições Alimentares: ${paciente.restricoes_alimentares && paciente.restricoes_alimentares.length > 0 ? paciente.restricoes_alimentares.join(', ') : 'Nenhuma'}`,
      `- Alergias Alimentares: ${paciente.alergias && paciente.alergias.length > 0 ? paciente.alergias.join(', ') : 'Nenhuma'}`,
      `- Medicamentos: ${paciente.medicamentos || 'Nenhum'}`,
      `- Suplementos: ${paciente.suplementos || 'Nenhum'}`,
      `- Refeições diárias: ${paciente.refeicoes_por_dia || '4'} refeições`,
      `- Horários: Acorda às ${paciente.horario_acorda || '07:00'}, dorme às ${paciente.horario_dorme || '22:30'}`,
      `- Consumo de água: ${paciente.litros_agua ? `${paciente.litros_agua} litros` : '2 litros'}`,
      `- Observações adicionais: ${paciente.observacoes || 'Nenhuma'}`,
    ].join('\n');

    const promptFinal = `Você é um nutricionista clínico profissional especialista na culinária e rotina brasileira.
Gere um plano alimentar semanal completo, saudável e diversificado com base nos dados do paciente fornecidos abaixo.

Dados do Paciente (Metas, Alergias, Restrições e Histórico):
${dadosPacienteTexto}

# Regras Críticas de Execução:
- Você deve responder APENAS e estritamente o objeto JSON solicitado.
- Não inclua blocos de código markdown (como \`\`\`json ... \`\`\`), explicações, introduções ou textos complementares.
- Adapte o cardápio rigorosamente a quaisquer alergias ou restrições descritas nos dados.
- Utilize alimentos comuns, acessíveis e culturalmente aceitos no Brasil.
- Evite repetições monótonas de alimentos nos dias seguidos.

O formato do JSON retornado deve seguir exatamente esta estrutura:
{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    }
  ]
}`;

    const genAI = new GoogleGenerativeAI(apiKey);

    // Lista de modelos ordenados por preferência e capacidade
    const modelosParaTestar = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro'
    ];

    let textoResposta = '';
    let erroUltimo: any = null;

    for (const modelName of modelosParaTestar) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.4,
          },
        });

        const result = await model.generateContent(promptFinal);
        textoResposta = result.response.text();
        if (textoResposta) {
          break;
        }
      } catch (err: any) {
        erroUltimo = err;
        console.warn(`Tentativa com modelo ${modelName} falhou:`, err?.message || err);
      }
    }

    if (!textoResposta) {
      throw erroUltimo || new Error('Não foi possível obter resposta de nenhum modelo Gemini.');
    }

    // Limpar possíveis delimitadores de markdown se o modelo incluir
    let jsonLimpo = textoResposta.trim();
    if (jsonLimpo.startsWith('```json')) {
      jsonLimpo = jsonLimpo.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonLimpo.startsWith('```')) {
      jsonLimpo = jsonLimpo.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Validação com try/catch
    let resultadoJson: any;
    try {
      resultadoJson = JSON.parse(jsonLimpo);
    } catch (parseErr) {
      console.error('Erro ao fazer JSON.parse do resultado da IA:', parseErr, jsonLimpo);
      return res.status(502).json({ 
        error: 'A IA respondeu em formato inválido. Tente novamente ou use a criação manual.',
        raw: jsonLimpo 
      });
    }

    return res.status(200).json(resultadoJson);
  } catch (error: any) {
    console.error('Erro na geração de plano com Gemini:', error);
    return res.status(500).json({ 
      error: error?.message || 'Erro interno ao processar a geração de plano com IA.' 
    });
  }
}
