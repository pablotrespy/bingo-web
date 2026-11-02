import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';

@Injectable()
export class GamesService {
  private readonly pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  private async prepare() {
    await this.pool.query(
      `CREATE SEQUENCE IF NOT EXISTS bingo_game_code_seq START 1`,
    );
    await this.pool.query(
      `CREATE SEQUENCE IF NOT EXISTS sale_transaction_seq START 1`,
    );
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS bingo_games (id uuid PRIMARY KEY, organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT, room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT, public_code char(6) UNIQUE NOT NULL, name text NOT NULL, bingo_type text NOT NULL, card_value numeric(12,2) NOT NULL, total_prize numeric(12,2) NOT NULL, line_prize numeric(12,2) NOT NULL, bingo_prize numeric(12,2) NOT NULL, line_percent numeric(5,2) NOT NULL DEFAULT 30, bingo_percent numeric(5,2) NOT NULL DEFAULT 70, sale_open_at timestamptz NOT NULL, sale_close_at timestamptz NOT NULL, bingo_at timestamptz NOT NULL, cards_sold integer NOT NULL DEFAULT 0, started_at timestamptz NULL, status text NOT NULL DEFAULT 'PROGRAMADO', created_at timestamptz NOT NULL DEFAULT now())`,
    );
    await this.pool.query(
      `ALTER TABLE bingo_games ADD COLUMN IF NOT EXISTS line_percent numeric(5,2) NOT NULL DEFAULT 30`,
    );
    await this.pool.query(
      `ALTER TABLE bingo_games ADD COLUMN IF NOT EXISTS bingo_percent numeric(5,2) NOT NULL DEFAULT 70`,
    );
    await this.pool.query(
      `ALTER TABLE bingo_games ADD COLUMN IF NOT EXISTS cards_sold integer NOT NULL DEFAULT 0`,
    );
    await this.pool.query(
      `ALTER TABLE bingo_games ADD COLUMN IF NOT EXISTS started_at timestamptz NULL`,
    );
    await this.pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS bingo_card_catalog (card_number integer PRIMARY KEY, series_number integer NOT NULL, grid jsonb NOT NULL)`,
    );
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS bingo_draws (game_id uuid PRIMARY KEY REFERENCES bingo_games(id) ON DELETE CASCADE, started boolean NOT NULL DEFAULT false, finished boolean NOT NULL DEFAULT false, current integer NULL, called_numbers jsonb NOT NULL DEFAULT '[]'::jsonb, updated_at timestamptz NOT NULL DEFAULT now())`,
    );
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS bingo_cards (id uuid PRIMARY KEY, game_id uuid NOT NULL REFERENCES bingo_games(id) ON DELETE CASCADE, series_number integer NOT NULL, card_number integer NOT NULL, grid jsonb NOT NULL, sold boolean NOT NULL DEFAULT false, UNIQUE(game_id,card_number))`,
    );
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS bingo_sales (id uuid PRIMARY KEY, sale_code varchar(7) UNIQUE NOT NULL, game_id uuid NOT NULL REFERENCES bingo_games(id), customer_document text, quantity integer NOT NULL, range_start integer NOT NULL, range_end integer NOT NULL, created_at timestamptz NOT NULL DEFAULT now())`,
    );
  }
  private readonly statusSql = `CASE WHEN d.finished THEN 'FINALIZADA' WHEN g.started_at IS NOT NULL THEN 'EN JUEGO' WHEN now() < g.sale_open_at THEN 'PROGRAMADO' WHEN now() < g.sale_close_at THEN 'VENTA' WHEN g.cards_sold = 0 AND now() >= g.sale_close_at + interval '2 minutes' THEN 'CANCELADO' WHEN now() >= g.bingo_at + interval '10 minutes' THEN 'CANCELADO' ELSE 'VENTA CERRADA' END`;
  async create(input: Record<string, unknown>) {
    const organizationId = String(input.organizationId ?? '');
    const roomId = String(input.roomId ?? '');
    const name = String(input.name ?? '').trim();
    if (!organizationId || !roomId || !name)
      throw new BadRequestException(
        'Organización, sala y nombre son obligatorios',
      );
    await this.prepare();
    const room = await this.pool.query(
      `SELECT id,local_id FROM rooms WHERE id=$1 AND organization_id=$2`,
      [roomId, organizationId],
    );
    if (!room.rowCount)
      throw new BadRequestException('La sala no pertenece a la organización');
    const values = [
      randomUUID(),
      organizationId,
      roomId,
      name,
      input.bingoType,
      input.cardValue,
      input.totalPrize,
      input.linePrize,
      input.bingoPrize,
      input.linePercent ?? 30,
      input.bingoPercent ?? 70,
      input.saleOpenAt,
      input.saleCloseAt,
      input.bingoAt,
    ];
    if (values.slice(4).some((value) => value === undefined || value === ''))
      throw new BadRequestException(
        'Todos los campos del bingo son obligatorios',
      );
    const result = await this.pool.query(
      `INSERT INTO bingo_games (id,organization_id,room_id,public_code,name,bingo_type,card_value,total_prize,line_prize,bingo_prize,line_percent,bingo_percent,sale_open_at,sale_close_at,bingo_at) VALUES ($1,$2,$3,lpad(nextval('bingo_game_code_seq')::text,6,'0'),$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id,public_code AS "publicCode",name,bingo_type AS "bingoType",card_value AS "cardValue",total_prize AS "totalPrize",line_prize AS "linePrize",bingo_prize AS "bingoPrize",line_percent AS "linePercent",bingo_percent AS "bingoPercent",sale_open_at AS "saleOpenAt",sale_close_at AS "saleCloseAt",bingo_at AS "bingoAt",status,room_id AS "roomId"`,
      values,
    );
    return { ...result.rows[0], localId: room.rows[0].local_id };
  }
  async listOrganization(id: string) {
    await this.prepare();
    const result = await this.pool.query(
      `SELECT g.id,g.public_code AS "publicCode",g.name,g.bingo_type AS "bingoType",g.card_value AS "cardValue",g.cards_sold AS "cardsSold",g.total_prize AS "totalPrize",g.line_prize AS "linePrize",g.bingo_prize AS "bingoPrize",g.sale_open_at AS "saleOpenAt",g.sale_close_at AS "saleCloseAt",g.bingo_at AS "bingoAt",${this.statusSql} AS status,g.room_id AS "roomId",r.name AS "roomName" FROM bingo_games g LEFT JOIN bingo_draws d ON d.game_id=g.id JOIN rooms r ON r.id=g.room_id WHERE g.organization_id=$1 ORDER BY g.public_code ASC`,
      [id],
    );
    return result.rows;
  }
  async listLocal(id: string) {
    await this.prepare();
    const result = await this.pool.query(
      `SELECT g.id,g.public_code AS "publicCode",g.name,g.bingo_type AS "bingoType",g.card_value AS "cardValue",g.cards_sold AS "cardsSold",g.total_prize AS "totalPrize",g.line_prize AS "linePrize",g.bingo_prize AS "bingoPrize",g.sale_open_at AS "saleOpenAt",g.sale_close_at AS "saleCloseAt",g.bingo_at AS "bingoAt",${this.statusSql} AS status,g.room_id AS "roomId",r.public_code AS "roomPublicCode",r.name AS "roomName" FROM bingo_games g LEFT JOIN bingo_draws d ON d.game_id=g.id JOIN rooms r ON r.id=g.room_id WHERE r.local_id=$1 ORDER BY g.public_code ASC`,
      [id],
    );
    return result.rows;
  }
  async get(id: string) {
    await this.prepare();
    const result = await this.pool.query(
      `SELECT id,public_code AS "publicCode",name,card_value AS "cardValue",total_prize AS "totalPrize",line_prize AS "linePrize",bingo_prize AS "bingoPrize",sale_open_at AS "saleOpenAt",sale_close_at AS "saleCloseAt",bingo_at AS "bingoAt",cards_sold AS "cardsSold" FROM bingo_games WHERE id=$1`,
      [id],
    );
    if (!result.rowCount) throw new BadRequestException('Jugada no encontrada');
    return result.rows[0];
  }
  async inventory(id: string) {
    await this.prepare();
    const result = await this.pool.query(
      `SELECT cards_sold AS "sold",24000-cards_sold AS "remaining",24000 AS "total" FROM bingo_games WHERE id=$1`,
      [id],
    );
    if (!result.rowCount) throw new BadRequestException('Jugada no encontrada');
    return result.rows[0];
  }
  async listSales(id: string) {
    await this.prepare();
    const result = await this.pool.query(
      `SELECT sale_code AS "saleId",customer_document AS "document",quantity,range_start AS "rangeStart",range_end AS "rangeEnd",created_at AS "createdAt" FROM bingo_sales WHERE game_id=$1 ORDER BY created_at ASC`,
      [id],
    );
    return result.rows;
  }
  async listCards(id: string) {
    await this.prepare();
    const result = await this.pool.query(
      `SELECT series_number AS "seriesNumber",card_number AS "cardNumber",grid,sold FROM bingo_cards WHERE game_id=$1 ORDER BY card_number ASC`,
      [id],
    );
    return result.rows;
  }
  async drawState(id: string) {
    await this.prepare();
    const result = await this.pool.query(
      `SELECT game_id AS "gameId",started,finished,current,called_numbers AS "calledNumbers" FROM bingo_draws WHERE game_id=$1`,
      [id],
    );
    return (
      result.rows[0] ?? {
        gameId: id,
        started: false,
        finished: false,
        current: null,
        calledNumbers: [],
      }
    );
  }
  async updateDraw(
    id: string,
    input: {
      started?: boolean;
      finished?: boolean;
      current?: number | null;
      calledNumbers?: number[];
    },
  ) {
    await this.prepare();
    const result = await this.pool.query(
      `INSERT INTO bingo_draws (game_id,started,finished,current,called_numbers) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (game_id) DO UPDATE SET started=EXCLUDED.started,finished=EXCLUDED.finished,current=EXCLUDED.current,called_numbers=EXCLUDED.called_numbers,updated_at=now() RETURNING game_id AS "gameId",started,finished,current,called_numbers AS "calledNumbers"`,
      [
        id,
        Boolean(input.started),
        Boolean(input.finished),
        input.current ?? null,
        JSON.stringify(input.calledNumbers ?? []),
      ],
    );
    return result.rows[0];
  }
  async sell(
    id: string,
    input: { quantity?: number; customerId?: string; document?: string; cashierShiftId?: string; sellerUserId?: string },
  ) {
    await this.prepare();
    const saleCode = await this.pool.query(
      "SELECT lpad(nextval('sale_transaction_seq')::text,6,'0') AS code",
    );
    const saleId = 'V' + saleCode.rows[0].code;
    const quantity = Number(input.quantity);
    if (!Number.isInteger(quantity) || quantity < 1)
      throw new BadRequestException(
        'La cantidad de cartones debe ser un entero positivo',
      );
    let cashierShiftId = input.cashierShiftId;
    if (!cashierShiftId && input.sellerUserId) {
      const shift = await this.pool.query(`SELECT s.id FROM cashier_shifts s JOIN bingo_games g ON g.room_id IN (SELECT id FROM rooms WHERE local_id=s.local_id) WHERE g.id=$1 AND s.seller_user_id=$2 AND s.status='ABIERTA' ORDER BY s.opened_at DESC LIMIT 1`, [id, input.sellerUserId]);
      cashierShiftId = shift.rows[0]?.id;
      if (!cashierShiftId) {
        const local = await this.pool.query(`SELECT r.local_id AS "localId", l.organization_id AS "organizationId" FROM bingo_games g JOIN rooms r ON r.id=g.room_id JOIN locals l ON l.id=r.local_id WHERE g.id=$1`, [id]);
        if (local.rowCount) {
          const created = await this.pool.query(`INSERT INTO cashier_shifts (id,organization_id,local_id,seller_user_id) VALUES ($1,$2,$3,$4) RETURNING id`, [randomUUID(), local.rows[0].organizationId, local.rows[0].localId, input.sellerUserId]);
          cashierShiftId = created.rows[0].id;
        }
      }
    }
    if (!cashierShiftId) throw new BadRequestException('Debe abrir una jornada de caja antes de vender');
    const shift = await this.pool.query(`SELECT id FROM cashier_shifts WHERE id=$1 AND status='ABIERTA'`, [cashierShiftId]);
    if (!shift.rowCount) throw new BadRequestException('La jornada de caja no está abierta');
    const result = await this.pool.query(
      `UPDATE bingo_games SET cards_sold=cards_sold+$1 WHERE id=$2 AND cards_sold+$1<=24000 AND now()>=sale_open_at AND now()<sale_close_at RETURNING cards_sold-$1+1 AS "rangeStart",cards_sold AS "rangeEnd",card_value AS "cardValue",total_prize AS "totalPrize",name`,
      [quantity, id],
    );
    if (!result.rowCount)
      throw new BadRequestException(
        'No hay suficientes cartones disponibles o la venta está cerrada',
      );
    await this.pool.query(
      `INSERT INTO bingo_sales (id,sale_code,game_id,customer_document,quantity,range_start,range_end,cashier_shift_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        randomUUID(),
        saleId,
        id,
        input.document ?? null,
        quantity,
        result.rows[0].rangeStart,
        result.rows[0].rangeEnd,
        cashierShiftId,
      ],
    );
    return { ...result.rows[0], saleId };
  }
  async update(id: string, input: { saleCloseAt?: string; bingoAt?: string }) {
    await this.prepare();
    const current = await this.pool.query(
      `SELECT id,sale_close_at AS "saleCloseAt",bingo_at AS "bingoAt" FROM bingo_games WHERE id=$1`,
      [id],
    );
    if (!current.rowCount)
      throw new BadRequestException('Jugada no encontrada');
    const bingoAt = input.bingoAt
      ? new Date(input.bingoAt)
      : new Date(current.rows[0].bingoAt);
    const saleCloseAt = input.saleCloseAt
      ? new Date(input.saleCloseAt)
      : new Date(current.rows[0].saleCloseAt);
    if (Number.isNaN(bingoAt.getTime()) || Number.isNaN(saleCloseAt.getTime()))
      throw new BadRequestException('Fecha u hora inválida');
    if (Date.now() > bingoAt.getTime() - 30 * 60 * 1000)
      throw new BadRequestException(
        'Solo se puede editar hasta 30 minutos antes del bingo',
      );
    if (saleCloseAt.getTime() > bingoAt.getTime())
      throw new BadRequestException(
        'El cierre de venta no puede ser posterior al bingo',
      );
    const result = await this.pool.query(
      `UPDATE bingo_games SET sale_close_at=$1,bingo_at=$2 WHERE id=$3 RETURNING id,sale_close_at AS "saleCloseAt",bingo_at AS "bingoAt"`,
      [saleCloseAt.toISOString(), bingoAt.toISOString(), id],
    );
    return result.rows[0];
  }
}
