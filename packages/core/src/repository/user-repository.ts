import { UUID } from '../types/base';

export interface User {
  id: UUID;
  firstName: string;
  lastName: string;
  email: string;
}

export interface IUserRepository {
  getUserById(id: UUID): Promise<User | null>;
  getUsersByIds(ids: UUID[]): Promise<User[]>;
}

import { Database } from '../db/connection';

export class UserRepository implements IUserRepository {
  constructor(private db: Database) {}

  async getUserById(_id: UUID): Promise<User | null> {
    // Implementation stub - replace with actual database query
    // TODO: Implement using this.db when users table is available
    void this.db; // Suppress unused variable warning
    throw new Error('getUserById not implemented - integrate with actual users table');
  }

  async getUsersByIds(_ids: UUID[]): Promise<User[]> {
    // Implementation stub - replace with actual database query
    // TODO: Implement using this.db when users table is available
    void this.db; // Suppress unused variable warning
    throw new Error('getUsersByIds not implemented - integrate with actual users table');
  }
}