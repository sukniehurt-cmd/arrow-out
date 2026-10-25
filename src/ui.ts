import Phaser from 'phaser';
import { COLORS, FONT } from './config';

export function text(scene: Phaser.Scene, x: number, y: number, s: string, size = 36, color: string = COLORS.text, bold = false) {
  return scene.add.text(x, y, s, { fontFamily: FONT, fontSize: `${size}px`, color, fontStyle: bold ? 'bold' : 'normal', align: 'center' }).setOrigin(0.5);
}

export function button(scene: Phaser.Scene, x: number, y: number, w: number, h: number, label: string, onClick: () => void, fill: number = COLORS.accent, textColor = '#10142a') {
  const c = scene.add.container(x, y);
  const bg = scene.add.rectangle(0, 0, w, h, fill).setStrokeStyle(0);
  const round = scene.add.graphics();
  round.fillStyle(fill, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 24);
  bg.destroy();
  const t = text(scene, 0, 0, label, Math.min(40, h * 0.5), textColor, true);
  c.add([round, t]);
  c.setSize(w, h).setInteractive({ useHandCursor: true });
  c.on('pointerdown', () => scene.tweens.add({ targets: c, scale: 0.94, duration: 70, yoyo: true }));
  c.on('pointerup', onClick);
  return c;
}

export function drawStar(g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number, on: boolean) {
  g.fillStyle(on ? COLORS.star : COLORS.starOff, 1);
  const pts: Phaser.Math.Vector2[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.45;
    pts.push(new Phaser.Math.Vector2(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad));
  }
  g.fillPoints(pts, true);
}

export function stars(scene: Phaser.Scene, x: number, y: number, count: number, r = 30, gap = 8) {
  const g = scene.add.graphics({ x, y }); // rysowane lokalnie, żeby skalowanie szło od środka
  for (let i = 0; i < 3; i++) drawStar(g, (i - 1) * (2 * r + gap), 0, r, i < count);
  return g;
}
