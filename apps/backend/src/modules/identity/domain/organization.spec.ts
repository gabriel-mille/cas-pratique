import { ValidationError } from '../../../shared/domain/errors';
import { Organization } from './organization';

describe('Organization', () => {
  const createdAt = new Date('2026-10-07T10:00:00Z');

  it('retire les espaces en bord du nom', () => {
    expect(Organization.create({ id: 'org', name: ' Clinique des Lilas ', createdAt }).snapshot().name).toBe(
      'Clinique des Lilas',
    );
  });

  it('exige un nom', () => {
    expect(() => Organization.create({ id: 'org', name: ' ', createdAt })).toThrow(ValidationError);
  });
});
