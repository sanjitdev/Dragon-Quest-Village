// BossScene.ts — Cinematic dragon boss fight

import { Player } from '../entities/Player.js';
import { BossDragon } from '../entities/BossDragon.js';
import { Goblin } from '../entities/Enemy.js';
import { Enemy } from '../entities/Enemy.js';
import { CombatSystem } from '../combat/CombatSystem.js';
import { LootSystem } from '../systems/LootSystem.js';
import { SceneManager } from '../core/SceneManager.js';
import { EventBus, Events } from '../core/EventBus.js';
import { GameConfig, ZoneId } from '../core/GameConfig.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { QuestSystem } from '../systems/QuestSystem.js';
import { LevelBuilder } from '../world/LevelBuilder.js';

export interface BossSceneData {
  player:        Player;
  saveSystem:    SaveSystem;
  questSystem:   QuestSystem;
  unlockedZones: ZoneId[];
}

export class BossScene extends Phaser.Scene {
  private sceneData!: BossSceneData;
  private player!: Player;
  private boss!: BossDragon;
  private minions: Enemy[] = [];
  private combatSystem!: CombatSystem;
  private lootSystem!: LootSystem;
  private sceneManager!: SceneManager;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private bossHealthBar!: Phaser.GameObjects.Rectangle;
  private bossHealthBg!:  Phaser.GameObjects.Rectangle;
  private bossNameText!: Phaser.GameObjects.Text;
  private phaseText!: Phaser.GameObjects.Text;
  private battleStarted: boolean = false;

  constructor() { super({ key: 'BossScene' }); }

  init(data: BossSceneData): void {
    this.sceneData = data;
  }

  create(): void {
    this.sceneManager = new SceneManager(this.game);
    this.lootSystem   = new LootSystem();
    this.player       = new Player(this, 120, 520);
    this.combatSystem = new CombatSystem(this, this.lootSystem);

    this.setupBackground();
    this.setupArena();
    this.setupBoss();
    this.setupBossUI();
    this.setupCamera();
    this.connectEvents();

    this.sceneManager.launchUI(this);
    this.cameras.main.fadeIn(600);

    // Cinematic intro
    this.time.delayedCall(800, () => {
      this.boss.playIntro(() => {
        this.battleStarted = true;
        this.boss.setTarget(this.player);
        this.cameras.main.zoomTo(GameConfig.BOSS_CAMERA_ZOOM, 1200, 'Quad.easeOut');
        this.showBanner('SKARATHOS THE DRAGON', '#ff4400');
      });
    });
  }

  // ── Setup ──────────────────────────────────────────────────────────────────

