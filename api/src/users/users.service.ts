import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomBytes, randomUUID } from 'node:crypto';
import { Pool } from 'pg';

@Injectable()
export class UsersService {
  private readonly pool = new Pool({ connectionString: process.env.DATABASE_URL });
  async list() {
    await this.pool.query(`CREATE SEQUENCE IF NOT EXISTS user_public_code_seq START 1`);
    await this.pool.query(`UPDATE users SET public_code=lpad(nextval('user_public_code_seq')::text,6,'0') WHERE public_code IS NULL`);
    const result = await this.pool.query(`
      SELECT u.id, u.public_code AS "publicCode", u.full_name AS "fullName",
             u.identification, u.email, u.is_active AS "isActive",
             o.id AS "organizationId", o.name AS "organizationName",
             r.code AS "roleCode"
      FROM users u
      INNER JOIN memberships m ON m.user_id=u.id
      INNER JOIN organizations o ON o.id=m.organization_id
      INNER JOIN membership_roles mr ON mr.membership_id=m.id
      INNER JOIN roles r ON r.id=mr.role_id
      WHERE r.scope_type IN ('ORGANIZATION', 'LOCAL')
      ORDER BY u.created_at DESC
    `);
    return result.rows;
  }
  async create(input: { fullName?: string; identification?: string; email?: string; organizationId?: string; roleCode?: string }, actorRoles: string[] = []) {
    const allowed = ['ORG_ADMIN', 'SUPERVISOR', 'AUDITOR', 'LOCAL_ADMIN', 'OPERADOR_BINGO', 'CAJERO_VENDEDOR'];
    const roleCode = input.roleCode || 'ORG_ADMIN';
    if (!allowed.includes(roleCode)) throw new BadRequestException('Rol no permitido');
    const isPlatformAdmin = actorRoles.some((role) => ['INGENIERIA', 'SUPER_ADMIN'].includes(role));
    const isOrgAdmin = actorRoles.includes('ORG_ADMIN');
    if (roleCode === 'ORG_ADMIN' && !isPlatformAdmin) throw new BadRequestException('Solo Ingeniería o SUPER_ADMIN puede crear ORG_ADMIN');
    if (roleCode !== 'ORG_ADMIN' && !isPlatformAdmin && !isOrgAdmin) throw new BadRequestException('Permiso insuficiente');
    const id = randomUUID(); const temporaryPassword = randomBytes(18).toString('base64url'); const email = input.email?.trim().toLowerCase() || `pending-${id.slice(0,8)}@local.bingo-web`; const client = await this.pool.connect();
    try { await client.query('BEGIN'); await client.query(`CREATE SEQUENCE IF NOT EXISTS user_public_code_seq START 1`); const user = await client.query(`INSERT INTO users (id,public_code,email,full_name,identification,password_hash,is_active,must_change_password,created_at,updated_at) VALUES ($1,lpad(nextval('user_public_code_seq')::text,6,'0'),$2,$3,$4,$5,true,true,now(),now()) RETURNING id,public_code AS "publicCode",full_name AS "fullName",identification,email,is_active AS "isActive"`, [id,email,input.fullName?.trim()||'Usuario pendiente',input.identification?.trim()||null,await bcrypt.hash(temporaryPassword,12)]); if(input.organizationId){const m=await client.query(`INSERT INTO memberships (id,user_id,organization_id,status,created_at,updated_at) VALUES(gen_random_uuid(),$1,$2,'ACTIVE',now(),now()) RETURNING id`,[id,input.organizationId]); await client.query(`INSERT INTO roles (id,code,name,description,scope_type,is_system) VALUES (gen_random_uuid(),$1,$2,$3,$4,true) ON CONFLICT (code) DO NOTHING`,[roleCode,roleCode,`Rol ${roleCode}`,'ORGANIZATION']); const r=await client.query(`SELECT id FROM roles WHERE code=$1`,[roleCode]); if(!r.rowCount) throw new BadRequestException(`No se pudo preparar el rol ${roleCode}`); await client.query(`INSERT INTO membership_roles(membership_id,role_id) VALUES($1,$2) ON CONFLICT DO NOTHING`,[m.rows[0].id,r.rows[0].id]);} await client.query('COMMIT'); return { ...user.rows[0], roleCode, temporaryPassword }; } catch(e){await client.query('ROLLBACK');throw e;} finally{client.release();}
  }
}
