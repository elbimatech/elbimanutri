import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

function devApiPlugin(): Plugin {
  return {
    name: 'dev-api-gerar-plano',
    configureServer(server) {
      server.middlewares.use('/api/gerar-plano', async (req, res, next) => {
        if (req.method !== 'POST') {
          return next();
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const parsedBody = body ? JSON.parse(body) : {};
            const env = loadEnv('development', process.cwd(), '');
            const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

            if (!apiKey) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Chave GEMINI_API_KEY não configurada no .env' }));
              return;
            }

            const { GoogleGenerativeAI } = await import('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(apiKey);

            const { paciente } = parsedBody;
            const dadosPacienteTexto = [
              `- Nome: ${paciente?.nome || 'Paciente'}`,
              `- Sexo: ${paciente?.sexo || 'Não informado'}`,
              `- Peso atual / inicial: ${paciente?.peso_inicial ? `${paciente.peso_inicial} kg` : 'Não informado'}`,
              `- Altura: ${paciente?.altura ? `${paciente.altura} cm` : 'Não informada'}`,
              `- Objetivos: ${paciente?.objetivos?.join(', ') || 'Saúde geral'}`,
              `- Detalhes do Objetivo: ${paciente?.objetivo_texto || 'Sem observações adicionais'}`,
              `- Nível de Atividade: ${paciente?.nivel_atividade || 'Sedentário'}`,
              `- Exercícios: ${paciente?.atividade_fisica_descricao || (paciente?.atividade_fisica ? 'Sim' : 'Não')}`,
              `- Patologias: ${paciente?.patologias?.join(', ') || 'Nenhuma'}`,
              `- Restrições Alimentares: ${paciente?.restricoes_alimentares?.join(', ') || 'Nenhuma'}`,
              `- Alergias Alimentares: ${paciente?.alergias?.join(', ') || 'Nenhuma'}`,
              `- Medicamentos: ${paciente?.medicamentos || 'Nenhum'}`,
              `- Suplementos: ${paciente?.suplementos || 'Nenhum'}`,
              `- Refeições diárias: ${paciente?.refeicoes_por_dia || '4'} refeições`,
              `- Horários: Acorda às ${paciente?.horario_acorda || '07:00'}, dorme às ${paciente?.horario_dorme || '22:30'}`,
              `- Consumo de água: ${paciente?.litros_agua ? `${paciente.litros_agua} litros` : '2 litros'}`,
              `- Observações adicionais: ${paciente?.observacoes || 'Nenhuma'}`,
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

            const modelos = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
            let texto = '';
            let lastErr: any = null;

            for (const m of modelos) {
              try {
                const model = genAI.getGenerativeModel({
                  model: m,
                  generationConfig: {
                    responseMimeType: 'application/json',
                    temperature: 0.4,
                  },
                });
                const result = await model.generateContent(promptFinal);
                texto = result.response.text();
                if (texto) break;
              } catch (e: any) {
                lastErr = e;
              }
            }

            if (!texto) {
              throw lastErr || new Error('Não foi possível gerar resposta dos modelos Gemini');
            }

            let jsonClean = texto.trim();
            if (jsonClean.startsWith('```json')) {
              jsonClean = jsonClean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (jsonClean.startsWith('```')) {
              jsonClean = jsonClean.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            const parsed = JSON.parse(jsonClean);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(parsed));
          } catch (err: any) {
            console.error('Erro no dev middleware /api/gerar-plano:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err?.message || 'Erro ao gerar plano' }));
          }
        });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    devApiPlugin(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
