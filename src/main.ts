import Phaser from 'phaser';
import { W, H, COLORS } from './config';
import { MenuScene } from './scenes/MenuScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { GameScene } from './scenes/GameScene';
import { ResultScene } from './scenes/ResultScene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W,
  height: H, // pionowo 9:16; FIT dopasowuje do dowolnego ekranu z pasami po bokach
  backgroundColor: COLORS.bg,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: { activePointers: 1 },
  scene: [MenuScene, LevelSelectScene, GameScene, ResultScene],
});
