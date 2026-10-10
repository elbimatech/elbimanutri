import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createPaciente, Paciente } from '../services/dashboardService';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { X, UserPlus, Sparkles, Check, AlertCircle } from 'lucide-react';

interface NewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientCreated: (newPatient: Paciente) => void;
}

export const NewPatientModal: React.FC<NewPatientModalProps> = ({
  isOpen,
  onClose,
  onPatientCreated,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Campos do formulário
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState('Feminino');
  const [pesoInicial, setPesoInicial] = useState('');
  const [altura, setAltura] = useState('');
  const [objetivosStr, setObjetivosStr] = useState('Emagrecimento, Saúde');
  const [objetivoTexto, setObjetivoTexto] = useState('');
  const [nivelAtividade, setNivelAtividade] = useState('Moderado');
  const [restricoes, setRestricoes] = useState('');
  const [patologias, setPatologias] = useState('');
  const [litrosAgua, setLitrosAgua] = useState('2.0');
  const [observacoes, setObservacoes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!nome.trim()) {
      setErrorMessage('O nome do paciente é obrigatório.');
      return;
    }

    if (!user?.id) {
      setErrorMessage('Nutricionista não autenticado.');
      return;
    }

    setLoading(true);
    try {
      const objetivosArray = objetivosStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const restricoesArray = restricoes
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const patologiasArray = patologias
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const created = await createPaciente(user.id, {
        nome: nome.trim(),
        email: email.trim() || null,
        whatsapp: whatsapp.trim() || null,
        data_nascimento: dataNascimento || null,
        sexo: sexo || null,
        peso_inicial: pesoInicial ? parseFloat(pesoInicial) : null,
        altura: altura ? parseFloat(altura) : null,
        objetivos: objetivosArray,
        objetivo_texto: objetivoTexto.trim() || null,
        nivel_atividade: nivelAtividade || null,
        restricoes_alimentares: restricoesArray,
        patologias: patologiasArray,
        litros_agua: litrosAgua ? parseFloat(litrosAgua) : null,
        observacoes: observacoes.trim() || null,
        atividade_fisica: nivelAtividade !== 'Sedentário',
      });

      if (created) {
        onPatientCreated(created);
        onClose();
      }
    } catch (err: any) {
      console.error('Erro ao cadastrar paciente:', err);
      setErrorMessage('Ocorreu um erro ao salvar o paciente no Neon. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Novo Paciente
              </h2>
              <p className="text-xs text-emerald-100">
                Cadastro de anamnese inicial no banco Neon
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Dados Pessoais
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                id="new-patient-nome"
                label="Nome Completo *"
                placeholder="Ex: Mariana Silva"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />

              <Input
                id="new-patient-email"
                label="E-mail"
                type="email"
                placeholder="mariana@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                id="new-patient-whatsapp"
                label="WhatsApp / Telefone"
                placeholder="(11) 98765-4321"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />

              <Input
                id="new-patient-nascimento"
                label="Data de Nascimento"
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Sexo Biológico
                </label>
                <select
                  value={sexo}
                  onChange={(e) => setSexo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="Feminino">Feminino</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>

            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pt-2">
              Biometria & Hábitos
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                id="new-patient-peso"
                label="Peso Inicial (kg)"
                type="number"
                step="0.1"
                placeholder="Ex: 68.5"
                value={pesoInicial}
                onChange={(e) => setPesoInicial(e.target.value)}
              />

              <Input
                id="new-patient-altura"
                label="Altura (m)"
                type="number"
                step="0.01"
                placeholder="Ex: 1.65"
                value={altura}
                onChange={(e) => setAltura(e.target.value)}
              />

              <Input
                id="new-patient-agua"
                label="Meta de Água (L)"
                type="number"
                step="0.1"
                placeholder="Ex: 2.5"
                value={litrosAgua}
                onChange={(e) => setLitrosAgua(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                id="new-patient-objetivos"
                label="Objetivos (separados por vírgula)"
                placeholder="Ex: Emagrecimento, Hipertrofia, Saúde"
                value={objetivosStr}
                onChange={(e) => setObjetivosStr(e.target.value)}
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Nível de Atividade Física
                </label>
                <select
                  value={nivelAtividade}
                  onChange={(e) => setNivelAtividade(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="Sedentário">Sedentário</option>
                  <option value="Leve">Leve (1-2x/semana)</option>
                  <option value="Moderado">Moderado (3-4x/semana)</option>
                  <option value="Intenso">Intenso (5x+/semana)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                id="new-patient-restricoes"
                label="Restrições Alimentares"
                placeholder="Ex: Sem lactose, Sem glúten"
                value={restricoes}
                onChange={(e) => setRestricoes(e.target.value)}
              />

              <Input
                id="new-patient-patologias"
                label="Patologias / Condições"
                placeholder="Ex: Diabetes, Hipertensão, Gastrite"
                value={patologias}
                onChange={(e) => setPatologias(e.target.value)}
              />
            </div>

            <Input
              id="new-patient-obs"
              label="Observações Gerais"
              placeholder="Histórico familiar, rotina diária, preferências..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
            >
              <Check className="w-4 h-4" />
              <span>Salvar Paciente no Neon</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
