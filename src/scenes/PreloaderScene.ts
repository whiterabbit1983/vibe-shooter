import { Scene } from 'phaser';

export class PreloaderScene extends Scene {
  constructor() {
    super({ key: 'PreloaderScene' });
  }

  preload() {
    // Create loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(240 - 160, 400 - 25, 320, 50);

    // Loading text
    const loadingText = this.add.text(240, 400 - 50, 'Loading...', {
      font: '20px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Loading progress
    const percentText = this.add.text(240, 400 + 50, '0%', {
      font: '18px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Update loading bar
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(240 - 150, 400 - 15, 300 * value, 30);
      percentText.setText(parseInt((value * 100).toString()) + '%');
    });

    // Load all game assets
    this.load.image('background', 'public/assets/background.jpg');
    this.load.image('splash_bg', 'public/assets/splash_bg.jpg');
    this.load.image('player', 'public/assets/player_ship.png');
    this.load.image('enemy', 'public/assets/enemy_ship.png');
    this.load.image('projectile', 'public/assets/projectile.png');
    this.load.image('heart', 'public/assets/heart.png');
    this.load.image('splash_bg', 'public/assets/splash_bg.jpg');
    this.load.image('first_aid', 'public/assets/first_aid_kit.png');
    
    // Load explosion animation frames
    for (let i = 1; i <= 5; i++) {
      this.load.image(`explosion_${i}`, `public/assets/explosion_${i}.png`);
    }
  }

  create() {
    // Create explosion animation
    const frames = [];
    for (let i = 1; i <= 5; i++) {
      frames.push({ key: `explosion_${i}` });
    }
    
    this.anims.create({
      key: 'explode',
      frames: frames,
      frameRate: 24,
      repeat: 0
    });

    // Start the StartScene
    this.scene.start('StartScene');
  }
} 