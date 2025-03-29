import { Scene } from 'phaser';

export class MusicManager {
  private static instance: MusicManager;
  private music: Phaser.Sound.BaseSound | null = null;
  private currentScene: Scene | null = null;
  private currentTrack: 'bg1' | 'bg2' = 'bg1';

  private constructor() {}

  static getInstance(): MusicManager {
    if (!MusicManager.instance) {
      MusicManager.instance = new MusicManager();
    }
    return MusicManager.instance;
  }

  playMusic(scene: Scene) {
    this.currentScene = scene;

    // If music is already playing, don't start it again
    if (this.music && this.music.isPlaying) {
      return;
    }

    // Create and play the music
    this.music = scene.sound.add(this.currentTrack, {
      loop: false, // Don't loop individual tracks
      volume: 0.5
    });

    // Set up completion handler to switch tracks
    this.music.once('complete', () => {
      // Switch to the other track
      this.currentTrack = this.currentTrack === 'bg1' ? 'bg2' : 'bg1';
      
      // Create and play the next track
      this.music = scene.sound.add(this.currentTrack, {
        loop: false,
        volume: 0.5
      });

      // Fade in the next track
      this.music.play();
      scene.tweens.add({
        targets: this.music,
        volume: 0.5,
        duration: 1000,
        ease: 'Power2'
      });

      // Set up completion handler for the next track
      this.music.once('complete', () => {
        // Switch back to the first track
        this.currentTrack = 'bg1';
        
        // Create and play the first track again
        this.music = scene.sound.add(this.currentTrack, {
          loop: false,
          volume: 0.5
        });

        // Fade in the first track
        this.music.play();
        scene.tweens.add({
          targets: this.music,
          volume: 0.5,
          duration: 1000,
          ease: 'Power2'
        });

        // Set up completion handler again
        this.music.once('complete', () => {
          // Switch to the second track again
          this.currentTrack = 'bg2';
          
          // Create and play the second track
          this.music = scene.sound.add(this.currentTrack, {
            loop: false,
            volume: 0.5
          });

          // Fade in the second track
          this.music.play();
          scene.tweens.add({
            targets: this.music,
            volume: 0.5,
            duration: 1000,
            ease: 'Power2'
          });
        });
      });
    });

    // Fade in the initial track
    this.music.play();
    scene.tweens.add({
      targets: this.music,
      volume: 0.5,
      duration: 1000,
      ease: 'Power2'
    });
  }

  stopMusic(scene: Scene) {
    if (this.music) {
      // Fade out the music
      scene.tweens.add({
        targets: this.music,
        volume: 0,
        duration: 1000,
        ease: 'Power2',
        onComplete: () => {
          this.music?.stop();
          this.music = null;
          // Reset to first track for next play
          this.currentTrack = 'bg1';
        }
      });
    }
  }

  pauseMusic() {
    if (this.music) {
      this.music.pause();
    }
  }

  resumeMusic() {
    if (this.music) {
      this.music.resume();
    }
  }
} 