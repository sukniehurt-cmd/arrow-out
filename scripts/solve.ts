// Solver: sprawdza rozwiązywalność poziomów i liczy minimalną liczbę ruchów (par).
//   npm run solve                  – raport; kod wyjścia 1, gdy coś jest nie tak (nadaje się do CI)
//   npm run solve -- --write       – zapisuje wyliczone "par" do plików JSON
//   npm run solve -- --solution    – pokazuje optymalną kolejność tapnięć
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { solve } from '../src/core/solver';
import { formatLevel } from '../src/core/levelFormat';
import type { LevelDef } from '../src/core/sim';

const dir = new URL('../src/levels/', import.meta.url).pathname;
const write = process.argv.includes('--write');
const showSolution = process.argv.includes('--solution');
let bad = false;

for (const f of readdirSync(dir).filter((n) => n.endsWith('.json')).sort()) {
  const path = join(dir, f);
  const level = JSON.parse(readFileSync(path, 'utf8')) as LevelDef;
  const r = solve(level);
  const problems: string[] = [];
  if (!r.solvable) {
    problems.push(r.truncated ? 'za duża przestrzeń stanów (przerwano)' : 'NIEROZWIĄZYWALNY');
  } else {
    if (level.par !== r.par) {
      if (write) {
        level.par = r.par!;
        writeFileSync(path, formatLevel(level));
      } else problems.push(`par w pliku=${level.par ?? 'brak'}, solver=${r.par} (użyj --write)`);
    }
    if (level.maxMoves < r.par!) problems.push(`maxMoves (${level.maxMoves}) < par (${r.par})`);
  }
  const ok = problems.length === 0;
  if (!ok) bad = true;
  console.log(`${ok ? '✓' : '✗'} ${f}  ${level.cols}x${level.rows}, ${level.birds.length} ptaków, par=${r.par ?? '-'}, max=${level.maxMoves}, stanów=${r.states}`);
  problems.forEach((p) => console.log(`    ${p}`));
  if (showSolution && r.solution)
    console.log('    tapnij: ' + r.solution.map((i) => `(${level.birds[i].x},${level.birds[i].y} ${level.birds[i].dir})`).join(' → '));
}
process.exit(bad ? 1 : 0);
