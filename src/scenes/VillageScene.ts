// VillageScene.ts — Hub scene: talk to NPCs, access world map, manage equipment

import { Player } from '../entities/Player.js';
import { NPC } from '../entities/NPC.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { QuestSystem } from '../systems/QuestSystem.js';
import { SceneManager } from '../core/SceneManager.js';
import { EventBus, Events } from '../core/EventBus.js';
import { GameConfig, ZoneId } from '../core/GameConfig.js';
import { LevelBuilder } from '../world/LevelBuilder.js';

interface CloudObj {
  g: Phaser.GameObjects.Graphics;
  wx: number;
  wy: number;
  speed: number;
  scrollF: number;
}

export class VillageScene extends Phaser.Scene {
  private player!: Player;
  private npcs: NPC[] = [];
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private sceneManager!: SceneManager;
  private saveSystem!: SaveSystem;
  private questSystem!: QuestSystem;
  private unlockedZones: ZoneId[] = ['village'];
  private dialogueBox!: Phaser.GameObjects.Container;
  private dialogueText!: Phaser.GameObjects.Text;
  private activeNPC: NPC | null = null;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private worldMapKey!: Phaser.Input.Keyboard.Key;
  private cloudObjs: CloudObj[] = [];

  constructor() { super({ key: 'VillageScene' }); }

  init(data: { unlockedZones?: ZoneId[] }): void {
    if (data.unlockedZones) this.unlockedZones = data.unlockedZones;
  }

  create(): void {
    this.sceneManager = new SceneManager(this.game);
    this.saveSystem   = new SaveSystem();
    this.questSystem  = new QuestSystem();

    this.setupWorld();
    this.setupClouds();
    this.setupBirdSpawner();
    this.setupPlayer();
    this.setupNPCs();
    this.setupCamera();
    this.setupInput();
    this.setupDialogueBox();

    // Try to restore save
    const save = this.saveSystem.load();
    if (save) {
      this.player.applyStats(save.playerData);
      this.unlockedZones = save.unlockedZones;
    }

    // Start quests for the village
    this.questSystem.startQuest('q_forest_clear');

    this.sceneManager.launchUI(this);

    this.cameras.main.fadeIn(400);
    this.showNotification('Welcome to Eldenmere Village!');
  }

  // ── Clouds ─────────────────────────────────────────────────────────────────

  private setupClouds(): void {
    const defs = [
      { wx:  80, wy: 38, speed: 14, scrollF: 0.12, scale: 1.5 },
      { wx: 380, wy: 22, speed: 22, scrollF: 0.18, scale: 0.9 },
      { wx: 660, wy: 55, speed: 10, scrollF: 0.10, scale: 2.0 },
      { wx: 950, wy: 30, speed: 26, scrollF: 0.20, scale: 0.8 },
      { wx: 1240, wy: 62, speed: 16, scrollF: 0.14, scale: 1.3 },
      { wx: 1520, wy: 26, speed: 11, scrollF: 0.09, scale: 1.7 },
      { wx:  200, wy: 78, speed: 19, scrollF: 0.17, scale: 1.1 },
    ];
    for (const def of defs) {
      const cg = this.add.graphics();
      this.drawCloud(cg, def.scale);
      cg.setPosition(def.wx, def.wy);
      cg.setScrollFactor(def.scrollF);
      cg.setDepth(3);
      this.cloudObjs.push({ g: cg, wx: def.wx, wy: def.wy, speed: def.speed, scrollF: def.scrollF });
    }
  }

  private drawCloud(g: Phaser.GameObjects.Graphics, scale: number): void {
    const s = scale;
    // Drop shadow
    g.fillStyle(0x7788AA, 0.10); g.fillEllipse(35 * s, 22, 80 * s, 18);
    // Base fog layer
    g.fillStyle(0xCCDDEE, 0.28); g.fillEllipse(35 * s, 14, 90 * s, 30);
    // Puffs
    g.fillStyle(0xDDEEFF, 0.48); g.fillEllipse(10 * s, 10, 46 * s, 28 * s);
    g.fillStyle(0xE8F2FF, 0.55); g.fillEllipse(30 * s,  4, 45 * s, 30 * s);
    g.fillStyle(0xEEF5FF, 0.60); g.fillEllipse(52 * s,  2, 40 * s, 28 * s);
    g.fillStyle(0xF4F8FF, 0.55); g.fillEllipse(70 * s,  9, 36 * s, 22 * s);
    // Bright crowns
    g.fillStyle(0xFFFFFF, 0.40); g.fillEllipse(33 * s,  2, 28 * s, 16 * s);
    g.fillStyle(0xFFFFFF, 0.32); g.fillEllipse(55 * s, -1, 22 * s, 12 * s);
  }

