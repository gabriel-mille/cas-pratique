import { ValidationError } from '../../../shared/domain/errors';
import { parseEmail } from './email';
import { User } from './user';

describe('User', () => {
  const createdAt = new Date('2026-10-07T10:00:00Z');
  const newUser = (mustChangePassword = false) =>
    User.create({
      id: 'bob',
      email: parseEmail('Bob@Lilas.fr'),
      name: ' Bob ',
      passwordHash: 'hash-temporaire',
      mustChangePassword,
      createdAt,
    });

  it('garde l’adresse saisie et sa forme de comparaison', () => {
    expect(newUser().snapshot()).toMatchObject({ email: 'Bob@Lilas.fr', emailKey: 'bob@lilas.fr', name: 'Bob', version: 1 });
  });

  it('exige un nom', () => {
    expect(() =>
      User.create({ id: 'x', email: parseEmail('x@lilas.fr'), name: '', passwordHash: 'h', mustChangePassword: false, createdAt }),
    ).toThrow(ValidationError);
  });

  it('accepte toute session tant qu’aucune révocation n’a eu lieu', () => {
    expect(newUser().acceptsSessionIssuedAt(new Date('2000-01-01'))).toBe(true);
  });

  it('refuse les sessions ouvertes avant la déconnexion, accepte les suivantes (D16)', () => {
    const user = newUser();
    user.revokeSessions(new Date('2026-10-07T12:00:00Z'));
    expect(user.acceptsSessionIssuedAt(new Date('2026-10-07T11:59:59Z'))).toBe(false);
    expect(user.acceptsSessionIssuedAt(new Date('2026-10-07T12:00:00Z'))).toBe(true);
  });

  it('changer le mot de passe lève l’obligation de le changer et ferme les sessions existantes', () => {
    const user = newUser(true);
    const at = new Date('2026-10-07T12:00:00Z');
    user.changePassword('nouveau-hash', at);
    expect(user.snapshot()).toMatchObject({ passwordHash: 'nouveau-hash', mustChangePassword: false, sessionsValidAfter: at });
  });
});
