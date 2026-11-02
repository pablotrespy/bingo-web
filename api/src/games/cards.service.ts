import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';

@Injectable()
export class CardsService {
  private readonly pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  private readonly ranges = [
    [1, 9],
    [10, 19],
    [20, 29],
    [30, 39],
    [40, 49],
    [50, 59],
    [60, 69],
    [70, 79],
    [80, 90],
  ];

  async generate(gameId: string) {
    const existing = await this.pool.query(
      'SELECT count(*)::int AS total FROM bingo_cards WHERE game_id=$1',
      [gameId],
    );
    const catalog = await this.pool.query(
      'SELECT count(*)::int AS total FROM bingo_card_catalog',
    );
    if (!catalog.rows[0].total)
      throw new Error('El catálogo de cartones está vacío');
    if (existing.rows[0].total >= catalog.rows[0].total)
      return { created: 0, total: existing.rows[0].total };
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        `INSERT INTO bingo_cards (id,game_id,series_number,card_number,grid)
        SELECT gen_random_uuid(), $1, series_number, card_number, grid
        FROM bingo_card_catalog
        ON CONFLICT (game_id,card_number) DO NOTHING`,
        [gameId],
      );
      await client.query('COMMIT');
      return {
        created: result.rowCount ?? 0,
        total: existing.rows[0].total + (result.rowCount ?? 0),
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private seriesGrids(seed: number) {
    const pattern = [0, 1, 2, 4, 7];
    const rows = Array.from({ length: 18 }, (_, index) =>
      pattern
        .map((offset) => (index + offset + seed) % 9)
        .sort((a, b) => a - b),
    );
    const adjustment = rows.find((row) => row.includes(0) && !row.includes(8));
    if (adjustment) adjustment[adjustment.indexOf(0)] = 8;
    const next = Array(9).fill(0);
    const grids = Array.from({ length: 6 }, (_, card) =>
      Array.from({ length: 3 }, (_, row) => {
        const cells = Array<number | null>(9).fill(null);
        rows[card * 3 + row].forEach((column) => {
          const [min] = this.ranges[column];
          const rangeSize = this.ranges[column][1] - min + 1;
          cells[column] = min + ((seed * 7 + next[column]++) % rangeSize);
        });
        return cells;
      }),
    );
    const all = grids
      .flat(2)
      .filter((value): value is number => value !== null);
    if (all.length !== 90 || new Set(all).size !== 90)
      throw new Error(`Tira inválida: ${seed}`);
    return grids;
  }
}
