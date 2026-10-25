import Phaser from 'phaser';
import { W, H, COLORS } from '../config';
import { button, text } from '../ui';
import { drawBird } from '../birdArt';
import { save } from '../services/save';
import { iap } from '../services/iap';
import { LEVELS } from '../levels';

export class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    const g = this.add.graphics();
    g.lineStyle(6, COLORS.wire, 1).lineBetween(0, 420, W, 420);
    // ptaki na drucie, jeden odlatuje co chwilę
    const dirs = ['left', 'up', 'right', 'down'] as const;
    for (let i = 0; i < 4; i++) {
      const b = this.add.container(130 + i * 150, 395);
      drawBird(this, b, 'bird', dirs[i], 40);
      this.tweens.add({ targets: b, y: 385, duration: 700 + i * 120, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    text(this, W / 2, 250, 'Shoo!', 130, COLORS.text, true);
    text(this, W / 2, 540, 'Spłosz wszystkie ptaki z drutów', 30, COLORS.muted);

    button(this, W / 2, 720, 440, 120, 'GRAJ', () => this.scene.start('LevelSelect'));
    text(this, W / 2, 860, `★ ${save.totalStars()} / ${LEVELS.length * 3}`, 36, COLORS.text);

    // MIEJSCE POD IAP: przycisk "Usuń reklamy" pojawi się, gdy iap.isAvailable() zwróci true
    if (iap.isAvailable() && !save.adsRemoved) {
      button(this, W / 2, 1000, 440, 90, 'Usuń reklamy', () => void iap.buyRemoveAds(), COLORS.panel, COLORS.text);
    }
    // MIEJSCE POD BANER: dolny pas H-100..H zarezerwowany na ewentualny banner AdMob
    text(this, W / 2, H - 40, 'v0.1', 22, COLORS.muted);
  }
}