  private updateClouds(delta: number): void {
    for (const cloud of this.cloudObjs) {
      cloud.wx -= cloud.speed * delta / 1000;
      if (cloud.wx < -280) cloud.wx = 1900 + Phaser.Math.Between(0, 400);
      cloud.g.setX(cloud.wx);
    }
  }

  // ── Birds ──────────────────────────────────────────────────────────────────

  private setupBirdSpawner(): void {
    // Small initial delay so the scene is fully visible first
    this.time.delayedCall(3000, () => this.scheduleNextBirdWave());
  }

  private scheduleNextBirdWave(): void {
    this.time.delayedCall(Phaser.Math.Between(7000, 18000), () => {
      const count = Phaser.Math.Between(1, 5);
      for (let i = 0; i < count; i++) {
        this.time.delayedCall(i * Phaser.Math.Between(180, 650), () => this.spawnBird());
      }
      this.scheduleNextBirdWave();
    });
  }

  private spawnBird(): void {
    const screenY  = Phaser.Math.Between(18, 108);
    const speed    = Phaser.Math.Between(55, 125);
    const duration = (GameConfig.WIDTH + 80) / speed * 1000;
    const bg = this.add.graphics().setScrollFactor(0).setDepth(6);
    bg.setPosition(GameConfig.WIDTH + 40, screenY);
    let flapFrame = 0;
    this.drawBird(bg, flapFrame);
    const flapTimer = this.time.addEvent({
      delay:    Phaser.Math.Between(140, 240),
      repeat:   -1,
      callback: () => {
        flapFrame ^= 1;
        bg.clear();
        this.drawBird(bg, flapFrame);
      },
    });
    this.tweens.add({
      targets:  bg,
      x:        -40,
      duration,
      ease:     'Linear',
      onComplete: () => { flapTimer.remove(); bg.destroy(); },
    });
  }

  private drawBird(g: Phaser.GameObjects.Graphics, frame: number): void {
    g.fillStyle(0xAABBCC, 0.72);
    if (frame === 0) {
      // Wings up — V shape
      g.fillTriangle(-11, 2,   0, -5,  1, 2);
      g.fillTriangle(  1, 2,   0, -5, 11, 2);
    } else {
      // Wings down — W dip
      g.fillTriangle(-11, -2, -5, 3,  0, 0);
      g.fillTriangle(  0,  0,  5, 3, 11, -2);
      g.fillTriangle( -5,  3,  0, 7,  5,  3);
    }
    // Body
    g.fillStyle(0xBBCCDD, 0.88);
    g.fillRect(-2, 0, 4, 3);
  }

  // ── World setup ────────────────────────────────────────────────────────────

  private setupWorld(): void {
    // Sky gradient background
    this.add.rectangle(0, 0, 1600, 600, 0x87ceeb).setOrigin(0);
    // Distant hills
    this.add.rectangle(0, 350, 1600, 250, 0x228b22).setOrigin(0);

    const builder = new LevelBuilder(this, GameConfig.TILE_SIZE);
    this.platforms = builder.buildGround(1600, 568);

    // Village props (drawn platform art)
    this.drawVillage();
    this.physics.world.setBounds(0, 0, 1600, 600);
  }

