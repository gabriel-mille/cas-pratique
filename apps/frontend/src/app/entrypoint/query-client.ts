import { QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError, queries } from '@/shared/api';

const MAX_RETRIES = 2;

/**
 * Une session expirée (401) ou un mot de passe à changer (403 `password-change-required`) sur n'importe quelle
 * lecture relance `/api/me` : la garde de session redirige alors vers la bonne page.
 */
export function createQueryClient({ retry = true }: { retry?: boolean } = {}): QueryClient {
  const client: QueryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        const sessionLost =
          error instanceof ApiError && (error.status === 401 || error.code === 'password-change-required');
        if (sessionLost && query.queryKey[0] !== queries.me().queryKey[0]) {
          void client.invalidateQueries(queries.me());
        }
      },
    }),
    defaultOptions: {
      queries: {
        // Une erreur 4xx est une réponse définitive : seules les pannes (réseau, 5xx) sont retentées.
        retry: (failureCount, error) =>
          retry && failureCount < MAX_RETRIES && !(error instanceof ApiError && error.status < 500),
      },
    },
  });
  return client;
}
