import React, { useState, useEffect } from 'react';
import { Paciente, getPacientes } from '../services/dashboardService';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Search, 
  UserPlus, 
  Calendar, 
  ChevronRight, 
  Target, 
  Sparkles, 
  Loader2, 
  Phone, 
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from './ui/Button';

interface PacientesViewProps {
  onSelectPatient: (pacienteId: string) => void;
  onOpenNewPatientPage: () => void;
}

export const PacientesView: React.FC<PacientesViewProps> = ({
  onSelectPatient,
  onOpenNewPatientPage,
}) => {
  const { user } = useAuth();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadPacientes = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await getPacientes(user.id);
      setPacientes(data);
    } catch (err) {
      console.error('Erro ao carregar lista de pacientes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPacientes();
  }, [user?.id]);

  // Filtragem exclusivamente por nome conforme Prompt 4 ("Campo de busca por nome no topo da listagem")
  const filteredPacientes = pacientes.filter((p) => {
    if (!searchTerm.trim()) return true;
    return p.nome.toLowerCase().includes(searchTerm.toLowerCase().trim());
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-emerald-600" />
            <span>Pacientes</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestão clínica e prontuários sincronizados em tempo real com o Neon PostgreSQL
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Botão "Novo Paciente" que redireciona para o formulário de cadastro */}
          <Button
            variant="primary"
            size="md"
            onClick={onOpenNewPatientPage}
            className="shadow-md shadow-emerald-600/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Paciente</span>
          </Button>
        </div>
      </div>

      {/* Campo de busca por nome no topo da listagem */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nome do paciente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all font-medium"
          />
        </div>

        <span className="text-xs font-semibold text-slate-400 whitespace-nowrap px-2">
          {filteredPacientes.length} {filteredPacientes.length === 1 ? 'paciente' : 'pacientes'}
        </span>
      </div>

      {/* Lista / Grid de Pacientes */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-emerald-700 font-medium bg-white rounded-3xl border border-slate-200 shadow-2xs">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-emerald-600" />
          <span>Carregando pacientes cadastrados no Neon...</span>
        </div>
      ) : pacientes.length === 0 ? (
        /* Regra: "Se não houver pacientes cadastrados, exibir a mensagem 'Nenhum paciente cadastrado ainda'" */
        <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8 shadow-2xs flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 shadow-2xs">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">
            Nenhum paciente cadastrado ainda
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1.5 mb-6">
            Você ainda não possui pacientes registrados em sua conta. Clique no botão abaixo para preencher o primeiro formulário de anamnese.
          </p>
          <Button variant="primary" size="md" onClick={onOpenNewPatientPage}>
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Primeiro Paciente</span>
          </Button>
        </div>
      ) : filteredPacientes.length === 0 ? (
        /* Caso a busca por nome não retorne resultados */
        <div className="py-14 text-center bg-white rounded-3xl border border-slate-200 p-8 shadow-2xs">
          <Search className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h4 className="text-base font-bold text-slate-800">
            Nenhum paciente encontrado com o nome "{searchTerm}"
          </h4>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Verifique a digitação ou limpe a busca para visualizar todos os pacientes.
          </p>
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            Limpar busca
          </button>
        </div>
      ) : (
        /* Regra: "Cada paciente exibe: nome, objetivo e data da última consulta" */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPacientes.map((p) => {
            const dataUltimaConsulta = p.ultima_consulta
              ? new Date(p.ultima_consulta).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
              : null;

            // Objetivos para exibição
            const temObjetivos = p.objetivos && p.objetivos.length > 0;

            return (
              <div
                key={p.id}
                onClick={() => onSelectPatient(p.id)}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  {/* Linha do Nome */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black flex items-center justify-center text-base shadow-xs group-hover:scale-105 transition-transform">
                        {p.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                          {p.nome}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {p.sexo || 'Paciente'} {p.peso_inicial ? `• ${p.peso_inicial} kg` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white text-slate-400 flex items-center justify-center transition-colors shrink-0">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Exibição Obrigatória do Objetivo */}
                  <div className="py-2.5 px-3 rounded-xl bg-slate-50/80 border border-slate-100 mb-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <Target className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Objetivo</span>
                    </div>

                    {temObjetivos ? (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {p.objetivos!.slice(0, 3).map((obj, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                          >
                            {obj}
                          </span>
                        ))}
                        {p.objetivos!.length > 3 && (
                          <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700">
                            +{p.objetivos!.length - 3}
                          </span>
                        )}
                      </div>
                    ) : p.objetivo_texto ? (
                      <p className="text-xs text-slate-700 font-medium line-clamp-1">
                        {p.objetivo_texto}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        Nenhum objetivo especificado
                      </p>
                    )}
                  </div>
                </div>

                {/* Exibição Obrigatória da Data da Última Consulta */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Última consulta:</span>
                  </div>

                  {dataUltimaConsulta ? (
                    <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                      {dataUltimaConsulta}
                    </span>
                  ) : (
                    <span className="font-medium text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md text-[11px]">
                      Sem consultas
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
