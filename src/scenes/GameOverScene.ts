import { Scene, GameObjects } from 'phaser';

export class GameOverScene extends Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: { score: number }) {
    // Add background with reduced opacity
    const background = this.add.image(240, 400, 'background').setOrigin(0.5);
    background.setAlpha(0.5);

    // Create game over text
    const gameOverText = this.add.text(240, 300, 'GAME OVER', {
      fontFamily: 'GamePaused',
      fontSize: '64px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5);

    // Create score text
    const scoreText = this.add.text(240, 400, `Score: ${data.score}`, {
      fontFamily: 'GamePaused',
      fontSize: '32px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Create restart prompt with blinking effect
    const restartText = this.add.text(240, 500, 'Press SPACE to start', {
      fontFamily: 'GamePaused',
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Add blinking effect to the restart text
    this.tweens.add({
      targets: restartText,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      yoyo: true,
      repeat: -1
    });

    // Add space key event listener
    this.input.keyboard!.on('keydown-SPACE', () => {
      this.scene.start('StartScene');
    });
  }
} 