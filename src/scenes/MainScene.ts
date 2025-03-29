import { Scene, GameObjects, Input, Physics, Types } from 'phaser';

export class MainScene extends Scene {
  private player!: GameObjects.Sprite & { body: Physics.Arcade.Body };
  private cursors!: Types.Input.Keyboard.CursorKeys;
  private playerLives: number = 3;
  private livesSprites: GameObjects.Sprite[] = [];
  private scoreText!: GameObjects.Text;
  private score: number = 0;
  private lastEnemySpawn: number = 0;
  private enemies!: GameObjects.Group;
  private playerProjectiles!: GameObjects.Group;
  private enemyProjectiles!: GameObjects.Group;
  private readonly ENEMY_SPEED: number = 0.5; // Reduced speed for slower movement
  private readonly PROJECTILE_SPEED: number = 8; // Reduced from 15 to 8 pixels per frame
  private readonly ENEMY_PROJECTILE_SPEED: number = 1.33; // Enemy projectiles move 6 times slower than player projectiles (8/6 ≈ 1.33)
  private readonly PLAYER_SPEED: number = 320; // Doubled from 160 to 320 pixels per frame
  private lastShotTime: number = 0;
  private readonly SHOT_COOLDOWN: number = 200; // 0.2 seconds in milliseconds
  private readonly ENEMY_SHOT_COOLDOWN: number = 2000; // Fixed 2 seconds between shots
  private isSpaceKeyDown: boolean = false;
  private isPlayerInvulnerable: boolean = false;
  private readonly INVULNERABILITY_DURATION: number = 1000; // 1 second of invulnerability after being hit
  private isPaused: boolean = false;
  private pauseText!: GameObjects.Text;
  private readonly ENEMY_SINUSOIDAL_SPEED: number = 0.25; // Same as ENEMY_SPEED
  private readonly ENEMY_SINUSOIDAL_AMPLITUDE: number = 50; // Reduced from 100 to 50 pixels for smaller side-to-side movement
  private readonly ENEMY_SINUSOIDAL_FREQUENCY: number = 0.01; // Reduced from 0.02 to 0.01 for slower horizontal movement
  private stars!: GameObjects.Group;
  private readonly MAX_STARS: number = 50;
  private readonly MIN_STAR_SPEED: number = 0.1; // Reduced from 0.3 to 0.1 for very slow stars
  private readonly MAX_STAR_SPEED: number = 0.7; // Keep max speed the same
  private readonly STAR_SIZE: number = 2; // Size of each star in pixels
  private readonly STAR_CREATION_INTERVAL: number = 1000; // Create new stars every second
  private lastStarCreation: number = 0;
  private readonly ENEMY_SPAWN_DELAY: number = 200; // Increased to 0.2 seconds between ships
  private readonly ENEMY_SPAWN_INTERVAL: number = 3000; // Spawn interval remains 3 seconds
  private readonly ENEMY_SPAWN_PATTERNS: string[] = ['straight', 'sinusoidal', 'diagonal']; // Only three patterns
  private readonly ENEMY_SPACING: number = 40; // Space between ships in formation
  private currentWave: number = 1;
  private waveTimer: number = 0;
  private waveDuration: number = 10000; // 10 seconds for first wave
  private waveTitle!: GameObjects.Text;
  private waveReadyText!: GameObjects.Text;
  private isWaveActive: boolean = false;
  private waveBonusText!: GameObjects.Text;
  private waveBonusPointsText!: GameObjects.Text;
  private firstAidKit: GameObjects.Sprite | null = null;
  private hasSpawnedFirstAid: boolean = false;
  private firstAidGroup!: GameObjects.Group;

  constructor() {
    super({ key: 'MainScene' });
  }

  init() {
    // Reset lives and score when scene is restarted
    this.playerLives = 3;
    this.score = 0;
    this.isPlayerInvulnerable = false;
    this.isPaused = false;
    this.currentWave = 1;
    this.waveDuration = 10000; // Reset to 10 seconds
    this.isWaveActive = false;
    this.hasSpawnedFirstAid = false;
    this.firstAidKit = null;
  }