  private drawVillage(): void {
    const g = this.add.graphics();

    // ── Sky gradient (layered rectangles)
    g.fillStyle(0x0A0B1E, 1); g.fillRect(0, 0, 1600, 200);
    g.fillStyle(0x0E1635, 1); g.fillRect(0, 100, 1600, 100);
    g.fillStyle(0x1A2A5A, 1); g.fillRect(0, 180, 1600, 80);
    g.fillStyle(0x2A3A6A, 1); g.fillRect(0, 220, 1600, 60);
    g.fillStyle(0x3A4A5A, 1); g.fillRect(0, 260, 1600, 60);
    // Horizon glow
    g.fillStyle(0x6A4A2A, 0.3); g.fillRect(0, 300, 1600, 40);

    // Stars
    g.fillStyle(0xFFFFFF, 1);
    for (const [sx, sy] of [[60,20],[150,40],[280,15],[400,55],[520,30],[700,10],[820,45],[960,25],
                             [1100,50],[1250,18],[1380,42],[1480,28],[220,60],[640,65],[1050,8]]) {
      g.fillRect(sx, sy, 2, 2);
    }
    g.fillStyle(0xFFFFFF, 0.5);
    for (const [sx, sy] of [[90,35],[330,70],[480,12],[750,60],[1000,35],[1300,65]]) {
      g.fillRect(sx, sy, 1, 1);
    }

    // ── Distant mountains
    g.fillStyle(0x1A1A3A, 1);
    g.fillTriangle(0, 350, 200, 260, 400, 350);
    g.fillTriangle(250, 350, 550, 220, 850, 350);
    g.fillTriangle(700, 350, 1000, 200, 1300, 350);
    g.fillTriangle(1100, 350, 1400, 230, 1600, 350);
    // Snow caps
    g.fillStyle(0xDDEEFF, 0.6);
    g.fillTriangle(170, 263, 200, 260, 230, 275);
    g.fillTriangle(510, 225, 550, 220, 590, 235);
    g.fillTriangle(960, 205, 1000, 200, 1040, 215);
    g.fillTriangle(1360, 235, 1400, 230, 1440, 245);

    // ── Ground (multi-layer)
    g.fillStyle(0x1A2E0A, 1); g.fillRect(0, 540, 1600, 60);  // grass
    g.fillStyle(0x254012, 1); g.fillRect(0, 540, 1600, 12);  // bright edge
    g.fillStyle(0x3A5A1A, 1); g.fillRect(0, 538, 1600, 4);   // top strip

    // ── Cobblestone path (center of village)
    g.fillStyle(0x5A5055, 1); g.fillRect(380, 545, 620, 20);
    g.fillStyle(0x4A4048, 1);
    for (let px = 384; px < 995; px += 30) {
      g.fillRect(px, 546, 24, 8);
      g.fillRect(px + 16, 556, 24, 8);
    }
    g.fillStyle(0x6A686A, 0.3);
    for (let px = 386; px < 990; px += 30) { g.fillRect(px, 547, 6, 2); }

    // ── Background trees (behind houses)
    for (const [tx, ty] of [[50,460],[220,440],[620,430],[950,440],[1200,445],[1450,435],[1550,460]]) {
      // Trunk
      g.fillStyle(0x3A2818, 1); g.fillRect(tx + 12, ty + 40, 16, 35);
      g.fillStyle(0x4A3422, 1); g.fillRect(tx + 14, ty + 40, 8, 35);
      // Foliage (3 layers)
      g.fillStyle(0x1A4410, 1); g.fillTriangle(tx - 5, ty + 45, tx + 20, ty, tx + 45, ty + 45);
      g.fillStyle(0x225518, 1); g.fillTriangle(tx, ty + 32, tx + 20, ty + 10, tx + 40, ty + 32);
      g.fillStyle(0x2E6820, 1); g.fillTriangle(tx + 4, ty + 20, tx + 20, ty + 8, tx + 36, ty + 20);
      // Highlight
      g.fillStyle(0x3A8028, 0.4); g.fillTriangle(tx + 14, ty + 12, tx + 20, ty + 8, tx + 26, ty + 18);
    }

    // ── Houses ─────────────────────────────────────────────────────────────
    const houses = [
      { x: 150, w: 90, h: 90, wall: 0xB8845A, roof: 0x8B2222, door: 0x4A2810 },
      { x: 420, w: 110, h: 100, wall: 0xC8A470, roof: 0x6B3A1A, door: 0x3A1C0A },
      { x: 750, w: 130, h: 110, wall: 0xD4B880, roof: 0x7A2828, door: 0x4A2010 }, // large
      { x: 1060, w: 100, h: 90, wall: 0xBBA06A, roof: 0x5A2A18, door: 0x3C1A08 },
      { x: 1300, w: 90, h: 85, wall: 0xCCA868, roof: 0x882222, door: 0x4A2010 },
    ];

    for (const h of houses) {
      const { x, w, wall, roof, door } = h;
      const ground = 540;
      const wallH  = h.h;
      const wallY  = ground - wallH;

      // Wall shadow
      g.fillStyle(0x000000, 0.2); g.fillRect(x + 4, wallY + 4, w, wallH);
      // Main wall
      g.fillStyle(wall, 1); g.fillRect(x, wallY, w, wallH);
      // Wall shading (right & bottom darker)
      g.fillStyle(0x000000, 0.15); g.fillRect(x + w - 10, wallY, 10, wallH);
      g.fillStyle(0xFFFFFF, 0.08); g.fillRect(x, wallY, 10, wallH);
      // Wall texture (horizontal lines)
      g.fillStyle(0x000000, 0.06);
      for (let wy = wallY + 12; wy < ground; wy += 12) { g.fillRect(x, wy, w, 1); }

      // Roof
      const roofW = w + 20;
      g.fillStyle(0x000000, 0.2); g.fillTriangle(x - 8, wallY + 3, x + w / 2 + 2, wallY - h.h * 0.45 + 3, x + roofW - 8, wallY + 3);
      g.fillStyle(roof, 1); g.fillTriangle(x - 10, wallY, x + w / 2, wallY - h.h * 0.45, x + roofW - 10, wallY);
      // Roof highlight
      g.fillStyle(0xFFFFFF, 0.12);
      g.fillTriangle(x - 10, wallY, x + w / 2, wallY - h.h * 0.45, x + Math.floor(w * 0.3), wallY - h.h * 0.1);
      // Roof edge
      g.fillStyle(0x000000, 0.3); g.fillRect(x - 10, wallY - 2, roofW, 3);

      // Door
      const doorX = x + Math.floor(w / 2) - 10;
      g.fillStyle(door, 1); g.fillRect(doorX, ground - 30, 20, 30);
      // Door arch top
      g.fillStyle(door, 1); g.fillEllipse(doorX + 10, ground - 30, 20, 12);
      // Door shine
      g.fillStyle(0xFFFFFF, 0.1); g.fillRect(doorX + 2, ground - 28, 5, 14);
      // Door knob
      g.fillStyle(0xCC9920, 1); g.fillCircle(doorX + 16, ground - 17, 2);

      // Windows
      const winY = wallY + 12;
      for (const winX of [x + 8, x + w - 26]) {
        g.fillStyle(0x223344, 1); g.fillRect(winX, winY, 18, 16);
        g.fillStyle(0x88AACC, 0.6); g.fillRect(winX + 1, winY + 1, 16, 14);
        // Window panes
        g.fillStyle(0x000000, 0.25); g.fillRect(winX + 8, winY, 2, 16); g.fillRect(winX, winY + 7, 18, 2);
        // Window frame
        g.fillStyle(0xDDBB88, 1); g.fillRect(winX - 2, winY - 2, 22, 2); g.fillRect(winX - 2, winY + 16, 22, 2);
        g.fillRect(winX - 2, winY, 2, 16); g.fillRect(winX + 18, winY, 2, 16);
        // Warm light inside
        g.fillStyle(0xFFCC44, 0.12); g.fillRect(winX + 1, winY + 1, 16, 14);
      }

      // Flower box (under left window)
      g.fillStyle(0x8B4513, 1); g.fillRect(x + 6, ground - wallH + 30, 20, 5);
      g.fillStyle(0xFF4466, 1); g.fillCircle(x + 9,  ground - wallH + 28, 3);
      g.fillStyle(0xFF8800, 1); g.fillCircle(x + 14, ground - wallH + 26, 3);
      g.fillStyle(0xFF4466, 1); g.fillCircle(x + 19, ground - wallH + 28, 3);
      g.fillStyle(0x22AA44, 1); g.fillRect(x + 10, ground - wallH + 28, 2, 5);
    }

    // ── Fence posts
    g.fillStyle(0xAA8855, 1);
    for (let fx = 120; fx < 420; fx += 28) { g.fillRect(fx, 530, 6, 20); g.fillRect(fx - 2, 528, 10, 4); }
    for (let fx = 950; fx < 1350; fx += 28) { g.fillRect(fx, 530, 6, 20); g.fillRect(fx - 2, 528, 10, 4); }
    // Fence rail
    g.fillStyle(0x997744, 1);
    g.fillRect(120, 532, 296, 3); g.fillRect(120, 542, 296, 2);
    g.fillRect(950, 532, 396, 3); g.fillRect(950, 542, 396, 2);

    // ── Well (center)
    g.fillStyle(0x888888, 1); g.fillEllipse(650, 545, 50, 20);
    g.fillStyle(0x666666, 1); g.fillRect(626, 530, 48, 17);
    g.fillStyle(0x888888, 1); g.fillEllipse(650, 530, 50, 18);
    g.fillStyle(0x444444, 1); g.fillEllipse(650, 530, 36, 12);
    g.fillStyle(0x1A2A3A, 1); g.fillEllipse(650, 530, 28, 8);
    // Well roof
    g.fillStyle(0x553322, 1); g.fillRect(630, 510, 6, 22); g.fillRect(666, 510, 6, 22);
    g.fillStyle(0x7A3322, 1); g.fillTriangle(620, 514, 650, 500, 680, 514);
    // Bucket
    g.fillStyle(0x8B4513, 1); g.fillRect(646, 518, 8, 10);
    g.fillStyle(0xCC8844, 1); g.fillRect(647, 519, 6, 8);

    // ── Sign post
    g.fillStyle(0x6B4422, 1); g.fillRect(490, 520, 6, 28);
    g.fillStyle(0xAA7744, 1); g.fillRect(464, 512, 56, 16);
    g.fillStyle(0x000000, 0.7); g.fillRect(465, 513, 54, 14);
    // Sign text hint (dots representing letters)
    g.fillStyle(0xDDBB66, 1);
    for (let sx = 470; sx < 515; sx += 5) { g.fillRect(sx, 517, 3, 2); }

    // ── Barrels
    for (const bx of [340, 360, 1020, 1040]) {
      g.fillStyle(0x8B5A2A, 1); g.fillRect(bx, 524, 16, 18);
      g.fillStyle(0xAA7744, 1); g.fillRect(bx + 1, 525, 14, 16);
      g.fillStyle(0x8B5A2A, 1); g.fillRect(bx, 527, 16, 2); g.fillRect(bx, 534, 16, 2);
      g.fillStyle(0xCC9966, 0.25); g.fillRect(bx + 2, 526, 4, 6);
    }
  }

