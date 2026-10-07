import { z } from 'zod';
import { validateForm } from './validate';

const schema = z.object({
  title: z.string().trim().min(1, 'Le titre est obligatoire'),
  count: z.coerce.number().min(2, 'Trop petit').max(5, 'Trop grand'),
});

function form(fields: Record<string, string>): HTMLFormElement {
  const element = document.createElement('form');
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input');
    input.name = name;
    input.value = value;
    element.append(input);
  }
  return element;
}

describe('validateForm', () => {
  it('renvoie les données nettoyées quand le formulaire est valide', () => {
    expect(validateForm(schema, form({ title: '  Audit  ', count: '3' }))).toEqual({
      ok: true,
      data: { title: 'Audit', count: 3 },
    });
  });

  it('renvoie un message par champ invalide', () => {
    expect(validateForm(schema, form({ title: ' ', count: '9' }))).toEqual({
      ok: false,
      errors: { title: 'Le titre est obligatoire', count: 'Trop grand' },
    });
  });
});
