import { Scene, GameObjects } from 'phaser';
import { MusicManager } from '../managers/MusicManager';

interface GameOverData {
  score: number;
  wavesCompleted: number;
}

export class GameOverScene extends Scene {
  private musicManager: MusicManager;
  private score: number = 0;
  private wavesCompleted: number = 0;

  constructor() {
    super({ key: 'GameOverScene' });
    this.musicManager = MusicManager.getInstance();
  }

  init(data: GameOverData) {
    this.score = data.score;
    this.wavesCompleted = data.wavesCompleted;
  }

  create() {
    // Start background music
    this.musicManager.playMusic(this);

    // Add background with reduced opacity
    const background = this.add.image(240, 400, 'background').setOrigin(0.5);
    background.setAlpha(0.5);

    // Add game over title
    this.add.text(240, 200, 'GAME OVER', {
      fontFamily: 'Thuast',
      fontSize: '64px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5);

    // Add score text
    this.add.text(240, 300, `Score: ${this.score}`, {
      fontFamily: 'GamePaused',
      fontSize: '32px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Add waves completed text
    this.add.text(240, 350, `Waves Completed: ${this.wavesCompleted}`, {
      fontFamily: 'GamePaused',
      fontSize: '32px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Add restart prompt with blinking effect
    const restartText = this.add.text(240, 450, 'Press SPACE to restart', {
      fontFamily: 'GamePaused',
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Setup blinking effect
    this.tweens.add({
      targets: restartText,
      alpha: 0,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });

    // Setup input handlers
    this.input.keyboard!.on('keydown-SPACE', () => {
      // Stop background music before starting new game
      this.musicManager.stopMusic(this);
      this.scene.start('MainScene');
    });
  }
} 