import React, { useState, useId } from 'react';
import { useAuth } from '../context/AuthContext';
import { createPaciente, Paciente } from '../services/dashboardService';
import { 
  formatTimeInput, 
  formatPhone, 
  calculateAge, 
  calculateIMC 
} from '../lib/patientHelpers';
import { 
  User, 
  Stethoscope, 
  Heart, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Sparkles, 
  AlertCircle, 
  Plus, 
  X, 
  Calendar, 
  Phone, 
  Mail, 
  Clock, 
  Droplet, 
  Activity, 
  ShieldCheck,
  CheckCircle2,
  Coffee,
  HelpCircle
} from 'lucide-react';
import { Button } from './ui/Button';

interface CadastroPacienteViewProps {
  onBack: () => void;
  onPatientSaved: (savedPatient: Paciente) => void;
}

type TabKey = 'pessoal' | 'clinico' | 'habitos';

// Opções pré-definidas conforme Prompt 4
const OBJETIVOS_PREDEFINIDOS = [
  'Emagrecer',
  'Ganhar massa',
  'Controlar diabetes',
  'Saúde geral',
  'Performance esportiva',
  'Reeducação alimentar'
];

const NIVEIS_ATIVIDADE = [
  { value: 'Sedentário', label: 'Sedentário', desc: 'Pouco ou nenhum exercício' },
  { value: 'Levemente ativo', label: 'Levemente ativo', desc: 'Exercício leve 1 a 3 dias/semana' },
  { value: 'Moderadamente ativo', label: 'Moderadamente ativo', desc: 'Exercício moderado 3 a 5 dias/semana' },
  { value: 'Muito ativo', label: 'Muito ativo', desc: 'Exercício pesado 6 a 7 dias/semana' },
  { value: 'Extremamente ativo', label: 'Extremamente ativo', desc: 'Treino de alta performance ou trabalho braçal' },
];

const PATOLOGIAS_PREDEFINIDAS = [
  'Diabetes',
  'Hipertensão',
  'Hipotireoidismo',
  'Hipertireoidismo',
  'Síndrome do ovário policístico',
  'Doença celíaca',
  'Colesterol alto'
];

const RESTRICOES_PREDEFINIDAS = [
  'Lactose',
  'Glúten',
  'Açúcar',
  'Carne vermelha',
  'Frutos do mar'
];

const ALERGIAS_PREDEFINIDAS = [
  'Amendoim',
  'Leite',
  'Ovo',
  'Soja',
  'Trigo',
  'Frutos do mar'
];

