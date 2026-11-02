"use client";

const ranges = [[1, 9], [10, 19], [20, 29], [30, 39], [40, 49], [50, 59], [60, 69], [70, 79], [80, 90]];
const patterns = [[0, 1, 2, 4, 7], [0, 2, 3, 5, 8]];
function buildSeries(seed: number) {
  const rows = Array.from({ length: 18 }, (_, index) => {
    const pattern = patterns[seed % patterns.length];
    const columns = pattern.map(offset => (index + offset + seed) % 9);
    return columns.sort((a, b) => a - b);
  });
  const adjustment = rows.find(row => row.includes(0) && !row.includes(8));
  if (adjustment) adjustment[adjustment.indexOf(0)] = 8;
  for (let card = 0; card < 6; card++) {
    const cardRows = rows.slice(card * 3, card * 3 + 3);
    const present = new Set(cardRows.flat());
    for (let missing = 0; missing < 9; missing++) {
      if (present.has(missing)) continue;
      const counts = Array(9).fill(0);
      cardRows.flat().forEach(column => counts[column]++);
      const sourceColumn = counts.findIndex((count, column) => count > 1 && column !== missing);
      const sourceRow = cardRows.find(row => row.includes(sourceColumn));
      if (!sourceRow) continue;
      const sourceIndex = sourceRow.indexOf(sourceColumn);
      sourceRow[sourceIndex] = missing;
      present.add(missing);
    }
  }
  const nextByColumn = Array(9).fill(0);
  const columnValues = ranges.map(([min, max], column) => {
    const values = Array.from({ length: max - min + 1 }, (_, index) => min + index);
    for (let index = values.length - 1; index > 0; index--) {
      const swap = (seed * 13 + column * 17 + index * 7) % (index + 1);
      [values[index], values[swap]] = [values[swap], values[index]];
    }
    return values;
  });
  return Array.from({ length: 6 }, (_, cardIndex) => Array.from({ length: 3 }, (_, row) => {
    const cells = Array<number | null>(9).fill(null);
    rows[cardIndex * 3 + row].forEach(column => { cells[column] = columnValues[column][nextByColumn[column]++]; });
    return cells;
  }));
}
const series = [{ number: 1, firstCard: 1, cards: buildSeries(0) }, { number: 2, firstCard: 7, cards: buildSeries(1) }];

export default function CartonesPruebaPage() {
  return <main className="min-h-screen bg-slate-950 p-6 text-white"><div className="mx-auto max-w-2xl"><p className="text-xs uppercase tracking-[0.25em] text-cyan-400">BINGO-WEB</p><h1 className="mt-2 text-3xl font-black">Vista de prueba de cartones</h1><p className="mt-2 text-slate-400">Dos tiras de prueba · 6 cartones por tira.</p><div className="mt-8 space-y-8">{series.map(item=><div key={item.number}><h2 className="mb-4 text-xl font-bold text-cyan-300">Tira {item.number}</h2><div className="space-y-5">{item.cards.map((card, index)=><section key={index} className="rounded-xl border border-slate-700 bg-white p-4 text-slate-950"><div className="mb-3 grid grid-cols-3 items-center text-sm font-bold"><span className="text-left">Cartón {item.firstCard + index}</span><span className="text-center">Tira {item.number}</span><span /></div><div className="grid grid-cols-9 gap-px border border-slate-900 bg-slate-900">{card.flat().map((number, cellIndex)=><div key={cellIndex} className="flex h-10 items-center justify-center border border-slate-300 bg-white text-center text-lg font-black">{number ?? "🌐"}</div>)}</div></section>)}</div></div>)}</div></div></main>;
}
