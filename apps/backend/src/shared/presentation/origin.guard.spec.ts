import { isAllowedOrigin } from './origin.guard';

const APP = 'http://localhost:4200';

describe('Contrôle de l’origine (D25)', () => {
  it.each(['GET', 'HEAD', 'OPTIONS'])('laisse passer une lecture %s sans origine', (method) => {
    expect(isAllowedOrigin(method, undefined, APP)).toBe(true);
  });

  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('accepte une écriture %s venant du front', (method) => {
    expect(isAllowedOrigin(method, APP, APP)).toBe(true);
  });

  it.each([[undefined], ['null'], ['https://evil.example'], ['http://localhost:4200.evil.example']])(
    'refuse une écriture d’une autre origine ou sans origine (%j)',
    (origin) => {
      expect(isAllowedOrigin('POST', origin, APP)).toBe(false);
    },
  );
});
