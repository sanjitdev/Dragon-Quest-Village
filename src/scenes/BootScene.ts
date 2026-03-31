// BootScene.ts — Generates placeholder textures and transitions to VillageScene

import { GameConfig } from '../core/GameConfig.js';

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload(): void {
    this.createLoadingBar();
    this.generateTextures();
  }

  create(): void {
    this.scene.start('VillageScene');
  }

  // ── Loading bar ────────────────────────────────────────────────────────────

  private createLoadingBar(): void {
    const { WIDTH, HEIGHT } = GameConfig;
    const barBg  = this.add.rectangle(WIDTH / 2, HEIGHT / 2 + 40, 320, 20, 0x333333);
    const bar    = this.add.rectangle(WIDTH / 2 - 159, HEIGHT / 2 + 40, 0, 18, 0x44bbff);
    bar.setOrigin(0, 0.5);

    this.add.text(WIDTH / 2, HEIGHT / 2, 'Dragon Quest Village', {
      fontSize: '28px', color: '#ffe033',
      fontFamily: 'Georgia, serif',
      stroke: '#000', strokeThickness: 5,
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      bar.width = 318 * value;
    });
  }

  // ── Procedurally generated placeholder art ─────────────────────────────────

  private generateTextures(): void {
    this.makeCharSheet('player',      0x3399ff, 0x2255aa);
    this.makeCharSheet('goblin',      0x44aa44, 0x226622);
    this.makeCharSheet('skeleton',    0xdddddd, 0x999999);
    this.makeCharSheet('bat',         0x882288, 0x440044);
    this.makeCharSheet('slime',       0x44ddaa, 0x228866);
    this.makeCharSheet('boss_dragon', 0xcc2222, 0x881111, 64, 64);

    this.makeTile('tile_ground', 0x88663c, 0x66441c);
    this.makeTile('tile_wall',   0x666688, 0x444466);
    this.makeTile('tile_grass',  0x44aa44, 0x228822);

    this.makeItemSheet();
    this.makeNPCSheets();
    this.makeParticle();
  }

  private makeCharSheet(
    key: string,
    fill: number,
    shadow: number,
    w: number = 32,
    h: number = 32
  ): void {
    if (this.textures.exists(key)) return;
    const frameCount = 10;
    const g = this.make.graphics({ x: 0, y: 0 });
    g.setVisible(false);

    for (let f = 0; f < frameCount; f++) {
      const x = f * w;
      g.fillStyle(shadow, 1);
      g.fillRect(x + 4, 4, w - 8, h - 4);
      g.fillStyle(fill, 1);
      g.fillRect(x + 4, 2, w - 8, h - 6);
      // Head
      g.fillStyle(0xffddaa, 1);
      g.fillCircle(x + w / 2, 10, 8);
      // Eyes
      g.fillStyle(0x000000, 1);
      g.fillCircle(x + w / 2 - 3, 9, 1.5);
      g.fillCircle(x + w / 2 + 3, 9, 1.5);
    }
    g.generateTexture(key, w * frameCount, h);
    g.destroy();

    // Create animation frames
    this.textures.get(key).add('__BASE', 0, 0, 0, w * frameCount, h);
    for (let f = 0; f < frameCount; f++) {
      this.textures.get(key).add(f, 0, f * w, 0, w, h);
    }
  }

  private makeTile(key: string, fill: number, shadow: number): void {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 });
    g.setVisible(false);
    g.fillStyle(fill, 1);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(shadow, 0.5);
    g.fillRect(0, 28, 32, 4);
    g.lineStyle(1, 0x000000, 0.3);
    g.strokeRect(0, 0, 32, 32);
    g.generateTexture(key, 32, 32);
    g.destroy();
  }

  private makeItemSheet(): void {
    if (this.textures.exists('items')) return;
    const cols   = 8;
    const frames = 40;
    const fw     = 24;
    const fh     = 24;
    const cols_  = cols;
    const rows   = Math.ceil(frames / cols_);
    const colors = [
      0xaaaaaa, 0xdddddd, 0xff8800, 0xffdd00, // weapons 0-3
      0x00aaff, 0x0055aa, 0x8800ff, 0x440088, // totems 20-23 placeholder
      0xff2222, 0xff6666, 0xff0000,            // potions 10-12
      0x00ff88, 0x88ff00, 0xffff00, 0x00ffff, // enchants 30-33
    ];

    const g = this.make.graphics({ x: 0, y: 0 });
    g.setVisible(false);
    for (let i = 0; i < frames; i++) {
      const cx = (i % cols_) * fw + fw / 2;
      const cy = Math.floor(i / cols_) * fh + fh / 2;
      const c  = colors[i % colors.length];
      g.fillStyle(c, 1);
      g.fillRoundedRect(cx - 9, cy - 9, 18, 18, 4);
      g.fillStyle(0xffffff, 0.3);
      g.fillCircle(cx - 2, cy - 2, 4);
    }
    g.generateTexture('items', fw * cols_, fh * rows);
    g.destroy();

    const tex = this.textures.get('items');
    for (let i = 0; i < frames; i++) {
      tex.add(i, 0, (i % cols_) * fw, Math.floor(i / cols_) * fh, fw, fh);
    }
  }

  private makeNPCSheets(): void {
    const npcs = [
      { key: 'npc_elder',  fill: 0x886622 },
      { key: 'npc_smith',  fill: 0x665544 },
      { key: 'npc_merchant', fill: 0x448844 },
    ];
    for (const npc of npcs) {
      if (this.textures.exists(npc.key)) continue;
      const g = this.make.graphics({ x: 0, y: 0 });
      g.setVisible(false);
      g.fillStyle(npc.fill, 1);
      g.fillRect(4, 8, 24, 22);
      g.fillStyle(0xffddaa, 1);
      g.fillCircle(16, 10, 9);
      g.fillStyle(0x000000, 1);
      g.fillCircle(13, 9, 1.5);
      g.fillCircle(19, 9, 1.5);
      g.generateTexture(npc.key, 32, 32);
      g.destroy();
    }
  }

  private makeParticle(): void {
    if (this.textures.exists('particle')) return;
    const g = this.make.graphics({ x: 0, y: 0 });
    g.setVisible(false);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture('particle', 8, 8);
    g.destroy();
  }
}
