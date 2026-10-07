import { Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';

// Vérifie que la chaîne de test (Vitest + SWC) émet les métadonnées de décorateurs :
// sans elles, NestJS ne sait pas résoudre une dépendance injectée par le constructeur.
@Injectable()
class Dependency {
  readonly value = 42;
}

@Injectable()
class Consumer {
  constructor(readonly dependency: Dependency) {}
}

describe('Chaîne de test backend', () => {
  it('injecte une dépendance déclarée par le type du constructeur', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [Dependency, Consumer],
    }).compile();

    expect(moduleRef.get(Consumer).dependency.value).toBe(42);
  });
});
