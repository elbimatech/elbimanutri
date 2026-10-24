import React, { useEffect, useState } from 'react';
import { 
  Paciente, 
  Consulta, 
  getPacienteDetalhes, 
  createConsulta 
} from '../services/dashboardService';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  Clock, 
  Activity, 
  AlertTriangle, 
  Plus, 
  CheckCircle2, 
  Heart,
  Droplet,
  FileText,
  Weight,
  Sparkles,
  Loader2
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { calculateAge, calculateIMC } from '../lib/patientHelpers';

interface PatientProfileModalProps {
  pacienteId: string | null;
  onClose: () => void;
  onDataChanged?: () => void;
}

export const PatientProfileModal: React.FC<PatientProfileModalProps> = ({
  pacienteId,
  onClose,
  onDataChanged,
}) => {
  const { user } = useAuth();
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewConsultaForm, setShowNewConsultaForm] = useState(false);
  const [savingConsulta, setSavingConsulta] = useState(false);

  // Form de nova consulta
  const [dataConsulta, setDataConsulta] = useState(new Date().toISOString().split('T')[0]);
  const [peso, setPeso] = useState('');
  const [cintura, setCintura] = useState('');
  const [quadril, setQuadril] = useState('');
  const [percentualGordura, setPercentualGordura] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [proximoRetorno, setProximoRetorno] = useState('');

  const loadData = async () => {
    if (!pacienteId || !user?.id) return;
    setLoading(true);
    try {
      const res = await getPacienteDetalhes(pacienteId, user.id);
      setPaciente(res.paciente);
      setConsultas(res.consultas);
    } catch (err) {
      console.error('Erro ao carregar detalhes do paciente:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [pacienteId, user?.id]);

  if (!pacienteId) return null;

  const handleCreateConsulta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteId) return;

    setSavingConsulta(true);
    try {
      await createConsulta(pacienteId, {
        data_consulta: dataConsulta,
        peso: peso ? parseFloat(peso) : null,
        cintura: cintura ? parseFloat(cintura) : null,
        quadril: quadril ? parseFloat(quadril) : null,
        percentual_gordura: percentualGordura ? parseFloat(percentualGordura) : null,
        observacoes: observacoes || null,
        proximo_retorno: proximoRetorno || null,
      });

      setShowNewConsultaForm(false);
      // Reset form
      setPeso('');
      setCintura('');
      setQuadril('');
      setPercentualGordura('');
      setObservacoes('');
      setProximoRetorno('');

      await loadData();
      if (onDataChanged) {
        onDataChanged();
      }
    } catch (err) {
      console.error('Erro ao salvar consulta:', err);
      alert('Erro ao registrar consulta. Tente novamente.');
    } finally {
      setSavingConsulta(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white p-6 relative flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-extrabold text-2xl shadow-inner">
              {paciente?.nome ? paciente.nome.charAt(0).toUpperCase() : <User className="w-7 h-7" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/20 text-emerald-100 uppercase tracking-wide">
                  Perfil do Paciente
                </span>
                {paciente?.sexo && (
                  <span className="text-xs text-emerald-200">
                    &bull; {paciente.sexo}
                  </span>
                )}
                {paciente?.data_nascimento && (
                  <span className="text-xs text-emerald-200">
                    &bull; {calculateAge(paciente.data_nascimento) ? `${calculateAge(paciente.data_nascimento)} anos` : paciente.data_nascimento}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
                {paciente?.nome || 'Carregando...'}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-100 mt-1">
                {paciente?.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    {paciente.email}
                  </span>
                )}
                {paciente?.whatsapp && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {paciente.whatsapp}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-emerald-700 dark:text-emerald-400 font-medium">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-emerald-600 dark:text-emerald-500" />
              <span>Carregando dados do paciente...</span>
            </div>
          ) : !paciente ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
              <p>Paciente não encontrado.</p>
            </div>
          ) : (
            <>
              {/* Resumo Biométrico & IMC */}
              {(() => {
                const imc = calculateIMC(
                  paciente.peso_inicial,
                  paciente.altura ? (paciente.altura < 3 ? paciente.altura * 100 : paciente.altura) : null
                );
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/50">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1">
                        <Weight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Peso Inicial</span>
                      </div>
                      <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {paciente.peso_inicial ? `${paciente.peso_inicial} kg` : 'Não inf.'}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-800/50">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 mb-1">
                        <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        <span>Altura</span>
                      </div>
                      <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {paciente.altura 
                          ? (paciente.altura > 3 ? `${paciente.altura} cm` : `${(paciente.altura * 100).toFixed(0)} cm (${paciente.altura}m)`)
                          : 'Não inf.'}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>IMC Inicial</span>
                      </div>
                      {imc ? (
                        <div>
                          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            {imc.imc} <span className="text-[10px] text-slate-400 font-normal">kg/m²</span>
                          </p>
                          <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ${imc.badgeColor}`}>
                            {imc.classificacao}
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Não calculado</p>
                      )}
                    </div>

                    <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800/50">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">
                        <Droplet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>Água / dia</span>
                      </div>
                      <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {paciente.litros_agua ? `${paciente.litros_agua} L` : 'Não inf.'}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800/50 col-span-2 sm:col-span-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">
                        <Heart className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span>Atividade</span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate" title={paciente.nivel_atividade || ''}>
                        {paciente.nivel_atividade || (paciente.atividade_fisica ? 'Ativo' : 'Sedentário')}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Hábitos e Rotina */}
              {(paciente.refeicoes_por_dia || paciente.horario_acorda || paciente.horario_dorme || paciente.atividade_fisica_descricao) && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Hábitos e Rotina Diária</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700 dark:text-slate-300">
                    {paciente.refeicoes_por_dia && (
                      <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-400 dark:text-slate-400 block text-[10px]">Refeições/dia:</span>
                        <strong className="text-sm text-slate-800 dark:text-slate-100">{paciente.refeicoes_por_dia} refeições</strong>
                      </div>
                    )}
                    {paciente.horario_acorda && (
                      <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-400 dark:text-slate-400 block text-[10px]">Acorda às:</span>
                        <strong className="text-sm text-slate-800 dark:text-slate-100">{paciente.horario_acorda}</strong>
                      </div>
                    )}
                    {paciente.horario_dorme && (
                      <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-400 dark:text-slate-400 block text-[10px]">Dorme às:</span>
                        <strong className="text-sm text-slate-800 dark:text-slate-100">{paciente.horario_dorme}</strong>
                      </div>
                    )}
                    {paciente.atividade_fisica_descricao && (
                      <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 col-span-2 sm:col-span-1">
                        <span className="text-slate-400 dark:text-slate-400 block text-[10px]">Exercícios:</span>
                        <span className="font-medium text-xs text-slate-800 dark:text-slate-200 line-clamp-2">{paciente.atividade_fisica_descricao}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Objetivos e Informações Clínicas */}
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Objetivos & Informações Clínicas
                </h3>

                {paciente.objetivos && paciente.objetivos.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {paciente.objetivos.map((obj, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/70">
                        🎯 {obj}
                      </span>
                    ))}
                  </div>
                )}

                {paciente.objetivo_texto && (
                  <p className="text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700">
                    <strong className="text-slate-900 dark:text-white">Objetivo Detalhado:</strong> {paciente.objetivo_texto}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-600 dark:text-slate-300">
                  {paciente.patologias && paciente.patologias.length > 0 && (
                    <div className="bg-white dark:bg-slate-800/90 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700">
                      <span className="font-bold text-red-700 dark:text-red-400 block mb-1">Patologias / Condições:</span>
                      <span>{paciente.patologias.join(', ')}</span>
                    </div>
                  )}

                  {paciente.restricoes_alimentares && paciente.restricoes_alimentares.length > 0 && (
                    <div className="bg-white dark:bg-slate-800/90 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700">
                      <span className="font-bold text-amber-700 dark:text-amber-400 block mb-1">Restrições Alimentares:</span>
                      <span>{paciente.restricoes_alimentares.join(', ')}</span>
                    </div>
                  )}

                  {paciente.alergias && paciente.alergias.length > 0 && (
                    <div className="bg-white dark:bg-slate-800/90 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700">
                      <span className="font-bold text-rose-700 dark:text-rose-400 block mb-1">Alergias Alimentares:</span>
                      <span>{paciente.alergias.join(', ')}</span>
                    </div>
                  )}

                  {paciente.medicamentos && (
                    <div className="bg-white dark:bg-slate-800/90 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700">
                      <span className="font-bold text-blue-700 dark:text-blue-400 block mb-1">Medicamentos:</span>
                      <span>{paciente.medicamentos}</span>
                    </div>
                  )}

                  {paciente.suplementos && (
                    <div className="bg-white dark:bg-slate-800/90 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700">
                      <span className="font-bold text-purple-700 dark:text-purple-400 block mb-1">Suplementos:</span>
                      <span>{paciente.suplementos}</span>
                    </div>
                  )}

                  {paciente.observacoes && (
                    <div className="bg-white dark:bg-slate-800/90 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700 col-span-1 sm:col-span-2">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Observações Gerais:</span>
                      <span>{paciente.observacoes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Histórico de Consultas & Acompanhamento */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      Histórico de Consultas ({consultas.length})
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Evolução antropométrica e próximos agendamentos
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setShowNewConsultaForm(!showNewConsultaForm)}
                  >
                    <Plus className="w-4 h-4" />
                    <span>{showNewConsultaForm ? 'Cancelar' : 'Registrar Consulta'}</span>
                  </Button>
                </div>

                {/* Form para adicionar nova consulta */}
                {showNewConsultaForm && (
                  <form onSubmit={handleCreateConsulta} className="bg-emerald-50/50 dark:bg-emerald-950/30 p-5 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/50 space-y-4 animate-in fade-in duration-150">
                    <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
                      Nova Avaliação / Consulta
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input
                        id="form-data-consulta"
                        label="Data da Consulta"
                        type="date"
                        value={dataConsulta}
                        onChange={(e) => setDataConsulta(e.target.value)}
                        required
                      />

                      <Input
                        id="form-peso"
                        label="Peso Atual (kg)"
                        type="number"
                        step="0.1"
                        placeholder="Ex: 72.5"
                        value={peso}
                        onChange={(e) => setPeso(e.target.value)}
                      />

                      <Input
                        id="form-gordura"
                        label="% Gordura Corporal"
                        type="number"
                        step="0.1"
                        placeholder="Ex: 21.0"
                        value={percentualGordura}
                        onChange={(e) => setPercentualGordura(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input
                        id="form-cintura"
                        label="Cintura (cm)"
                        type="number"
                        step="0.1"
                        placeholder="Ex: 78"
                        value={cintura}
                        onChange={(e) => setCintura(e.target.value)}
                      />

                      <Input
                        id="form-quadril"
                        label="Quadril (cm)"
                        type="number"
                        step="0.1"
                        placeholder="Ex: 102"
                        value={quadril}
                        onChange={(e) => setQuadril(e.target.value)}
                      />

                      <Input
                        id="form-proximo-retorno"
                        label="Próximo Retorno Agendado"
                        type="date"
                        value={proximoRetorno}
                        onChange={(e) => setProximoRetorno(e.target.value)}
                      />
                    </div>

                    <Input
                      id="form-observacoes"
                      label="Observações da Consulta"
                      placeholder="Evolução, ajustes no plano alimentar, queixas..."
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                    />

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowNewConsultaForm(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        loading={savingConsulta}
                      >
                        Salvar Consulta
                      </Button>
                    </div>
                  </form>
                )}

                {/* Lista de Consultas */}
                {consultas.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <Clock className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      Nenhuma consulta registrada para este paciente ainda.
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Clique em "Registrar Consulta" acima para adicionar a primeira avaliação.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {consultas.map((c) => {
                      const dataFormatada = new Date(c.data_consulta).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                      const retornoFormatado = c.proximo_retorno 
                        ? new Date(c.proximo_retorno).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) 
                        : null;

                      return (
                        <div key={c.id} className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 shadow-2xs hover:border-emerald-200 dark:hover:border-emerald-600/50 transition-colors">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-700/70">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              <span className="font-bold text-sm text-slate-900 dark:text-white">
                                Consulta em {dataFormatada}
                              </span>
                            </div>

                            {retornoFormatado ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                Retorno: {retornoFormatado}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                Sem retorno agendado
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 dark:text-slate-300 mb-2">
                            {c.peso && (
                              <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg">
                                <span className="text-slate-400 dark:text-slate-500 block">Peso:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{c.peso} kg</span>
                              </div>
                            )}
                            {c.percentual_gordura && (
                              <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg">
                                <span className="text-slate-400 dark:text-slate-500 block">% Gordura:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{c.percentual_gordura}%</span>
                              </div>
                            )}
                            {c.cintura && (
                              <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg">
                                <span className="text-slate-400 dark:text-slate-500 block">Cintura:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{c.cintura} cm</span>
                              </div>
                            )}
                            {c.quadril && (
                              <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg">
                                <span className="text-slate-400 dark:text-slate-500 block">Quadril:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{c.quadril} cm</span>
                              </div>
                            )}
                          </div>

                          {c.observacoes && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50/70 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700/70">
                              "{c.observacoes}"
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Dados sincronizados com segurança
          </div>
          <Button variant="secondary" size="md" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
};
