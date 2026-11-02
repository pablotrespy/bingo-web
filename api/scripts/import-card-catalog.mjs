import fs from 'node:fs';
import readline from 'node:readline';
import { Client } from 'pg';

const file = process.argv[2];
if (!file) throw new Error('Uso: node scripts/import-card-catalog.mjs <CA024000.TXT>');

const cards = new Map();
let current = null;
const input = readline.createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity });
for await (const raw of input) {
  const line = raw.trimEnd();
  if (!line.trim()) continue;
  const [prefix, valuesText] = line.split('-', 2);
  if (!valuesText) throw new Error(`Línea inválida: ${line}`);
  const match = prefix.trim().match(/^(\d+)_([1-6])$/);
  if (!match) throw new Error(`Identificador inválido: ${prefix}`);
  const cardNumber = Number(match[1]);
  const rowIndex = Number(match[2]) - 1;
  const values = Array.from({ length: 9 }, (_, column) => {
    const token = valuesText.slice(column * 4, column * 4 + 4).trim();
    return token ? Number(token) : null;
  });
  const numbers = values.filter((value) => value !== null);
  if (numbers.length !== 5 || numbers.some((value) => !Number.isInteger(value))) throw new Error(`Fila inválida: ${line}`);
  if (!current || current.cardNumber !== cardNumber) {
    if (current) cards.set(current.cardNumber, current);
    current = { cardNumber, seriesNumber: Math.ceil(cardNumber / 6), grid: Array.from({ length: 3 }, () => Array(9).fill(null)) };
  }
  if (rowIndex > 2) throw new Error(`Fila inválida: ${line}`);
  values.forEach((value, column) => { current.grid[rowIndex][column] = value; });
}
if (current) cards.set(current.cardNumber, current);
if (cards.size !== 24000) throw new Error(`Se esperaban 24000 cartones y se encontraron ${cards.size}`);
for (const card of cards.values()) {
  const values = card.grid.flat().filter((value) => value !== null);
  if (values.length !== 15 || new Set(values).size !== 15) throw new Error(`Cartón inválido: ${card.cardNumber}`);
}

const client = new Client({ connectionString: process.env.DATABASE_URL ?? 'postgresql://bingo_app:bingo_dev_password@localhost:5432/bingo_web' });
await client.connect();
try {
  await client.query('BEGIN');
  await client.query('CREATE TABLE IF NOT EXISTS bingo_card_catalog (card_number integer PRIMARY KEY, series_number integer NOT NULL, grid jsonb NOT NULL)');
  await client.query('TRUNCATE bingo_card_catalog');
  for (const card of cards.values()) await client.query('INSERT INTO bingo_card_catalog (card_number,series_number,grid) VALUES ($1,$2,$3)', [card.cardNumber, card.seriesNumber, JSON.stringify(card.grid)]);
  await client.query('COMMIT');
  console.log(`Catálogo importado: ${cards.size} cartones`);
} catch (error) { await client.query('ROLLBACK'); throw error; } finally { await client.end(); }