  // ── Player ─────────────────────────────────────────────────────────────────

  private setupPlayer(): void {
    this.player = new Player(this, 120, 520);
    this.physics.add.collider(this.player.sprite, this.platforms);
  }

  // ── NPCs ───────────────────────────────────────────────────────────────────

  private setupNPCs(): void {
    const elder = new NPC(this, 300, 535, 'npc_elder', 'Elder Theron', [
      { speaker: 'Elder Theron', text: 'Hero! Dark forces stir beyond our walls.'},
      { speaker: 'Elder Theron', text: 'Head to the Whisperwood Forest first. Goblins run rampant!'},
      { speaker: 'Elder Theron', text: 'Press [M] to open the World Map. Good luck.'},
    ]);
    const smith = new NPC(this, 580, 535, 'npc_smith', 'Bram the Smith', [
      { speaker: 'Bram', text: 'I can forge great weapons if you bring me materials.'},
      { speaker: 'Bram', text: 'For now, check your inventory [I] for what you carry.'},
    ]);
    const merchant = new NPC(this, 900, 535, 'npc_merchant', 'Mira Merchant', [
      { speaker: 'Mira', text: 'Welcome! I deal in potions and enchantments.'},
      { speaker: 'Mira', text: 'The Dragon grows bolder each day. Stock up!'},
    ]);
    this.npcs = [elder, smith, merchant];
  }

