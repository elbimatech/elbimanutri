import React, { useState } from 'react';
import { Consulta } from '../services/dashboardService';
import { TrendingDown, TrendingUp, Minus, Calendar, Plus, Scale } from 'lucide-react';
import { Button } from './ui/Button';

interface WeightEvolutionChartProps {
  consultas: Consulta[];
  pesoInicial?: number | null;
  onOpenNovaConsulta?: () => void;
}

export const WeightEvolutionChart: React.FC<WeightEvolutionChartProps> = ({
  consultas,
  pesoInicial,
  onOpenNovaConsulta,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Ordenar cronologicamente (mais antiga para mais recente para o gráfico)
  const validConsultas = (consultas || [])
    .filter((c) => c.peso !== null && c.peso !== undefined && !isNaN(Number(c.peso)))
    .sort((a, b) => new Date(a.data_consulta).getTime() - new Date(b.data_consulta).getTime());

  // Se não houver consultas registradas ainda, cumprir a regra:
  // "Se não houver consultas ainda, o gráfico deve aparecer vazio com a mensagem 'Nenhuma consulta registrada ainda'"
  if (validConsultas.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-2xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Evolução de Peso</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Acompanhamento gráfico das pesagens e composição corporal ao longo do tempo
            </p>
          </div>

          {onOpenNovaConsulta && (
            <Button size="sm" variant="primary" onClick={onOpenNovaConsulta}>
              <Plus className="w-4 h-4" />
              <span>Nova Consulta</span>
            </Button>
          )}
        </div>

        {/* Quadro Vazio com grid estilizado */}
        <div className="relative h-64 sm:h-72 w-full rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
          {/* Linhas de grade sutis para simular o gráfico vazio */}
          <div className="absolute inset-0 flex flex-col justify-between py-6 px-4 opacity-30 dark:opacity-20 pointer-events-none">
            <div className="w-full border-b border-dashed border-slate-400" />
            <div className="w-full border-b border-dashed border-slate-400" />
            <div className="w-full border-b border-dashed border-slate-400" />
            <div className="w-full border-b border-dashed border-slate-400" />
          </div>

          <div className="relative z-10 flex flex-col items-center max-w-sm">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 shadow-inner">
              <Scale className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
              Nenhuma consulta registrada ainda
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {pesoInicial 
                ? `Peso cadastrado na anamnese: ${pesoInicial} kg. Registre as consultas para traçar a curva de progresso.`
                : 'Registre a primeira consulta com o peso do paciente para gerar o gráfico de evolução.'}
            </p>
            {onOpenNovaConsulta && (
              <Button size="sm" variant="secondary" onClick={onOpenNovaConsulta}>
                <Plus className="w-4 h-4" />
                <span>Registrar Primeira Consulta</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Prepara dados dos pontos
  const pointsData = validConsultas.map((c) => {
    const rawDate = new Date(c.data_consulta);
    const dateFormatted = rawDate.toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit' });
    const fullDate = rawDate.toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' });
    const pesoNum = Number(c.peso);
    return {
      id: c.id,
      peso: pesoNum,
      label: dateFormatted,
      fullDate,
      cintura: c.cintura,
      quadril: c.quadril,
      gordura: c.percentual_gordura,
      observacoes: c.observacoes,
    };
  });

  // Métricas de resumo
  const primeiroPeso = pesoInicial ? Number(pesoInicial) : pointsData[0].peso;
  const ultimoPeso = pointsData[pointsData.length - 1].peso;
  const diferencaTotal = Number((ultimoPeso - primeiroPeso).toFixed(1));

  const pesos = pointsData.map((p) => p.peso);
  const minPeso = Math.floor(Math.min(...pesos, primeiroPeso) - 2);
  const maxPeso = Math.ceil(Math.max(...pesos, primeiroPeso) + 2);
  const range = maxPeso - minPeso || 1;

  // Dimensões do SVG
  const width = 700;
  const height = 220;
  const paddingLeft = 55;
  const paddingRight = 35;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Coordenadas dos pontos
  const coordinates = pointsData.map((pt, idx) => {
    const x = pointsData.length === 1 
      ? paddingLeft + chartWidth / 2 
      : paddingLeft + (idx / (pointsData.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((pt.peso - minPeso) / range) * chartHeight;
    return { ...pt, x, y };
  });

  // Construir caminho SVG com curvas suaves
  let pathD = '';
  if (coordinates.length === 1) {
    const p = coordinates[0];
    pathD = `M ${p.x - 30} ${p.y} L ${p.x + 30} ${p.y}`;
  } else {
    pathD = coordinates.reduce((acc, pt, i, arr) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`;
      const prev = arr[i - 1];
      const cx1 = prev.x + (pt.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (pt.x - prev.x) / 2;
      const cy2 = pt.y;
      return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt.y}`;
    }, '');
  }

  // Caminho fechado para o gradiente de área
  const firstPoint = coordinates[0];
  const lastPoint = coordinates[coordinates.length - 1];
  const areaPathD = coordinates.length === 1
    ? ''
    : `${pathD} L ${lastPoint.x} ${paddingTop + chartHeight} L ${firstPoint.x} ${paddingTop + chartHeight} Z`;

  // Linhas horizontais de grade (4 níveis)
  const gridLevels = [0, 0.33, 0.66, 1].map((ratio) => {
    const val = Number((minPeso + ratio * range).toFixed(1));
    const y = paddingTop + chartHeight - ratio * chartHeight;
    return { val, y };
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-2xs transition-colors">
      {/* Top Header do Gráfico */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Evolução de Peso</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Histórico contínuo de pesagens e variação antropométrica
          </p>
        </div>

        {/* Badges de Resumo em destaque */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center gap-2 text-xs">
            <span className="text-slate-400 dark:text-slate-500 font-medium">Inicial:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{primeiroPeso} kg</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2 text-xs">
            <span className="text-emerald-700 dark:text-emerald-300 font-medium">Atual:</span>
            <span className="font-extrabold text-emerald-800 dark:text-emerald-200">{ultimoPeso} kg</span>
          </div>

          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold ${
            diferencaTotal < 0
              ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300'
              : diferencaTotal > 0
              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-700 dark:text-slate-300'
          }`}>
            {diferencaTotal < 0 ? (
              <TrendingDown className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            ) : diferencaTotal > 0 ? (
              <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            ) : (
              <Minus className="w-4 h-4 text-slate-400" />
            )}
            <span>
              {diferencaTotal > 0 ? `+${diferencaTotal} kg` : `${diferencaTotal} kg`}
            </span>
          </div>

          {onOpenNovaConsulta && (
            <Button size="sm" variant="primary" onClick={onOpenNovaConsulta} className="shadow-xs">
              <Plus className="w-4 h-4" />
              <span>Nova Consulta</span>
            </Button>
          )}
        </div>
      </div>

      {/* SVG Canvas Responsivo */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[550px] relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-56 sm:h-64 select-none overflow-visible"
          >
            <defs>
              <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
                <stop offset="90%" stopColor="#0d9488" stopOpacity="0.0" />
              </linearGradient>

              <linearGradient id="weightLineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#059669" />
                <stop offset="100%" stopColor="#0d9488" />
              </linearGradient>

              <filter id="shadowFilter" x="-10%" y="-10%" width="120%" height="130%">
                <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#059669" floodOpacity="0.3" />
              </filter>
            </defs>

            {/* Linhas de Grade Horizontais */}
            {gridLevels.map((lvl, i) => (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={lvl.y}
                  x2={width - paddingRight}
                  y2={lvl.y}
                  className="stroke-slate-200 dark:stroke-slate-800"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={lvl.y + 4}
                  textAnchor="end"
                  className="fill-slate-400 dark:fill-slate-500 text-[11px] font-semibold"
                >
                  {lvl.val} kg
                </text>
              </g>
            ))}

            {/* Preenchimento de Área Gradiente */}
            {areaPathD && (
              <path d={areaPathD} fill="url(#weightAreaGrad)" />
            )}

            {/* Linha Principal da Curva */}
            <path
              d={pathD}
              fill="none"
              stroke="url(#weightLineGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#shadowFilter)"
            />

            {/* Pontos Interativos */}
            {coordinates.map((pt, idx) => {
              const isHovered = hoveredIndex === idx;
              return (
                <g 
                  key={pt.id || idx}
                  className="cursor-pointer transition-transform duration-150"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Linha vertical pontilhada indicadora */}
                  {isHovered && (
                    <line
                      x1={pt.x}
                      y1={paddingTop}
                      x2={pt.x}
                      y2={paddingTop + chartHeight}
                      className="stroke-emerald-400 dark:stroke-emerald-500"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  )}

                  {/* Halo do ponto */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 9 : 6}
                    className="fill-white dark:fill-slate-900 stroke-emerald-600 dark:stroke-emerald-400 transition-all"
                    strokeWidth={isHovered ? '3.5' : '2.5'}
                  />

                  {/* Miolo do ponto */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 4 : 2.5}
                    className="fill-emerald-600 dark:fill-emerald-400"
                  />

                  {/* Rótulo de Data no Eixo X */}
                  <text
                    x={pt.x}
                    y={paddingTop + chartHeight + 20}
                    textAnchor="middle"
                    className={`text-[11px] font-semibold transition-colors ${
                      isHovered
                        ? 'fill-emerald-700 dark:fill-emerald-400 font-bold'
                        : 'fill-slate-400 dark:fill-slate-500'
                    }`}
                  >
                    {pt.label}
                  </text>

                  {/* Rótulo de Peso acima do ponto */}
                  <text
                    x={pt.x}
                    y={pt.y - 12}
                    textAnchor="middle"
                    className={`text-[11px] font-bold ${
                      isHovered
                        ? 'fill-emerald-700 dark:fill-emerald-300 text-xs'
                        : 'fill-slate-700 dark:fill-slate-300'
                    }`}
                  >
                    {pt.peso} kg
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Tooltip Dinâmico ao passar o mouse */}
          {hoveredIndex !== null && coordinates[hoveredIndex] && (
            <div 
              className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs rounded-xl p-3 shadow-xl border border-slate-700 dark:border-slate-200 transition-all min-w-[160px]"
              style={{
                left: `${(coordinates[hoveredIndex].x / width) * 100}%`,
                top: `${(coordinates[hoveredIndex].y / height) * 100}%`,
              }}
            >
              <div className="flex items-center gap-1.5 text-[11px] text-slate-300 dark:text-slate-600 mb-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                <span>{coordinates[hoveredIndex].fullDate}</span>
              </div>
              <div className="text-sm font-extrabold flex items-baseline gap-1 text-emerald-400 dark:text-emerald-700">
                <span>{coordinates[hoveredIndex].peso}</span>
                <span className="text-[10px] font-medium text-slate-300 dark:text-slate-600">kg</span>
              </div>
              <div className="mt-1.5 pt-1.5 border-t border-slate-700 dark:border-slate-200 flex flex-col gap-0.5 text-[11px]">
                {coordinates[hoveredIndex].gordura && (
                  <div>Gordura: <strong>{coordinates[hoveredIndex].gordura}%</strong></div>
                )}
                {coordinates[hoveredIndex].cintura && (
                  <div>Cintura: <strong>{coordinates[hoveredIndex].cintura} cm</strong></div>
                )}
                {coordinates[hoveredIndex].quadril && (
                  <div>Quadril: <strong>{coordinates[hoveredIndex].quadril} cm</strong></div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
