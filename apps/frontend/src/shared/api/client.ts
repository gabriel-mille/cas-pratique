/** Erreur renvoyée par l'API au format RFC 9457 (`application/problem+json`, D24). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    /** Code stable du back (`/problems/<code>`), à préférer au texte pour décider. */
    readonly code: string,
    readonly detail: string,
    readonly errors: readonly string[] = [],
  ) {
    super(detail);
    this.name = 'ApiError';
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Version lue : envoyée en `If-Match` pour une écriture conditionnelle (D14). */
  version?: number;
}

const UNEXPECTED_RESPONSE = 'Le serveur a répondu de façon inattendue. Réessayez plus tard.';

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const problem = (await response.json()) as { code?: unknown; detail?: unknown; errors?: unknown };
    if (typeof problem.code === 'string' && typeof problem.detail === 'string') {
      const errors = Array.isArray(problem.errors) ? problem.errors.map(String) : [];
      return new ApiError(response.status, problem.code, problem.detail, errors);
    }
  } catch {
    // Corps absent ou non JSON (proxy, panne) : message générique ci-dessous.
  }
  return new ApiError(response.status, `http-${response.status}`, UNEXPECTED_RESPONSE);
}

/**
 * Seul point d'accès HTTP du front. Le cookie de session part avec `same-origin` :
 * le front et l'API partagent l'origine (proxy Vite en dev, D34), sans CORS.
 */
export async function request<T>(path: string, { method = 'GET', body, version }: RequestOptions = {}): Promise<T> {
  const headers = new Headers({ Accept: 'application/json, application/problem+json' });
  if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  if (version !== undefined) {
    headers.set('If-Match', `"${version}"`);
  }
  const response = await fetch(new URL(path, window.location.origin), {
    method,
    headers,
    credentials: 'same-origin',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    throw await toApiError(response);
  }
  return (response.status === 204 ? undefined : await response.json()) as T;
}
