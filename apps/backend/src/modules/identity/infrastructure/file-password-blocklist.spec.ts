import { fileURLToPath } from 'node:url';
import { PASSWORD_MIN_LENGTH } from '../domain/password-policy';
import { FilePasswordBlocklist } from './file-password-blocklist';

describe('FilePasswordBlocklist', () => {
  const blocklist = FilePasswordBlocklist.fromFile(fileURLToPath(new URL('./common-passwords.txt', import.meta.url)));

  it('contient au moins 3000 mots de passe conformes à la politique (ASVS 6.2.4)', () => {
    expect(blocklist.size).toBeGreaterThanOrEqual(3000);
  });

  it('reconnaît un mot de passe courant de 15 caractères ou plus, quelle que soit la casse', () => {
    expect('1qaz2wsx3edc4rfv'.length).toBeGreaterThanOrEqual(PASSWORD_MIN_LENGTH);
    expect(blocklist.has('1QAZ2WSX3EDC4RFV')).toBe(true);
  });

  it('laisse passer une phrase de passe peu commune', () => {
    expect(blocklist.has('cheval agrafe pile correcte')).toBe(false);
  });
});
