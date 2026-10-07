import { FactoryProvider, InjectionToken } from '@nestjs/common';

/**
 * Les cas d'usage sont des classes TypeScript sans décorateur Nest (couche application) :
 * un provider de fabrique leur passe leurs ports (doc NestJS *Custom providers*, `useFactory`).
 */
export function useCaseProvider<T>(
  useCase: new (...dependencies: never[]) => T,
  inject: InjectionToken[],
): FactoryProvider<T> {
  return {
    provide: useCase,
    useFactory: (...dependencies: unknown[]) => new (useCase as new (...args: unknown[]) => T)(...dependencies),
    inject,
  };
}
