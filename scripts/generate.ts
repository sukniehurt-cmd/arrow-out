// Generator poziomów walidowany solverem.
//   npm run generate -- --difficulty 5 --count 3 [--seed 42] [--start-id 11] [--dry]
//   opcjonalnie nadpisz: --cols 5 --rows 4 --birds 9 --min-par 3 --slack 2 --types
// Trudność 1–10 wybiera preset (rozmiar planszy, liczba ptaków, minimalne par).
// --types dodaje ptaki specjalne (sowa, wrony, klatki).
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { solve } from '../src/core/solver';
import { formatLevel } from '../src/core/levelFormat';
import type { BirdDef, BirdType, Dir, LevelDef } from '../src/core/sim';

const arg = (name: string, def?: number) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? Number(process.argv[i + 1]) : def;
};
const flag = (name: string) => process.argv.includes(`--${name}`);

// [cols, rows, birds, minPar]
export const PRESETS: Record<number, [number, number, number, number]> = {
  1: [3, 2, 4, 2],
  2: [4, 2, 5, 3],
  3: [4, 3, 7, 3],
  4: [5, 3, 9, 4],
  5: [5, 4, 11, 5],
  6: [5, 4, 13, 5],
  7: [6, 4, 14, 6],
  8: [6, 5, 17, 7],
  9: [7, 5, 20, 8],
  10: [7, 6, 24, 9],
};

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomBoard(cols: number, rows: number, n: number, r: () => number, types: boolean): BirdDef[] {
  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) cells.push({ x, y });
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  const dirs: Dir[] = ['up', 'down', 'left', 'right'];
  return cells.slice(0, n).map((c) => {
    let type: BirdType = 'bird';
    if (types) {
      const p = r();
      type = p < 0.08 ? 'owl' : p < 0.16 ? 'crow' : p < 0.26 ? 'caged' : 'bird';
    }
    return { ...c, dir: dirs[Math.floor(r() * 4)], ...(type !== 'bird' ? { type } : {}) };
  });
}

const difficulty = arg('difficulty', 5)!;
const preset = PRESETS[difficulty];
if (!preset) throw new Error('--difficulty musi być w zakresie 1–10');
const cols = arg('cols', preset[0])!;
const rows = arg('rows', preset[1])!;
const nBirds = arg('birds', preset[2])!;
const minPar = arg('min-par', preset[3])!;
const slack = arg('slack', 2)!;
const count = arg('count', 1)!;
const seed = arg('seed', Date.now() % 100000)!;
const types = flag('types');
const dir = new URL('../src/levels/', import.meta.url).pathname;

let id = arg('start-id') ?? readdirSync(dir).filter((f) => f.endsWith('.json')).length + 1;
let made = 0;
for (let attempt = 0; made < count && attempt < 200000; attempt++) {
  const birds = randomBoard(cols, rows, nBirds, rng(seed * 100003 + attempt), types);
  const level: LevelDef = { id, name: `Poziom ${id}`, cols, rows, maxMoves: 0, birds };
  const res = solve(level, 400_000);
  if (!res.solvable || res.par! < minPar) continue;
  level.par = res.par!;
  level.maxMoves = res.par! + slack;
  const file = join(dir, `level-${String(id).padStart(2, '0')}.json`);
  if (existsSync(file) && !flag('force')) throw new Error(`${file} już istnieje (--force aby nadpisać)`);
  if (!flag('dry')) writeFileSync(file, formatLevel(level));
  console.log(`✓ poziom ${id}: ${cols}x${rows}, ${nBirds} ptaków, par=${level.par}, max=${level.maxMoves} (próba ${attempt})${flag('dry') ? ' [dry]' : ''}`);
  id++;
  made++;
}
if (made < count) {
  console.error(`Udało się wygenerować tylko ${made}/${count}. Obniż --min-par lub zwiększ --birds.`);
  process.exit(1);
}
