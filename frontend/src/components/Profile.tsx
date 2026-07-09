import { useQuery } from '@tanstack/react-query';
import { loviTaskAPI } from '../services/api';

export const Profile = () => {
  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['profile'],
    queryFn: loviTaskAPI.getProfile,
    refetchInterval: 10000,
  });

  const { data: recommendations } = useQuery({
    queryKey: ['recommendations'],
    queryFn: loviTaskAPI.getRecommendations,
    refetchInterval: 10000,
  });

  if (isLoading) return <div className="text-center text-gray-500">Carregando perfil...</div>;
  if (isError) return <div className="text-red-600">Erro ao carregar perfil</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Seu Perfil Cognitivo</h2>
        <p className="text-gray-600">{profile?.summary}</p>
      </div>

      {profile?.productivityWindow && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Janela de Produtividade</h3>
          <p className="text-lg text-blue-600 font-bold">{profile.productivityWindow.period}</p>
          <p className="text-sm text-gray-600">
            Confiança: {Math.round((profile.productivityWindow.confidence || 0) * 100)}%
          </p>
        </div>
      )}

      {recommendations && recommendations.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Recomendações Personalizadas</h3>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg border-l-4 border-green-500">
                <h4 className="font-bold text-gray-900">{rec.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                <span className="inline-block mt-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  {rec.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
