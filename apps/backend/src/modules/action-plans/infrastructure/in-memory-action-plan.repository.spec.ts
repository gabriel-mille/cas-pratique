import { describeActionPlanRepositoryContract } from '../testing/action-plan-repository.contract';
import { InMemoryActionPlanRepository } from './in-memory-action-plan.repository';

describeActionPlanRepositoryContract('en mémoire', async () => new InMemoryActionPlanRepository());
