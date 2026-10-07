import { randomBytes, scrypt, ScryptOptions, timingSafeEqual } from 'node:crypto';
import { PasswordHasher } from '../domain/password-hasher';

// Paramètres minimaux de l'OWASP Password Storage Cheat Sheet pour scrypt (D13).
const COST = 2 ** 17;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;

const derive = (password: string, salt: Buffer, options: ScryptOptions) =>
  new Promise<Buffer>((resolve, reject) =>
    scrypt(password.normalize('NFC'), salt, KEY_LENGTH, options, (error, key) => (error ? reject(error) : resolve(key))),
  );

// scrypt utilise environ 128 * N * r octets ; la limite par défaut de Node (32 Mio) refuse N = 2^17.
const withMemory = (N: number, r: number, p: number): ScryptOptions => ({ N, r, p, maxmem: 2 * 128 * N * r });

/**
 * Empreinte `scrypt$N$r$p$sel$clé` (base64) : les paramètres sont stockés avec l'empreinte
 * pour pouvoir les durcir plus tard sans invalider les mots de passe existants.
 * Le mot de passe est normalisé en NFC avant hachage (NIST SP 800-63B rev 4).
 */
export class ScryptPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH);
    const key = await derive(password, salt, withMemory(COST, BLOCK_SIZE, PARALLELIZATION));
    return ['scrypt', COST, BLOCK_SIZE, PARALLELIZATION, salt.toString('base64'), key.toString('base64')].join('$');
  }

  async verify(password: string, hash: string): Promise<boolean> {
    const [algorithm, N, r, p, salt, key] = hash.split('$');
    if (algorithm !== 'scrypt' || !salt || !key) {
      return false;
    }
    try {
      const expected = Buffer.from(key, 'base64');
      const actual = await derive(password, Buffer.from(salt, 'base64'), withMemory(Number(N), Number(r), Number(p)));
      return actual.length === expected.length && timingSafeEqual(actual, expected);
    } catch {
      return false;
    }
  }
}
