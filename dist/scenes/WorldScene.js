// WorldScene.ts — Reusable adventure scene (forest, cave) with combat and loot
import { Player } from '../entities/Player.js';
import { EnemySpawner } from '../systems/EnemySpawner.js';
import { LootSystem } from '../systems/LootSystem.js';
import { CombatSystem } from '../combat/CombatSystem.js';
import { SceneManager } from '../core/SceneManager.js';
import { EventBus, Events } from '../core/EventBus.js';
import { GameConfig } from '../core/GameConfig.js';
import { LevelBuilder } from '../world/LevelBuilder.js';
import { MapLoader } from '../world/MapLoader.js';
export class WorldScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WorldScene' });
        this.bgScrollFactor = 0.3;
        this.goblinKills = 0;
        this.batKills = 0;
    }
    init(data) {
        this.sceneData = data;
    }
    create() {
        this.sceneManager = new SceneManager(this.game);
        this.player = this.sceneData.player;
        this.lootSystem = new LootSystem();
        this.spawner = new EnemySpawner(this);
        this.combatSystem = new CombatSystem(this, this.lootSystem);
        // Rebuild player sprite in this scene
        this.player.sprite.destroy();
        this.player = new Player(this, 80, 520);
        const config = MapLoader.getConfig(this.sceneData.zoneId);
        this.setupBackground();
        this.setupPlatforms(config);
        this.setupEnemies(config);
        this.setupCamera(config.width);
        this.setupColliders();
        this.setupEvents();
        this.sceneManager.launchUI(this);
        this.cameras.main.fadeIn(400);
        this.showZoneBanner();
    }
    // ── World setup ────────────────────────────────────────────────────────────
    setupBackground() {
        const bg = this.sceneData.zoneId === 'cave'
            ? 0x222233
            : this.sceneData.zoneId === 'dungeon' ? 0x1a1a2e : 0x5588bb;
        this.add.rectangle(0, 0, 6400, 600, bg).setOrigin(0).setScrollFactor(this.bgScrollFactor);
        if (this.sceneData.zoneId === 'forest') {
            // Simple tree sprites
            for (let tx = 0; tx < 3200; tx += 120) {
                const g = this.add.graphics();
                g.fillStyle(0x225522, 1);
                g.fillTriangle(tx + 20, 350, tx + 60, 250, tx + 100, 350);
                g.fillStyle(0x553322, 1);
                g.fillRect(tx + 45, 350, 30, 50);
                g.setScrollFactor(0.6);
            }
        }
    }
    setupPlatforms(config) {
        const builder = new LevelBuilder(this, GameConfig.TILE_SIZE);
        this.platforms = builder.build(config);
        this.physics.world.setBounds(0, 0, config.width, config.height);
    }
    setupEnemies(config) {
        for (const zone of config.enemyZones) {
            const type = zone.type;
            this.spawner.spawn(type, zone.x, zone.y, this.player);
        }
    }
    setupCamera(worldWidth) {
        this.cameras.main.setBounds(0, 0, worldWidth, 600);
        this.cameras.main.startFollow(this.player.sprite, true, GameConfig.CAMERA_LERP, GameConfig.CAMERA_LERP);
    }
    setupColliders() {
        this.physics.add.collider(this.player.sprite, this.platforms);
        for (const enemy of this.spawner.getActive()) {
            this.physics.add.collider(enemy.sprite, this.platforms);
            this.physics.add.overlap(this.player.sprite, enemy.sprite, () => this.combatSystem.playerHitsEnemy(this.player, enemy));
        }
    }
    setupEvents() {
        EventBus.on(Events.PLAYER_DIED, this.onPlayerDied.bind(this));
        EventBus.on(Events.CAMERA_SHAKE, this.onCameraShake.bind(this));
        EventBus.on(Events.ENEMY_DIED, this.onEnemyDied.bind(this));
    }
    // ── Banner ─────────────────────────────────────────────────────────────────
    showZoneBanner() {
        const zoneInfo = GameConfig.ZONES.find(z => z.id === this.sceneData.zoneId);
        if (!zoneInfo)
            return;
        const t = this.add.text(GameConfig.WIDTH / 2, 80, zoneInfo.name, {
            fontSize: '24px', color: '#ffe033',
            fontFamily: 'Georgia, serif',
            stroke: '#000', strokeThickness: 5,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(50);
        this.tweens.add({
            targets: t, y: 60, alpha: 0, delay: 2500, duration: 800,
            onComplete: () => t.destroy(),
        });
    }
    // ── Events ─────────────────────────────────────────────────────────────────
    onPlayerDied() {
        this.cameras.main.fade(600, 0, 0, 0);
        this.time.delayedCall(650, () => {
            this.sceneManager.transitionTo(this, 'GameOverScene', {
                zoneId: this.sceneData.zoneId,
                unlockedZones: this.sceneData.unlockedZones,
            });
        });
    }
    onCameraShake() {
        this.cameras.main.shake(200, 0.012);
    }
    onEnemyDied(...args) {
        const enemy = args[0];
        // Quest tracking
        const textureKey = (enemy.sprite.texture.key);
        if (textureKey === 'goblin' && this.sceneData.zoneId === 'forest') {
            this.goblinKills++;
            this.sceneData.questSystem.updateObjective('q_forest_clear', 0, 1);
        }
        if (textureKey === 'bat' && this.sceneData.zoneId === 'cave') {
            this.batKills++;
            this.sceneData.questSystem.updateObjective('q_cave_bats', 0, 1);
        }
        // Check for zone completion → next area unlock
        const allDead = this.spawner.getActive().length === 0;
        if (allDead) {
            this.onZoneCleared();
        }
    }
    onZoneCleared() {
        const { zoneId, unlockedZones } = this.sceneData;
        const zones = GameConfig.ZONES.map(z => z.id);
        const currentIdx = zones.indexOf(zoneId);
        if (currentIdx !== -1 && currentIdx < zones.length - 1) {
            const next = zones[currentIdx + 1];
            if (!unlockedZones.includes(next)) {
                unlockedZones.push(next);
                this.sceneData.saveSystem.save(this.player, unlockedZones);
                this.showZoneUnlocked(next);
            }
        }
        this.time.delayedCall(3000, () => {
            this.sceneManager.transitionTo(this, 'VillageScene', {
                unlockedZones,
            });
        });
    }
    showZoneUnlocked(id) {
        const info = GameConfig.ZONES.find(z => z.id === id);
        if (!info)
            return;
        const t = this.add.text(GameConfig.WIDTH / 2, 150, `New area unlocked: ${info.name}!`, {
            fontSize: '18px', color: '#aaff88',
            fontFamily: 'Georgia, serif',
            stroke: '#000', strokeThickness: 4,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(60);
        this.tweens.add({
            targets: t, y: 130, alpha: 0, delay: 3000, duration: 800,
            onComplete: () => t.destroy(),
        });
    }
    // ── Update ─────────────────────────────────────────────────────────────────
    update(time, delta) {
        this.player.update(time, delta);
        this.spawner.update(time, delta);
        // Loot proximity pick-up
        this.lootSystem.tryPickUp(this.player.x, this.player.y, 40, (item) => {
            this.player.inventory.addItem(item);
            item.applyEffect(this.player);
        });
    }
    // ── Cleanup ────────────────────────────────────────────────────────────────
    shutdown() {
        EventBus.off(Events.PLAYER_DIED, this.onPlayerDied.bind(this));
        EventBus.off(Events.CAMERA_SHAKE, this.onCameraShake.bind(this));
        EventBus.off(Events.ENEMY_DIED, this.onEnemyDied.bind(this));
        this.spawner.destroyAll();
        this.lootSystem.clearAll();
    }
}
//# sourceMappingURL=WorldScene.js.map