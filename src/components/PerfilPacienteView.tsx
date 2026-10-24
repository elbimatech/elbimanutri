import React, { useEffect, useState } from 'react';
import { 
  Paciente, 
  Consulta, 
  PlanoAlimentar, 
  getPacienteDetalhes, 
  updatePaciente, 
  getPlanosAlimentares, 
  deleteConsulta 
} from '../services/dashboardService';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  Sparkles, 
  CheckCircle2, 
  Save, 
  Plus, 
  Clock, 
  FileText, 
  AlertTriangle, 
  Loader2, 
  Trash2, 
  ChevronRight, 
  UtensilsCrossed, 
  X,
  Stethoscope
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { WeightEvolutionChart } from './WeightEvolutionChart';
import { NovaConsultaModal } from './NovaConsultaModal';
import { 
  calculateAge, 
  calculateIMC, 
  formatPhone, 
  formatTimeInput 
} from '../lib/patientHelpers';

interface PerfilPacienteViewProps {
  pacienteId: string;
  onBack: () => void;
  onPatientUpdated?: () => void;
}

// Opções pré-definidas para seleção
const OBJETIVOS_OPCOES = [
  'Emagrecer',
  'Ganhar massa',
  'Controlar diabetes',
  'Saúde geral',
  'Performance esportiva',
  'Reeducação alimentar',
];

const NIVEIS_ATIVIDADE = [
  'Sedentário',
  'Levemente ativo',
  'Moderadamente ativo',
  'Muito ativo',
  'Extremamente ativo',
];

const PATOLOGIAS_OPCOES = [
  'Diabetes',
  'Hipertensão',
  'Hipotireoidismo',
  'Hipertireoidismo',
  'Síndrome do ovário policístico',
  'Doença celíaca',
  'Colesterol alto',
];

const RESTRICOES_OPCOES = [
  'Lactose',
  'Glúten',
  'Açúcar',
  'Carne vermelha',
  'Frutos do mar',
];

const ALERGIAS_OPCOES = [
  'Amendoim',
  'Leite',
  'Ovo',
  'Soja',
  'Trigo',
  'Frutos do mar',
];

