#!/usr/bin/env npx tsx
/**
 * Vertical Scaffold Generator
 *
 * Generates a new vertical with standard structure and boilerplate code.
 *
 * Usage:
 *   npx tsx scripts/scaffold-vertical.ts --name=<vertical-name>
 *
 * Example:
 *   npx tsx scripts/scaffold-vertical.ts --name=medication-management
 *
 * Generated Structure:
 *   verticals/<name>/
 *   ├── package.json
 *   ├── tsconfig.json
 *   ├── src/
 *   │   ├── index.ts
 *   │   ├── types/<name>.ts
 *   │   ├── repository/<name>-repository.ts
 *   │   ├── service/<name>-service.ts
 *   │   ├── api/<name>-handlers.ts
 *   │   ├── validation/<name>-validator.ts
 *   │   └── __tests__/
 *   │       ├── <name>-service.test.ts
 *   │       └── <name>-handlers.test.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VERTICALS_DIR = path.join(__dirname, '../verticals');

interface ScaffoldOptions {
  name: string;
}

function parseArgs(): ScaffoldOptions {
  const args = process.argv.slice(2);
  const options: Record<string, string> = {};

  for (const arg of args) {
    const match = arg.match(/^--(\w+)=(.+)$/);
    if (match) {
      options[match[1]] = match[2];
    }
  }

  if (!options.name) {
    console.error('Usage: npx tsx scripts/scaffold-vertical.ts --name=<vertical-name>');
    console.error('\nExample: npx tsx scripts/scaffold-vertical.ts --name=medication-management');
    process.exit(1);
  }

  // Validate name format
  if (!/^[a-z][a-z0-9-]+$/.test(options.name)) {
    console.error('Error: Vertical name must be lowercase with hyphens only');
    console.error('Example: medication-management, patient-intake');
    process.exit(1);
  }

  return { name: options.name };
}

function toKebabCase(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-');
}

function toPascalCase(str: string): string {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function generatePackageJson(name: string, pascalName: string): string {
  return `{
  "name": "@folkcare/${name}",
  "version": "0.1.0",
  "description": "Folk Care ${pascalName} - TODO: Add description",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc --composite false && tsc-alias -p tsconfig.json",
    "dev": "tsc --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint . --ext ts --max-warnings 10",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@folkcare/core": "^0.1.0",
    "pg": "^8.11.3",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^24.10.1",
    "@types/pg": "^8.10.9",
    "@vitest/coverage-v8": "^4.0.13",
    "eslint": "^9.39.1",
    "tsc-alias": "^1.8.10",
    "typescript": "^5.3.3",
    "vitest": "^4.0.13"
  }
}
`;
}

function generateTsConfig(): string {
  return `{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "types": [
      "vitest/globals"
    ]
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ],
  "references": [
    {
      "path": "../../packages/core"
    }
  ],
  "tsc-alias": {
    "resolveFullPaths": true,
    "replacers": {
      "replace-imports": {
        "replace": "^(\\\\.{1,2}\\\\/[^'\\"]*)$",
        "with": "$1.js"
      }
    }
  }
}
`;
}

function generateTypes(name: string, pascalName: string): string {
  return `import type { UUID } from '@folkcare/core';

/**
 * ${pascalName} entity
 *
 * TODO: Update fields according to requirements
 */
export interface ${pascalName} {
  id: UUID;
  organizationId: UUID;
  name: string;
  description?: string;
  status: ${pascalName}Status;
  createdAt: Date;
  createdBy: UUID;
  updatedAt: Date;
  updatedBy: UUID;
  deletedAt?: Date;
  deletedBy?: UUID;
  isDemoData: boolean;
}

export type ${pascalName}Status = 'ACTIVE' | 'INACTIVE' | 'DRAFT';

export interface Create${pascalName}Input {
  organizationId: UUID;
  name: string;
  description?: string;
  status?: ${pascalName}Status;
}

export interface Update${pascalName}Input {
  name?: string;
  description?: string;
  status?: ${pascalName}Status;
}

