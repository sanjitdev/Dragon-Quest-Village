// GameOverScene.ts — Death screen with retry / return to village

import { GameConfig, ZoneId } from '../core/GameConfig.js';
import { SaveSystem } from '../systems/SaveSystem.js';

interface GameOverData {
  unlockedZones?: ZoneId[];
  zoneId?: string;
}

export class GameOverScene extends Phaser.Scene {
  private sceneData: GameOverData = {};

  constructor() { super({ key: 'GameOverScene' }); }

  init(data: GameOverData): void {
    this.sceneData = data;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0d0010');
    this.cameras.main.fadeIn(400);

    const cx = GameConfig.WIDTH  / 2;
    const cy = GameConfig.HEIGHT / 2;

    // Animated skull / title
    this.add.text(cx, cy - 100, '☠', {
      fontSize: '64px', color: '#cc2222',
    }).setOrigin(0.5);

    this.add.text(cx, cy - 20, 'YOU HAVE FALLEN', {
      fontSize: '28px', color: '#ff4444',
      fontFamily: 'Georgia, serif',
      stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(cx, cy + 20, 'The Dragon grows stronger...', {
      fontSize: '14px', color: '#888888',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Retry button
    const retryBtn = this.add.text(cx, cy + 80, '[ Return to Village ]', {
      fontSize: '18px', color: '#aaaaff',
      fontFamily: 'monospace', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    retryBtn.on('pointerover', () => retryBtn.setColor('#ffffff'));
    retryBtn.on('pointerout',  () => retryBtn.setColor('#aaaaff'));
    retryBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(400);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('VillageScene', {
          unlockedZones: this.sceneData.unlockedZones ?? ['village'],
        });
      });
    });

    // New game button
    const newBtn = this.add.text(cx, cy + 120, '[ New Game ]', {
      fontSize: '14px', color: '#ff8888',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    newBtn.on('pointerover', () => newBtn.setColor('#ffaaaa'));
    newBtn.on('pointerout',  () => newBtn.setColor('#ff8888'));
    newBtn.on('pointerdown', () => {
      new SaveSystem().deleteSave();
      this.cameras.main.fadeOut(400);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('VillageScene', { unlockedZones: ['village'] });
      });
    });

    // Pulse animation on skull
    this.tweens.add({
      targets: this.children.list[0],
      scaleX: 1.1, scaleY: 1.1,
      yoyo: true, repeat: -1, duration: 800,
    });
  }
}
