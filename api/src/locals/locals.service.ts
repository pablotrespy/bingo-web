import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';

@Injectable()
export class LocalsService {
  private readonly pool = new Pool({ connectionString: process.env.DATABASE_URL });

  private async prepare() {
    await this.pool.query(`ALTER TABLE locals ADD COLUMN IF NOT EXISTS public_code CHAR(6)`);
    await this.pool.query(`CREATE SEQUENCE IF NOT EXISTS local_public_code_seq START 1`);
    await this.pool.query(`UPDATE locals SET public_code=lpad(nextval('local_public_code_seq')::text,6,'0') WHERE public_code IS NULL`);
  }

  async list(organizationId: string) {
    await this.prepare();
    const result = await this.pool.query(`SELECT id, public_code AS "publicCode", organization_id AS "organizationId", name, code, is_active AS "isActive" FROM locals WHERE organization_id=$1 ORDER BY public_code ASC`, [organizationId]);
    return result.rows;
  }

  async create(input: { organizationId?: string; name?: string }) {
    if (!input.organizationId || !input.name?.trim()) throw new BadRequestException('Organización y nombre del local son obligatorios');
    await this.prepare();
    const id = randomUUID();
    const result = await this.pool.query(`INSERT INTO locals (id, organization_id, name, code, public_code, is_active, created_at, updated_at) VALUES ($1,$2,$3,lpad(nextval('local_public_code_seq')::text,6,'0'),lpad(currval('local_public_code_seq')::text,6,'0'),true,now(),now()) RETURNING id, public_code AS "publicCode", organization_id AS "organizationId", name, code, is_active AS "isActive"`, [id, input.organizationId, input.name.trim()]);
    return result.rows[0];
  }
}
