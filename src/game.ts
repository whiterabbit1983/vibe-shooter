import 'phaser';
import { MainScene } from './scenes/MainScene';
import { GameOverScene } from './scenes/GameOverScene';
import { StartScene } from './scenes/StartScene';
import { PreloaderScene } from './scenes/PreloaderScene';
import { InstructionsScene } from './scenes/InstructionsScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 480,
  height: 800,
  parent: 'game',
  scene: [PreloaderScene, InstructionsScene, StartScene, MainScene, GameOverScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  }
};

new Phaser.Game(config); 