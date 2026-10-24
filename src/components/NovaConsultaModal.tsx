import React, { useState } from 'react';
import { X, Calendar, Scale, Ruler, Percent, FileText, Check, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { createConsulta, Consulta } from '../services/dashboardService';

interface NovaConsultaModalProps {
  pacienteId: string;
  pacienteNome?: string;
  isOpen: boolean;
  onClose: () => void;
  onConsultaSaved: (consulta: Consulta) => void;
}

export const NovaConsultaModal: React.FC<NovaConsultaModalProps> = ({
  pacienteId,
  pacienteNome,
  isOpen,
  onClose,
  onConsultaSaved,
}) => {
  // Data de hoje no formato YYYY-MM-DD (local)
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [dataConsulta, setDataConsulta] = useState(getTodayDate());
  const [peso, setPeso] = useState('');
  const [cintura, setCintura] = useState('');
  const [quadril, setQuadril] = useState('');
  const [percentualGordura, setPercentualGordura] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [proximoRetorno, setProximoRetorno] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteId) return;

    if (!dataConsulta) {
      setErrorMessage('Por favor, informe a data da consulta.');
      return;
    }

    if (!peso || isNaN(Number(peso)) || Number(peso) <= 0) {
      setErrorMessage('Por favor, informe um peso válido em kg.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const created = await createConsulta(pacienteId, {
        data_consulta: dataConsulta,
        peso: peso ? parseFloat(peso) : null,
        cintura: cintura ? parseFloat(cintura) : null,
        quadril: quadril ? parseFloat(quadril) : null,
        percentual_gordura: percentualGordura ? parseFloat(percentualGordura) : null,
        observacoes: observacoes ? observacoes.trim() : null,
        proximo_retorno: proximoRetorno || null,
      });

      if (created) {
        // Reset form
        setDataConsulta(getTodayDate());
        setPeso('');
        setCintura('');
        setQuadril('');
        setPercentualGordura('');
        setObservacoes('');
        setProximoRetorno('');

        onConsultaSaved(created);
        onClose();
      }
    } catch (err: any) {
      console.error('Erro ao salvar consulta:', err);
      setErrorMessage('Ocorreu um erro ao salvar a consulta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nova-consulta-modal-title"
      >
        {/* Header do Modal */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 id="nova-consulta-modal-title" className="text-xl font-extrabold text-white tracking-tight">
                Nova Consulta
              </h2>
              <p className="text-xs text-emerald-100">
                {pacienteNome ? `Registro de avaliação para ${pacienteNome}` : 'Avaliação física e acompanhamento clínico'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Fechar modal de nova consulta"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* Data da Consulta e Peso Atual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="nova-consulta-data"
              label="Data da Consulta *"
              type="date"
              value={dataConsulta}
              onChange={(e) => setDataConsulta(e.target.value)}
              required
            />

            <Input
              id="nova-consulta-peso"
              label="Peso Atual em kg *"
              type="number"
              step="0.1"
              placeholder="Ex: 68.5"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              required
            />
          </div>

          {/* Medidas Antropométricas Opcionais */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Ruler className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Medidas Adicionais (Opcionais)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                id="nova-consulta-cintura"
                label="Cintura (cm)"
                type="number"
                step="0.1"
                placeholder="Ex: 76.0"
                value={cintura}
                onChange={(e) => setCintura(e.target.value)}
              />

              <Input
                id="nova-consulta-quadril"
                label="Quadril (cm)"
                type="number"
                step="0.1"
                placeholder="Ex: 98.0"
                value={quadril}
                onChange={(e) => setQuadril(e.target.value)}
              />

              <Input
                id="nova-consulta-gordura"
                label="% de Gordura"
                type="number"
                step="0.1"
                placeholder="Ex: 22.5"
                value={percentualGordura}
                onChange={(e) => setPercentualGordura(e.target.value)}
              />
            </div>
          </div>

          {/* Próximo Retorno */}
          <Input
            id="nova-consulta-proximo-retorno"
            label="Próximo Retorno (seletor de data)"
            type="date"
            value={proximoRetorno}
            onChange={(e) => setProximoRetorno(e.target.value)}
          />

          {/* Observações da Consulta */}
          <div>
            <label 
              htmlFor="nova-consulta-observacoes" 
              className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5"
            >
              Observações (texto livre)
            </label>
            <textarea
              id="nova-consulta-observacoes"
              rows={3}
              placeholder="Descreva a evolução, adesão ao plano nutricional, queixas ou metas..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium resize-none"
            />
          </div>

          {/* Footer com botões */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
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
              className="shadow-md shadow-emerald-600/25"
            >
              <Check className="w-4 h-4" />
              <span>Salvar consulta</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
