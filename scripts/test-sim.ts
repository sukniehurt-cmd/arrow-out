// Testy reguł gry (npm test). Używa wbudowanego node:test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Sim, GONE, ACTIVE, type BirdDef, type LevelDef } from '../src/core/sim';
import { solve } from '../src/core/solver';

const mk = (birds: BirdDef[], cols = 5, rows = 3): Sim =>
  new Sim({ id: 0, name: 't', cols, rows, maxMoves: 99, birds } as LevelDef);

test('ptak odlatuje i płoszy innego na torze (reakcja łańcuchowa)', () => {
  const sim = mk([
    { x: 0, y: 0, dir: 'right' },
    { x: 2, y: 0, dir: 'down' }, // spłoszony – leci w dół i płoszy ptaka niżej
    { x: 2, y: 2, dir: 'left' },
  ]);
  const r = sim.tap(sim.initialState(), 0);
  assert.deepEqual([...r.state], [GONE, GONE, GONE]);
});

test('sowa blokuje lot: ptak wraca, ruch przepada', () => {
  const sim = mk([{ x: 0, y: 0, dir: 'right' }, { x: 3, y: 0, dir: 'left', type: 'owl' }]);
  const r = sim.tap(sim.initialState(), 0);
  assert.equal(r.state[0], ACTIVE);
  assert.equal(r.events[0].kind, 'bounce');
  assert.equal(sim.canTap(r.state, 1), false); // sowy nie da się tapnąć
  assert.equal(solve(sim.level).solvable, false); // jedyny ptak zawsze odbija się od sowy
});

test('sowa nie jest wymagana do wyczyszczenia planszy', () => {
  const sim = mk([{ x: 0, y: 0, dir: 'left' }, { x: 3, y: 2, dir: 'up', type: 'owl' }]);
  assert.equal(solve(sim.level).par, 1);
});

test('wrona płoszy sąsiadów po odlocie', () => {
  const sim = mk([
    { x: 1, y: 1, dir: 'up', type: 'crow' },
    { x: 2, y: 1, dir: 'down' }, // sąsiad (nie na torze wrony)
    { x: 0, y: 1, dir: 'down' },
  ]);
  assert.deepEqual([...sim.tap(sim.initialState(), 0).state], [GONE, GONE, GONE]);
});

test('ptak w klatce wymaga 2 spłoszeń', () => {
  const sim = mk([{ x: 0, y: 0, dir: 'left', type: 'caged' }]);
  const s1 = sim.tap(sim.initialState(), 0);
  assert.equal(s1.state[0], ACTIVE);
  assert.equal(s1.events[0].kind, 'open');
  assert.equal(sim.tap(s1.state, 0).state[0], GONE);
  assert.equal(solve(sim.level).par, 2);
});
