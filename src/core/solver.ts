import { Sim, type LevelDef } from './sim';

export interface SolveResult {
  solvable: boolean;
  /** minimalna liczba ruchów (tapnięć) */
  par: number | null;
  /** indeksy ptaków do tapnięcia w optymalnym rozwiązaniu */
  solution: number[] | null;
  /** true, gdy przerwano po przekroczeniu limitu stanów (wynik nieznany) */
  truncated: boolean;
  states: number;
}

/** BFS po stanach planszy – daje minimalną liczbę ruchów. */
export function solve(level: LevelDef, maxStates = 3_000_000): SolveResult {
  const sim = new Sim(level);
  const start = sim.initialState();
  const key = (s: Uint8Array) => String.fromCharCode(...s);
  if (sim.isCleared(start)) return { solvable: true, par: 0, solution: [], truncated: false, states: 1 };

  type Parent = { prev: string; tap: number } | null;
  const parent = new Map<string, Parent>();
  parent.set(key(start), null);
  let frontier = [start];
  let depth = 0;

  while (frontier.length) {
    depth++;
    const nextFrontier: Uint8Array[] = [];
    for (const s of frontier) {
      const ks = key(s);
      for (let i = 0; i < sim.n; i++) {
        const r = sim.tap(s, i);
        if (!r.valid) continue;
        const k = key(r.state);
        if (parent.has(k)) continue;
        parent.set(k, { prev: ks, tap: i });
        if (sim.isCleared(r.state)) {
          const solution: number[] = [];
          for (let cur: string = k; ; ) {
            const p: Parent = parent.get(cur)!;
            if (!p) break;
            solution.push(p.tap);
            cur = p.prev;
          }
          return { solvable: true, par: depth, solution: solution.reverse(), truncated: false, states: parent.size };
        }
        nextFrontier.push(r.state);
        if (parent.size > maxStates) return { solvable: false, par: null, solution: null, truncated: true, states: parent.size };
      }
    }
    frontier = nextFrontier;
  }
  return { solvable: false, par: null, solution: null, truncated: false, states: parent.size };
}
