import { describeUserRepositoryContract } from '../testing/user-repository.contract';
import { InMemoryUserRepository } from './in-memory-user.repository';

describeUserRepositoryContract('en mémoire', async () => new InMemoryUserRepository());