  private setupBackground(): void {
    // Lava-lit cavern
    this.add.rectangle(0, 0, 1600, 600, 0x1a0500).setOrigin(0);
    // Pulsing lava glow at bottom
    const lava = this.add.rectangle(0, 560, 1600, 40, 0xff4400).setOrigin(0).setAlpha(0.7);
    this.tweens.add({
      targets: lava, alpha: 0.3, yoyo: true, repeat: -1, duration: 600,
    });
    // Pillars
    for (let px = 150; px < 1600; px += 300) {
      this.add.rectangle(px, 350, 30, 240, 0x333333);
    }
    this.add.text(800, 30, "DRAGON'S LAIR", {
      fontSize: '16px', color: '#ff6622',
      fontFamily: 'Georgia, serif',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0);
  }

  private setupArena(): void {
    const builder = new LevelBuilder(this, GameConfig.TILE_SIZE);
    this.platforms = builder.buildGround(1600, 568);
    // Mid platforms
    const midG = this.physics.add.staticGroup();
    for (const [x, w] of [[200, 4], [700, 5], [1200, 4]] as [number, number][]) {
      for (let i = 0; i < w; i++) {
        const t = midG.create(x + i * 32, 440, 'tile_ground') as Phaser.Physics.Arcade.Sprite;
        t.refreshBody();
      }
    }
    this.physics.add.collider(this.player.sprite, this.platforms);
    this.physics.add.collider(this.player.sprite, midG);
    this.physics.world.setBounds(0, 0, 1600, 600);
  }

  private setupBoss(): void {
    this.boss = new BossDragon(this, 1200, 480);

    this.boss.onSpawnMinion = (x: number, y: number) => {
      const minion = new Goblin(this, x, y);
      minion.setTarget(this.player);
      this.minions.push(minion);
      this.physics.add.collider(minion.sprite, this.platforms);
      this.physics.add.overlap(
        this.player.sprite,
        minion.sprite,
        () => this.combatSystem.playerHitsEnemy(this.player, minion)
      );
      EventBus.once(Events.ENEMY_DIED, (dead: unknown) => {
        if (dead === minion) this.boss.onMinionDefeated();
      });
    };

    this.physics.add.collider(this.boss.sprite, this.platforms);
    this.physics.add.overlap(
      this.player.sprite,
      this.boss.sprite,
      () => {
        if (this.battleStarted) {
          this.combatSystem.playerHitsEnemy(this.player, this.boss);
        }
      }
    );
  }

  private setupBossUI(): void {
    const barW = 400;
    this.bossHealthBg = this.add.rectangle(GameConfig.WIDTH / 2, 30, barW + 4, 18, 0x333333)
      .setScrollFactor(0).setDepth(50);
    this.bossHealthBar = this.add.rectangle(GameConfig.WIDTH / 2, 30, barW, 14, 0xff2200)
      .setScrollFactor(0).setDepth(51);
    this.bossNameText = this.add.text(GameConfig.WIDTH / 2, 50, 'SKARATHOS', {
      fontSize: '11px', color: '#ff8844',
      fontFamily: 'monospace', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(52);
    this.phaseText = this.add.text(GameConfig.WIDTH / 2, 62, 'Phase I', {
      fontSize: '10px', color: '#ffaaaa',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(52);
  }

  private setupCamera(): void {
    this.cameras.main.setBounds(0, 0, 1600, 600);
    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);
  }

  // ── Events ─────────────────────────────────────────────────────────────────

  private connectEvents(): void {
    EventBus.on(Events.BOSS_PHASE_CHANGE, this.onPhaseChange.bind(this));
    EventBus.on(Events.BOSS_DEFEATED,     this.onBossDefeated.bind(this));
    EventBus.on(Events.PLAYER_DIED,       this.onPlayerDied.bind(this));
    EventBus.on(Events.CAMERA_SHAKE,      this.onCameraShake.bind(this));
  }

  private onPhaseChange(phase: unknown): void {
    const labels = ['', 'Phase I', 'Phase II — ENRAGED', 'Phase III — FINAL FORM'];
    const p = Number(phase);
    this.phaseText.setText(labels[p] ?? '');
    this.cameras.main.shake(500, 0.02);

    if (p === 2) {
      this.bossHealthBar.setFillStyle(0xff6600);
    } else if (p === 3) {
      this.bossHealthBar.setFillStyle(0x8800ff);
      this.cameras.main.shake(800, 0.03);
    }
  }

  private onBossDefeated(): void {
    this.battleStarted = false;
    this.cameras.main.zoomTo(1, 800);
    this.cameras.main.shake(600, 0.025);

    // Victory explosion
    for (let i = 0; i < 12; i++) {
      this.time.delayedCall(i * 120, () => {
        const rx = Phaser.Math.Between(600, 1000);
        const ry = Phaser.Math.Between(350, 550);
        const exp = this.add.circle(rx, ry, 20, 0xff8800).setDepth(60);
        this.tweens.add({
          targets: exp, scaleX: 3, scaleY: 3, alpha: 0, duration: 400,
          onComplete: () => exp.destroy(),
        });
      });
    }

    this.sceneData.questSystem.updateObjective('q_slay_dragon', 0, 1);
    this.sceneData.saveSystem.save(this.player, this.sceneData.unlockedZones);

    this.showBanner('VICTORY!', '#ffdd00');
    this.time.delayedCall(4000, () => {
      this.sceneManager.transitionTo(this, 'VillageScene', {
        unlockedZones: this.sceneData.unlockedZones,
      });
    });
  }

  private onPlayerDied(): void {
    this.cameras.main.fade(600, 0, 0, 0);
    this.time.delayedCall(650, () => {
      this.sceneManager.transitionTo(this, 'GameOverScene', {
        unlockedZones: this.sceneData.unlockedZones,
      });
    });
  }

  private onCameraShake(): void {
    this.cameras.main.shake(200, 0.015);
  }

  private showBanner(text: string, color: string): void {
    const t = this.add.text(GameConfig.WIDTH / 2, 130, text, {
      fontSize: '30px', color,
      fontFamily: 'Georgia, serif',
      stroke: '#000', strokeThickness: 6,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(55);
    this.tweens.add({
      targets: t, y: 110, alpha: 0, delay: 3000, duration: 1000,
      onComplete: () => t.destroy(),
    });
  }

  // ── Update ─────────────────────────────────────────────────────────────────

  update(time: number, delta: number): void {
    this.player.update(time, delta);

    if (this.battleStarted) {
      this.boss.update(time, delta);
      for (let i = this.minions.length - 1; i >= 0; i--) {
        const m = this.minions[i];
        if (!m.isAlive) { this.minions.splice(i, 1); continue; }
        m.update(time, delta);
      }

      // Update boss health bar
      const pct = this.boss.health / this.boss.maxHealth;
      this.bossHealthBar.width = 400 * pct;
    }

    this.lootSystem.tryPickUp(this.player.x, this.player.y, 40, (item) => {
      this.player.inventory.addItem(item);
      item.applyEffect(this.player);
    });
  }

  shutdown(): void {
    EventBus.off(Events.BOSS_PHASE_CHANGE, this.onPhaseChange.bind(this));
    EventBus.off(Events.BOSS_DEFEATED,     this.onBossDefeated.bind(this));
    EventBus.off(Events.PLAYER_DIED,       this.onPlayerDied.bind(this));
    EventBus.off(Events.CAMERA_SHAKE,      this.onCameraShake.bind(this));
    this.lootSystem.clearAll();
  }
}