  create() {
    // Add background with reduced opacity
    const background = this.add.image(240, 400, 'background').setOrigin(0.5);
    background.setAlpha(0.5);

    // Create stars group
    this.stars = this.add.group();

    // Create initial stars
    this.createStar();

    // Create player at bottom center with glow
    this.player = this.add.sprite(240, 750, 'player') as GameObjects.Sprite & { body: Physics.Arcade.Body };
    this.player.setScale(1);
    this.player.setAlpha(0.9); // Slightly transparent to create glow effect
    this.physics.world.enable(this.player);
    this.player.body.setCollideWorldBounds(true);

    // Setup input
    this.cursors = this.input.keyboard!.createCursorKeys();
    
    // Setup space key events
    this.input.keyboard!.on('keydown-SPACE', () => {
      this.isSpaceKeyDown = true;
    });
    this.input.keyboard!.on('keyup-SPACE', () => {
      this.isSpaceKeyDown = false;
    });

    // Create groups with physics
    this.enemies = this.add.group();
    this.playerProjectiles = this.add.group();
    this.enemyProjectiles = this.add.group();
    this.firstAidGroup = this.add.group();

    // Setup collisions
    this.physics.add.overlap(
      this.playerProjectiles,
      this.enemies,
      (projectile, enemy) => this.handleProjectileEnemyCollision(projectile as GameObjects.Sprite, enemy as GameObjects.Sprite),
      undefined,
      this
    );

    this.physics.add.overlap(
      this.enemyProjectiles,
      this.player,
      (projectile, player) => this.handleEnemyProjectilePlayerCollision(projectile as GameObjects.Sprite, player as GameObjects.Sprite),
      undefined,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.enemies,
      (player, enemy) => this.handlePlayerEnemyCollision(player as GameObjects.Sprite, enemy as GameObjects.Sprite),
      undefined,
      this
    );

    // Add collision between player and first aid kit
    this.physics.add.overlap(
      this.player,
      this.firstAidGroup,
      (player, firstAid) => this.handleFirstAidCollection(player as GameObjects.Sprite, firstAid as GameObjects.Sprite),
      undefined,
      this
    );

    // Setup lives hearts with glow
    for (let i = 0; i < this.playerLives; i++) {
      const heart = this.add.sprite(16 + (i * 18), 16, 'heart');
      heart.setScale(2);
      heart.setAlpha(0.8); // Slightly transparent to create glow effect
      this.livesSprites.push(heart);
    }

    // Setup score text with glow
    this.scoreText = this.add.text(460, 16, 'Score: 0', {
      fontFamily: 'GamePaused',
      fontSize: '24px',
      color: '#fff',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(1, 0); // Right-aligned

    // Setup pause text (initially hidden)
    this.pauseText = this.add.text(240, 400, 'PAUSED', {
      fontSize: '64px',
      color: '#fff',
      stroke: '#000',
      strokeThickness: 8
    }).setOrigin(0.5);
    this.pauseText.setVisible(false);

    // Setup pause key
    this.input.keyboard!.on('keydown-P', () => {
      this.togglePause();
    });

    // Setup wave title (initially hidden)
    this.waveTitle = this.add.text(240, 300, 'WAVE 1', {
      fontFamily: 'Thuast',
      fontSize: '64px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5);
    this.waveTitle.setVisible(false);

    // Setup wave ready text (initially hidden)
    this.waveReadyText = this.add.text(240, 400, 'GET READY', {
      fontFamily: 'GamePaused',
      fontSize: '32px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    this.waveReadyText.setVisible(false);

    // Setup wave bonus text (initially hidden)
    this.waveBonusText = this.add.text(240, 350, 'WAVE BONUS', {
      fontFamily: 'Thuast',
      fontSize: '48px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5);
    this.waveBonusText.setVisible(false);

    // Setup wave bonus points text (initially hidden)
    this.waveBonusPointsText = this.add.text(240, 450, '+500', {
      fontFamily: 'Thuast',
      fontSize: '32px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    this.waveBonusPointsText.setVisible(false);

    // Start first wave
    this.startWave();
  }

  private createStar() {
    // Calculate grid-based distribution with more randomness
    const columns = 10; // Divide screen into 10 columns
    const rows = 5; // Divide screen into 5 rows
    const columnWidth = 480 / columns;
    const rowHeight = 800 / rows;
    
    // Create stars in a grid pattern with random variations
    for (let col = 0; col < columns; col++) {
      for (let row = 0; row < rows; row++) {
        // Add random offset to grid positions
        const randomOffsetX = Phaser.Math.Between(-columnWidth/2, columnWidth/2);
        const randomOffsetY = Phaser.Math.Between(-rowHeight/2, rowHeight/2);
        
        const star = this.add.rectangle(
          col * columnWidth + randomOffsetX,
          row * rowHeight + randomOffsetY + Phaser.Math.Between(-50, 0),
          this.STAR_SIZE,
          this.STAR_SIZE,
          0xFFFFFF // White color
        );

        // Assign random speed to each star
        const speed = Phaser.Math.Between(this.MIN_STAR_SPEED, this.MAX_STAR_SPEED);
        star.setData('speed', speed);
        
        // Make faster stars slightly brighter, but overall less bright
        const brightness = (speed - this.MIN_STAR_SPEED) / (this.MAX_STAR_SPEED - this.MIN_STAR_SPEED);
        star.setAlpha(0.2 + (brightness * 0.2)); // Alpha between 0.2 and 0.4 based on speed
        
        this.stars.add(star);
      }
    }
  }

  update() {
    if (this.isPaused) return;

    const currentTime = this.time.now;

    // Create new stars periodically
    if (currentTime - this.lastStarCreation >= this.STAR_CREATION_INTERVAL) {
      this.createStar();
      this.lastStarCreation = currentTime;
    }

    // Update stars
    this.stars.getChildren().forEach((star: GameObjects.GameObject) => {
      if (star instanceof GameObjects.Rectangle) {
        const speed = star.getData('speed');
        star.y += speed;
        
        // If star goes off screen, reposition it at the top with new random properties
        if (star.y > 850) {
          star.y = -50;
          star.x = Phaser.Math.Between(0, 480);
          const newSpeed = Phaser.Math.Between(this.MIN_STAR_SPEED, this.MAX_STAR_SPEED);
          star.setData('speed', newSpeed);
          const brightness = (newSpeed - this.MIN_STAR_SPEED) / (this.MAX_STAR_SPEED - this.MIN_STAR_SPEED);
          star.setAlpha(0.2 + (brightness * 0.2));
        }
      }
    });

    // Check wave completion
    if (this.isWaveActive && currentTime - this.waveTimer >= this.waveDuration) {
      this.endWave();
    }

    // Only spawn enemies if wave is active
    if (this.isWaveActive && currentTime - this.lastEnemySpawn >= this.ENEMY_SPAWN_INTERVAL) {
      this.spawnEnemy();
      this.lastEnemySpawn = currentTime;
    }

    // Update enemies
    this.enemies.getChildren().forEach((enemy: GameObjects.GameObject) => {
      if (enemy instanceof GameObjects.Sprite) {
        const movementPattern = enemy.getData('movementPattern');
        
        if (movementPattern === 'sinusoidal') {
          // Update time for sine wave
          const time = enemy.getData('time') + this.ENEMY_SINUSOIDAL_FREQUENCY;
          enemy.setData('time', time);
          
          // Calculate new position
          const initialX = enemy.getData('initialX');
          const newX = initialX + Math.sin(time) * this.ENEMY_SINUSOIDAL_AMPLITUDE;
          enemy.x = newX;
          enemy.y += this.ENEMY_SINUSOIDAL_SPEED;
        } else if (movementPattern === 'straight') {
          // Straight line movement
          enemy.y += this.ENEMY_SPEED;
        } else {
          // Diagonal movement with bouncing
          const direction = enemy.getData('direction');
          const speed = enemy.getData('speed');
          const bounced = enemy.getData('bounced');
          
          // Move the enemy
          enemy.x += speed * direction;
          enemy.y += speed;
          
          // Check for screen boundaries and bounce
          if (!bounced) {
            if (enemy.x <= 20 || enemy.x >= 460) {
              enemy.setData('direction', -direction); // Reverse direction
              enemy.setData('bounced', true);
            }
          }
        }
        
        // Handle enemy shooting
        const lastShotTime = enemy.getData('lastShotTime');
        if (currentTime - lastShotTime >= this.ENEMY_SHOT_COOLDOWN) {
          this.enemyShoot(enemy);
          enemy.setData('lastShotTime', currentTime);
        }
        
        // Remove enemy if it goes off screen vertically
        if (enemy.y > 850) {
          enemy.destroy();
        }
      }
    });

    // Calculate movement direction
    let moveX = 0;
    let moveY = 0;

    if (this.cursors.left.isDown || this.input.keyboard!.addKey('A').isDown) {
      moveX = -1;
    } else if (this.cursors.right.isDown || this.input.keyboard!.addKey('D').isDown) {
      moveX = 1;
    }

    if (this.cursors.up.isDown || this.input.keyboard!.addKey('W').isDown) {
      moveY = -1;
    } else if (this.cursors.down.isDown || this.input.keyboard!.addKey('S').isDown) {
      moveY = 1;
    }

    // Normalize diagonal movement
    if (moveX !== 0 && moveY !== 0) {
      moveX *= 0.707; // 1/√2
      moveY *= 0.707; // 1/√2
    }

    // Apply movement
    this.player.body.setVelocity(
      moveX * this.PLAYER_SPEED,
      moveY * this.PLAYER_SPEED
    );

    // Shooting with cooldown (only if wave is active)
    if (this.isWaveActive && this.isSpaceKeyDown && currentTime - this.lastShotTime >= this.SHOT_COOLDOWN) {
      this.shoot();
      this.lastShotTime = currentTime;
    }

    // Move and cleanup player projectiles
    this.playerProjectiles.getChildren().forEach((projectile: GameObjects.GameObject) => {
      if (projectile instanceof GameObjects.Sprite) {
        projectile.y -= this.PROJECTILE_SPEED;
        if (projectile.y < -16) { // Account for projectile height
          projectile.destroy();
        }
      }
    });

    // Move and cleanup enemy projectiles
    this.enemyProjectiles.getChildren().forEach((projectile: GameObjects.GameObject) => {
      if (projectile instanceof GameObjects.Sprite) {
        projectile.y += this.ENEMY_PROJECTILE_SPEED; // Use slower speed for enemy projectiles
        if (projectile.y > 816) { // Account for projectile height
          projectile.destroy();
        }
      }
    });
  }

  private shoot() {
    const projectile = this.add.sprite(
      this.player.x,
      this.player.y - 20,
      'projectile'
    );
    projectile.setScale(1.5); // Increased scale
    projectile.setAlpha(0.9); // Less transparent for better visibility
    this.physics.world.enable(projectile);
    this.playerProjectiles.add(projectile);
  }

  private enemyShoot(enemy: GameObjects.Sprite) {
    const projectile = this.add.sprite(
      enemy.x,
      enemy.y + 20,
      'projectile'
    );
    projectile.setScale(1.5); // Same scale as player projectiles
    projectile.setAlpha(0.9); // Less transparent for better visibility
    this.physics.world.enable(projectile);
    this.enemyProjectiles.add(projectile);
  }

  private createExplosion(x: number, y: number) {
    const explosion = this.add.sprite(x, y, 'explosion_1');
    explosion.setScale(1.5);
    explosion.setAlpha(0.9);
    
    // Play the pre-created explosion animation
    explosion.play('explode');
    
    // Set up completion callback
    explosion.once('animationcomplete', () => {
      explosion.destroy();
    });
  }

  private handleProjectileEnemyCollision(projectile: GameObjects.Sprite, enemy: GameObjects.Sprite) {
    projectile.destroy();
    enemy.destroy();
    // Create explosion at enemy position
    this.createExplosion(enemy.x, enemy.y);
    this.score += 50;
    this.scoreText.setText(`Score: ${this.score}`);
  }

  private handleEnemyProjectilePlayerCollision(projectile: GameObjects.Sprite, player: GameObjects.Sprite) {
    projectile.destroy();
    this.handlePlayerHit();
  }

  private handlePlayerEnemyCollision(player: GameObjects.Sprite, enemy: GameObjects.Sprite) {
    // Create explosion at enemy position
    if (!this.isPlayerInvulnerable) {
      this.createExplosion(enemy.x, enemy.y);
      enemy.destroy();
    }

    this.handlePlayerHit();
  }

  private handlePlayerHit() {
    if (this.isPlayerInvulnerable) return;

    this.playerLives--;
    
    // Remove the last heart sprite
    if (this.livesSprites.length > 0) {
      const lastHeart = this.livesSprites.pop();
      if (lastHeart) {
        lastHeart.destroy();
      }
    }

    // Make player invulnerable and start blinking
    this.isPlayerInvulnerable = true;
    this.player.setAlpha(0.5);
    
    // Blink effect
    this.tweens.add({
      targets: this.player,
      alpha: 1,
      duration: 100,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        this.player.setAlpha(1);
        // Add a delay before removing invulnerability
        this.time.delayedCall(this.INVULNERABILITY_DURATION, () => {
          this.isPlayerInvulnerable = false;
        });
      }
    });

    if (this.playerLives <= 0) {
      // Create explosion at player position
      this.createExplosion(this.player.x, this.player.y);
      this.player.destroy();
      
      // Stop all game activity
      this.isPaused = true;
      
      // Stop all game objects
      this.player.setActive(false);
      this.enemies.setActive(false);
      this.playerProjectiles.setActive(false);
      this.enemyProjectiles.setActive(false);
      
      // Pause physics
      this.physics.world.pause();
      
      // Stop all tweens
      this.tweens.killAll();
      
      // Stop all timers
      this.time.removeAllEvents();
      
      // Add fade out effect before transitioning to Game Over scene
      this.cameras.main.fadeOut(1000, 0, 0, 0, (camera: Phaser.Cameras.Scene2D.Camera, progress: number) => {
        if (progress === 1) {
          this.scene.start('GameOverScene', { 
            score: this.score,
            wavesCompleted: this.currentWave - 1 // Pass the number of completed waves
          });
        }
      });
    }
  }

  private togglePause() {
    this.isPaused = !this.isPaused;
    this.pauseText.setVisible(this.isPaused);
    
    // Pause/resume all game objects
    this.player.setActive(!this.isPaused);
    this.enemies.setActive(!this.isPaused);
    this.playerProjectiles.setActive(!this.isPaused);
    this.enemyProjectiles.setActive(!this.isPaused);
    
    // Pause/resume physics
    if (this.isPaused) {
      this.physics.world.pause();
    } else {
      this.physics.world.resume();
    }
  }

  private spawnEnemy() {
    const pattern = Phaser.Math.RND.pick(this.ENEMY_SPAWN_PATTERNS);
    
    if (pattern === 'diagonal') {
      // Determine random direction (left or right)
      const direction = Phaser.Math.RND.pick([-1, 1]);
      
      // Create ships sequentially with delay
      for (let i = 0; i < 5; i++) {
        this.time.delayedCall(i * this.ENEMY_SPAWN_DELAY, () => {
          const enemy = this.add.sprite(
            240, // Start at center
            -50, // All ships start at the same position
            'enemy'
          );
          enemy.setScale(1);
          enemy.setAlpha(0.9);
          
          // Enable physics for the enemy
          this.physics.world.enable(enemy);
          
          // Set the enemy's movement direction and speed
          enemy.setData('direction', direction);
          enemy.setData('speed', this.ENEMY_SPEED);
          enemy.setData('lastShotTime', 0); // Initialize last shot time
          enemy.setData('bounced', false); // Track if ship has bounced
          
          this.enemies.add(enemy);
        });
      }
    } else if (pattern === 'sinusoidal') {
      // Create single enemy with sinusoidal movement
      const x = Phaser.Math.Between(120, 360);
      const enemy = this.add.sprite(
        x,
        -50,
        'enemy'
      );
      enemy.setScale(1);
      enemy.setAlpha(0.9);
      
      // Enable physics for the enemy
      this.physics.world.enable(enemy);
      
      enemy.setData('movementPattern', 'sinusoidal');
      enemy.setData('initialX', x);
      enemy.setData('time', 0);
      enemy.setData('speed', this.ENEMY_SPEED);
      enemy.setData('lastShotTime', 0);
      
      this.enemies.add(enemy);
    } else {
      // Straight pattern
      const x = Phaser.Math.Between(120, 360);
      const enemy = this.add.sprite(
        x,
        -50,
        'enemy'
      );
      enemy.setScale(1);
      enemy.setAlpha(0.9);
      
      // Enable physics for the enemy
      this.physics.world.enable(enemy);
      
      enemy.setData('movementPattern', 'straight');
      enemy.setData('speed', this.ENEMY_SPEED);
      enemy.setData('lastShotTime', 0);
      
      this.enemies.add(enemy);
    }
  }

  private startWave() {
    // Clear all enemies and projectiles
    this.enemies.getChildren().forEach((enemy: GameObjects.GameObject) => {
      if (enemy instanceof GameObjects.Sprite) {
        enemy.destroy();
      }
    });

    this.playerProjectiles.getChildren().forEach((projectile: GameObjects.GameObject) => {
      if (projectile instanceof GameObjects.Sprite) {
        projectile.destroy();
      }
    });

    this.enemyProjectiles.getChildren().forEach((projectile: GameObjects.GameObject) => {
      if (projectile instanceof GameObjects.Sprite) {
        projectile.destroy();
      }
    });

    // Hide player and disable controls
    this.player.setVisible(false);
    this.player.setActive(false);
    
    // Show wave title and ready text
    this.waveTitle.setText(`WAVE ${this.currentWave}`);
    this.waveTitle.setVisible(true);
    this.waveReadyText.setVisible(true);

    // Hide texts after 3 seconds and start the wave
    this.time.delayedCall(3000, () => {
      this.waveTitle.setVisible(false);
      this.waveReadyText.setVisible(false);
      this.isWaveActive = true;
      this.waveTimer = this.time.now;
      
      // Show player and enable controls
      this.player.setVisible(true);
      this.player.setActive(true);

      // Reset first aid spawn flag and spawn first aid kit
      this.hasSpawnedFirstAid = false;
      this.spawnFirstAidKit();
    });
  }

  private endWave() {
    // Clear all enemies and projectiles
    this.enemies.getChildren().forEach((enemy: GameObjects.GameObject) => {
      if (enemy instanceof GameObjects.Sprite) {
        enemy.destroy();
      }
    });

    this.playerProjectiles.getChildren().forEach((projectile: GameObjects.GameObject) => {
      if (projectile instanceof GameObjects.Sprite) {
        projectile.destroy();
      }
    });

    this.enemyProjectiles.getChildren().forEach((projectile: GameObjects.GameObject) => {
      if (projectile instanceof GameObjects.Sprite) {
        projectile.destroy();
      }
    });

    // Show wave bonus text
    this.waveBonusText.setVisible(true);
    this.waveBonusPointsText.setVisible(true);

    // Fade out wave bonus text
    this.tweens.add({
      targets: [this.waveBonusText, this.waveBonusPointsText],
      alpha: 0,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => {
        this.waveBonusText.setVisible(false);
        this.waveBonusPointsText.setVisible(false);
        this.waveBonusText.setAlpha(1);
        this.waveBonusPointsText.setAlpha(1);
      }
    });

    // Award wave completion bonus
    this.score += 500;
    this.scoreText.setText(`Score: ${this.score}`);

    // Prepare next wave
    this.currentWave++;
    this.waveDuration += 5000; // Add 5 seconds to next wave
    this.isWaveActive = false;

    // Start next wave after a short delay
    this.time.delayedCall(2000, () => {
      this.startWave();
    });
  }

  private spawnFirstAidKit() {
    if (this.hasSpawnedFirstAid || this.playerLives >= 3) return;

    // Random time between 2 and 8 seconds into the wave
    const spawnTime = Phaser.Math.Between(2000, 8000);
    
    this.time.delayedCall(spawnTime, () => {
      if (!this.isWaveActive || this.playerLives >= 3) return;

      // Random position on screen
      const x = Phaser.Math.Between(40, 440);
      const y = Phaser.Math.Between(100, 700);

      this.firstAidKit = this.add.sprite(x, y, 'first_aid');
      this.firstAidKit.setScale(1.5);
      this.firstAidKit.setAlpha(0.9);
      this.physics.world.enable(this.firstAidKit);
      
      // Add floating animation
      this.tweens.add({
        targets: this.firstAidKit,
        y: y + 10,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // Add to first aid group for collision
      this.firstAidGroup.add(this.firstAidKit);
      this.hasSpawnedFirstAid = true;

      // Destroy first aid kit after 5 seconds
      this.time.delayedCall(5000, () => {
        if (this.firstAidKit && this.firstAidKit.active) {
          this.firstAidKit.destroy();
          this.firstAidKit = null;
          this.hasSpawnedFirstAid = false;
        }
      });
    });
  }

  private handleFirstAidCollection(player: GameObjects.Sprite, firstAid: GameObjects.Sprite) {
    if (this.playerLives >= 3) return;

    // Add one life
    this.playerLives++;
    
    // Add new heart sprite
    const heart = this.add.sprite(16 + ((this.playerLives - 1) * 18), 16, 'heart');
    heart.setScale(2);
    heart.setAlpha(0.8);
    this.livesSprites.push(heart);

    // Destroy first aid kit and its tweens
    if (this.firstAidKit) {
      this.firstAidKit.destroy();
      this.firstAidKit = null;
    }
    this.hasSpawnedFirstAid = false;
  }
} 