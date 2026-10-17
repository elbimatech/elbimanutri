import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sidebar, NavigationTab } from './Sidebar';
import { PacientesView } from './PacientesView';
import { CadastroPacienteView } from './CadastroPacienteView';
import { PatientProfileModal } from './PatientProfileModal';
import { 
  getDashboardStats, 
  DashboardStats, 
  PacienteSemRetorno,
  seedDemoData 
} from '../services/dashboardService';
import { 
  Users, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  RefreshCw, 
  UserPlus, 
  ChevronRight, 
  CalendarCheck2, 
  TrendingUp, 
  Activity, 
  ShieldCheck, 
  Menu,
  Phone,
  Mail,
  Loader2
} from 'lucide-react';
import { Button } from './ui/Button';

export const Dashboard: React.FC = () => {
  const { user, nutricionista } = useAuth();
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [stats, setStats] = useState<DashboardStats>({
    totalPacientes: 0,
    consultasSemana: 0,
    pacientesSemRetorno: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const displayName = nutricionista?.nome || user?.name || 'Nutricionista';
  const firstName = displayName.split(' ')[0];

  // Carregamento de dados em tempo real do Neon
  const loadDashboardData = useCallback(async (isSilent = false) => {
    if (!user?.id) return;
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const data = await getDashboardStats(user.id);
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handler para popular dados de teste caso o banco esteja vazio
  const handleSeedDemo = async () => {
    if (!user?.id) return;
    setIsSeeding(true);
    try {
      const success = await seedDemoData(user.id);
      if (success) {
        await loadDashboardData();
      }
    } catch (e) {
      console.error('Erro ao inserir dados de teste:', e);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleOpenPatientProfile = (pacienteId: string) => {
    setSelectedPatientId(pacienteId);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Menu Lateral Fixo */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        pacientesCount={stats.totalPacientes}
        isOpenMobile={isMobileSidebarOpen}
        onToggleMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Conteúdo Principal com compensação da Sidebar fixa (lg:ml-72) */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-72 transition-all">
        {/* Top Header Barra Superior */}
        <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs backdrop-blur-md bg-white/95">
          <div className="px-4 sm:px-8 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Botão de Menu Mobile */}
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                aria-label="Abrir menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
                  {activeTab === 'dashboard'
                    ? 'Painel de Controle'
                    : activeTab === 'novo-paciente'
                    ? 'Cadastro de Paciente'
                    : 'Gerenciamento de Pacientes'}
                </h2>
                <p className="text-xs text-slate-400 hidden sm:block">
                  {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => loadDashboardData(true)}
                disabled={refreshing}
                className="text-slate-600 hover:text-emerald-700"
                title="Sincronizar em tempo real com o Neon"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
                <span className="hidden sm:inline text-xs font-semibold">Atualizar</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveTab('novo-paciente')}
                className="shadow-sm shadow-emerald-600/20"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Novo Paciente</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Corpo da Página */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-8">
          {activeTab === 'novo-paciente' ? (
            <CadastroPacienteView
              onBack={() => setActiveTab('pacientes')}
              onPatientSaved={(savedPatient) => {
                loadDashboardData(true);
                setSelectedPatientId(savedPatient.id);
                setActiveTab('pacientes');
              }}
            />
          ) : activeTab === 'pacientes' ? (
            <PacientesView
              onSelectPatient={handleOpenPatientProfile}
              onOpenNewPatientPage={() => setActiveTab('novo-paciente')}
            />
          ) : (
            <>
              {/* Banner de Boas-Vindas */}
              <div className="bg-gradient-to-br from-emerald-700 via-teal-700 to-emerald-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-900/10 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-80 h-full opacity-10 pointer-events-none flex items-center justify-center">
                  <Sparkles className="w-72 h-72 text-white" />
                </div>

                <div className="relative z-10 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-emerald-100 mb-3 border border-white/20">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Neon Database &bull; Dados em Tempo Real</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
                    Olá, {firstName}! 👋
                  </h1>

                  <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
                    Acompanhe aqui o resumo dos seus atendimentos, pacientes ativos e monitoramento de retornos clínicos.
                  </p>
                </div>
              </div>

              {/* Botão de Ajuda para Popular Dados de Teste (quando 0 pacientes) */}
              {stats.totalPacientes === 0 && !loading && (
                <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-emerald-950">
                        Seu banco de dados está pronto para receber cadastros!
                      </h3>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Deseja preencher com alguns pacientes e consultas de exemplo para visualizar os 3 cards em funcionamento?
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSeedDemo}
                    loading={isSeeding}
                    className="shrink-0 bg-emerald-700 hover:bg-emerald-800"
                  >
                    <span>Inserir Dados de Exemplo</span>
                  </Button>
                </div>
              )}

              {/* Seção dos 3 Cards Principais */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Visão Geral</span>
                  </h2>
                  <span className="text-xs text-slate-400">
                    Métricas calculadas do seu banco de dados
                  </span>
                </div>

                {loading ? (
                  <div className="py-20 flex flex-col items-center justify-center text-emerald-700 font-medium bg-white rounded-3xl border border-slate-200 shadow-2xs">
                    <Loader2 className="w-8 h-8 animate-spin mb-3 text-emerald-600" />
                    <span>Carregando métricas do Neon em tempo real...</span>
                  </div>
                ) : (
                  <>
                    {/* Linha com os Cards 1 e 2 (Numéricos de Alto Impacto) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* CARD 1 — Total de pacientes ativos */}
                      <div 
                        onClick={() => setActiveTab('pacientes')}
                        className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group relative overflow-hidden"
                      >
                        <div className="flex items-start justify-between">
                          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                            <Users className="w-7 h-7" />
                          </div>

                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                            <Activity className="w-3.5 h-3.5" />
                            <span>Ativos</span>
                          </span>
                        </div>

                        <div className="mt-5">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Card 1 &bull; Pacientes
                          </span>
                          <h3 className="text-base font-bold text-slate-700 mt-0.5">
                            Total de Pacientes Ativos
                          </h3>
                          <div className="flex items-baseline gap-3 mt-2">
                            <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                              {stats.totalPacientes}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              cadastrados por você
                            </span>
                          </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600 group-hover:text-emerald-700">
                          <span>Ver lista de pacientes</span>
                          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>

                      {/* CARD 2 — Consultas da semana */}
                      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-teal-300 transition-all relative overflow-hidden">
                        <div className="flex items-start justify-between">
                          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-700 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
                            <CalendarCheck2 className="w-7 h-7" />
                          </div>

                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200/70">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Semana Corrente</span>
                          </span>
                        </div>

                        <div className="mt-5">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Card 2 &bull; Atendimentos
                          </span>
                          <h3 className="text-base font-bold text-slate-700 mt-0.5">
                            Consultas da Semana
                          </h3>
                          <div className="flex items-baseline gap-3 mt-2">
                            <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                              {stats.consultasSemana}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              atendimentos registrados nesta semana
                            </span>
                          </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                          <span>Período: Segunda a Domingo</span>
                          <span className="text-teal-700 font-semibold">Atualizado</span>
                        </div>
                      </div>
                    </div>

                    {/* CARD 3 — Pacientes sem retorno */}
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                            <Clock className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Card 3
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                &gt; 30 dias sem retorno
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">
                              Pacientes Sem Retorno
                            </h3>
                          </div>
                        </div>

                        <div className="text-xs text-slate-500">
                          {stats.pacientesSemRetorno.length > 0 ? (
                            <span className="font-semibold text-amber-700">
                              {stats.pacientesSemRetorno.length} paciente(s) precisam de contato
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-medium">
                              Nenhuma pendência
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Conteúdo da Lista do Card 3 */}
                      <div className="mt-6">
                        {stats.pacientesSemRetorno.length === 0 ? (
                          /* Regra: "Se não houver pacientes sem retorno, exibir a mensagem 'Nenhum paciente sem retorno no momento'" */
                          <div className="py-12 px-4 text-center rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col items-center justify-center">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 shadow-2xs">
                              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h4 className="text-base font-bold text-slate-800">
                              Nenhum paciente sem retorno no momento
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 max-w-md">
                              Todos os seus pacientes com consultas realizadas estão com retornos agendados ou foram atendidos há menos de 30 dias.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-xs text-slate-500 mb-2">
                              Clique no nome do paciente para abrir seu perfil e histórico clínico:
                            </p>
                            
                            <div className="grid grid-cols-1 gap-3">
                              {stats.pacientesSemRetorno.map((paciente) => {
                                const dataFormatada = paciente.ultima_consulta_data 
                                  ? new Date(paciente.ultima_consulta_data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) 
                                  : 'Não informada';

                                return (
                                  <div
                                    key={paciente.paciente_id}
                                    onClick={() => handleOpenPatientProfile(paciente.paciente_id)}
                                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                  >
                                    <div className="flex items-center gap-3.5">
                                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                                        {paciente.paciente_nome.charAt(0).toUpperCase()}
                                      </div>

                                      <div>
                                        <h4 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-2">
                                          <span>{paciente.paciente_nome}</span>
                                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 opacity-0 group-hover:opacity-100 transition-opacity">
                                            Ver Perfil
                                          </span>
                                        </h4>

                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-0.5">
                                          {paciente.paciente_whatsapp && (
                                            <span className="flex items-center gap-1 text-emerald-700 font-medium">
                                              <Phone className="w-3 h-3" />
                                              {paciente.paciente_whatsapp}
                                            </span>
                                          )}
                                          {paciente.paciente_email && (
                                            <span className="flex items-center gap-1 text-slate-500">
                                              <Mail className="w-3 h-3" />
                                              {paciente.paciente_email}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                      <div className="text-left sm:text-right">
                                        <span className="text-xs text-slate-500 block">
                                          Última consulta: <strong className="text-slate-800">{dataFormatada}</strong>
                                        </span>
                                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                                          {paciente.dias_sem_consulta} dias sem retorno
                                        </span>
                                      </div>

                                      <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white text-slate-400 flex items-center justify-center transition-colors shrink-0">
                                        <ChevronRight className="w-4 h-4" />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Modal de Perfil do Paciente */}
      {selectedPatientId && (
        <PatientProfileModal
          pacienteId={selectedPatientId}
          onClose={() => setSelectedPatientId(null)}
          onDataChanged={() => loadDashboardData(true)}
        />
      )}
    </div>
  );
};
