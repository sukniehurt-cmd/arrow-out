import Phaser from 'phaser';
import { W, H, COLORS } from '../config';
import { DIRS, Sim, starsFor, type LevelDef, type SimEvent, type State } from '../core/sim';
import { LEVELS } from '../levels';
import { button, text } from '../ui';
import { drawBird } from '../birdArt';

const STEP_MS = 75; // opóźnienie reakcji łańcuchowej na 1 komórkę dystansu
const FLY_MS = 480;

export interface ResumeData { state: number[]; moves: number; bonus: number }
export interface GameInit { index: number; resume?: ResumeData }

export class GameScene extends Phaser.Scene {
  private index = 0;
  private level!: LevelDef;
  private sim!: Sim;
  private state!: State;
  private moves = 0;
  private bonus = 0; // dodatkowe ruchy z reklamy nagradzanej
  private busy = false;
  private cell = 100;
  private ox = 0;
  private oy = 0;
  private birds: Phaser.GameObjects.Container[] = [];
  private cages = new Map<number, Phaser.GameObjects.Graphics>();
  private movesText!: Phaser.GameObjects.Text;

  constructor() { super('Game'); }

  init(data: GameInit) {
    this.index = data.index ?? 0;
    this.level = LEVELS[this.index];
    this.sim = new Sim(this.level);
    this.state = data.resume ? Uint8Array.from(data.resume.state) : this.sim.initialState();
    this.moves = data.resume?.moves ?? 0;
    this.bonus = data.resume?.bonus ?? 0;
    this.busy = false;
    this.birds = [];
    this.cages.clear();
  }

  private get limit() { return this.level.maxMoves + this.bonus; }

  create() {
    const { cols, rows } = this.level;
    // HUD
    button(this, 80, 90, 100, 80, '‹', () => this.scene.start('LevelSelect'), COLORS.panel, COLORS.text);
    button(this, W - 80, 90, 100, 80, '↻', () => this.scene.restart({ index: this.index }), COLORS.panel, COLORS.text);
    text(this, W / 2, 70, `${this.level.id}. ${this.level.name}`, 40, COLORS.text, true);
    this.movesText = text(this, W / 2, 130, '', 34, COLORS.muted);
    this.refreshHud();
    text(this, W / 2, 195, `★★★ ≤ ${this.level.par ?? '?'}   ★★ ≤ ${(this.level.par ?? 0) + 1}`, 24, COLORS.muted);

    // Plansza (skalowana do dostępnego obszaru)
    const areaW = W - 80, areaH = 820;
    this.cell = Math.min(areaW / cols, areaH / rows, 130);
    this.ox = (W - cols * this.cell) / 2;
    this.oy = 250 + (areaH - rows * this.cell) / 2;

    // Druty (po jednym na wiersz), ptaki siedzą tuż nad drutem
    const g = this.add.graphics();
    for (let y = 0; y < rows; y++) {
      const wy = this.oy + y * this.cell + this.cell * 0.82;
      g.lineStyle(5, COLORS.wire, 1).lineBetween(this.ox - 24, wy, this.ox + cols * this.cell + 24, wy);
      g.fillStyle(COLORS.wire, 1).fillRect(this.ox - 30, wy - 14, 10, 28).fillRect(this.ox + cols * this.cell + 20, wy - 14, 10, 28);
    }

    this.level.birds.forEach((b, i) => {
      const c = this.add.container(this.cellX(b.x), this.cellY(b.y));
      const cage = drawBird(this, c, this.sim.types[i], b.dir, this.cell * 0.32);
      if (cage) {
        if (this.state[i] === 1) cage.destroy(); else this.cages.set(i, cage);
      }
      c.setSize(this.cell * 0.9, this.cell * 0.9);
      if (this.sim.types[i] !== 'owl') c.setInteractive({ useHandCursor: true });
      c.on('pointerdown', () => this.onTap(i));
      if (this.state[i] === 0) c.setVisible(false);
      this.birds.push(c);
      // pojawianie się
      c.setScale(0);
      this.tweens.add({ targets: c, scale: 1, duration: 250, delay: 30 * i, ease: 'Back.out' });
    });
  }

  private cellX(x: number) { return this.ox + (x + 0.5) * this.cell; }
  private cellY(y: number) { return this.oy + y * this.cell + this.cell * 0.5; }

