import { Role } from '../../../shared/domain/role';
import { accountKey } from './auth-throttling';

describe('accountKey (D17)', () => {
  it('identifie le compte par l’email saisi, sans tenir compte de la casse', () => {
    expect(accountKey({ body: { email: ' Alice@Lilas.fr ' } })).toBe('email:alice@lilas.fr');
  });

  it('identifie le membre connecté quand la requête ne porte pas d’email', () => {
    const actor = { userId: 'user-alice', organizationId: 'org', role: Role.ADMIN };
    expect(accountKey({ body: { currentPassword: 'x' }, actor })).toBe('user:user-alice');
  });

  it.each([[{}], [{ email: 42 }], [undefined]])('ne limite pas par compte sans compte identifiable (%j)', (body) => {
    expect(accountKey({ body })).toBeNull();
  });
});