export const CadastroPacienteView: React.FC<CadastroPacienteViewProps> = ({
  onBack,
  onPatientSaved,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('pessoal');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // ==========================================
  // ABA 1 — PESSOAL
  // ==========================================
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState<'Feminino' | 'Masculino' | 'Outro'>('Feminino');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');

  // ==========================================
  // ABA 2 — CLÍNICO
  // ==========================================
  const [pesoKg, setPesoKg] = useState('');
  const [alturaCm, setAlturaCm] = useState('');
  const [objetivosSelecionados, setObjetivosSelecionados] = useState<string[]>([]);
  const [objetivoTexto, setObjetivoTexto] = useState('');
  const [nivelAtividade, setNivelAtividade] = useState('Moderadamente ativo');
  
  // Patologias
  const [patologiasSelecionadas, setPatologiasSelecionadas] = useState<string[]>([]);
  const [patologiaNenhum, setPatologiaNenhum] = useState(false);
  const [customPatologiaInput, setCustomPatologiaInput] = useState('');

  // Restrições
  const [restricoesSelecionadas, setRestricoesSelecionadas] = useState<string[]>([]);
  const [restricaoNenhum, setRestricaoNenhum] = useState(false);
  const [customRestricaoInput, setCustomRestricaoInput] = useState('');

  // Alergias
  const [alergiasSelecionadas, setAlergiasSelecionadas] = useState<string[]>([]);
  const [alergiaNenhum, setAlergiaNenhum] = useState(false);
  const [customAlergiaInput, setCustomAlergiaInput] = useState('');

  const [medicamentos, setMedicamentos] = useState('');
  const [suplementos, setSuplementos] = useState('');

  // ==========================================
  // ABA 3 — HÁBITOS
  // ==========================================
  const [refeicoesPorDia, setRefeicoesPorDia] = useState('');
  const [horarioAcorda, setHorarioAcorda] = useState('');
  const [horarioDorme, setHorarioDorme] = useState('');
  const [litrosAgua, setLitrosAgua] = useState('');
  const [praticaAtividade, setPraticaAtividade] = useState<boolean>(false);
  const [atividadeDescricao, setAtividadeDescricao] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Cálculos Automáticos
  const idadeCalculada = calculateAge(dataNascimento);
  const imcCalculado = calculateIMC(
    pesoKg ? parseFloat(pesoKg) : null,
    alturaCm ? parseFloat(alturaCm) : null
  );

  // Handlers de tags dinâmicas
  const toggleObjetivo = (obj: string) => {
    setObjetivosSelecionados(prev => 
      prev.includes(obj) ? prev.filter(item => item !== obj) : [...prev, obj]
    );
  };

  const togglePatologia = (item: string) => {
    setPatologiaNenhum(false);
    setPatologiasSelecionadas(prev => 
      prev.includes(item) ? prev.filter(p => p !== item) : [...prev, item]
    );
  };

  const handleTogglePatologiaNenhum = () => {
    if (!patologiaNenhum) {
      setPatologiasSelecionadas([]);
      setPatologiaNenhum(true);
    } else {
      setPatologiaNenhum(false);
    }
  };

  const handleAddCustomPatologia = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = customPatologiaInput.trim();
    if (clean && !patologiasSelecionadas.includes(clean)) {
      setPatologiaNenhum(false);
      setPatologiasSelecionadas(prev => [...prev, clean]);
      setCustomPatologiaInput('');
    }
  };

  const toggleRestricao = (item: string) => {
    setRestricaoNenhum(false);
    setRestricoesSelecionadas(prev => 
      prev.includes(item) ? prev.filter(r => r !== item) : [...prev, item]
    );
  };

  const handleToggleRestricaoNenhum = () => {
    if (!restricaoNenhum) {
      setRestricoesSelecionadas([]);
      setRestricaoNenhum(true);
    } else {
      setRestricaoNenhum(false);
    }
  };

  const handleAddCustomRestricao = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = customRestricaoInput.trim();
    if (clean && !restricoesSelecionadas.includes(clean)) {
      setRestricaoNenhum(false);
      setRestricoesSelecionadas(prev => [...prev, clean]);
      setCustomRestricaoInput('');
    }
  };

  const toggleAlergia = (item: string) => {
    setAlergiaNenhum(false);
    setAlergiasSelecionadas(prev => 
      prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]
    );
  };

  const handleToggleAlergiaNenhum = () => {
    if (!alergiaNenhum) {
      setAlergiasSelecionadas([]);
      setAlergiaNenhum(true);
    } else {
      setAlergiaNenhum(false);
    }
  };

  const handleAddCustomAlergia = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = customAlergiaInput.trim();
    if (clean && !alergiasSelecionadas.includes(clean)) {
      setAlergiaNenhum(false);
      setAlergiasSelecionadas(prev => [...prev, clean]);
      setCustomAlergiaInput('');
    }
  };

  // Submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Regra: "O único campo obrigatório é o nome completo"
    if (!nome.trim()) {
      setErrorMessage('O Nome completo é o único campo obrigatório.');
      setActiveTab('pessoal');
      return;
    }

    if (!user?.id) {
      setErrorMessage('Sessão expirada. Faça login novamente.');
      return;
    }

    setSaving(true);
    try {
      // Converte altura para metros caso tenha sido digitada em cm (> 3)
      const numAltura = alturaCm ? parseFloat(alturaCm) : null;
      const alturaParaSalvar = numAltura ? (numAltura > 3 ? Number((numAltura / 100).toFixed(2)) : numAltura) : null;

      const created = await createPaciente(user.id, {
        nome: nome.trim(),
        data_nascimento: dataNascimento || null,
        sexo: sexo || null,
        whatsapp: whatsapp ? whatsapp.trim() : null,
        email: email ? email.trim() : null,
        peso_inicial: pesoKg ? parseFloat(pesoKg) : null,
        altura: alturaParaSalvar,
        objetivos: objetivosSelecionados,
        objetivo_texto: objetivoTexto ? objetivoTexto.trim() : null,
        nivel_atividade: nivelAtividade || null,
        patologias: patologiaNenhum ? ['Nenhum'] : patologiasSelecionadas,
        restricoes_alimentares: restricaoNenhum ? ['Nenhum'] : restricoesSelecionadas,
        alergias: alergiaNenhum ? ['Nenhum'] : alergiasSelecionadas,
        medicamentos: medicamentos ? medicamentos.trim() : null,
        suplementos: suplementos ? suplementos.trim() : null,
        refeicoes_por_dia: refeicoesPorDia ? parseInt(refeicoesPorDia, 10) : null,
        horario_acorda: horarioAcorda ? formatTimeInput(horarioAcorda) : null,
        horario_dorme: horarioDorme ? formatTimeInput(horarioDorme) : null,
        litros_agua: litrosAgua ? parseFloat(litrosAgua) : null,
        atividade_fisica: praticaAtividade,
        atividade_fisica_descricao: praticaAtividade ? atividadeDescricao.trim() : null,
        observacoes: observacoes ? observacoes.trim() : null,
      });

      if (created) {
        setSuccessToast(`Paciente "${created.nome}" cadastrado com sucesso!`);
        setTimeout(() => {
          onPatientSaved(created);
        }, 800);
      }
    } catch (err: any) {
      console.error('Erro ao cadastrar paciente no Neon:', err);
      setErrorMessage('Erro ao salvar paciente no banco de dados. Verifique a conexão e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* Toast de Sucesso Flutuante */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-400 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-100" />
          <span className="font-semibold text-sm">{successToast}</span>
        </div>
      )}

      {/* Header com Navegação e Título */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50 px-3 py-1.5 rounded-lg transition-colors mb-2.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para Lista de Pacientes</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span>Novo Paciente</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              Anamnese Completa
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Organizado em 3 abas clínicas com cálculos automáticos e sincronização segura
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onBack}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleSubmit}
            loading={saving}
            className="shadow-md shadow-emerald-600/20"
          >
            <Check className="w-4 h-4" />
            <span>Salvar Paciente</span>
          </Button>
        </div>
      </div>

      {/* Alerta de Erro caso ocorra */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 dark:text-red-300 hover:text-red-700 dark:hover:text-red-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navegação por Abas (Pessoal, Clínico, Hábitos) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-2 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('pessoal')}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'pessoal'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
            activeTab === 'pessoal' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}>
            1
          </div>
          <User className="w-4 h-4" />
          <span>Aba 1 — Pessoal</span>
          {nome.trim() && (
            <span className={`w-2 h-2 rounded-full ${activeTab === 'pessoal' ? 'bg-white' : 'bg-emerald-500'}`} />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('clinico')}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'clinico'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
            activeTab === 'clinico' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}>
            2
          </div>
          <Stethoscope className="w-4 h-4" />
          <span>Aba 2 — Clínico</span>
          {(pesoKg || alturaCm) && (
            <span className={`w-2 h-2 rounded-full ${activeTab === 'clinico' ? 'bg-white' : 'bg-emerald-500'}`} />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('habitos')}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'habitos'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
            activeTab === 'habitos' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}>
            3
          </div>
          <Heart className="w-4 h-4" />
          <span>Aba 3 — Hábitos</span>
          {(litrosAgua || refeicoesPorDia) && (
            <span className={`w-2 h-2 rounded-full ${activeTab === 'habitos' ? 'bg-white' : 'bg-emerald-500'}`} />
          )}
        </button>
      </div>

      {/* Conteúdo das Abas */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-8">
        
        {/* ========================================================= */}
        {/* ABA 1 — PESSOAL */}
        {/* ========================================================= */}
        {activeTab === 'pessoal' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Dados Pessoais e Contato</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Identificação do paciente. Apenas o nome completo é obrigatório.
                </p>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Passo 1 de 3
              </span>
            </div>

            {/* Nome Completo */}
            <div className="space-y-1.5">
              <label htmlFor="field-nome" className="block text-sm font-bold text-slate-800 dark:text-slate-200">
                Nome completo <span className="text-red-500 font-extrabold">*</span>
              </label>
              <input
                id="field-nome"
                type="text"
                placeholder="Ex: Ana Clara Vasconcelos"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs font-medium transition-all"
                required
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Este é o único campo obrigatório para criação do prontuário.
              </p>
            </div>

            {/* Grid: Data de Nascimento & Idade Calculada */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="field-nasc" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Data de nascimento
                  </label>
                  {idadeCalculada !== null && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 animate-in fade-in">
                      🎂 {idadeCalculada} {idadeCalculada === 1 ? 'ano' : 'anos'}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="field-nasc"
                    type="date"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  O sistema calcula a idade atual automaticamente.
                </p>
              </div>

              {/* Sexo (Feminino, Masculino, Outro) */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Sexo biológico
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Feminino', 'Masculino', 'Outro'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSexo(s)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                        sexo === s
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Contatos: WhatsApp e E-mail */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="field-whatsapp" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>WhatsApp</span>
                </label>
                <input
                  id="field-whatsapp"
                  type="text"
                  placeholder="(11) 98765-4321"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Formatado automaticamente para envio de mensagens e retornos.
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="field-email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>E-mail</span>
                </label>
                <input
                  id="field-email"
                  type="email"
                  placeholder="paciente@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                type="button"
                variant="primary"
                onClick={() => setActiveTab('clinico')}
              >
                <span>Avançar para Clínico</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 2 — CLÍNICO */}
        {/* ========================================================= */}
        {activeTab === 'clinico' && (
          <div className="space-y-7 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Avaliação Clínica e Objetivos</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Medições corporais, cálculo de IMC, histórico patológico e nutricional
                </p>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Passo 2 de 3
              </span>
            </div>

            {/* Antropometria: Peso, Altura e IMC Automático */}
            <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>Biometria & IMC Automático</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Peso atual em kg */}
                <div className="space-y-1.5">
                  <label htmlFor="field-peso" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Peso atual
                  </label>
                  <div className="relative">
                    <input
                      id="field-peso"
                      type="number"
                      step="0.1"
                      placeholder="Ex: 70.5"
                      value={pesoKg}
                      onChange={(e) => setPesoKg(e.target.value)}
                      className="w-full pl-3 pr-12 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded pointer-events-none">
                      kg
                    </span>
                  </div>
                </div>

                {/* Altura em cm */}
                <div className="space-y-1.5">
                  <label htmlFor="field-altura" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Altura
                  </label>
                  <div className="relative">
                    <input
                      id="field-altura"
                      type="number"
                      step="1"
                      placeholder="Ex: 175"
                      value={alturaCm}
                      onChange={(e) => setAlturaCm(e.target.value)}
                      className="w-full pl-3 pr-12 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded pointer-events-none">
                      cm
                    </span>
                  </div>
                </div>

                {/* IMC Calculado Somente Leitura */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    IMC (Calculado automaticamente)
                  </label>
                  <div className="h-[42px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between">
                    {imcCalculado ? (
                      <>
                        <span className="text-base font-extrabold text-slate-900 dark:text-white">
                          {imcCalculado.imc} <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">kg/m²</span>
                        </span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${imcCalculado.badgeColor}`}>
                          {imcCalculado.classificacao}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                        Preencha peso e altura
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Objetivos: Múltipla Escolha + Campo Livre Adicional */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">
                  Objetivo nutricional
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Selecione uma ou mais metas do paciente e adicione detalhes livres abaixo
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {OBJETIVOS_PREDEFINIDOS.map((obj) => {
                  const isSelected = objetivosSelecionados.includes(obj);
                  return (
                    <button
                      key={obj}
                      type="button"
                      onClick={() => toggleObjetivo(obj)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30'
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />}
                      <span>{obj}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-1">
                <input
                  type="text"
                  placeholder="Campo de texto livre adicional: detalhes sobre os objetivos e metas específicas..."
                  value={objetivoTexto}
                  onChange={(e) => setObjetivoTexto(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Nível de Atividade Física (Seleção Única) */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">
                Nível de atividade física
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {NIVEIS_ATIVIDADE.map((item) => {
                  const isSelected = nivelAtividade === item.value;
                  return (
                    <div
                      key={item.value}
                      onClick={() => setNivelAtividade(item.value)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/50 border-emerald-500 shadow-2xs'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-700/50'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                      <div>
                        <span className={`block text-xs font-bold ${isSelected ? 'text-emerald-950 dark:text-emerald-200' : 'text-slate-800 dark:text-slate-200'}`}>
                          {item.label}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight block mt-0.5">
                          {item.desc}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Patologias ou Condições de Saúde */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">
                  Patologias ou condições de saúde
                </label>
                <span className="text-xs text-slate-400 dark:text-slate-500">Múltipla escolha</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {/* Opção Nenhum */}
                <button
                  type="button"
                  onClick={handleTogglePatologiaNenhum}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    patologiaNenhum
                      ? 'bg-slate-800 dark:bg-slate-700 text-white border-slate-800 dark:border-slate-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Nenhum
                </button>

                {PATOLOGIAS_PREDEFINIDAS.map((item) => {
                  const isSelected = patologiasSelecionadas.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => togglePatologia(item)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800 font-bold'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {isSelected ? <Check className="w-3 h-3 text-red-600 dark:text-red-400" /> : <Plus className="w-3 h-3 text-slate-400 dark:text-slate-500" />}
                      <span>{item}</span>
                    </button>
                  );
                })}

                {/* Tags customizadas já adicionadas */}
                {patologiasSelecionadas
                  .filter((p) => !PATOLOGIAS_PREDEFINIDAS.includes(p))
                  .map((custom) => (
                    <span
                      key={custom}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-100 dark:bg-red-950/70 text-red-900 dark:text-red-200 border border-red-300 dark:border-red-800 flex items-center gap-1.5"
                    >
                      <span>{custom}</span>
                      <button
                        type="button"
                        onClick={() => togglePatologia(custom)}
                        className="text-red-500 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
              </div>

              {/* Campo para adicionar livremente */}
              <div className="flex items-center gap-2 pt-1 max-w-md">
                <input
                  type="text"
                  placeholder="Adicionar outra patologia ou condição..."
                  value={customPatologiaInput}
                  onChange={(e) => setCustomPatologiaInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomPatologia();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleAddCustomPatologia()}
                  disabled={!customPatologiaInput.trim()}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </Button>
              </div>
            </div>

            {/* Restrições Alimentares */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">
                  Restrições alimentares
                </label>
                <span className="text-xs text-slate-400 dark:text-slate-500">Múltipla escolha</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {/* Opção Nenhum */}
                <button
                  type="button"
                  onClick={handleToggleRestricaoNenhum}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    restricaoNenhum
                      ? 'bg-slate-800 dark:bg-slate-700 text-white border-slate-800 dark:border-slate-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Nenhum
                </button>

                {RESTRICOES_PREDEFINIDAS.map((item) => {
                  const isSelected = restricoesSelecionadas.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleRestricao(item)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-bold'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {isSelected ? <Check className="w-3 h-3 text-amber-700 dark:text-amber-400" /> : <Plus className="w-3 h-3 text-slate-400 dark:text-slate-500" />}
                      <span>{item}</span>
                    </button>
                  );
                })}

                {/* Tags customizadas */}
                {restricoesSelecionadas
                  .filter((r) => !RESTRICOES_PREDEFINIDAS.includes(r))
                  .map((custom) => (
                    <span
                      key={custom}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 flex items-center gap-1.5"
                    >
                      <span>{custom}</span>
                      <button
                        type="button"
                        onClick={() => toggleRestricao(custom)}
                        className="text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
              </div>

              {/* Campo para adicionar livremente */}
              <div className="flex items-center gap-2 pt-1 max-w-md">
                <input
                  type="text"
                  placeholder="Adicionar outra restrição alimentar..."
                  value={customRestricaoInput}
                  onChange={(e) => setCustomRestricaoInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomRestricao();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleAddCustomRestricao()}
                  disabled={!customRestricaoInput.trim()}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </Button>
              </div>
            </div>

            {/* Alergias Alimentares */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">
                  Alergias alimentares
                </label>
                <span className="text-xs text-slate-400 dark:text-slate-500">Múltipla escolha</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {/* Opção Nenhum */}
                <button
                  type="button"
                  onClick={handleToggleAlergiaNenhum}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    alergiaNenhum
                      ? 'bg-slate-800 dark:bg-slate-700 text-white border-slate-800 dark:border-slate-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Nenhum
                </button>

                {ALERGIAS_PREDEFINIDAS.map((item) => {
                  const isSelected = alergiasSelecionadas.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleAlergia(item)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-300 border-rose-300 dark:border-rose-800 font-bold'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {isSelected ? <Check className="w-3 h-3 text-rose-700 dark:text-rose-400" /> : <Plus className="w-3 h-3 text-slate-400 dark:text-slate-500" />}
                      <span>{item}</span>
                    </button>
                  );
                })}

                {/* Tags customizadas */}
                {alergiasSelecionadas
                  .filter((a) => !ALERGIAS_PREDEFINIDAS.includes(a))
                  .map((custom) => (
                    <span
                      key={custom}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800 flex items-center gap-1.5"
                    >
                      <span>{custom}</span>
                      <button
                        type="button"
                        onClick={() => toggleAlergia(custom)}
                        className="text-rose-700 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-200"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
              </div>

              {/* Campo para adicionar livremente */}
              <div className="flex items-center gap-2 pt-1 max-w-md">
                <input
                  type="text"
                  placeholder="Adicionar outra alergia alimentar..."
                  value={customAlergiaInput}
                  onChange={(e) => setCustomAlergiaInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomAlergia();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleAddCustomAlergia()}
                  disabled={!customAlergiaInput.trim()}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </Button>
              </div>
            </div>

            {/* Medicamentos e Suplementos (Texto Livre) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-1.5">
                <label htmlFor="field-meds" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Medicamentos contínuos (texto livre)
                </label>
                <textarea
                  id="field-meds"
                  rows={3}
                  placeholder="Ex: Puran T4 50mcg em jejum, Losartana 50mg..."
                  value={medicamentos}
                  onChange={(e) => setMedicamentos(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="field-supl" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Suplementos em uso (texto livre)
                </label>
                <textarea
                  id="field-supl"
                  rows={3}
                  placeholder="Ex: Creatina 5g diárias, Whey protein isolado, Vitamina D..."
                  value={suplementos}
                  onChange={(e) => setSuplementos(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setActiveTab('pessoal')}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                <span>Voltar para Pessoal</span>
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => setActiveTab('habitos')}
              >
                <span>Avançar para Hábitos</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 3 — HÁBITOS */}
        {/* ========================================================= */}
        {activeTab === 'habitos' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Heart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Rotina, Hidratação e Hábitos Diários</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Horários biológicos, frequência alimentar e prática de exercícios
                </p>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Passo 3 de 3
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Quantas refeições faz por dia */}
              <div className="space-y-1.5">
                <label htmlFor="field-refeicoes" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Coffee className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Quantas refeições faz por dia</span>
                </label>
                <input
                  id="field-refeicoes"
                  type="number"
                  min="1"
                  max="12"
                  placeholder="Ex: 4"
                  value={refeicoesPorDia}
                  onChange={(e) => setRefeicoesPorDia(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Quantidade de água por dia */}
              <div className="space-y-1.5">
                <label htmlFor="field-agua" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Droplet className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                  <span>Quantidade de água por dia</span>
                </label>
                <div className="relative">
                  <input
                    id="field-agua"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 2.5"
                    value={litrosAgua}
                    onChange={(e) => setLitrosAgua(e.target.value)}
                    className="w-full pl-3 pr-16 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded pointer-events-none">
                    litros
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  O sistema exibe e formata em litros automaticamente.
                </p>
              </div>
            </div>

            {/* Horário que acorda e Horário que dorme com conversão automática */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Ciclo Circadiano (Conversão Automática de Horários)
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Você pode digitar apenas os números (ex: <strong>6</strong> vira <strong>06:00</strong>, <strong>630</strong> vira <strong>06:30</strong>, <strong>23</strong> vira <strong>23:00</strong>, <strong>2230</strong> vira <strong>22:30</strong>).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Horário que acorda */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="field-acorda" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Horário que acorda
                    </label>
                    {horarioAcorda && (
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                        {formatTimeInput(horarioAcorda)}
                      </span>
                    )}
                  </div>
                  <input
                    id="field-acorda"
                    type="text"
                    placeholder="Ex: 6 ou 630"
                    value={horarioAcorda}
                    onChange={(e) => setHorarioAcorda(e.target.value)}
                    onBlur={(e) => setHorarioAcorda(formatTimeInput(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Horário que dorme */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="field-dorme" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Horário que dorme
                    </label>
                    {horarioDorme && (
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                        {formatTimeInput(horarioDorme)}
                      </span>
                    )}
                  </div>
                  <input
                    id="field-dorme"
                    type="text"
                    placeholder="Ex: 23 ou 2230"
                    value={horarioDorme}
                    onChange={(e) => setHorarioDorme(e.target.value)}
                    onBlur={(e) => setHorarioDorme(formatTimeInput(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Pratica Atividade Física (Sim / Não) */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">
                    Pratica atividade física?
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Selecione Sim para registrar modalidades e rotina semanal
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPraticaAtividade(true)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      praticaAtividade
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPraticaAtividade(false);
                      setAtividadeDescricao('');
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      !praticaAtividade
                        ? 'bg-slate-800 dark:bg-slate-700 text-white border-slate-800 dark:border-slate-600 shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    Não
                  </button>
                </div>
              </div>

              {/* Se sim, abre campo de texto: qual atividade e frequência semanal */}
              {praticaAtividade && (
                <div className="pt-2 animate-in fade-in duration-150 space-y-1.5">
                  <label htmlFor="field-ativ-desc" className="block text-xs font-bold text-emerald-900 dark:text-emerald-300">
                    Qual atividade e frequência semanal?
                  </label>
                  <input
                    id="field-ativ-desc"
                    type="text"
                    placeholder="Ex: Musculação 4x na semana e corrida aos sábados pela manhã"
                    value={atividadeDescricao}
                    onChange={(e) => setAtividadeDescricao(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-950/30 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Observações Gerais */}
            <div className="space-y-1.5">
              <label htmlFor="field-obs" className="block text-sm font-bold text-slate-800 dark:text-slate-200">
                Observações gerais (texto livre)
              </label>
              <textarea
                id="field-obs"
                rows={3}
                placeholder="Histórico familiar, preferências alimentares, aversões, rotina diária ou qualquer detalhe relevante para o plano nutricional..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            {/* Ações da Aba 3 */}
            <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setActiveTab('clinico')}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                <span>Voltar para Clínico</span>
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={saving}
                className="shadow-md shadow-emerald-600/20"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Paciente</span>
              </Button>
            </div>
          </div>
        )}

      </form>
    </div>
  );
};
