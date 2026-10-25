// Czysta logika gry (bez Phasera) – współdzielona przez grę, solver i generator.

export type Dir = 'up' | 'down' | 'left' | 'right';
export type BirdType = 'bird' | 'owl' | 'crow' | 'caged';

export interface BirdDef {
  x: number; // kolumna
  y: number; // numer drutu (wiersz)
  dir: Dir;
  type?: BirdType; // domyślnie 'bird'
}

export interface LevelDef {
  id: number;
  name: string;
  cols: number;
  rows: number; // liczba drutów
  maxMoves: number; // limit tapnięć
  par?: number; // minimum ruchów wyliczone solverem (3 gwiazdki)
  birds: BirdDef[];
}

export const DIRS: Record<Dir, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

/** Status ptaka w stanie gry. */
export const GONE = 0;
export const ACTIVE = 1;
export const CAGED = 2; // w klatce – pierwsze spłoszenie tylko otwiera klatkę

export type State = Uint8Array;

export type SimEvent =
  | { kind: 'fly'; bird: number; t: number; from: number } // odlot poza planszę
  | { kind: 'bounce'; bird: number; t: number; from: number } // uderzył w sowę i wrócił
  | { kind: 'open'; bird: number; t: number; from: number }; // klatka otwarta

export interface TapResult {
  valid: boolean;
  state: State;
  events: SimEvent[];
}

/** Opóźnienie (w "komórkach") spłoszenia sąsiada przez wronę – używane do animacji. */
const NEIGHBOR_DELAY = 1;

export class Sim {
  readonly n: number;
  readonly types: BirdType[];
  /** rays[i] = ptaki leżące na torze lotu ptaka i (od najbliższego) z odległością w komórkach */
  readonly rays: { j: number; dist: number }[][];
  readonly neighbors: number[][];

  constructor(readonly level: LevelDef) {
    const { cols, rows, birds } = level;
    this.n = birds.length;
    this.types = birds.map((b) => b.type ?? 'bird');
    const cell = new Map<number, number>();
    birds.forEach((b, i) => {
      if (b.x < 0 || b.y < 0 || b.x >= cols || b.y >= rows) throw new Error(`ptak ${i} poza planszą`);
      const k = b.y * cols + b.x;
      if (cell.has(k)) throw new Error(`dwa ptaki w komórce ${b.x},${b.y}`);
      cell.set(k, i);
    });
    this.rays = birds.map((b) => {
      const [dx, dy] = DIRS[b.dir];
      const out: { j: number; dist: number }[] = [];
      let x = b.x + dx, y = b.y + dy, d = 1;
      while (x >= 0 && y >= 0 && x < cols && y < rows) {
        const j = cell.get(y * cols + x);
        if (j !== undefined) out.push({ j, dist: d });
        x += dx; y += dy; d++;
      }
      return out;
    });
    this.neighbors = birds.map((b) => {
      const out: number[] = [];
      for (const [dx, dy] of Object.values(DIRS)) {
        const nx = b.x + dx, ny = b.y + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        const j = cell.get(ny * cols + nx);
        if (j !== undefined) out.push(j);
      }
      return out;
    });
  }

  initialState(): State {
    return Uint8Array.from(this.types, (t) => (t === 'caged' ? CAGED : ACTIVE));
  }

  /** Plansza wyczyszczona = wszystkie ptaki poza sowami odleciały. */
  isCleared(s: State): boolean {
    for (let i = 0; i < this.n; i++) if (this.types[i] !== 'owl' && s[i] !== GONE) return false;
    return true;
  }

  canTap(s: State, i: number): boolean {
    return this.types[i] !== 'owl' && s[i] !== GONE;
  }

  /**
   * Tap na ptaka i. Deterministyczna reakcja łańcuchowa (kolejka FIFO):
   *  - ptak leci w swoim kierunku i płoszy KAŻDEGO ptaka na torze (wszyscy odlatują swoim kierunkiem),
   *  - sowa nie da się spłoszyć i blokuje lot: ptak, który ją trafi, wraca na miejsce
   *    (ptaki trafione wcześniej na torze pozostają spłoszone),
   *  - wrona po odlocie płoszy też 4 sąsiadów,
   *  - ptak w klatce: 1. spłoszenie otwiera klatkę, 2. – normalny odlot,
   *  - w jednym tapnięciu każdy ptak może zostać "uruchomiony" najwyżej raz.
   */
  tap(s: State, i: number): TapResult {
    if (!this.canTap(s, i)) return { valid: false, state: s, events: [] };
    const next = s.slice();
    const events: SimEvent[] = [];
    const activated = new Set<number>();
    const queue: { b: number; t: number; from: number }[] = [];

    const scare = (b: number, t: number, from: number) => {
      if (next[b] === GONE || this.types[b] === 'owl' || activated.has(b)) return;
      if (next[b] === CAGED) {
        next[b] = ACTIVE;
        events.push({ kind: 'open', bird: b, t, from });
        return;
      }
      activated.add(b);
      queue.push({ b, t, from });
    };

    scare(i, 0, -1);
    while (queue.length) {
      const { b, t, from } = queue.shift()!;
      let blocked = false;
      for (const { j, dist } of this.rays[b]) {
        if (this.types[j] === 'owl') { blocked = true; break; }
        scare(j, t + dist, b);
      }
      if (blocked) {
        events.push({ kind: 'bounce', bird: b, t, from });
      } else {
        next[b] = GONE;
        events.push({ kind: 'fly', bird: b, t, from });
        if (this.types[b] === 'crow') for (const j of this.neighbors[b]) scare(j, t + NEIGHBOR_DELAY, b);
      }
    }
    return { valid: true, state: next, events };
  }
}

/** Gwiazdki: 3 = par, 2 = par+1, 1 = w limicie ruchów. 0 = poza limitem. */
export function starsFor(level: LevelDef, moves: number): number {
  const par = level.par ?? level.maxMoves;
  if (moves <= par) return 3;
  if (moves <= par + 1) return 2;
  return moves <= level.maxMoves ? 1 : 0;
}
