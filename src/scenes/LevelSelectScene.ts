import Phaser from 'phaser';
import { W, COLORS } from '../config';
import { button, stars, text } from '../ui';
import { LEVELS } from '../levels';
import { save } from '../services/save';

const COLS = 3;

export class LevelSelectScene extends Phaser.Scene {
  constructor() { super('LevelSelect'); }

  create() {
    text(this, W / 2, 130, 'Wybierz poziom', 48, COLORS.text, true);
    button(this, 90, 130, 100, 80, '‹', () => this.scene.start('Menu'), COLORS.panel, COLORS.text);

    const cell = 200, top = 350;
    const left = (W - (COLS - 1) * cell) / 2;
    LEVELS.forEach((lvl, i) => {
      const x = left + (i % COLS) * cell;
      const y = top + Math.floor(i / COLS) * 230;
      const unlocked = save.isUnlocked(lvl.id, i);
      const card = this.add.graphics();
      card.fillStyle(unlocked ? COLORS.panel : 0x191d36, 1).fillRoundedRect(x - 85, y - 90, 170, 190, 28);
      text(this, x, y - 25, unlocked ? String(lvl.id) : '🔒', unlocked ? 70 : 54, unlocked ? COLORS.text : COLORS.muted, true);
      if (unlocked) {
        stars(this, x, y + 55, save.starsFor(lvl.id), 18, 4);
        const hit = this.add.rectangle(x, y + 5, 170, 190, 0, 0).setInteractive({ useHandCursor: true });
        hit.on('pointerup', () => this.scene.start('Game', { index: i }));
      }
    });
  }
}
