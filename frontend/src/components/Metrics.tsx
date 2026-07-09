import { useQuery } from '@tanstack/react-query';
import { loviTaskAPI } from '../services/api';

export const Metrics = () => {
  const { data: metrics, isLoading, isError } = useQuery({
    queryKey: ['metrics'],
    queryFn: loviTaskAPI.getMetrics,
    refetchInterval: 5000,
  });

  if (isLoading)
    return <div className="text-center text-gray-500">Carregando métricas...</div>;
  if (isError) return <div className="text-red-600">Erro ao carregar métricas</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Métricas de Produtividade</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total de Eventos</p>
          <p className="text-3xl font-bold text-blue-600">{metrics?.totalEvents || 0}</p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Concluídos</p>
          <p className="text-3xl font-bold text-green-600">{metrics?.completedEvents || 0}</p>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Abandonados</p>
          <p className="text-3xl font-bold text-red-600">{metrics?.abandonedEvents || 0}</p>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Taxa de Procrastinação</p>
          <p className="text-3xl font-bold text-orange-600">
            {Math.round((metrics?.procrastinationRate || 0) * 100)}%
          </p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Tempo Médio (min)</p>
          <p className="text-3xl font-bold text-purple-600">
            {Math.round(metrics?.averageCompletionMinutes || 0)}
          </p>
        </div>

        <div className="bg-indigo-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Categoria Favorita</p>
          <p className="text-lg font-bold text-indigo-600 truncate">
            {metrics?.mostFrequentCategory || '—'}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="border-t pt-4">
          <p className="text-sm text-gray-600">Período Mais Produtivo</p>
          <p className="text-lg font-semibold text-gray-900">
            {metrics?.mostProductivePeriod || '—'}
          </p>
        </div>
        <div className="border-t pt-4">
          <p className="text-sm text-gray-600">Período Menos Produtivo</p>
          <p className="text-lg font-semibold text-gray-900">
            {metrics?.leastProductivePeriod || '—'}
          </p>
        </div>
      </div>
    </div>
  );
};
