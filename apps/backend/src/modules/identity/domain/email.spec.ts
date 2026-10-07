import { ValidationError } from '../../../shared/domain/errors';
import { EMAIL_MAX_LENGTH, parseEmail } from './email';

describe('parseEmail (D32)', () => {
  it('garde l’adresse saisie pour l’affichage, sans espaces en bord', () => {
    expect(parseEmail('  Alice@Lilas.fr ').address).toBe('Alice@Lilas.fr');
  });

  it('compare sans tenir compte de la casse', () => {
    expect(parseEmail('Alice@LILAS.fr').key).toBe(parseEmail('alice@lilas.fr').key);
  });

  it('compare un domaine accentué sous sa forme punycode', () => {
    expect(parseEmail('alice@hôpital.fr').key).toBe('alice@xn--hpital-ixa.fr');
  });

  it('compare les formes Unicode composée et décomposée comme une seule adresse (NFC)', () => {
    expect(parseEmail('hélene@lilas.fr').key).toBe(parseEmail('hélene@lilas.fr').key);
  });

  it.each(['', 'alice', '@lilas.fr', 'alice@', 'alice @lilas.fr', 'alice@lil as.fr'])(
    'refuse une adresse clairement invalide : %j',
    (value) => {
      expect(() => parseEmail(value)).toThrow(ValidationError);
    },
  );

  it('refuse une adresse de plus de 254 caractères', () => {
    const domain = '@lilas.fr';
    expect(() => parseEmail('a'.repeat(EMAIL_MAX_LENGTH - domain.length + 1) + domain)).toThrow(ValidationError);
    expect(parseEmail('a'.repeat(EMAIL_MAX_LENGTH - domain.length) + domain).address).toHaveLength(EMAIL_MAX_LENGTH);
  });
});
