import { describeActionRepositoryContract } from '../testing/action-repository.contract';
import { InMemoryActionRepository } from './in-memory-action.repository';

describeActionRepositoryContract('en mémoire', async () => new InMemoryActionRepository());
