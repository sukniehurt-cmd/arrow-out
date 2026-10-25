// Placeholderowa grafika ptaków – same kształty, bez zewnętrznych plików.
import Phaser from 'phaser';
import { COLORS } from './config';
import { DIRS, type BirdType, type Dir } from './core/sim';

/** Rysuje ptaka do kontenera. Zwraca nakładkę klatki (jeśli jest), by móc ją zdjąć. */
export function drawBird(scene: Phaser.Scene, c: Phaser.GameObjects.Container, type: BirdType, dir: Dir, r: number) {
  const g = scene.add.graphics();
  const [dx, dy] = DIRS[dir];
  const body = type === 'owl' ? COLORS.owl : type === 'crow' ? COLORS.crow : COLORS.bird;
  const rad = type === 'owl' ? r * 1.1 : r;

  g.fillStyle(COLORS.birdDark, 0.35).fillEllipse(0, rad * 0.9, rad * 1.6, rad * 0.35); // cień
  g.fillStyle(body, 1).fillCircle(0, 0, rad);
  if (type === 'bird' || type === 'caged') g.fillStyle(COLORS.birdDark, 1).fillCircle(-dx * rad * 0.35, -dy * rad * 0.35 + rad * 0.25, rad * 0.45); // skrzydło
  if (type === 'owl') {
    g.fillTriangle(-rad * 0.8, -rad * 0.6, -rad * 0.4, -rad * 1.15, -rad * 0.05, -rad * 0.8);
    g.fillTriangle(rad * 0.8, -rad * 0.6, rad * 0.4, -rad * 1.15, rad * 0.05, -rad * 0.8);
    g.fillStyle(0xffffff, 1).fillCircle(-rad * 0.4, -rad * 0.1, rad * 0.32).fillCircle(rad * 0.4, -rad * 0.1, rad * 0.32);
    g.fillStyle(0x111111, 1).fillCircle(-rad * 0.4, -rad * 0.1, rad * 0.14).fillCircle(rad * 0.4, -rad * 0.1, rad * 0.14);
  } else {
    // oko z boku względem kierunku patrzenia
    const ex = dx * rad * 0.35 + -dy * rad * 0.3, ey = dy * rad * 0.35 + dx * rad * 0.3 - rad * 0.1;
    g.fillStyle(0xffffff, 1).fillCircle(ex, ey, rad * 0.24);
    g.fillStyle(0x111111, 1).fillCircle(ex + dx * rad * 0.07, ey + dy * rad * 0.07, rad * 0.11);
    // dziób wskazuje kierunek lotu
    const bx = dx * rad, by = dy * rad, px = -dy * rad * 0.28, py = dx * rad * 0.28;
    g.fillStyle(COLORS.beak, 1).fillTriangle(bx - px, by - py, bx + px, by + py, bx + dx * rad * 0.55, by + dy * rad * 0.55);
  }
  c.add(g);

  if (type === 'caged') {
    const cage = scene.add.graphics();
    cage.lineStyle(4, COLORS.cage, 1).strokeCircle(0, 0, r * 1.3);
    for (let i = -2; i <= 2; i++) cage.lineBetween(i * r * 0.5, -r * 1.2, i * r * 0.5, r * 1.2);
    c.add(cage);
    return cage;
  }
  return null;
}
