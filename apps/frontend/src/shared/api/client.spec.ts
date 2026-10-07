import { http, HttpResponse } from 'msw';
import { server } from '@/testing/server';
import { ApiError, request } from './client';

describe('request', () => {
  it('envoie la version lue en If-Match et le corps en JSON', async () => {
    let received: { ifMatch: string | null; body: unknown } | undefined;
    server.use(
      http.put('*/api/echo', async ({ request: sent }) => {
        received = { ifMatch: sent.headers.get('If-Match'), body: await sent.json() };
        return HttpResponse.json({ ok: true });
      }),
    );
    await expect(request('/api/echo', { method: 'PUT', body: { title: 'A' }, version: 3 })).resolves.toEqual({
      ok: true,
    });
    expect(received).toEqual({ ifMatch: '"3"', body: { title: 'A' } });
  });

  it('rend undefined pour une réponse 204', async () => {
    server.use(http.delete('*/api/echo', () => new HttpResponse(null, { status: 204 })));
    await expect(request('/api/echo', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('lit une erreur RFC 9457 avec son code et le détail des champs', async () => {
    server.use(
      http.get('*/api/echo', () =>
        HttpResponse.json(
          {
            type: '/problems/validation-failed',
            status: 400,
            detail: 'Données invalides',
            code: 'validation-failed',
            errors: ['title'],
          },
          { status: 400 },
        ),
      ),
    );
    await expect(request('/api/echo')).rejects.toEqual(
      expect.objectContaining({ status: 400, code: 'validation-failed', detail: 'Données invalides', errors: ['title'] }),
    );
  });

  it('garde un message générique si le corps n’est pas un problème JSON (proxy, panne)', async () => {
    server.use(http.get('*/api/echo', () => new HttpResponse('<html>Bad Gateway</html>', { status: 502 })));
    const error = await request('/api/echo').catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 502, code: 'http-502', detail: expect.stringMatching(/inattendue/) });
  });
});
