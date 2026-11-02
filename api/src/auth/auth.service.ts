import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Pool } from 'pg';

@Injectable()
export class AuthService {
  private readonly pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  constructor(private readonly jwtService: JwtService) {}

  async login(email: string, password: string) {
    const normalizedEmail = email?.trim().toLowerCase();

    const result = await this.pool.query(
      `
      SELECT
        u.id,
        u.email,
        u.full_name,
        u.password_hash,
        u.is_active,
        u.must_change_password,
        COALESCE(
          ARRAY(
            SELECT DISTINCT r.code
            FROM user_platform_roles upr
            INNER JOIN roles r ON r.id = upr.role_id
            WHERE upr.user_id = u.id
          ),
          ARRAY[]::text[]
        )
        ||
        COALESCE(
          ARRAY(
            SELECT DISTINCT r.code
            FROM memberships m
            INNER JOIN membership_roles mr ON mr.membership_id = m.id
            INNER JOIN roles r ON r.id = mr.role_id
            WHERE m.user_id = u.id
          ),
          ARRAY[]::text[]
        ) AS roles
      FROM users u
      WHERE LOWER(u.email) = $1
      LIMIT 1
      `,
      [normalizedEmail],
    );

    const user = result.rows[0];

    if (
      !user ||
      !user.is_active ||
      !(await bcrypt.compare(password ?? '', user.password_hash))
    ) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    const roles = [...new Set(user.roles ?? [])];

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      roles,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        roles,
        mustChangePassword: user.must_change_password,
      },
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    if (!newPassword || newPassword.length < 8) {
      throw new UnauthorizedException('La nueva contraseña debe tener al menos 8 caracteres');
    }
    const result = await this.pool.query('SELECT password_hash FROM users WHERE id = $1 AND is_active = true', [userId]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(currentPassword ?? '', user.password_hash))) {
      throw new UnauthorizedException('La contraseña actual no es correcta');
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.pool.query('UPDATE users SET password_hash = $1, must_change_password = false, updated_at = now() WHERE id = $2', [passwordHash, userId]);
    return { message: 'Contraseña actualizada correctamente' };
  }
}
