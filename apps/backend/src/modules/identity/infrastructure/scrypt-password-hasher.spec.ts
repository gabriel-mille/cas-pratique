import { ScryptPasswordHasher } from './scrypt-password-hasher';

describe('ScryptPasswordHasher (D13)', () => {
  const hasher = new ScryptPasswordHasher();
  const password = 'cheval agrafe pile correcte';
  let hash: string;

  beforeAll(async () => {
    hash = await hasher.hash(password);
  });

  it('stocke les paramètres OWASP avec l’empreinte, jamais le mot de passe', () => {
    expect(hash).toMatch(/^scrypt\$131072\$8\$1\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
    expect(hash).not.toContain(password);
  });

  it('reconnaît le bon mot de passe et refuse un autre', async () => {
    expect(await hasher.verify(password, hash)).toBe(true);
    expect(await hasher.verify(`${password}!`, hash)).toBe(false);
  });

  it('sale chaque empreinte : deux hachages du même mot de passe diffèrent', async () => {
    expect(await hasher.hash(password)).not.toBe(hash);
  });

  it('normalise en NFC : un « é » composé ou décomposé donne le même mot de passe', async () => {
    const composed = await hasher.hash('café au lait tous les matins');
    expect(await hasher.verify('café au lait tous les matins', composed)).toBe(true);
  });

  it.each(['', 'bcrypt$x', 'scrypt$abc$8$1$c2Fs$a2V5', 'scrypt$131072$8$1$$'])(
    'refuse une empreinte illisible sans lever d’exception : %j',
    async (malformed) => {
      expect(await hasher.verify(password, malformed)).toBe(false);
    },
  );
});
