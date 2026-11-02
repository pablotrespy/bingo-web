import { BadRequestException, Injectable } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class OrganizationsService {
  private readonly pool = new Pool({ connectionString: process.env.DATABASE_URL });

  private async ensurePublicCodes() {
    await this.pool.query(`CREATE SEQUENCE IF NOT EXISTS organization_public_code_seq START 1`);
    await this.pool.query(`UPDATE organizations SET public_code = lpad(nextval('organization_public_code_seq')::text, 6, '0') WHERE public_code IS NULL`);
  }

  async list() {
    await this.ensurePublicCodes();
    const result = await this.pool.query(`SELECT id, public_code AS "publicCode", name, legal_name AS "legalName", status, created_at AS "createdAt" FROM organizations ORDER BY created_at DESC`);
    return result.rows;
  }

  async create(input: { name: string; tradeName?: string; taxId?: string; phone?: string; email?: string; postalCode?: string }) {
    const name = input.name?.trim();
    if (!name) throw new BadRequestException('El nombre de la organización es obligatorio');
    await this.ensurePublicCodes();
    const result = await this.pool.query(
      `INSERT INTO organizations (id, public_code, name, trade_name, tax_id, phone, email, postal_code, status, created_at, updated_at)
       VALUES (gen_random_uuid(), lpad(nextval('organization_public_code_seq')::text, 6, '0'), $1, $2, $3, $4, $5, $6, 'ACTIVE', now(), now())
       RETURNING id, public_code AS "publicCode", name, trade_name AS "tradeName", tax_id AS "taxId", phone, email, postal_code AS "postalCode", status, created_at AS "createdAt"`,
      [name, input.tradeName?.trim() || null, input.taxId?.trim() || null, input.phone?.trim() || null, input.email?.trim() || null, input.postalCode?.trim() || null],
    );
    return result.rows[0];
  }

  async update(id: string, input: { name?: string; taxId?: string; phone?: string; email?: string; postalCode?: string; status?: string }) {
    const allowedStatuses = ['PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE', 'ARCHIVED'];
    if (input.status && !allowedStatuses.includes(input.status)) throw new BadRequestException('Estado no válido');
    const result = await this.pool.query(
      `UPDATE organizations
       SET name = COALESCE($2, name), tax_id = COALESCE($3, tax_id), phone = COALESCE($4, phone), email = COALESCE($5, email), postal_code = COALESCE($6, postal_code), status = COALESCE($7::"OrganizationStatus", status), updated_at = now()
       WHERE id = $1
       RETURNING id, public_code AS "publicCode", name, tax_id AS "taxId", phone, email, postal_code AS "postalCode", status, created_at AS "createdAt"`,
      [id, input.name?.trim() || null, input.taxId?.trim() || null, input.phone?.trim() || null, input.email?.trim() || null, input.postalCode?.trim() || null, input.status || null],
    );
    if (!result.rowCount) throw new BadRequestException('Organización no encontrada');
    return result.rows[0];
  }
}
