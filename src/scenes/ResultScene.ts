import Phaser from 'phaser';
import { W, H, COLORS } from '../config';
import { LEVELS } from '../levels';
import { button, stars, text } from '../ui';
import { save } from '../services/save';
import { ads, maybeShowInterstitial } from '../services/ads';
import type { ResumeData } from './GameScene';

interface ResultData { index: number; won: boolean; moves: number; stars: number; resume: ResumeData }

const REWARDED_BONUS_MOVES = 3;

export class ResultScene extends Phaser.Scene {
  constructor() { super('Result'); }

  create(d: ResultData) {
    const level = LEVELS[d.index];
    const hasNext = d.index + 1 < LEVELS.length;
    this.add.rectangle(W / 2, H / 2, W, H, COLORS.bg);
    const card = this.add.graphics();
    card.fillStyle(COLORS.panel, 1).fillRoundedRect(60, 260, W - 120, 700, 40);

    if (d.won) {
      save.recordResult(level.id, d.stars);
      // MIEJSCE POD INTERSTITIAL: reklama pokazywana co N ukończonych poziomów (patrz services/ads.ts)
      void maybeShowInterstitial();
      text(this, W / 2, 350, 'Czysto!', 80, COLORS.text, true);
      text(this, W / 2, 440, level.name, 32, COLORS.muted);
      const sg = stars(this, W / 2, 560, d.stars, 52, 14);
      sg.setScale(0);
      this.tweens.add({ targets: sg, scale: 1, duration: 500, ease: 'Back.out' });
      text(this, W / 2, 660, `Ruchy: ${d.moves}   (najlepiej: ${level.par})`, 34, COLORS.text);
      if (hasNext) button(this, W / 2, 780, 440, 100, 'Dalej', () => this.scene.start('Game', { index: d.index + 1 }));
    } else {
      text(this, W / 2, 350, 'Uciekły ptaki…', 64, COLORS.text, true);
      text(this, W / 2, 450, 'Skończyły się ruchy, a ptaki zostały', 28, COLORS.muted);
      // MIEJSCE POD REWARDED: dodatkowe ruchy za obejrzenie reklamy (przycisk tylko gdy reklama gotowa)
      if (ads.isRewardedReady()) {
        button(this, W / 2, 570, 520, 100, `+${REWARDED_BONUS_MOVES} ruchy (reklama)`, async () => {
          if (await ads.showRewarded()) {
            this.scene.start('Game', { index: d.index, resume: { ...d.resume, bonus: d.resume.bonus + REWARDED_BONUS_MOVES } });
          }
        }, COLORS.star);
      }
      button(this, W / 2, 700, 440, 100, 'Jeszcze raz', () => this.scene.start('Game', { index: d.index }));
    }
    if (d.won) button(this, W / 2, hasNext ? 890 : 780, 440, 80, 'Jeszcze raz', () => this.scene.start('Game', { index: d.index }), COLORS.panel, COLORS.text);
    button(this, W / 2, 1040, 440, 90, 'Wybór poziomu', () => this.scene.start('LevelSelect'), COLORS.panel, COLORS.text);
  }
}