  // ── Camera ─────────────────────────────────────────────────────────────────

  private setupCamera(): void {
    this.cameras.main.setBounds(0, 0, 1600, 600);
    this.cameras.main.startFollow(this.player.sprite, true, GameConfig.CAMERA_LERP, GameConfig.CAMERA_LERP);
  }

  // ── Input ──────────────────────────────────────────────────────────────────

  private setupInput(): void {
    if (!this.input.keyboard) return;
    this.interactKey  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.worldMapKey  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
  }

  // ── Dialogue UI ────────────────────────────────────────────────────────────

  private setupDialogueBox(): void {
    const bg = this.add.rectangle(0, 0, 640, 96, 0x08051A, 0.92)
      .setStrokeStyle(2, 0x8B6800);
    const topBar = this.add.rectangle(-320, -44, 640, 16, 0x0F0B25, 1).setOrigin(0);
    const divider = this.add.rectangle(-320, -28, 640, 1, 0x8B6800, 0.6).setOrigin(0);
    this.dialogueText = this.add.text(-310, -24, '', {
      fontSize: '8px', color: '#F0DFA8',
      fontFamily: '"Press Start 2P", monospace',
      wordWrap: { width: 600 },
      lineSpacing: 6,
    });
    this.dialogueBox = this.add.container(400, 558, [bg, topBar, divider, this.dialogueText])
      .setDepth(50)
      .setScrollFactor(0)
      .setVisible(false);
  }