export const PerfilPacienteView: React.FC<PerfilPacienteViewProps> = ({
  pacienteId,
  onBack,
  onPatientUpdated,
}) => {
  const { user } = useAuth();

  // Estados principais
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [planosAlimentares, setPlanosAlimentares] = useState<PlanoAlimentar[]>([]);
  const [loading, setLoading] = useState(true);

  // Navegação entre as 3 seções do perfil (Prompt 5)
  // Layout geral: Dados do Paciente, Consultas e Planos Alimentares
  const [activeSection, setActiveSection] = useState<'dados' | 'consultas' | 'planos'>('dados');

  // Sub-abas da Seção 1 (Dados do Paciente: Pessoal, Clínico, Hábitos)
  const [activeDataTab, setActiveDataTab] = useState<'pessoal' | 'clinico' | 'habitos'>('pessoal');

  // Modal de Nova Consulta
  const [isNovaConsultaOpen, setIsNovaConsultaOpen] = useState(false);

  // Modal para ver plano alimentar selecionado
  const [selectedPlano, setSelectedPlano] = useState<PlanoAlimentar | null>(null);

  // Modal/Aviso do botão "Gerar Plano Alimentar" (Prompt 5: implementar no próximo prompt)
  const [showGerarPlanoAviso, setShowGerarPlanoAviso] = useState(false);

  // Estados de formulário editável diretamente na página (Seção 1)
  const [savingPaciente, setSavingPaciente] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Campos editáveis
  // Aba 1 — Pessoal
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');

  // Aba 2 — Clínico
  const [pesoInicial, setPesoInicial] = useState('');
  const [altura, setAltura] = useState('');
  const [objetivos, setObjetivos] = useState<string[]>([]);
  const [objetivoTexto, setObjetivoTexto] = useState('');
  const [nivelAtividade, setNivelAtividade] = useState('');
  const [patologias, setPatologias] = useState<string[]>([]);
  const [customPatologia, setCustomPatologia] = useState('');
  const [restricoes, setRestricoes] = useState<string[]>([]);
  const [customRestricao, setCustomRestricao] = useState('');
  const [alergias, setAlergias] = useState<string[]>([]);
  const [customAlergia, setCustomAlergia] = useState('');
  const [medicamentos, setMedicamentos] = useState('');
  const [suplementos, setSuplementos] = useState('');

  // Aba 3 — Hábitos
  const [refeicoesPorDia, setRefeicoesPorDia] = useState('');
  const [horarioAcorda, setHorarioAcorda] = useState('');
  const [horarioDorme, setHorarioDorme] = useState('');
  const [litrosAgua, setLitrosAgua] = useState('');
  const [atividadeFisica, setAtividadeFisica] = useState<boolean | null>(null);
  const [atividadeFisicaDesc, setAtividadeFisicaDesc] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Carregar dados
  const loadData = async () => {
    if (!pacienteId || !user?.id) return;
    setLoading(true);
    try {
      const res = await getPacienteDetalhes(pacienteId, user.id);
      if (res.paciente) {
        setPaciente(res.paciente);
        populateForm(res.paciente);
      }
      setConsultas(res.consultas || []);

      const planos = await getPlanosAlimentares(pacienteId);
      setPlanosAlimentares(planos || []);
    } catch (err) {
      console.error('Erro ao carregar dados do paciente:', err);
      setErrorMessage('Erro ao carregar prontuário do paciente.');
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (p: Paciente) => {
    setNome(p.nome || '');
    setDataNascimento(p.data_nascimento ? p.data_nascimento.split('T')[0] : '');
    setSexo(p.sexo || '');
    setWhatsapp(p.whatsapp ? formatPhone(p.whatsapp) : '');
    setEmail(p.email || '');

    setPesoInicial(p.peso_inicial !== null && p.peso_inicial !== undefined ? String(p.peso_inicial) : '');
    setAltura(p.altura !== null && p.altura !== undefined ? String(p.altura) : '');
    setObjetivos(p.objetivos || []);
    setObjetivoTexto(p.objetivo_texto || '');
    setNivelAtividade(p.nivel_atividade || '');
    setPatologias(p.patologias || []);
    setRestricoes(p.restricoes_alimentares || []);
    setAlergias(p.alergias || []);
    setMedicamentos(p.medicamentos || '');
    setSuplementos(p.suplementos || '');

    setRefeicoesPorDia(p.refeicoes_por_dia !== null && p.refeicoes_por_dia !== undefined ? String(p.refeicoes_por_dia) : '');
    setHorarioAcorda(p.horario_acorda || '');
    setHorarioDorme(p.horario_dorme || '');
    setLitrosAgua(p.litros_agua !== null && p.litros_agua !== undefined ? String(p.litros_agua) : '');
    setAtividadeFisica(p.atividade_fisica ?? null);
    setAtividadeFisicaDesc(p.atividade_fisica_descricao || '');
    setObservacoes(p.observacoes || '');
  };

  useEffect(() => {
    loadData();
  }, [pacienteId, user?.id]);

  // Cálculos dinâmicos em tempo real
  const currentAge = calculateAge(dataNascimento);
  const currentIMC = calculateIMC(
    pesoInicial ? parseFloat(pesoInicial) : null,
    altura ? parseFloat(altura) : null
  );

  // Helper para toggles de array com opção "Nenhum"
  const toggleArrayItem = (
    currentList: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    item: string
  ) => {
    if (item === 'Nenhum') {
      if (currentList.includes('Nenhum')) {
        setList([]);
      } else {
        setList(['Nenhum']);
      }
      return;
    }

    const withoutNenhum = currentList.filter((x) => x !== 'Nenhum');
    if (withoutNenhum.includes(item)) {
      setList(withoutNenhum.filter((x) => x !== item));
    } else {
      setList([...withoutNenhum, item]);
    }
  };

  const addCustomItem = (
    value: string,
    setValue: React.Dispatch<React.SetStateAction<string>>,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const withoutNenhum = list.filter((x) => x !== 'Nenhum');
    if (!withoutNenhum.includes(trimmed)) {
      setList([...withoutNenhum, trimmed]);
    }
    setValue('');
  };

  // Salvar alterações nos dados do paciente (Seção 1)
  const handleSavePaciente = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pacienteId || !user?.id) return;

    if (!nome.trim()) {
      setErrorMessage('O nome do paciente é obrigatório.');
      return;
    }

    setSavingPaciente(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const updated = await updatePaciente(pacienteId, user.id, {
        nome: nome.trim(),
        data_nascimento: dataNascimento || null,
        sexo: sexo || null,
        whatsapp: whatsapp ? whatsapp.trim() : null,
        email: email ? email.trim() : null,
        peso_inicial: pesoInicial ? parseFloat(pesoInicial) : null,
        altura: altura ? parseFloat(altura) : null,
        objetivos,
        objetivo_texto: objetivoTexto ? objetivoTexto.trim() : null,
        nivel_atividade: nivelAtividade || null,
        patologias,
        restricoes_alimentares: restricoes,
        alergias,
        medicamentos: medicamentos ? medicamentos.trim() : null,
        suplementos: suplementos ? suplementos.trim() : null,
        refeicoes_por_dia: refeicoesPorDia ? parseInt(refeicoesPorDia, 10) : null,
        horario_acorda: horarioAcorda ? formatTimeInput(horarioAcorda) : null,
        horario_dorme: horarioDorme ? formatTimeInput(horarioDorme) : null,
        litros_agua: litrosAgua ? parseFloat(litrosAgua) : null,
        atividade_fisica: atividadeFisica,
        atividade_fisica_descricao: atividadeFisicaDesc ? atividadeFisicaDesc.trim() : null,
        observacoes: observacoes ? observacoes.trim() : null,
      });

      if (updated) {
        setPaciente(updated);
        setSuccessMessage('Alterações salvas com sucesso!');
        if (onPatientUpdated) {
          onPatientUpdated();
        }
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      console.error('Erro ao atualizar paciente:', err);
      setErrorMessage('Ocorreu um erro ao salvar as alterações. Tente novamente.');
    } finally {
      setSavingPaciente(false);
    }
  };

  // Excluir consulta
  const handleDeleteConsulta = async (consultaId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta consulta do histórico?')) return;
    try {
      await deleteConsulta(consultaId);
      setConsultas((prev) => prev.filter((c) => c.id !== consultaId));
      if (onPatientUpdated) onPatientUpdated();
    } catch (err) {
      console.error('Erro ao excluir consulta:', err);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-emerald-700 dark:text-emerald-400 font-medium">
        <Loader2 className="w-10 h-10 animate-spin mb-3 text-emerald-600 dark:text-emerald-500" />
        <span className="text-sm">Carregando prontuário do paciente...</span>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-2xs">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Paciente não encontrado</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-5">
          Este registro pode ter sido removido ou não pertence ao seu usuário.
        </p>
        <Button variant="secondary" size="md" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Lista de Pacientes</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Botão de Retorno e Header Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors w-fit group"
        >
          <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center group-hover:border-emerald-300 dark:group-hover:border-emerald-600 transition-colors shadow-2xs">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          </div>
          <span>Voltar para Pacientes</span>
        </button>

        <div className="flex items-center gap-2">
          {activeSection === 'dados' && (
            <Button
              variant="primary"
              size="md"
              loading={savingPaciente}
              onClick={() => handleSavePaciente()}
              className="shadow-md shadow-emerald-600/20"
            >
              <Save className="w-4 h-4" />
              <span>Salvar alterações</span>
            </Button>
          )}

          {activeSection === 'consultas' && (
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsNovaConsultaOpen(true)}
              className="shadow-md shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Consulta</span>
            </Button>
          )}
        </div>
      </div>

      {/* Toast de Sucesso ou Erro Flutuante / Topo */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-sm font-semibold">{successMessage}</span>
          </div>
          <button 
            onClick={() => setSuccessMessage(null)} 
            className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 text-red-900 dark:text-red-200 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
            <span className="text-sm font-semibold">{errorMessage}</span>
          </div>
          <button 
            onClick={() => setErrorMessage(null)} 
            className="text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cartão de Identidade do Paciente (Header Clínico) */}
      <div className="bg-gradient-to-br from-emerald-700 via-teal-700 to-emerald-800 dark:from-emerald-900 dark:via-teal-950 dark:to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl shadow-emerald-900/10 dark:shadow-black/40 relative overflow-hidden transition-colors">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-extrabold text-2xl sm:text-3xl shadow-inner shrink-0">
              {paciente.nome ? paciente.nome.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-emerald-100 uppercase tracking-wide border border-white/20">
                  Prontuário Ativo
                </span>
                {sexo && (
                  <span className="text-xs text-emerald-200 font-medium">
                    &bull; {sexo}
                  </span>
                )}
                {currentAge !== null && (
                  <span className="text-xs text-emerald-200 font-medium">
                    &bull; {currentAge} anos
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {nome || paciente.nome}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-100 mt-2 font-medium">
                {email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-300" />
                    {email}
                  </span>
                )}
                {whatsapp && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-300" />
                    {whatsapp}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar no Header */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-black/15 dark:bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
            <div className="px-3 py-1.5 rounded-xl bg-white/10 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-200 block">Peso</span>
              <span className="text-sm font-extrabold text-white">
                {consultas.length > 0 && consultas[0].peso ? `${consultas[0].peso} kg` : pesoInicial ? `${pesoInicial} kg` : '-'}
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-white/10 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-200 block">Altura</span>
              <span className="text-sm font-extrabold text-white">
                {altura ? `${altura} cm` : '-'}
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-white/10 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-200 block">IMC</span>
              <span className="text-sm font-extrabold text-white">
                {currentIMC ? currentIMC.imc : '-'}
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-white/10 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-200 block">Consultas</span>
              <span className="text-sm font-extrabold text-white">
                {consultas.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação entre as 3 Seções Principais (Prompt 5) */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-wrap items-center gap-2 transition-colors">
        <button
          onClick={() => setActiveSection('dados')}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
            activeSection === 'dados'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Dados do Paciente</span>
        </button>

        <button
          onClick={() => setActiveSection('consultas')}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all relative ${
            activeSection === 'consultas'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Consultas</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            activeSection === 'consultas'
              ? 'bg-white/20 text-white'
              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
          }`}>
            {consultas.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSection('planos')}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
            activeSection === 'planos'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>Planos Alimentares</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            activeSection === 'planos'
              ? 'bg-white/20 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}>
            {planosAlimentares.length}
          </span>
        </button>
      </div>

      {/* ========================================================
          SEÇÃO 1 — DADOS DO PACIENTE (EDITÁVEIS DIRETAMENTE)
         ======================================================== */}
      {activeSection === 'dados' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-6 transition-colors">
          {/* Sub-Navegação em 3 Abas: Pessoal, Clínico e Hábitos */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 sm:gap-6 overflow-x-auto">
            <button
              onClick={() => setActiveDataTab('pessoal')}
              className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeDataTab === 'pessoal'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>1. Pessoal</span>
            </button>

            <button
              onClick={() => setActiveDataTab('clinico')}
              className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeDataTab === 'clinico'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>2. Clínico</span>
            </button>

            <button
              onClick={() => setActiveDataTab('habitos')}
              className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeDataTab === 'habitos'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>3. Hábitos</span>
            </button>
          </div>

          <form onSubmit={handleSavePaciente} className="space-y-6">
            {/* ABA 1 — PESSOAL */}
            {activeDataTab === 'pessoal' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Input
                      id="edit-nome"
                      label="Nome Completo *"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required
                      placeholder="Ex: Maria Clara Souza"
                    />
                  </div>

                  <div>
                    <Input
                      id="edit-nascimento"
                      label="Data de Nascimento"
                      type="date"
                      value={dataNascimento}
                      onChange={(e) => setDataNascimento(e.target.value)}
                    />
                    {currentAge !== null && (
                      <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                        Idade calculada: {currentAge} anos
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                      Sexo
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Feminino', 'Masculino', 'Outro'].map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setSexo(item)}
                          className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                            sexo === item
                              ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Input
                    id="edit-whatsapp"
                    label="WhatsApp"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                  />

                  <Input
                    id="edit-email"
                    label="E-mail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="paciente@exemplo.com"
                  />
                </div>
              </div>
            )}

            {/* ABA 2 — CLÍNICO */}
            {activeDataTab === 'clinico' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Peso, Altura e IMC */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                  <Input
                    id="edit-peso"
                    label="Peso Inicial em kg"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 68.5"
                    value={pesoInicial}
                    onChange={(e) => setPesoInicial(e.target.value)}
                  />

                  <Input
                    id="edit-altura"
                    label="Altura em cm"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 165"
                    value={altura}
                    onChange={(e) => setAltura(e.target.value)}
                  />

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                      IMC Calculado
                    </label>
                    <div className="h-10.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between">
                      {currentIMC ? (
                        <>
                          <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                            {currentIMC.imc} <span className="text-[10px] text-slate-400 font-normal">kg/m²</span>
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${currentIMC.badgeColor}`}>
                            {currentIMC.classificacao}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                          Informe peso e altura
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Objetivos */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Objetivos Clínicos
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {OBJETIVOS_OPCOES.map((obj) => {
                      const isSelected = objetivos.includes(obj);
                      return (
                        <button
                          key={obj}
                          type="button"
                          onClick={() => toggleArrayItem(objetivos, setObjetivos, obj)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                          }`}
                        >
                          {obj}
                        </button>
                      );
                    })}
                  </div>
                  <Input
                    id="edit-objetivo-texto"
                    label="Objetivo Detalhado / Observação adicional"
                    placeholder="Descreva detalhes específicos da meta do paciente..."
                    value={objetivoTexto}
                    onChange={(e) => setObjetivoTexto(e.target.value)}
                  />
                </div>

                {/* Nível de Atividade */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Nível de Atividade Física
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {NIVEIS_ATIVIDADE.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setNivelAtividade(item)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                          nivelAtividade === item
                            ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Patologias */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Patologias ou Condições de Saúde
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleArrayItem(patologias, setPatologias, 'Nenhum')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        patologias.includes('Nenhum')
                          ? 'bg-slate-700 text-white border-slate-700'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Nenhum
                    </button>
                    {PATOLOGIAS_OPCOES.map((pat) => (
                      <button
                        key={pat}
                        type="button"
                        onClick={() => toggleArrayItem(patologias, setPatologias, pat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          patologias.includes(pat)
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {pat}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Outra condição..."
                      value={customPatologia}
                      onChange={(e) => setCustomPatologia(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomItem(customPatologia, setCustomPatologia, patologias, setPatologias);
                        }
                      }}
                      className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => addCustomItem(customPatologia, setCustomPatologia, patologias, setPatologias)}
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>

                {/* Restrições e Alergias */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Restrições */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Restrições Alimentares
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => toggleArrayItem(restricoes, setRestricoes, 'Nenhum')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          restricoes.includes('Nenhum')
                            ? 'bg-slate-700 text-white border-slate-700'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Nenhum
                      </button>
                      {RESTRICOES_OPCOES.map((res) => (
                        <button
                          key={res}
                          type="button"
                          onClick={() => toggleArrayItem(restricoes, setRestricoes, res)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            restricoes.includes(res)
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {res}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Adicionar restrição..."
                        value={customRestricao}
                        onChange={(e) => setCustomRestricao(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCustomItem(customRestricao, setCustomRestricao, restricoes, setRestricoes);
                          }
                        }}
                        className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => addCustomItem(customRestricao, setCustomRestricao, restricoes, setRestricoes)}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  {/* Alergias */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Alergias Alimentares
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => toggleArrayItem(alergias, setAlergias, 'Nenhum')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          alergias.includes('Nenhum')
                            ? 'bg-slate-700 text-white border-slate-700'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Nenhum
                      </button>
                      {ALERGIAS_OPCOES.map((ale) => (
                        <button
                          key={ale}
                          type="button"
                          onClick={() => toggleArrayItem(alergias, setAlergias, ale)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            alergias.includes(ale)
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {ale}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Adicionar alergia..."
                        value={customAlergia}
                        onChange={(e) => setCustomAlergia(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCustomItem(customAlergia, setCustomAlergia, alergias, setAlergias);
                          }
                        }}
                        className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => addCustomItem(customAlergia, setCustomAlergia, alergias, setAlergias)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Medicamentos e Suplementos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="edit-medicamentos"
                    label="Medicamentos Contínuos"
                    placeholder="Ex: Losartana 50mg, Levotiroxina 75mcg..."
                    value={medicamentos}
                    onChange={(e) => setMedicamentos(e.target.value)}
                  />

                  <Input
                    id="edit-suplementos"
                    label="Suplementos em Uso"
                    placeholder="Ex: Whey protein, Creatina, Vitamina D..."
                    value={suplementos}
                    onChange={(e) => setSuplementos(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* ABA 3 — HÁBITOS */}
            {activeDataTab === 'habitos' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <Input
                    id="edit-refeicoes"
                    label="Refeições por Dia"
                    type="number"
                    placeholder="Ex: 4"
                    value={refeicoesPorDia}
                    onChange={(e) => setRefeicoesPorDia(e.target.value)}
                  />

                  <Input
                    id="edit-horario-acorda"
                    label="Horário que Acorda"
                    placeholder="Ex: 06:30"
                    value={horarioAcorda}
                    onChange={(e) => setHorarioAcorda(e.target.value)}
                    onBlur={(e) => setHorarioAcorda(formatTimeInput(e.target.value))}
                  />

                  <Input
                    id="edit-horario-dorme"
                    label="Horário que Dorme"
                    placeholder="Ex: 22:30"
                    value={horarioDorme}
                    onChange={(e) => setHorarioDorme(e.target.value)}
                    onBlur={(e) => setHorarioDorme(formatTimeInput(e.target.value))}
                  />

                  <Input
                    id="edit-litros-agua"
                    label="Água por Dia (Litros)"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 2.5"
                    value={litrosAgua}
                    onChange={(e) => setLitrosAgua(e.target.value)}
                  />
                </div>

                {/* Atividade Física */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Pratica Atividade Física?
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setAtividadeFisica(true)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        atividadeFisica === true
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAtividadeFisica(false);
                        setAtividadeFisicaDesc('');
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        atividadeFisica === false
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Não
                    </button>
                  </div>

                  {atividadeFisica && (
                    <div className="pt-2 animate-in fade-in duration-150">
                      <Input
                        id="edit-atividade-desc"
                        label="Qual atividade e frequência semanal?"
                        placeholder="Ex: Musculação 4x na semana, corrida aos sábados"
                        value={atividadeFisicaDesc}
                        onChange={(e) => setAtividadeFisicaDesc(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {/* Observações Gerais */}
                <div>
                  <label 
                    htmlFor="edit-observacoes" 
                    className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5"
                  >
                    Observações Gerais (texto livre)
                  </label>
                  <textarea
                    id="edit-observacoes"
                    rows={3}
                    placeholder="Outras anotações clínicas, rotina de trabalho, viagens..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium resize-none"
                  />
                </div>
              </div>
            )}

            {/* Barra de Ação Inferior */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Os dados são salvos em tempo real no prontuário do paciente.
              </span>

              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={savingPaciente}
                className="shadow-md shadow-emerald-600/20"
              >
                <Save className="w-4 h-4" />
                <span>Salvar alterações</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          SEÇÃO 2 — CONSULTAS (GRÁFICO EM DESTAQUE + LISTA + MODAL)
         ======================================================== */}
      {activeSection === 'consultas' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Gráfico de Evolução de Peso sempre visível em destaque */}
          <WeightEvolutionChart
            consultas={consultas}
            pesoInicial={paciente.peso_inicial}
            onOpenNovaConsulta={() => setIsNovaConsultaOpen(true)}
          />

          {/* Histórico / Lista de Consultas */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Histórico de Consultas ({consultas.length})</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ordenadas cronologicamente da mais recente para a mais antiga
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsNovaConsultaOpen(true)}
                className="shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Consulta</span>
              </Button>
            </div>

            {/* Listagem das Consultas */}
            {consultas.length === 0 ? (
              <div className="py-14 text-center bg-slate-50/70 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
                  <Clock className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Nenhuma consulta registrada ainda
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4 max-w-sm">
                  Utilize o botão "Nova Consulta" acima para adicionar a primeira avaliação clínica deste paciente.
                </p>
                <Button variant="secondary" size="sm" onClick={() => setIsNovaConsultaOpen(true)}>
                  <Plus className="w-4 h-4" />
                  <span>Registrar Primeira Consulta</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {consultas.map((c, index) => {
                  const dataFormatada = new Date(c.data_consulta).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                  const retornoFormatado = c.proximo_retorno 
                    ? new Date(c.proximo_retorno).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) 
                    : null;

                  return (
                    <div 
                      key={c.id} 
                      className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-300 dark:hover:border-emerald-600/50 transition-all shadow-2xs group"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-200/70 dark:border-slate-700/60">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${index === 0 ? 'bg-emerald-500 ring-4 ring-emerald-500/20' : 'bg-slate-400 dark:bg-slate-500'}`} />
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                            Consulta em {dataFormatada}
                          </span>
                          {index === 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                              Última
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {retornoFormatado ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              Próximo Retorno: {retornoFormatado}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              Sem retorno agendado
                            </span>
                          )}

                          <button
                            onClick={() => handleDeleteConsulta(c.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors opacity-0 group-hover:opacity-100"
                            title="Excluir consulta"
                            aria-label="Excluir consulta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Grade de Medidas da Consulta */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                        <div className="bg-white dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700">
                          <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-bold uppercase">Peso Atual</span>
                          <span className="text-base font-extrabold text-slate-900 dark:text-white">
                            {c.peso !== null && c.peso !== undefined ? `${c.peso} kg` : '-'}
                          </span>
                        </div>

                        <div className="bg-white dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700">
                          <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-bold uppercase">Cintura</span>
                          <span className="text-base font-extrabold text-slate-900 dark:text-white">
                            {c.cintura !== null && c.cintura !== undefined ? `${c.cintura} cm` : '-'}
                          </span>
                        </div>

                        <div className="bg-white dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700">
                          <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-bold uppercase">Quadril</span>
                          <span className="text-base font-extrabold text-slate-900 dark:text-white">
                            {c.quadril !== null && c.quadril !== undefined ? `${c.quadril} cm` : '-'}
                          </span>
                        </div>

                        <div className="bg-white dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700">
                          <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-bold uppercase">% Gordura</span>
                          <span className="text-base font-extrabold text-slate-900 dark:text-white">
                            {c.percentual_gordura !== null && c.percentual_gordura !== undefined ? `${c.percentual_gordura}%` : '-'}
                          </span>
                        </div>
                      </div>

                      {/* Observações da Consulta */}
                      {c.observacoes && (
                        <div className="mt-3 pt-2.5 text-xs text-slate-600 dark:text-slate-300 italic bg-white/70 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60">
                          "{c.observacoes}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          SEÇÃO 3 — PLANOS ALIMENTARES (HISTÓRICO + MODAL)
         ======================================================== */}
      {activeSection === 'planos' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-6 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Planos Alimentares</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Histórico de dietas e prescrições nutricionais personalizadas
              </p>
            </div>

            {/* Botão "Gerar Plano Alimentar" bem visível (Prompt 5) */}
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowGerarPlanoAviso(true)}
              className="shadow-md shadow-emerald-600/25"
            >
              <Sparkles className="w-4 h-4" />
              <span>Gerar Plano Alimentar</span>
            </Button>
          </div>

          {/* Histórico de Planos Salvos */}
          {planosAlimentares.length === 0 ? (
            <div className="py-16 text-center bg-slate-50/70 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 shadow-2xs">
                <UtensilsCrossed className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Nenhum plano alimentar gerado ainda
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5 max-w-md">
                Você poderá gerar cardápios calculados e adaptados às necessidades energéticas e preferências clínicas deste paciente.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowGerarPlanoAviso(true)}
              >
                <Sparkles className="w-4 h-4" />
                <span>Gerar Plano Alimentar</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {planosAlimentares.map((plano) => {
                const dataGeracao = new Date(plano.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={plano.id}
                    onClick={() => setSelectedPlano(plano)}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:bg-emerald-50/30 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          Plano Alimentar Prescrito
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>Gerado em {dataGeracao}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <span className="hidden sm:inline">Ver conteúdo</span>
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal de Nova Consulta */}
      <NovaConsultaModal
        pacienteId={pacienteId}
        pacienteNome={paciente.nome}
        isOpen={isNovaConsultaOpen}
        onClose={() => setIsNovaConsultaOpen(false)}
        onConsultaSaved={async () => {
          await loadData();
          if (onPatientUpdated) onPatientUpdated();
          setSuccessMessage('Consulta registrada com sucesso!');
          setTimeout(() => setSuccessMessage(null), 4000);
        }}
      />

      {/* Modal para Visualização Completa de Plano Alimentar Salvo */}
      {selectedPlano && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UtensilsCrossed className="w-6 h-6" />
                <div>
                  <h3 className="text-lg font-bold text-white">Conteúdo do Plano Alimentar</h3>
                  <p className="text-xs text-emerald-100">
                    Gerado em {new Date(selectedPlano.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlano(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-xs font-mono text-slate-800 dark:text-slate-200 overflow-x-auto border border-slate-200 dark:border-slate-700">
                <pre>{typeof selectedPlano.conteudo === 'string' ? selectedPlano.conteudo : JSON.stringify(selectedPlano.conteudo, null, 2)}</pre>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <Button variant="secondary" size="md" onClick={() => setSelectedPlano(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Dialog Informativo para "Gerar Plano Alimentar" */}
      {showGerarPlanoAviso && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <Sparkles className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Gerador de Planos Alimentares
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              O motor de inteligência e cálculo automatizado para elaboração de cardápios completos será implementado no <strong>Prompt 6</strong>.
            </p>

            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowGerarPlanoAviso(false)}
                className="w-full"
              >
                Entendido
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
