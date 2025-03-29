import { Scene, GameObjects, Cameras } from 'phaser';

export class InstructionsScene extends Scene {
  constructor() {
    super({ key: 'InstructionsScene' });
  }

  create() {
    // Add background with reduced opacity
    const background = this.add.image(240, 400, 'background').setOrigin(0.5);
    background.setAlpha(0.5);

    // Create instruction texts
    const moveText = this.add.text(240, 300, 'Use arrows or WASD to move', {
      fontFamily: 'GamePaused',
      fontSize: '32px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    const shootText = this.add.text(240, 350, 'Use SPACE to shoot', {
      fontFamily: 'GamePaused',
      fontSize: '32px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Set initial alpha to 0
    moveText.setAlpha(0);
    shootText.setAlpha(0);

    // Fade in texts
    this.tweens.add({
      targets: [moveText, shootText],
      alpha: 1,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => {
        // After 3 seconds, transition to StartScene
        this.time.delayedCall(3000, () => {
          this.cameras.main.fadeOut(1000, 0, 0, 0, (camera: Cameras.Scene2D.Camera, progress: number) => {
            if (progress === 1) {
              this.scene.start('MainScene');
            }
          });
        });
      }
    });
  }
} 