  private refreshHud() {
    this.movesText.setText(`Ruchy: ${this.moves} / ${this.limit}`);
    this.movesText.setColor(this.moves >= this.limit - 1 ? '#ff8a9b' : COLORS.muted);
  }

  private onTap(i: number) {
    if (this.busy || !this.sim.canTap(this.state, i)) return;
    const r = this.sim.tap(this.state, i);
    if (!r.valid) return;
    this.busy = true;
    this.moves++;
    this.refreshHud();
    this.state = r.state;

    let end = 0;
    for (const ev of r.events) end = Math.max(end, this.animate(ev) + (ev.t * STEP_MS));
    if (r.events.length >= 4) this.cameras.main.shake(180, 0.004 + Math.min(r.events.length, 10) * 0.0004);

    this.time.delayedCall(end + 200, () => this.afterMove());
  }

  /** Zwraca czas trwania animacji tego zdarzenia (bez opóźnienia startowego). */
  private animate(ev: SimEvent): number {
    const c = this.birds[ev.bird];
    const b = this.level.birds[ev.bird];
    const [dx, dy] = DIRS[b.dir];
    const delay = ev.t * STEP_MS;
    const cx = c.x, cy = c.y;

    if (ev.kind === 'open') {
      const cage = this.cages.get(ev.bird);
      this.time.delayedCall(delay, () => {
        this.puff(cx, cy, COLORS.cage, 8);
        if (cage) this.tweens.add({ targets: cage, alpha: 0, scale: 1.6, duration: 250, onComplete: () => cage.destroy() });
        this.tweens.add({ targets: c, scale: 1.2, duration: 90, yoyo: true });
      });
      return 350;
    }

    if (ev.kind === 'bounce') {
      this.tweens.add({
        targets: c, x: cx + dx * this.cell * 0.45, y: cy + dy * this.cell * 0.45,
        duration: 110, delay, yoyo: true, ease: 'Quad.out',
        onYoyo: () => { this.puff(cx + dx * this.cell * 0.6, cy + dy * this.cell * 0.6, 0xffffff, 6); this.cameras.main.shake(120, 0.006); },
      });
      return 260;
    }

    // fly: krótkie "!" (przestraszenie), potem odlot z obrotem i smugą piórek
    this.tweens.add({
      targets: c, scale: 1.25, duration: 80, delay, yoyo: true,
      onStart: () => this.puff(cx, cy, COLORS.bird, 7),
      onComplete: () => {
        this.tweens.add({
          targets: c, x: cx + dx * 1500, y: cy + dy * 1500, angle: (dx + dy >= 0 ? 1 : -1) * 25,
          duration: FLY_MS, ease: 'Quad.in',
          onUpdate: () => { if (Math.random() < 0.35) this.puff(c.x, c.y, COLORS.birdDark, 1, 0.5); },
          onComplete: () => c.setVisible(false),
        });
      },
    });
    const ex = this.add.text(cx, cy - this.cell * 0.55, '!', { fontSize: '44px', color: '#ff6b3d', fontStyle: 'bold' }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: ex, alpha: 1, y: ex.y - 14, duration: 120, delay, yoyo: true, hold: 120, onComplete: () => ex.destroy() });
    return 160 + FLY_MS;
  }

  private puff(x: number, y: number, color: number, n: number, scale = 1) {
    for (let k = 0; k < n; k++) {
      const p = this.add.circle(x, y, Phaser.Math.Between(3, 7) * scale, color, 0.9);
      const a = Math.random() * Math.PI * 2, d = Phaser.Math.Between(25, 60) * scale;
      this.tweens.add({ targets: p, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0, scale: 0.2, duration: 380, ease: 'Quad.out', onComplete: () => p.destroy() });
    }
  }

  private afterMove() {
    if (this.sim.isCleared(this.state)) {
      this.finish(true);
    } else if (this.moves >= this.limit) {
      this.finish(false);
    } else {
      this.busy = false;
    }
  }

  private finish(won: boolean) {
    const stars = won ? starsFor(this.level, this.moves) : 0;
    this.time.delayedCall(250, () =>
      this.scene.start('Result', {
        index: this.index, won, moves: this.moves, stars,
        resume: { state: Array.from(this.state), moves: this.moves, bonus: this.bonus } satisfies ResumeData,
      }),
    );
  }
}
