import { ValidationError } from '../../../shared/domain/errors';
import { ActionPlan } from './action-plan';

const createdAt = new Date('2026-10-01T08:00:00Z');
const newPlan = (title: string, description: string | null = null) =>
  ActionPlan.create({ id: 'p1', organizationId: 'org', title, description, createdAt });

describe('ActionPlan', () => {
  it('est créé en version 1, avec un titre et une description nettoyés (D6, D11)', () => {
    expect(newPlan(' Audit hygiène 2026 ', ' ').snapshot()).toEqual({
      id: 'p1',
      organizationId: 'org',
      title: 'Audit hygiène 2026',
      description: null,
      version: 1,
      createdAt,
    });
  });

  it('refuse un titre vide', () => {
    expect(() => newPlan('')).toThrow(ValidationError);
  });

  it('modifie son titre et sa description', () => {
    const plan = newPlan('Audit');

    plan.edit('Audit hygiène 2026', 'Suite à la visite HAS');

    expect(plan.snapshot()).toMatchObject({ title: 'Audit hygiène 2026', description: 'Suite à la visite HAS' });
  });

  it('refuse une modification qui vide le titre, sans rien changer', () => {
    const plan = newPlan('Audit');

    expect(() => plan.edit(' ', null)).toThrow(ValidationError);
    expect(plan.snapshot().title).toBe('Audit');
  });
});
