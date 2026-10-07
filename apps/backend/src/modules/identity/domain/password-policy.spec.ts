import { ValidationError } from '../../../shared/domain/errors';
import { checkNewPassword, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, PasswordBlocklist } from './password-policy';

const blocklist: PasswordBlocklist = { has: (password) => password.toLowerCase() === '1q2w3e4r5t6y7u8i' };
const check = (password: string, context: string[] = []) => checkNewPassword(password, blocklist, context);

describe('checkNewPassword (D13, D18)', () => {
  it('refuse 14 caractères et accepte 15', () => {
    expect(() => check('a'.repeat(PASSWORD_MIN_LENGTH - 1))).toThrow('moins de 15 caractères');
    expect(check('a'.repeat(PASSWORD_MIN_LENGTH))).toHaveLength(PASSWORD_MIN_LENGTH);
  });

  it('accepte 128 caractères (au moins 64 exigés) et refuse au-delà', () => {
    expect(check('a'.repeat(PASSWORD_MAX_LENGTH))).toHaveLength(PASSWORD_MAX_LENGTH);
    expect(() => check('a'.repeat(PASSWORD_MAX_LENGTH + 1))).toThrow(ValidationError);
  });

  it('compte un caractère par point de code, pas par unité UTF-16', () => {
    expect(() => check('😷'.repeat(PASSWORD_MIN_LENGTH - 1))).toThrow(ValidationError);
  });

  it('normalise en NFC avant de compter : un « é » décomposé compte pour un caractère', () => {
    expect(() => check('é'.repeat(PASSWORD_MIN_LENGTH - 1))).toThrow(ValidationError);
    expect(check('é'.repeat(PASSWORD_MIN_LENGTH))).toBe('é'.repeat(PASSWORD_MIN_LENGTH));
  });

  it('n’impose aucune règle de composition et garde les espaces', () => {
    expect(check(' cheval agrafe pile ')).toBe(' cheval agrafe pile ');
  });

  it('refuse un mot de passe de la liste interdite, en donnant la raison', () => {
    expect(() => check('1q2w3e4r5t6y7u8i')).toThrow('trop courant');
  });

  it('refuse un mot de passe égal à un mot du contexte, quelle que soit la casse', () => {
    expect(() => check('Alice.Martin@lilas.fr', ['alice.martin@lilas.fr'])).toThrow(ValidationError);
  });

  it('compare le mot de passe entier, pas ses sous-chaînes (NIST)', () => {
    expect(check('alice.martin@lilas.fr et sa phrase', ['alice.martin@lilas.fr'])).toBeTruthy();
  });
});
