// DungeonScene.ts — Combat-heavy dungeon with waves of enemies

import { Player } from '../entities/Player.js';
import { EnemySpawner } from '../systems/EnemySpawner.js';
import { LootSystem } from '../systems/LootSystem.js';
import { CombatSystem } from '../combat/CombatSystem.js';
import { SceneManager } from '../core/SceneManager.js';
import { EventBus, Events } from '../core/EventBus.js';
import { GameConfig, ZoneId } from '../core/GameConfig.js';
import { LevelBuilder } from '../world/LevelBuilder.js';
import { MapLoader } from '../world/MapLoader.js';
import { QuestSystem } from '../systems/QuestSystem.js';
import { SaveSystem } from '../systems/SaveSystem.js';

export interface DungeonSceneData {
  player:        Player;
  questSystem:   QuestSystem;
  saveSystem:    SaveSystem;
  unlockedZones: ZoneId[];
}

export class DungeonScene extends Phaser.Scene {
  private sceneData!: DungeonSceneData;
  private player!: Player;
  private spawner!: EnemySpawner;
  private lootSystem!: LootSystem;
  private combatSystem!: CombatSystem;
  private sceneManager!: SceneManager;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private wave: number = 0;
  private readonly totalWaves = 3;

  constructor() { super({ key: 'DungeonScene' }); }

  init(data: DungeonSceneData): void {
    this.sceneData = data;
  }

  create(): void {
    this.sceneManager = new SceneManager(this.game);
    this.lootSystem   = new LootSystem();
    this.spawner      = new EnemySpawner(this);
    this.player       = new Player(this, 80, 520);
    this.combatSystem = new CombatSystem(this, this.lootSystem);

    const config = MapLoader.getConfig('dungeon');
    this.setupBackground();
    this.setupPlatforms(config);
    this.setupCamera(config.width);

    this.physics.add.collider(this.player.sprite, this.platforms);
    this.startWave();

    EventBus.on(Events.PLAYER_DIED,   this.onPlayerDied.bind(this));
    EventBus.on(Events.CAMERA_SHAKE,  this.onCameraShake.bind(this));
    EventBus.on(Events.ENEMY_DIED,    this.onEnemyDied.bind(this));

    this.sceneManager.launchUI(this);
    this.cameras.main.fadeIn(400);
    this.showBanner('Ruined Dungeon', '#ff8844');
  }

  private setupBackground(): void {
    this.add.rectangle(0, 0, 6400, 600, 0x1a1a2e).setOrigin(0);
    // Torch lights
    for (let tx = 200; tx < 3200; tx += 400) {
      const glow = this.add.pointlight(tx, 400, 0xff8844, 120, 0.07);
    }
  }

  private setupPlatforms(config: ReturnType<typeof MapLoader.getConfig>): void {
    const builder = new LevelBuilder(this, GameConfig.TILE_SIZE);
    this.platforms = builder.build(config);
    this.physics.world.setBounds(0, 0, config.width, config.height);
  }

  private setupCamera(w: number): void {
    this.cameras.main.setBounds(0, 0, w, 600);
    this.cameras.main.startFollow(this.player.sprite, true, GameConfig.CAMERA_LERP, GameConfig.CAMERA_LERP);
  }

  // ── Waves ──────────────────────────────────────────────────────────────────

  private startWave(): void {
    this.wave++;
    const waveConfigs: Array<Array<{ type: 'skeleton' | 'goblin' | 'bat' | 'slime'; x: number; y: number }>> = [
      [
        { type: 'skeleton', x: 600,  y: 530 },
        { type: 'goblin',   x: 900,  y: 530 },
        { type: 'skeleton', x: 1200, y: 530 },
      ],
      [
        { type: 'skeleton', x: 400,  y: 530 },
        { type: 'bat',      x: 800,  y: 300 },
        { type: 'skeleton', x: 1100, y: 530 },
        { type: 'goblin',   x: 1400, y: 530 },
      ],
      [
        { type: 'skeleton', x: 500,  y: 530 },
        { type: 'skeleton', x: 900,  y: 530 },
        { type: 'bat',      x: 700,  y: 280 },
        { type: 'bat',      x: 1200, y: 280 },
        { type: 'goblin',   x: 1500, y: 530 },
      ],
    ];

    const cfg = waveConfigs[this.wave - 1] ?? [];
    const enemies = this.spawner.spawnGroup(cfg, this.player);

    for (const e of enemies) {
      this.physics.add.collider(e.sprite, this.platforms);
      this.physics.add.overlap(
        this.player.sprite,
        e.sprite,
        () => this.combatSystem.playerHitsEnemy(this.player, e)
      );
    }

    this.showBanner(`Wave ${this.wave} / ${this.totalWaves}`, '#ffee33');
  }

  // ── Callbacks ──────────────────────────────────────────────────────────────

  private onEnemyDied(): void {
    if (this.spawner.getActive().length === 0) {
      if (this.wave < this.totalWaves) {
        this.time.delayedCall(1500, () => this.startWave());
      } else {
        this.onDungeonCleared();
      }
    }
  }

  private onDungeonCleared(): void {
    const { unlockedZones, saveSystem } = this.sceneData;
    if (!unlockedZones.includes('boss')) {
      unlockedZones.push('boss');
      saveSystem.save(this.player, unlockedZones);
      this.showBanner("Dragon's Lair Unlocked!", '#ff4444');
    } else {
      this.showBanner('Dungeon Cleared!', '#aaff88');
    }
    this.time.delayedCall(3000, () => {
      this.sceneManager.transitionTo(this, 'VillageScene', { unlockedZones });
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
    this.cameras.main.shake(200, 0.012);
  }

  private showBanner(text: string, color: string): void {
    const t = this.add.text(GameConfig.WIDTH / 2, 80, text, {
      fontSize: '22px', color,
      fontFamily: 'Georgia, serif',
      stroke: '#000', strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(50);
    this.tweens.add({
      targets: t, y: 60, alpha: 0, delay: 2500, duration: 800,
      onComplete: () => t.destroy(),
    });
  }

  update(time: number, delta: number): void {
    this.player.update(time, delta);
    this.spawner.update(time, delta);

    this.lootSystem.tryPickUp(this.player.x, this.player.y, 40, (item) => {
      this.player.inventory.addItem(item);
      item.applyEffect(this.player);
    });
  }

  shutdown(): void {
    EventBus.off(Events.PLAYER_DIED,  this.onPlayerDied.bind(this));
    EventBus.off(Events.CAMERA_SHAKE, this.onCameraShake.bind(this));
    EventBus.off(Events.ENEMY_DIED,   this.onEnemyDied.bind(this));
    this.spawner.destroyAll();
    this.lootSystem.clearAll();
  }
}
