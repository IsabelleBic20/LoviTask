import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { loviTaskAPI } from '../services/api';
import { UserTask } from '../types';

interface SmartPlanningProps {
  isDarkMode: boolean;
}

export const SmartPlanning = ({ isDarkMode }: SmartPlanningProps) => {
  const queryClient = useQueryClient();

  // Estados do Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Trabalho');
  const [energyRequirement, setEnergyRequirement] = useState('Média');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');

  // Estados de Interação
  const [completingTaskId, setCompletingTaskId] = useState<number | null>(null);
  const [actualMinutes, setActualMinutes] = useState(30);

  // Queries
  const { data: tasks, isLoading: loadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: loviTaskAPI.getTasks,
    refetchInterval: 10000,
  });

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: loviTaskAPI.getProfile,
  });

  // Mutations
  const createTaskMutation = useMutation({
    mutationFn: (task: UserTask) => loviTaskAPI.createTask(task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['cognitive-load'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setTitle('');
      setDescription('');
      setEstimatedMinutes(30);
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: ({ id, minutes }: { id: number; minutes: number }) => loviTaskAPI.completeTask(id, minutes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['cognitive-load'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setCompletingTaskId(null);
    },
  });

  const delayTaskMutation = useMutation({
    mutationFn: (id: number) => loviTaskAPI.delayTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['cognitive-load'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const rebuildScheduleMutation = useMutation({
    mutationFn: loviTaskAPI.rebuildSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createTaskMutation.mutate({
      title,
      description,
      category,
      energyRequirement,
      estimatedMinutes,
      priority,
    });
  };

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (completingTaskId === null) return;
    completeTaskMutation.mutate({ id: completingTaskId, minutes: actualMinutes });
  };

  // Heurística de Fator de Correção Visível
  const getCorrectionFactorLabel = () => {
    if (!profile) return 'Calculando...';
    if (profile.delayRate >= 0.5) return '⚠️ Fator de Correção: 1.6x (Alta taxa de atrasos históricos)';
    if (profile.delayRate >= 0.3) return '⚡ Fator de Correção: 1.3x (Atrasos moderados)';
    return '🌱 Sem correção necessária (Ritmo consistente)';
  };

  const cardClass = `border transition-all duration-300 p-7 rounded-[32px] shadow-sm relative overflow-hidden group ${
    isDarkMode 
      ? 'bg-brand-cardDark/40 border-slate-800/60 shadow-slate-950/20 hover:border-slate-800' 
      : 'bg-white border-indigo-50/60 shadow-indigo-100/20 hover:border-indigo-100/80 hover:shadow-md'
  }`;

  const inputClass = `w-full p-4 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-xs leading-relaxed ${
    isDarkMode 
      ? 'bg-slate-950/50 border-slate-855 text-slate-200 placeholder-slate-750' 
      : 'bg-indigo-50/20 border-indigo-100/80 text-slate-855 placeholder-slate-400 focus:bg-white'
  }`;

  // Formatar Data/Hora para exibição amigável
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return 'Não agendado';
    const date = new Date(timeStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getPriorityBadgeColor = (prio: string) => {
    if (prio === 'Critical') return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    if (prio === 'High') return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
    if (prio === 'Medium') return 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20';
    return 'text-slate-500 bg-slate-500/10 border-slate-500/10';
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h2 className={`text-2xl font-black tracking-tight flex items-center gap-3.5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
            <div className={`p-2.5 rounded-2xl border flex items-center justify-center ${
              isDarkMode ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-200/80 shadow-sm'
            }`}>
              <span className="text-xl">📅</span>
            </div>
            Planejamento Inteligente
          </h2>
          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500 font-semibold'}`}>
            Organização adaptativa de tarefas: estimativas corrigidas, quebras automáticas de atividades longas e cronograma sem conflitos.
          </p>
        </div>

        <button
          onClick={() => rebuildScheduleMutation.mutate()}
          disabled={rebuildScheduleMutation.isPending}
          className={`px-4 py-2.5 rounded-2xl font-black text-xs transition-all duration-200 border flex items-center gap-2 ${
            rebuildScheduleMutation.isPending
              ? 'bg-slate-350 dark:bg-slate-800 text-slate-500 border-transparent cursor-not-allowed'
              : 'bg-indigo-650 hover:bg-indigo-700 text-white border-transparent shadow-md shadow-indigo-500/10 active:scale-95'
          }`}
        >
          <span>⚡</span>
          <span>{rebuildScheduleMutation.isPending ? 'Reorganizando...' : 'Recalcular Agenda'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Coluna 1: Criar Tarefa */}
        <div className="space-y-6 lg:col-span-1">
          <div className={cardClass}>
            <h3 className={`text-sm font-black mb-4 flex items-center gap-2.5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              <span>➕</span>
              <span>Nova Tarefa Planejada</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-indigo-500 mb-1.5">Título</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Escrever artigo científico"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-indigo-500 mb-1.5">Descrição</label>
                <textarea
                  placeholder="Detalhamento opcional..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className={inputClass}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-indigo-500 mb-1.5">Categoria</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className={inputClass}
                  >
                    <option>Trabalho</option>
                    <option>Estudo</option>
                    <option>Rotina</option>
                    <option>Saúde</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-indigo-500 mb-1.5">Energia Exigida</label>
                  <select
                    value={energyRequirement}
                    onChange={e => setEnergyRequirement(e.target.value)}
                    className={inputClass}
                  >
                    <option>Muito Baixa</option>
                    <option>Baixa</option>
                    <option>Média</option>
                    <option>Alta</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-indigo-500 mb-1.5">Estimativa (minutos)</label>
                  <input
                    type="number"
                    min={5}
                    max={480}
                    value={estimatedMinutes}
                    onChange={e => setEstimatedMinutes(parseInt(e.target.value) || 30)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-indigo-500 mb-1.5">Prioridade</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className={inputClass}
                  >
                    <option value="Low">Baixa</option>
                    <option value="Medium">Média</option>
                    <option value="High">Alta</option>
                    <option value="Critical">Crítica</option>
                  </select>
                </div>
              </div>

              <div className={`p-3 rounded-xl border text-[10px] leading-relaxed font-semibold ${
                isDarkMode ? 'bg-slate-950/20 border-slate-900 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                {getCorrectionFactorLabel()}
              </div>

              <button
                type="submit"
                disabled={createTaskMutation.isPending}
                className="w-full bg-indigo-650 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all duration-200"
              >
                {createTaskMutation.isPending ? 'Planejando...' : 'Planejar Tarefa'}
              </button>
            </form>
          </div>
        </div>

        {/* Coluna 2 & 3: Linha do Tempo e Lista de Tarefas Planejadas */}
        <div className="lg:col-span-2">
          <div className={`border rounded-[32px] p-8 shadow-sm h-full ${
            isDarkMode ? 'bg-brand-cardDark/40 border-slate-800/60' : 'bg-white border-indigo-50/85'
          }`}>
            <h3 className={`text-sm font-black mb-6 flex items-center gap-2.5 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              <span>📜</span>
              <span>Cronograma Adaptativo do Dia</span>
            </h3>

            {loadingTasks ? (
              <div className="text-center py-20 text-xs text-slate-400 font-semibold">Carregando cronograma...</div>
            ) : tasks && tasks.length > 0 ? (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {tasks
                  .filter(t => t.status !== 'Completed')
                  .sort((a, b) => new Date(a.suggestedTime || '').getTime() - new Date(b.suggestedTime || '').getTime())
                  .map((task) => (
                    <div 
                      key={task.id}
                      className={`p-5 rounded-[24px] border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        task.status === 'Delayed'
                          ? 'bg-amber-500/5 border-amber-500/20'
                          : isDarkMode
                            ? 'bg-slate-950/30 border-slate-900 hover:border-slate-800'
                            : 'bg-slate-50/50 border-slate-200/60 hover:bg-slate-100/40 hover:border-slate-300 shadow-sm'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-slate-800 dark:text-white">
                            {formatTime(task.suggestedTime)}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black border uppercase ${getPriorityBadgeColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black border uppercase ${
                            task.complexityEstimate === 'Difícil'
                              ? 'text-rose-500 bg-rose-500/10 border-rose-500/20'
                              : task.complexityEstimate === 'Média'
                                ? 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                                : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                          }`}>
                            {task.complexityEstimate}
                          </span>
                          {task.parentTaskId && (
                            <span className="px-2 py-0.5 rounded-md text-[8px] font-black border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 uppercase">
                              Microtarefa
                            </span>
                          )}
                          {task.predecessorTaskId && (
                            <span className="px-2 py-0.5 rounded-md text-[8px] font-black border border-teal-500/20 bg-teal-500/10 text-teal-400 uppercase">
                              🔗 Vinculada
                            </span>
                          )}
                        </div>

                        <h4 className={`font-black text-xs ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{task.title}</h4>
                        {task.description && (
                          <p className={`text-[11px] font-semibold leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-550'}`}>
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-[9px] font-black uppercase text-slate-500 pt-1">
                          <span>⚡ {task.energyRequirement} Energia</span>
                          <span>⏳ {task.estimatedMinutes} min sugeridos</span>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => setCompletingTaskId(task.id || null)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider transition active:scale-95"
                        >
                          Concluir
                        </button>
                        <button
                          onClick={() => delayTaskMutation.mutate(task.id || 0)}
                          disabled={delayTaskMutation.isPending}
                          className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-black text-[10px] uppercase tracking-wider transition hover:bg-amber-500/20 active:scale-95"
                        >
                          Adiar
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-400 text-xs border border-dashed rounded-[32px] border-slate-200 dark:border-slate-855 font-semibold">
                Nenhuma tarefa planejada para hoje. Crie uma tarefa ao lado aplicando inteligência cognitiva!
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Modal de Conclusão de Tarefa */}
      <AnimatePresence>
        {completingTaskId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-sm border rounded-[32px] p-6 shadow-2xl relative ${
                isDarkMode ? 'bg-brand-cardDark border-slate-800 text-white' : 'bg-white border-indigo-50 text-slate-855'
              }`}
            >
              <h3 className="text-sm font-black mb-3">Concluir Atividade</h3>
              <p className="text-xs text-slate-400 font-semibold mb-5">
                Quanto tempo você realmente levou para completar esta atividade?
              </p>

              <form onSubmit={handleCompleteSubmit} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-indigo-500 mb-1.5">Tempo Real (minutos)</label>
                  <input
                    type="number"
                    min={1}
                    value={actualMinutes}
                    onChange={e => setActualMinutes(parseInt(e.target.value) || 1)}
                    className={inputClass}
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCompletingTaskId(null)}
                    className="px-4 py-2 text-xs font-black uppercase text-slate-400 hover:text-rose-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={completeTaskMutation.isPending}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider transition shadow-sm active:scale-95"
                  >
                    {completeTaskMutation.isPending ? 'Salvando...' : 'Confirmar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default SmartPlanning;
