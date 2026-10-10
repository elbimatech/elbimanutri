import React, { useState, useEffect } from 'react';
import { Paciente, getPacientes } from '../services/dashboardService';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Search, 
  UserPlus, 
  Calendar, 
  Phone, 
  Mail, 
  Clock, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Loader2,
  Filter
} from 'lucide-react';
import { Button } from './ui/Button';

interface PacientesViewProps {
  onSelectPatient: (pacienteId: string) => void;
  onOpenNewPatientModal: () => void;
  initialFilter?: 'all' | 'sem-retorno' | 'com-retorno';
}

export const PacientesView: React.FC<PacientesViewProps> = ({
  onSelectPatient,
  onOpenNewPatientModal,
  initialFilter = 'all',
}) => {
  const { user } = useAuth();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'sem-retorno' | 'com-retorno'>(initialFilter);

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

  // Filtragem dos pacientes
  const filteredPacientes = pacientes.filter((p) => {
    const matchesSearch = 
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.whatsapp && p.whatsapp.includes(searchTerm));

    if (!matchesSearch) return false;

    if (filter === 'sem-retorno') {
      if (!p.ultima_consulta) return false;
      const lastDate = new Date(p.ultima_consulta).getTime();
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const hasUpcoming = p.proximo_retorno && new Date(p.proximo_retorno).getTime() >= Date.now();
      return lastDate < thirtyDaysAgo && !hasUpcoming;
    }

    if (filter === 'com-retorno') {
      return p.proximo_retorno && new Date(p.proximo_retorno).getTime() >= Date.now();
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-emerald-600" />
            <span>Meus Pacientes</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestão clínica e prontuários sincronizados com o Neon DB
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={onOpenNewPatientModal}
            className="shadow-md shadow-emerald-600/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Paciente</span>
          </Button>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou whatsapp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({pacientes.length})
          </button>
          <button
            onClick={() => setFilter('sem-retorno')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === 'sem-retorno'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 border border-amber-200/60 hover:bg-amber-100'
            }`}
          >
            Sem Retorno (&gt;30d)
          </button>
          <button
            onClick={() => setFilter('com-retorno')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === 'com-retorno'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200/60 hover:bg-emerald-100'
            }`}
          >
            Com Retorno Agendado
          </button>
        </div>
      </div>

      {/* Lista / Grid de Pacientes */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-emerald-700 font-medium bg-white rounded-3xl border border-slate-200 shadow-2xs">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-emerald-600" />
          <span>Carregando lista de pacientes no Neon...</span>
        </div>
      ) : filteredPacientes.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            {searchTerm ? 'Nenhum paciente encontrado na busca' : 'Nenhum paciente cadastrado'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
            {searchTerm 
              ? 'Tente buscar com outro termo ou limpe os filtros selecionados.' 
              : 'Comece adicionando seu primeiro paciente para gerenciar consultas e planos.'}
          </p>
          {!searchTerm && (
            <Button variant="primary" size="md" onClick={onOpenNewPatientModal}>
              <UserPlus className="w-4 h-4" />
              <span>Cadastrar Primeiro Paciente</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPacientes.map((p) => {
            const lastDate = p.ultima_consulta 
              ? new Date(p.ultima_consulta).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) 
              : null;
            const nextDate = p.proximo_retorno 
              ? new Date(p.proximo_retorno).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) 
              : null;

            return (
              <div
                key={p.id}
                onClick={() => onSelectPatient(p.id)}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-xs group-hover:scale-105 transition-transform">
                        {p.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                          {p.nome}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {p.sexo || 'Paciente'} &bull; {p.peso_inicial ? `${p.peso_inicial} kg` : ''}
                        </p>
                      </div>
                    </div>

                    <span className="p-1.5 rounded-lg text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3 mb-3">
                    {p.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{p.email}</span>
                      </div>
                    )}
                    {p.whatsapp && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{p.whatsapp}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    {lastDate ? (
                      <span className="text-slate-500">
                        Última: <strong className="text-slate-700">{lastDate}</strong>
                      </span>
                    ) : (
                      <span className="text-amber-600 font-medium">Sem consultas</span>
                    )}
                  </div>

                  {nextDate ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium text-[11px] border border-emerald-200">
                      Retorno: {nextDate}
                    </span>
                  ) : lastDate ? (
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-medium text-[11px] border border-amber-200">
                      Sem retorno
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
