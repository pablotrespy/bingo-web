export type BingoGrid = (number | null)[][];

/** Builds a deterministic 3x9 bingo card layout for the card-generation phase. */
export function buildBingoGrid(seed: number): BingoGrid {
  const grid: BingoGrid = Array.from({ length: 3 }, () => Array(9).fill(null));
  let cursor = 0;
  for (let row = 0; row < 3; row++) {
    for (let slot = 0; slot < 5; slot++) {
      let column = (seed + row * 3 + slot) % 9;
      while (grid[row][column] !== null) column = (column + 1) % 9;
      const min = column === 0 ? 1 : column === 1 ? 20 : column * 10;
      const max = column === 0 ? 19 : column === 8 ? 90 : min + 9;
      grid[row][column] = min + ((seed * 7 + cursor * 3) % (max - min + 1));
      cursor++;
    }
  }
  return grid;
}
