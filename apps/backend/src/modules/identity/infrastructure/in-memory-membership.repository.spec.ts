import { describeMembershipRepositoryContract } from '../testing/membership-repository.contract';
import { InMemoryMembershipRepository } from './in-memory-membership.repository';

describeMembershipRepositoryContract('en mémoire', async () => new InMemoryMembershipRepository());