export interface ${pascalName}SearchFilters {
  organizationId: UUID;
  status?: ${pascalName}Status[];
  search?: string;
}
`;
}

function generateRepository(name: string, pascalName: string, camelName: string): string {
  return `import { Pool, PoolClient } from 'pg';
import type { UUID, PaginatedResult, PaginationOptions, UserContext } from '@folkcare/core';
import type { ${pascalName}, Create${pascalName}Input, Update${pascalName}Input, ${pascalName}SearchFilters } from '../types/${name}.js';

/**
 * ${pascalName} Repository
 *
 * Handles database operations for ${pascalName} entities.
 */
export class ${pascalName}Repository {
  constructor(private pool: Pool) {}

  async findById(id: UUID, _tx?: PoolClient): Promise<${pascalName} | null> {
    const client = _tx ?? this.pool;
    const result = await client.query(
      \`SELECT * FROM ${name.replace(/-/g, '_')}s WHERE id = $1 AND deleted_at IS NULL\`,
      [id]
    );
    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  async search(
    filters: ${pascalName}SearchFilters,
    options: PaginationOptions,
    _tx?: PoolClient
  ): Promise<PaginatedResult<${pascalName}>> {
    const client = _tx ?? this.pool;
    const { page, limit, sortBy = 'created_at', sortOrder = 'desc' } = options;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE organization_id = $1 AND deleted_at IS NULL';
    const params: unknown[] = [filters.organizationId];
    let paramIndex = 2;

    if (filters.status && filters.status.length > 0) {
      whereClause += \` AND status = ANY($\${paramIndex})\`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.search) {
      whereClause += \` AND (name ILIKE $\${paramIndex} OR description ILIKE $\${paramIndex})\`;
      params.push(\`%\${filters.search}%\`);
      paramIndex++;
    }

    const countQuery = \`SELECT COUNT(*) FROM ${name.replace(/-/g, '_')}s \${whereClause}\`;
    const countResult = await client.query(countQuery, params);
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    const dataQuery = \`
      SELECT * FROM ${name.replace(/-/g, '_')}s
      \${whereClause}
      ORDER BY \${sortBy} \${sortOrder}
      LIMIT $\${paramIndex} OFFSET $\${paramIndex + 1}
    \`;
    params.push(limit, offset);

    const dataResult = await client.query(dataQuery, params);
    const items = dataResult.rows.map((row) => this.mapToEntity(row));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(
    input: Create${pascalName}Input,
    context: UserContext,
    _tx?: PoolClient
  ): Promise<${pascalName}> {
    const client = _tx ?? this.pool;
    const result = await client.query(
      \`INSERT INTO ${name.replace(/-/g, '_')}s (
        organization_id, name, description, status, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $5)
      RETURNING *\`,
      [
        input.organizationId,
        input.name,
        input.description ?? null,
        input.status ?? 'ACTIVE',
        context.userId,
      ]
    );
    return this.mapToEntity(result.rows[0]);
  }

  async update(
    id: UUID,
    input: Update${pascalName}Input,
    context: UserContext,
    _tx?: PoolClient
  ): Promise<${pascalName}> {
    const client = _tx ?? this.pool;
    const sets: string[] = ['updated_at = NOW()', 'updated_by = $2'];
    const params: unknown[] = [id, context.userId];
    let paramIndex = 3;

    if (input.name !== undefined) {
      sets.push(\`name = $\${paramIndex}\`);
      params.push(input.name);
      paramIndex++;
    }
    if (input.description !== undefined) {
      sets.push(\`description = $\${paramIndex}\`);
      params.push(input.description);
      paramIndex++;
    }
    if (input.status !== undefined) {
      sets.push(\`status = $\${paramIndex}\`);
      params.push(input.status);
      paramIndex++;
    }

    const result = await client.query(
      \`UPDATE ${name.replace(/-/g, '_')}s SET \${sets.join(', ')} WHERE id = $1 AND deleted_at IS NULL RETURNING *\`,
      params
    );
    return this.mapToEntity(result.rows[0]);
  }

  async softDelete(id: UUID, context: UserContext, _tx?: PoolClient): Promise<void> {
    const client = _tx ?? this.pool;
    await client.query(
      \`UPDATE ${name.replace(/-/g, '_')}s SET deleted_at = NOW(), deleted_by = $2 WHERE id = $1\`,
      [id, context.userId]
    );
  }

  private mapToEntity(row: Record<string, unknown>): ${pascalName} {
    return {
      id: row.id as UUID,
      organizationId: row.organization_id as UUID,
      name: row.name as string,
      description: row.description as string | undefined,
      status: row.status as ${pascalName}['status'],
      createdAt: new Date(row.created_at as string),
      createdBy: row.created_by as UUID,
      updatedAt: new Date(row.updated_at as string),
      updatedBy: row.updated_by as UUID,
      deletedAt: row.deleted_at ? new Date(row.deleted_at as string) : undefined,
      deletedBy: row.deleted_by as UUID | undefined,
      isDemoData: row.is_demo_data as boolean,
    };
  }
}
`;
}

function generateService(name: string, pascalName: string, _camelName: string): string {
  return `import type { Pool } from 'pg';
import type { UUID, PaginatedResult, PaginationOptions, UserContext } from '@folkcare/core';
import { NotFoundError, ValidationError } from '@folkcare/core';
import { ${pascalName}Repository } from '../repository/${name}-repository.js';
import type { ${pascalName}, Create${pascalName}Input, Update${pascalName}Input, ${pascalName}SearchFilters } from '../types/${name}.js';

/**
 * ${pascalName} Service
 *
 * Business logic for ${pascalName} operations.
 */
export class ${pascalName}Service {
  private repository: ${pascalName}Repository;

  constructor(pool: Pool) {
    this.repository = new ${pascalName}Repository(pool);
  }

  async getById(id: UUID, context: UserContext): Promise<${pascalName}> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundError('${pascalName} not found', { id });
    }

    // Verify organization access
    if (entity.organizationId !== context.organizationId) {
      throw new NotFoundError('${pascalName} not found', { id });
    }

    return entity;
  }

  async search(
    filters: ${pascalName}SearchFilters,
    options: PaginationOptions,
    context: UserContext
  ): Promise<PaginatedResult<${pascalName}>> {
    // Ensure user can only search within their organization
    const safeFilters = {
      ...filters,
      organizationId: context.organizationId!,
    };

    return this.repository.search(safeFilters, options);
  }

  async create(
    input: Create${pascalName}Input,
    context: UserContext
  ): Promise<${pascalName}> {
    // Validate organization matches user's org
    if (input.organizationId !== context.organizationId) {
      throw new ValidationError('Invalid organization');
    }

    return this.repository.create(input, context);
  }

  async update(
    id: UUID,
    input: Update${pascalName}Input,
    context: UserContext
  ): Promise<${pascalName}> {
    // Verify entity exists and belongs to user's organization
    const existing = await this.getById(id, context);

    return this.repository.update(id, input, context);
  }

  async delete(id: UUID, context: UserContext): Promise<void> {
    // Verify entity exists and belongs to user's organization
    await this.getById(id, context);

    await this.repository.softDelete(id, context);
  }
}
`;
}

function generateHandlers(name: string, pascalName: string, camelName: string): string {
  return `import type { Request, Response, NextFunction, Router } from 'express';
import type { Pool } from 'pg';
import { ${pascalName}Service } from '../service/${name}-service.js';
import { create${pascalName}Schema, update${pascalName}Schema } from '../validation/${name}-validator.js';

/**
 * ${pascalName} API Handlers
 *
 * REST API endpoints for ${pascalName} operations.
 */
export function create${pascalName}Handlers(pool: Pool) {
  const service = new ${pascalName}Service(pool);

  return {
    /**
     * GET /${name}s
     * List ${camelName}s with pagination and filters
     */
    async list(req: Request, res: Response, next: NextFunction) {
      try {
        const { page = '1', limit = '20', status, search } = req.query;
        const result = await service.search(
          {
            organizationId: req.user!.organizationId!,
            status: status ? (status as string).split(',') as any : undefined,
            search: search as string,
          },
          {
            page: parseInt(page as string, 10),
            limit: parseInt(limit as string, 10),
          },
          req.user!
        );
        res.json(result);
      } catch (error) {
        next(error);
      }
    },

    /**
     * GET /${name}s/:id
     * Get a single ${camelName} by ID
     */
    async getById(req: Request, res: Response, next: NextFunction) {
      try {
        const entity = await service.getById(req.params.id, req.user!);
        res.json(entity);
      } catch (error) {
        next(error);
      }
    },

    /**
     * POST /${name}s
     * Create a new ${camelName}
     */
    async create(req: Request, res: Response, next: NextFunction) {
      try {
        const input = create${pascalName}Schema.parse({
          ...req.body,
          organizationId: req.user!.organizationId,
        });
        const entity = await service.create(input, req.user!);
        res.status(201).json(entity);
      } catch (error) {
        next(error);
      }
    },

    /**
     * PATCH /${name}s/:id
     * Update an existing ${camelName}
     */
    async update(req: Request, res: Response, next: NextFunction) {
      try {
        const input = update${pascalName}Schema.parse(req.body);
        const entity = await service.update(req.params.id, input, req.user!);
        res.json(entity);
      } catch (error) {
        next(error);
      }
    },

    /**
     * DELETE /${name}s/:id
     * Soft delete a ${camelName}
     */
    async delete(req: Request, res: Response, next: NextFunction) {
      try {
        await service.delete(req.params.id, req.user!);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  };
}

/**
 * Register ${pascalName} routes
 */
export function register${pascalName}Routes(router: Router, pool: Pool): void {
  const handlers = create${pascalName}Handlers(pool);

  router.get('/${name}s', handlers.list);
  router.get('/${name}s/:id', handlers.getById);
  router.post('/${name}s', handlers.create);
  router.patch('/${name}s/:id', handlers.update);
  router.delete('/${name}s/:id', handlers.delete);
}
`;
}

function generateValidator(name: string, pascalName: string): string {
  return `import { z } from 'zod';

/**
 * ${pascalName} Validation Schemas
 */

const ${pascalName.toLowerCase()}StatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'DRAFT']);

export const create${pascalName}Schema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  status: ${pascalName.toLowerCase()}StatusSchema.optional(),
});

export const update${pascalName}Schema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  status: ${pascalName.toLowerCase()}StatusSchema.optional(),
});

export type Create${pascalName}Schema = z.infer<typeof create${pascalName}Schema>;
export type Update${pascalName}Schema = z.infer<typeof update${pascalName}Schema>;
`;
}

function generateIndex(name: string, pascalName: string): string {
  return `// Types
export type {
  ${pascalName},
  ${pascalName}Status,
  Create${pascalName}Input,
  Update${pascalName}Input,
  ${pascalName}SearchFilters,
} from './types/${name}.js';

// Repository
export { ${pascalName}Repository } from './repository/${name}-repository.js';

// Service
export { ${pascalName}Service } from './service/${name}-service.js';

// Validation
export { create${pascalName}Schema, update${pascalName}Schema } from './validation/${name}-validator.js';

// API
export { create${pascalName}Handlers, register${pascalName}Routes } from './api/${name}-handlers.js';
`;
}

function generateServiceTest(name: string, pascalName: string, camelName: string): string {
  return `import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ${pascalName}Service } from '../service/${name}-service.js';
import type { UserContext } from '@folkcare/core';

describe('${pascalName}Service', () => {
  let service: ${pascalName}Service;
  let mockPool: any;
  let mockContext: UserContext;

  beforeEach(() => {
    mockPool = {
      query: vi.fn(),
    };
    mockContext = {
      userId: 'user-1',
      organizationId: 'org-1',
      branchIds: [],
      roles: ['ADMIN'],
      permissions: [],
    };
    service = new ${pascalName}Service(mockPool);
  });

  describe('getById', () => {
    it('should return ${camelName} when found', async () => {
      const mockEntity = {
        id: '123',
        organization_id: 'org-1',
        name: 'Test ${pascalName}',
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'user-1',
        updated_by: 'user-1',
        is_demo_data: false,
      };

      mockPool.query.mockResolvedValue({ rows: [mockEntity] });

      const result = await service.getById('123', mockContext);

      expect(result).toBeDefined();
      expect(result.id).toBe('123');
      expect(result.name).toBe('Test ${pascalName}');
    });

    it('should throw NotFoundError when ${camelName} not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await expect(service.getById('nonexistent', mockContext)).rejects.toThrow(
        '${pascalName} not found'
      );
    });
  });

  describe('create', () => {
    it('should create a new ${camelName}', async () => {
      const input = {
        organizationId: 'org-1',
        name: 'New ${pascalName}',
      };

      const mockCreated = {
        id: 'new-id',
        organization_id: 'org-1',
        name: 'New ${pascalName}',
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'user-1',
        updated_by: 'user-1',
        is_demo_data: false,
      };

      mockPool.query.mockResolvedValue({ rows: [mockCreated] });

      const result = await service.create(input, mockContext);

      expect(result).toBeDefined();
      expect(result.name).toBe('New ${pascalName}');
    });
  });

  // TODO: Add more test cases for update, delete, search
});
`;
}

function generateHandlersTest(name: string, pascalName: string): string {
  return `import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('${pascalName} Handlers', () => {
  // TODO: Add integration tests for API handlers

  it('placeholder test', () => {
    expect(true).toBe(true);
  });
});
`;
}

function scaffoldVertical(options: ScaffoldOptions): void {
  const { name } = options;
  const pascalName = toPascalCase(name);
  const camelName = toCamelCase(name);
  const verticalDir = path.join(VERTICALS_DIR, name);

  // Check if vertical already exists
  if (fs.existsSync(verticalDir)) {
    console.error(`Error: Vertical '${name}' already exists at ${verticalDir}`);
    process.exit(1);
  }

  console.log(`\nScaffolding vertical: ${name}`);
  console.log(`Location: ${verticalDir}\n`);

  // Create directory structure
  const dirs = [
    verticalDir,
    path.join(verticalDir, 'src'),
    path.join(verticalDir, 'src', 'types'),
    path.join(verticalDir, 'src', 'repository'),
    path.join(verticalDir, 'src', 'service'),
    path.join(verticalDir, 'src', 'api'),
    path.join(verticalDir, 'src', 'validation'),
    path.join(verticalDir, 'src', '__tests__'),
  ];

  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`  Created: ${path.relative(VERTICALS_DIR, dir)}/`);
  }

