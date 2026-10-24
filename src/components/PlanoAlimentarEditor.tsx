import React, { useState } from 'react';
import { 
  PlanoSemanal, 
  DiaPlano, 
  RefeicoesDia, 
  DIAS_DA_SEMANA, 
  REFEICOES_NOMES 
} from '../services/geminiService';
import { Paciente } from '../services/dashboardService';
import { 
  Sparkles, 
  Save, 
  ArrowLeft, 
  AlertTriangle, 
  Coffee, 
  Apple, 
  Utensils, 
  Sandwich, 
  Salad, 
  Loader2, 
  Check, 
  RotateCcw, 
  Edit3,
  CalendarDays,
  Copy
} from 'lucide-react';
import { Button } from './ui/Button';

interface PlanoAlimentarEditorProps {
  paciente: Paciente;
  plano: PlanoSemanal;
  onPlanoChange: (novoPlano: PlanoSemanal) => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  isLoadingAi: boolean;
  aiMessage: string;
  errorMessage: string | null;
  onRetryAi: () => void;
  onInitManual: () => void;
}

export const PlanoAlimentarEditor: React.FC<PlanoAlimentarEditorProps> = ({
  paciente,
  plano,
  onPlanoChange,
  onSave,
  onCancel,
  saving,
  isLoadingAi,
  aiMessage,
  errorMessage,
  onRetryAi,
  onInitManual,
}) => {
  // Dia da semana ativo na interface de edição (Tabs)
  const [activeDia, setActiveDia] = useState<string>(DIAS_DA_SEMANA[0]);
  const [copiedFeedback, setCopiedFeedback] = useState<string | null>(null);

  // Encontra o dia selecionado no plano atual
  const diaPlanoAtual = plano.plano_semanal.find((d) => d.dia === activeDia) || {
    dia: activeDia,
    refeicoes: {
      cafe_da_manha: ['', '', '', '', ''],
      lanche_manha: ['', '', '', '', ''],
      almoco: ['', '', '', '', ''],
      lanche_tarde: ['', '', '', '', ''],
      jantar: ['', '', '', '', ''],
    },
  };

  // Atualiza uma opção específica de uma refeição
  const handleOptionChange = (
    refeicaoKey: keyof RefeicoesDia,
    optionIndex: number,
    value: string
  ) => {
    const novosDias = plano.plano_semanal.map((d) => {
      if (d.dia !== activeDia) return d;

      const novasOpcoes = [...(d.refeicoes[refeicaoKey] || ['', '', '', '', ''])];
      novasOpcoes[optionIndex] = value;

      return {
        ...d,
        refeicoes: {
          ...d.refeicoes,
          [refeicaoKey]: novasOpcoes,
        },
      };
    });

    onPlanoChange({ plano_semanal: novosDias });
  };

  // Copia cardápio do dia ativo para todos os outros dias da semana (recurso prático)
  const handleCopyDayToAll = () => {
    if (!window.confirm(`Deseja replicar as opções de ${activeDia} para todos os outros dias da semana?`)) {
      return;
    }

    const novosDias: DiaPlano[] = DIAS_DA_SEMANA.map((dia) => ({
      dia,
      refeicoes: JSON.parse(JSON.stringify(diaPlanoAtual.refeicoes)),
    }));

    onPlanoChange({ plano_semanal: novosDias });
    setCopiedFeedback('Opções replicadas para toda a semana!');
    setTimeout(() => setCopiedFeedback(null), 3000);
  };

  const getMealIcon = (key: keyof RefeicoesDia) => {
    switch (key) {
      case 'cafe_da_manha':
        return <Coffee className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'lanche_manha':
        return <Apple className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'almoco':
        return <Utensils className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
      case 'lanche_tarde':
        return <Sandwich className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      case 'jantar':
        return <Salad className="w-4 h-4 text-green-600 dark:text-green-400" />;
      default:
        return <Utensils className="w-4 h-4 text-emerald-600" />;
    }
  };

  // 1. Estado de Carregamento com Mensagens Dinâmicas da IA
  if (isLoadingAi) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200/90 dark:border-slate-800 shadow-2xs text-center space-y-6 transition-colors animate-in fade-in">
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 dark:bg-emerald-400/10 animate-ping" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
            <Sparkles className="w-10 h-10 animate-spin duration-1000" />
          </div>
        </div>

        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Criando Plano Alimentar com IA
          </h3>
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 min-h-[24px] animate-pulse">
            {aiMessage || 'Processando cardápio...'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            O Gemini está lendo objetivos, restrições e dados antropométricos de {paciente.nome} para montar um cardápio semanal completo.
          </p>
        </div>

        <div className="w-full max-w-xs mx-auto bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-pulse w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-6 transition-colors animate-in fade-in">
      {/* Toast de Erro com Ação de Resiliência (Prompt 6) */}
      {errorMessage && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/70 text-amber-900 dark:text-amber-200 space-y-3 animate-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <strong className="block font-bold mb-0.5">
                Não foi possível gerar o plano com IA no momento.
              </strong>
              <span>Deseja tentar novamente ou criar um Plano Manual?</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 pl-8">
            <Button size="sm" variant="primary" onClick={onRetryAi}>
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Tentar novamente com IA</span>
            </Button>

            <Button size="sm" variant="secondary" onClick={onInitManual}>
              <Edit3 className="w-3.5 h-3.5" />
              <span>Criar Plano Manual</span>
            </Button>
          </div>
        </div>
      )}

      {/* Header da Tela de Edição */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={onCancel}
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Voltar ao Histórico</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">&bull;</span>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
              Modo de Edição
            </span>
          </div>

          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Cardápio Semanal Personalizado</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Plano estruturado para {paciente.nome}. Cada refeição possui 5 opções que podem ser editadas diretamente.
          </p>
        </div>

        {/* Botão "Salvar Plano Alimentar" visível enquanto houver plano carregado */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            onClick={onCancel}
            disabled={saving}
          >
            Cancelar
          </Button>

          <Button
            variant="primary"
            size="md"
            loading={saving}
            onClick={onSave}
            className="shadow-md shadow-emerald-600/25"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Plano Alimentar</span>
          </Button>
        </div>
      </div>

      {/* Feedback de cópia entre dias */}
      {copiedFeedback && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{copiedFeedback}</span>
        </div>
      )}

      {/* Abas (Tabs) dos Dias da Semana para Evitar Sobrecarga de Tela (Prompt 6) */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {DIAS_DA_SEMANA.map((dia) => {
            const isActive = activeDia === dia;
            return (
              <button
                key={dia}
                type="button"
                onClick={() => setActiveDia(dia)}
                className={`py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                    : 'bg-slate-100/80 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-750'
                }`}
              >
                {dia}
              </button>
            );
          })}
        </div>

        {/* Botão utilitário para replicar o dia */}
        <button
          type="button"
          onClick={handleCopyDayToAll}
          className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Copiar as opções deste dia para todos os outros dias da semana"
        >
          <Copy className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Replicar dia</span>
        </button>
      </div>

      {/* Grade de Refeições do Dia Ativo com 5 Inputs Editáveis cada (Prompt 6) */}
      <div className="space-y-5">
        {(Object.keys(REFEICOES_NOMES) as Array<keyof RefeicoesDia>).map((refeicaoKey) => {
          const refeicaoInfo = REFEICOES_NOMES[refeicaoKey];
          const opcoes = diaPlanoAtual.refeicoes[refeicaoKey] || ['', '', '', '', ''];

          return (
            <div
              key={refeicaoKey}
              className="p-5 sm:p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3.5 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-2xs">
                    {getMealIcon(refeicaoKey)}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {refeicaoInfo.label}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {refeicaoInfo.descricao}
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  5 Opções
                </span>
              </div>

              {/* 5 Inputs de Texto Preenchidos pela IA ou Editados pela Nutricionista */}
              <div className="space-y-2 pt-1">
                {opcoes.slice(0, 5).map((opcao, optIdx) => (
                  <div key={optIdx} className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-extrabold text-[11px] flex items-center justify-center shrink-0">
                      {optIdx + 1}
                    </span>

                    <input
                      type="text"
                      value={opcao}
                      onChange={(e) => handleOptionChange(refeicaoKey, optIdx, e.target.value)}
                      placeholder={`Opção ${optIdx + 1} de ${refeicaoInfo.label.toLowerCase()}...`}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Barra de Ação Inferior com Botão "Salvar Plano Alimentar" */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-xs text-slate-400 dark:text-slate-500">
          Você pode ajustar qualquer item antes de confirmar o salvamento.
        </span>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={onCancel}
            disabled={saving}
          >
            Cancelar
          </Button>

          <Button
            variant="primary"
            size="md"
            loading={saving}
            onClick={onSave}
            className="shadow-md shadow-emerald-600/25"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Plano Alimentar</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
