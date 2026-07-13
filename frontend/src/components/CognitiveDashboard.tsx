import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { loviTaskAPI } from '../services/api';

interface CognitiveDashboardProps {
  isDarkMode: boolean;
}

export const CognitiveDashboard = ({ isDarkMode }: CognitiveDashboardProps) => {
  // Queries
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: loviTaskAPI.getProfile,
  });

  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ['cognitive-history'],
    queryFn: () => loviTaskAPI.getCognitiveHistory(7),
    refetchInterval: 15000,
  });

  // Helpers de Score
  const getFocusScore = () => {
    if (!profile) return 0;
    // Normalizar foco médio (máximo 60 minutos = 100%)
    const score = (profile.averageFocusTime / 60) * 100;
    return Math.min(Math.round(score), 100);
  };

  const getProductivityScore = () => {
    if (!profile) return 0;
    return Math.round(profile.completionRate * 100);
  };

  const getConsistencyScore = () => {
    if (!profile) return 0;
    return Math.round(profile.consistencyScore);
  };

  // Renderizador de Anel de Progresso SVG
  const ProgressRing = ({ percentage, color, title, emoji }: { percentage: number; color: string; title: string; emoji: string }) => {
    const radius = 36;
    const strokeWidth = 8;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className={`p-6 rounded-[28px] border flex flex-col items-center justify-center gap-4 transition-all duration-300 ${
        isDarkMode 
          ? 'bg-brand-cardDark/40 border-slate-800/60 shadow-slate-950/20' 
          : 'bg-white border-indigo-50/65 shadow-indigo-150/10'
      }`}>
        <div className="relative flex items-center justify-center">
          <svg className="w-24 h-24 transform -rotate-90">
            {/* Background ring */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke={isDarkMode ? '#1e1b4b' : '#f0f4ff'}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Progress ring */}
            <motion.circle
              cx="48"
              cy="48"
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-xl">{emoji}</span>
            <span className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{percentage}%</span>
          </div>
        </div>
        <span className={`text-[10px] font-black uppercase tracking-wider text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {title}
        </span>
      </div>
    );
  };

  // Gerar Pontos SVG para Gráfico Temporal
  const renderHistoryGraph = () => {
    if (!history || history.length === 0) return null;

    const width = 500;
    const height = 150;
    const padding = 20;

    const stepX = (width - padding * 2) / (history.length - 1 || 1);
    
    // Mapear pontos para Carga Cognitiva (0-100) -> y (height-padding a padding)
    const loadPoints = history.map((day, i) => {
      const x = padding + i * stepX;
      const y = height - padding - (day.averageCognitiveLoad / 100) * (height - padding * 2);
      return { x, y, val: day.averageCognitiveLoad, date: day.date };
    });

    // Mapear pontos para Energia (0-10) -> y
    const energyPoints = history.map((day, i) => {
      const x = padding + i * stepX;
      const y = height - padding - (day.averageEnergy / 10) * (height - padding * 2);
      return { x, y, val: day.averageEnergy, date: day.date };
    });

    const createPath = (points: typeof loadPoints) => {
      if (points.length === 0) return '';
      return points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4 text-[10px] font-black uppercase tracking-wider">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-1.5 rounded-full bg-rose-500 block" />
              <span className={isDarkMode ? 'text-slate-350' : 'text-slate-500'}>Sobrecarga Mental</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-1.5 rounded-full bg-emerald-500 block" />
              <span className={isDarkMode ? 'text-slate-350' : 'text-slate-500'}>Energia Física</span>
            </div>
          </div>
          <span className="text-[9px] text-indigo-500">Últimos 7 dias</span>
        </div>

        <div className="relative overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[400px]">
            {/* Grid Lines */}
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke={isDarkMode ? '#1e293b/30' : '#e2e8f0/60'} strokeWidth={1} strokeDasharray="4 4" />
            <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke={isDarkMode ? '#1e293b/30' : '#e2e8f0/60'} strokeWidth={1} strokeDasharray="4 4" />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke={isDarkMode ? '#1e293b/50' : '#e2e8f0/90'} strokeWidth={1.5} />

            {/* Load Line Path */}
            <path
              d={createPath(loadPoints)}
              fill="none"
              stroke="#ef4444"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Energy Line Path */}
            <path
              d={createPath(energyPoints)}
              fill="none"
              stroke="#10b981"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Render Load Nodes */}
            {loadPoints.map((p, idx) => (
              <g key={`load-${idx}`} className="group cursor-pointer">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={4}
                  fill={isDarkMode ? '#0f172a' : '#ffffff'}
                  stroke="#ef4444"
                  strokeWidth={2}
                  className="transition duration-150 hover:r-6"
                />
                <title>{`Sobrecarga: ${p.val}% em ${p.date.split('-').slice(1).join('/')}`}</title>
              </g>
            ))}

            {/* Render Energy Nodes */}
            {energyPoints.map((p, idx) => (
              <g key={`energy-${idx}`} className="group cursor-pointer">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={4}
                  fill={isDarkMode ? '#0f172a' : '#ffffff'}
                  stroke="#10b981"
                  strokeWidth={2}
                />
                <title>{`Energia: ${p.val}/10 em ${p.date.split('-').slice(1).join('/')}`}</title>
              </g>
            ))}
          </svg>
        </div>

        {/* Eixo X labels */}
        <div className="flex justify-between px-4 text-[9px] font-black uppercase text-slate-400">
          {history.map((day, idx) => (
            <span key={idx}>{day.date.split('-').slice(2).join('/')}</span>
          ))}
        </div>
      </div>
    );
  };

  const getMindRegulationAdvice = () => {
    if (!profile) return 'Mantenha o equilíbrio.';
    if (profile.cognitiveLoad >= 80) {
      return '🚨 Seu cérebro está operando sob alta sobrecarga. Pare agora e faça uma pausa de 15 minutos. Beba um copo de água ou faça um alongamento leve.';
    }
    if (profile.cognitiveLoad >= 50) {
      return '⚡ Sobrecarga moderada detectada. Sugerimos priorizar microtarefas mais simples (de baixa energia) e evitar reuniões complexas no momento.';
    }
    return '🌱 Excelente! Sua carga cognitiva está sob controle. Esta é uma ótima janela horária para focar em tarefas criativas ou de raciocínio lógico.';
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="space-y-2">
        <h2 className={`text-2xl font-black tracking-tight flex items-center gap-3.5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
          <div className={`p-2.5 rounded-2xl border flex items-center justify-center ${
            isDarkMode ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-200/80 shadow-sm'
          }`}>
            <span className="text-xl">📊</span>
          </div>
          Dashboard Cognitivo
        </h2>
        <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-550 font-semibold'}`}>
          Seus scores de performance mental, janelas biológicas e linha do tempo de evolução comportamental consolidada.
        </p>
      </div>

      {/* Grid de Anéis de Progresso */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <ProgressRing percentage={getFocusScore()} color="#6366f1" title="Foco Score (Pomodoro)" emoji="🎯" />
        <ProgressRing percentage={getConsistencyScore()} color="#10b981" title="Consistência de Hábitos" emoji="📅" />
        <ProgressRing percentage={getProductivityScore()} color="#f59e0b" title="Produtividade (Metas)" emoji="🏆" />
      </div>

      {/* Gráfico SVG Autoral */}
      <div className={`border p-7 rounded-[32px] shadow-sm ${
        isDarkMode ? 'bg-brand-cardDark/40 border-slate-800/60' : 'bg-white border-indigo-50/65 shadow-indigo-150/10'
      }`}>
        <h3 className={`text-xs font-black uppercase tracking-wider mb-6 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-855'}`}>
          <span>📈</span>
          <span>Linha do Tempo de Energia & Fadiga</span>
        </h3>

        {loadingHistory ? (
          <div className="text-center py-16 text-xs text-slate-400 font-semibold">Agregando série temporal...</div>
        ) : history && history.length > 0 ? (
          renderHistoryGraph()
        ) : (
          <div className="text-center py-16 text-slate-400 text-xs border border-dashed rounded-2xl border-slate-200 dark:border-slate-855 font-semibold">
            Dados históricos em processamento. Conclua tarefas e registre energia diária para traçar o gráfico!
          </div>
        )}
      </div>

      {/* Estatísticas Complementares & Dicas de Regulação */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Janelas Biológicas */}
        <div className={`border p-7 rounded-[32px] shadow-sm ${
          isDarkMode ? 'bg-brand-cardDark/40 border-slate-800/60 shadow-slate-950/20' : 'bg-white border-indigo-50/65 shadow-indigo-150/10'
        }`}>
          <h3 className={`text-xs font-black uppercase tracking-wider mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-855'}`}>
            <span>🕒</span>
            <span>Janelas Biológicas</span>
          </h3>

          <div className="space-y-4 text-xs font-semibold">
            <div className="flex justify-between items-center py-2.5 border-b border-dashed border-slate-200 dark:border-slate-850">
              <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Melhor Horário Produtivo</span>
              <span className="text-emerald-500 font-black">{profile?.bestProductivityHour || 'Calculando...'}</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-dashed border-slate-200 dark:border-slate-850">
              <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Pior Horário de Fadiga</span>
              <span className="text-rose-500 font-black">{profile?.worstProductivityHour || 'Calculando...'}</span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Taxa de Adiamento Geral</span>
              <span className={`font-black ${profile && profile.delayRate >= 0.4 ? 'text-amber-500' : 'text-indigo-500'}`}>
                {profile ? `${Math.round(profile.delayRate * 100)}%` : 'Calculando...'}
              </span>
            </div>
          </div>
        </div>

        {/* Regulação Cognitiva Acessível */}
        <div className={`border p-7 rounded-[32px] shadow-sm flex flex-col justify-between gap-4 ${
          isDarkMode ? 'bg-brand-cardDark/40 border-slate-800/60 shadow-slate-950/20' : 'bg-white border-indigo-50/65 shadow-indigo-150/10'
        }`}>
          <div>
            <h3 className={`text-xs font-black uppercase tracking-wider mb-3 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-855'}`}>
              <span>🧘</span>
              <span>Regulação de Sobrecarga</span>
            </h3>
            <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
              {getMindRegulationAdvice()}
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-500 pt-2 border-t border-slate-100 dark:border-slate-850/60">
            <span>💡</span>
            <span>Dica do Lovi: Respeitar suas janelas biológicas evita o Burnout.</span>
          </div>
        </div>

      </div>
    </div>
  );
};
export default CognitiveDashboard;