  // Write files
  const files: Array<{ path: string; content: string }> = [
    { path: 'package.json', content: generatePackageJson(name, pascalName) },
    { path: 'tsconfig.json', content: generateTsConfig() },
    { path: `src/types/${name}.ts`, content: generateTypes(name, pascalName) },
    { path: `src/repository/${name}-repository.ts`, content: generateRepository(name, pascalName, camelName) },
    { path: `src/service/${name}-service.ts`, content: generateService(name, pascalName, camelName) },
    { path: `src/api/${name}-handlers.ts`, content: generateHandlers(name, pascalName, camelName) },
    { path: `src/validation/${name}-validator.ts`, content: generateValidator(name, pascalName) },
    { path: 'src/index.ts', content: generateIndex(name, pascalName) },
    { path: `src/__tests__/${name}-service.test.ts`, content: generateServiceTest(name, pascalName, camelName) },
    { path: `src/__tests__/${name}-handlers.test.ts`, content: generateHandlersTest(name, pascalName) },
  ];

  for (const file of files) {
    const filePath = path.join(verticalDir, file.path);
    fs.writeFileSync(filePath, file.content);
    console.log(`  Created: ${name}/${file.path}`);
  }

  console.log(`\n✅ Vertical '${name}' scaffolded successfully!\n`);
  console.log('Next steps:');
  console.log('1. Install dependencies: npm install');
  console.log('2. Update the types in src/types/' + name + '.ts');
  console.log('3. Create database migration: npm run db:migration:create -- --type=add-table --name=' + name.replace(/-/g, '_') + 's');
  console.log('4. Register routes in packages/app/src/routes/index.ts');
  console.log('5. Add to packages/app/package.json dependencies');
  console.log('6. Run tests: npm test --filter=@folkcare/' + name);
}

function main(): void {
  const options = parseArgs();
  scaffoldVertical(options);
}

main();
