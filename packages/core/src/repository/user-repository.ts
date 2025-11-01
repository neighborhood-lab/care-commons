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

  async getUserById(id: UUID): Promise<User | null> {
    const query = `
      SELECT id, first_name, last_name, email
      FROM users
      WHERE id = $1 AND deleted_at IS NULL
    `;

    const result = await this.db.query<{
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    }>(query, [id]);

    const row = result.rows[0];
    if (row === undefined) {
      return null;
    }

    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
    };
  }

  async getUsersByIds(ids: UUID[]): Promise<User[]> {
    if (ids.length === 0) {
      return [];
    }

    const query = `
      SELECT id, first_name, last_name, email
      FROM users
      WHERE id = ANY($1) AND deleted_at IS NULL
      ORDER BY last_name, first_name
    `;

    const result = await this.db.query<{
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    }>(query, [ids]);

    return result.rows.map((row) => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
    }));
  }
}