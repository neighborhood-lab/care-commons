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

export class UserRepository implements IUserRepository {
  async getUserById(id: UUID): Promise<User | null> {
    // Implementation stub - replace with actual database query
    throw new Error('getUserById not implemented - integrate with actual users table');
  }

  async getUsersByIds(ids: UUID[]): Promise<User[]> {
    // Implementation stub - replace with actual database query
    throw new Error('getUsersByIds not implemented - integrate with actual users table');
  }
}