  private showDialogue(line: { speaker: string; text: string } | null): void {
    if (!line) {
      this.dialogueBox.setVisible(false);
      this.activeNPC = null;
      return;
    }
    this.dialogueText.setText(`[${line.speaker}]: ${line.text}`);
    this.dialogueBox.setVisible(true);
  }

  private showNotification(msg: string): void {
    const t = this.add.text(GameConfig.WIDTH / 2, 78, msg, {
      fontSize: '7px', color: '#FFEE88',
      fontFamily: '"Press Start 2P", monospace',
      stroke: '#1A0800', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(60);
    this.tweens.add({
      targets: t, y: 62, alpha: 0, delay: 2000, duration: 700,
      ease: 'Quad.easeIn',
      onComplete: () => t.destroy(),
    });
  }

  // ── World map overlay ──────────────────────────────────────────────────────

  private showWorldMap(): void {
    this.scene.launch('WorldMapScene', {
      unlockedZones: this.unlockedZones,
      playerLevel:   this.player.level,
      questSystem:   this.questSystem,
      player:        this.player,
      saveSystem:    this.saveSystem,
    });
    this.scene.pause();
  }

  // ── Update ─────────────────────────────────────────────────────────────────

  update(time: number, delta: number): void {
    this.player.update(time, delta);
    this.updateClouds(delta);

    // Interact with NPCs
    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      const nearNPC = this.npcs.find(
        n => Math.abs(n.x - this.player.x) < 60 && Math.abs(n.y - this.player.y) < 80
      );
      if (nearNPC) {
        this.activeNPC = nearNPC;
        const line = nearNPC.nextDialogue();
        this.showDialogue(line);
      } else if (this.activeNPC) {
        const line = this.activeNPC.nextDialogue();
        this.showDialogue(line);
      }
    }

    // World map
    if (Phaser.Input.Keyboard.JustDown(this.worldMapKey)) {
      this.showWorldMap();
    }
  }

  // ── Accessors used by WorldMapScene ───────────────────────────────────────

  getPlayer(): Player         { return this.player; }
  getSaveSystem(): SaveSystem { return this.saveSystem; }
  getQuestSystem(): QuestSystem { return this.questSystem; }
  getUnlockedZones(): ZoneId[] { return this.unlockedZones; }

  unlockZone(id: ZoneId): void {
    if (!this.unlockedZones.includes(id)) {
      this.unlockedZones.push(id);
      this.saveSystem.save(this.player, this.unlockedZones);
    }
  }
}
