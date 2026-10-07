import { ValidationError } from './errors';
import {
  DESCRIPTION_MAX_LENGTH,
  NAME_MAX_LENGTH,
  optionalDescription,
  requireName,
  requireTitle,
  TITLE_MAX_LENGTH,
} from './text';

describe('requireTitle (D11)', () => {
  it('retire les espaces en bord', () => {
    expect(requireTitle('  Audit hygiène  ')).toBe('Audit hygiène');
  });

  it.each(['', '   '])('refuse un titre vide : %j', (title) => {
    expect(() => requireTitle(title)).toThrow(ValidationError);
  });

  it('compte les caractères et non les unités UTF-16, comme PostgreSQL', () => {
    expect(requireTitle('😷'.repeat(TITLE_MAX_LENGTH))).toHaveLength(TITLE_MAX_LENGTH * 2);
  });

  it('refuse un titre trop long', () => {
    expect(() => requireTitle('a'.repeat(TITLE_MAX_LENGTH + 1))).toThrow(ValidationError);
  });
});

describe('optionalDescription (D11)', () => {
  it.each([null, '', '   '])('ramène une description vide à null : %j', (description) => {
    expect(optionalDescription(description)).toBeNull();
  });

  it('retire les espaces en bord', () => {
    expect(optionalDescription(' Former tout le personnel ')).toBe('Former tout le personnel');
  });

  it('refuse une description trop longue', () => {
    expect(() => optionalDescription('a'.repeat(DESCRIPTION_MAX_LENGTH + 1))).toThrow(ValidationError);
  });
});

describe('requireName', () => {
  it('retire les espaces en bord', () => {
    expect(requireName(' Clinique des Lilas ', 'Le nom')).toBe('Clinique des Lilas');
  });

  it('nomme le champ refusé', () => {
    expect(() => requireName(' ', 'Le nom de l’organisation')).toThrow('Le nom de l’organisation est obligatoire');
  });

  it('refuse un nom trop long', () => {
    expect(() => requireName('a'.repeat(NAME_MAX_LENGTH + 1), 'Le nom')).toThrow(ValidationError);
  });
});
