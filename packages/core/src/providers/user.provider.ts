/**
 * User Provider Interface and Implementation
 *
 * Provides user data access for all verticals.
 * Decouples services from direct database queries.
 */

import { Database } from '../db/connection.js';
import type { UUID, Role } from '../types/base.js';

/**
 * User data structure for cross-vertical use
 */
export interface User {
  id: UUID;
  organizationId: UUID;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  roles: Role[];
  branchIds: UUID[];
  status: string;
}

/**
 * User Provider Interface
 *
 * Provides read access to user data for cross-vertical operations.
 * Services should depend on this interface, not the concrete implementation.
 */
export interface IUserProvider {
  /**
   * Get user by ID
   */
  getUserById(userId: UUID): Promise<User | null>;

  /**
   * Get multiple users by IDs
   */
  getUsersByIds(userIds: UUID[]): Promise<User[]>;

  /**
   * Get user name by ID (convenience method)
   */
  getUserName(userId: UUID): Promise<string>;
}

/**
 * User Provider Implementation
 *
 * Concrete implementation that queries the database.
 */
export class UserProvider implements IUserProvider {
  constructor(private database: Database) {}

  async getUserById(userId: UUID): Promise<User | null> {
    const query = `
      SELECT
        id, organization_id, first_name, last_name, email, username,
        roles, branch_ids, status
      FROM users
      WHERE id = $1 AND deleted_at IS NULL
    `;

    const result = await this.database.query(query, [userId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0] as Record<string, unknown>;
    return {
      id: row['id'] as UUID,
      organizationId: row['organization_id'] as UUID,
      firstName: row['first_name'] as string,
      lastName: row['last_name'] as string,
      email: row['email'] as string,
      username: row['username'] as string,
      roles: row['roles'] as Role[],
      branchIds: row['branch_ids'] as UUID[],
      status: row['status'] as string,
    };
  }

  async getUsersByIds(userIds: UUID[]): Promise<User[]> {
    if (userIds.length === 0) {
      return [];
    }

    const query = `
      SELECT
        id, organization_id, first_name, last_name, email, username,
        roles, branch_ids, status
      FROM users
      WHERE id = ANY($1) AND deleted_at IS NULL
      ORDER BY last_name, first_name
    `;

    const result = await this.database.query(query, [userIds]);

    return result.rows.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: r['id'] as UUID,
        organizationId: r['organization_id'] as UUID,
        firstName: r['first_name'] as string,
        lastName: r['last_name'] as string,
        email: r['email'] as string,
        username: r['username'] as string,
        roles: r['roles'] as Role[],
        branchIds: r['branch_ids'] as UUID[],
        status: r['status'] as string,
      };
    });
  }

  async getUserName(userId: UUID): Promise<string> {
    const user = await this.getUserById(userId);
    if (user === null) {
      return 'Unknown User';
    }
    return `${user.firstName} ${user.lastName}`;
  }
}

/**
 * Factory function to create a UserProvider instance
 */
export function createUserProvider(database: Database): IUserProvider {
  return new UserProvider(database);
}
