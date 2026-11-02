import 'dotenv/config';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import bcrypt from 'bcryptjs';
import pg from 'pg';

const { Client } = pg;
const rl = createInterface({ input, output });

const name = (await rl.question('Nombre completo [Pablo Luis]: ')).trim() || 'Pablo Luis';
const email = (await rl.question('Correo [pablotrespy@gmail.com]: ')).trim().toLowerCase() || 'pablotrespy@gmail.com';
const password = await rl.question('Contraseña inicial: ', { hideEchoBack: true });
rl.close();

if (password.length < 12) {
  throw new Error('La contraseña debe tener al menos 12 caracteres.');
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  await client.query('BEGIN');

  const role = await client.query(
    `INSERT INTO roles (id, code, name, description, scope_type, is_system)
     VALUES (gen_random_uuid(), 'INGENIERIA', 'Ingeniería', 'Administración técnica y operativa completa de la plataforma', 'PLATFORM', true)
     ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
     RETURNING id`,
  );

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await client.query(
    `INSERT INTO users (id, email, full_name, password_hash, is_active, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, $3, true, now(), now())
     ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, password_hash = EXCLUDED.password_hash, is_active = true, updated_at = now()
     RETURNING id`,
    [email, name, passwordHash],
  );

  await client.query(
    `INSERT INTO user_platform_roles (user_id, role_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, role_id) DO NOTHING`,
    [user.rows[0].id, role.rows[0].id],
  );

  await client.query('COMMIT');
  console.log(`Usuario INGENIERIA creado o actualizado: ${email}`);
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  await client.end();
}
