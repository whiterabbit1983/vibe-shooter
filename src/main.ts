import 'phaser';
import { MainScene } from './scenes/MainScene';
import { GameOverScene } from './scenes/GameOverScene';
import { PreloaderScene } from './scenes/PreloaderScene';
import { StartScene } from './scenes/StartScene';
import { InstructionsScene } from './scenes/InstructionsScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 480,
  height: 800,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  pixelArt: true,
  roundPixels: true,
  scene: [PreloaderScene, InstructionsScene, StartScene, MainScene, GameOverScene]
};

export default new Phaser.Game(config);
