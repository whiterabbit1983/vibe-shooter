import { Scene, GameObjects } from 'phaser';
import { MusicManager } from '../managers/MusicManager';

export class StartScene extends Scene {
  private musicManager: MusicManager;

  constructor() {
    super({ key: 'StartScene' });
    this.musicManager = MusicManager.getInstance();
  }

  create() {
    // Start background music
    this.musicManager.playMusic(this);

    // Add background
    this.add.image(240, 400, 'splash_bg').setOrigin(0.5);

    // Add title text
    this.add.text(240, 200, 'SPACE SHOOTER', {
      fontFamily: 'Thuast',
      fontSize: '64px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5);

    // Add blinking start prompt with Game Paused font
    const startPrompt = this.add.text(240, 600, 'Press SPACE to start', {
      fontFamily: 'GamePaused',
      fontSize: '32px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Create blinking effect
    this.tweens.add({
      targets: startPrompt,
      alpha: 0,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });

    // Setup input handler
    this.input.keyboard!.on('keydown-SPACE', () => {
      // Stop background music before transitioning
      this.musicManager.stopMusic(this);
      this.scene.start('InstructionsScene');
    });
  }
} 