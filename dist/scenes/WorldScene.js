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
        this.cloudObjs = [];
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
        if (this.sceneData.zoneId === 'forest') {
            this.setupClouds();
            this.setupBirdSpawner();
        }
        this.setupPlatforms(config);
        this.setupEnemies(config);
        this.setupCamera(config.width);
        this.setupColliders();
        this.setupEvents();
        this.sceneManager.launchUI(this);
        this.cameras.main.fadeIn(400);
        this.showZoneBanner();
    }
    // ── Clouds (forest zone) ───────────────────────────────────────────────
    setupClouds() {
        const WORLD_W = MapLoader.getConfig('forest').width;
        const count = Math.ceil(WORLD_W / 600);
        for (let i = 0; i < count; i++) {
            const wx = (i / count) * (WORLD_W + 1200) - 200;
            const wy = Phaser.Math.Between(20, 80);
            const scale = 0.7 + Math.random() * 1.4;
            const speed = 8 + Math.random() * 18;
            const scrollF = 0.08 + Math.random() * 0.14;
            const cg = this.add.graphics();
            this.drawCloud(cg, scale);
            cg.setPosition(wx, wy);
            cg.setScrollFactor(scrollF);
            cg.setDepth(3);
            this.cloudObjs.push({ g: cg, wx, wy, speed, scrollF });
        }
    }
    drawCloud(g, scale) {
        const s = scale;
        // Night-toned: dark blue-grey tints
        g.fillStyle(0x1A2A3A, 0.18);
        g.fillEllipse(35 * s, 22, 80 * s, 18);
        g.fillStyle(0x1E2E42, 0.30);
        g.fillEllipse(35 * s, 14, 90 * s, 30);
        g.fillStyle(0x263446, 0.42);
        g.fillEllipse(10 * s, 10, 46 * s, 28 * s);
        g.fillStyle(0x2C3C52, 0.48);
        g.fillEllipse(30 * s, 4, 45 * s, 30 * s);
        g.fillStyle(0x324456, 0.45);
        g.fillEllipse(52 * s, 2, 40 * s, 28 * s);
        g.fillStyle(0x2A3A4E, 0.42);
        g.fillEllipse(70 * s, 9, 36 * s, 22 * s);
        // Faint moonlit edges
        g.fillStyle(0x8899BB, 0.12);
        g.fillEllipse(33 * s, 2, 28 * s, 14 * s);
        g.fillStyle(0x7788AA, 0.10);
        g.fillEllipse(55 * s, -1, 22 * s, 10 * s);
    }
    updateClouds(delta) {
        if (this.cloudObjs.length === 0)
            return;
        const worldW = MapLoader.getConfig(this.sceneData.zoneId).width;
        for (const cloud of this.cloudObjs) {
            cloud.wx -= cloud.speed * delta / 1000;
            if (cloud.wx < -300)
                cloud.wx = worldW + Phaser.Math.Between(0, 500);
            cloud.g.setX(cloud.wx);
        }
    }
    // ── Birds (forest zone) ───────────────────────────────────────────────
    setupBirdSpawner() {
        this.time.delayedCall(4000, () => this.scheduleNextBirdWave());
    }
    scheduleNextBirdWave() {
        this.time.delayedCall(Phaser.Math.Between(9000, 22000), () => {
            const count = Phaser.Math.Between(1, 4);
            for (let i = 0; i < count; i++) {
                this.time.delayedCall(i * Phaser.Math.Between(200, 700), () => this.spawnBird());
            }
            this.scheduleNextBirdWave();
        });
    }
    spawnBird() {
        const screenY = Phaser.Math.Between(15, 100);
        const speed = Phaser.Math.Between(50, 110);
        const duration = (GameConfig.WIDTH + 80) / speed * 1000;
        const bg = this.add.graphics().setScrollFactor(0).setDepth(6);
        bg.setPosition(GameConfig.WIDTH + 40, screenY);
        let flapFrame = 0;
        this.drawBird(bg, flapFrame);
        const flapTimer = this.time.addEvent({
            delay: Phaser.Math.Between(150, 250),
            repeat: -1,
            callback: () => {
                flapFrame ^= 1;
                bg.clear();
                this.drawBird(bg, flapFrame);
            },
        });
        this.tweens.add({
            targets: bg,
            x: -40,
            duration,
            ease: 'Linear',
            onComplete: () => { flapTimer.remove(); bg.destroy(); },
        });
    }
    drawBird(g, frame) {
        // Dark silhouette against night sky, with faint blue-moon rim
        g.fillStyle(0x556677, 0.68);
        if (frame === 0) {
            g.fillTriangle(-11, 2, 0, -5, 1, 2);
            g.fillTriangle(1, 2, 0, -5, 11, 2);
        }
        else {
            g.fillTriangle(-11, -2, -5, 3, 0, 0);
            g.fillTriangle(0, 0, 5, 3, 11, -2);
            g.fillTriangle(-5, 3, 0, 7, 5, 3);
        }
        g.fillStyle(0x7788AA, 0.85);
        g.fillRect(-2, 0, 4, 3);
    }
    // ── World setup ────────────────────────────────────────────────────────────
    setupBackground() {
        const zone = this.sceneData.zoneId;
        const g = this.add.graphics();
        if (zone === 'forest') {
            // ── Sky
            g.fillStyle(0x0A1A0A, 1);
            g.fillRect(0, 0, 6400, 220);
            g.fillStyle(0x081808, 1);
            g.fillRect(0, 180, 6400, 80);
            // Moon
            g.fillStyle(0xE8E8C8, 1);
            g.fillCircle(300, 80, 35);
            g.fillStyle(0xC8C8A8, 1);
            g.fillCircle(288, 72, 30);
            g.fillStyle(0x0A1A0A, 1);
            g.fillCircle(310, 66, 24); // crescent cutout
            // Stars
            g.fillStyle(0xFFFFFF, 1);
            for (const [sx, sy] of [[80, 30], [200, 55], [450, 20], [700, 45], [950, 15], [1200, 50], [1500, 28], [1750, 60], [2000, 22]]) {
                g.fillRect(sx, sy, 2, 2);
            }
            g.fillStyle(0xFFFFFF, 0.5);
            for (const [sx, sy] of [[160, 70], [380, 35], [600, 65], [900, 30], [1100, 68], [1400, 40]]) {
                g.fillRect(sx, sy, 1, 1);
            }
            // Far trees (parallax layer 1 — very dark)
            for (let tx = 0; tx < 6400; tx += 90) {
                const h = 120 + (tx % 60);
                const farG = this.add.graphics().setScrollFactor(0.2);
                farG.fillStyle(0x081208, 1);
                farG.fillTriangle(tx + 5, 300, tx + 45, 300 - h, tx + 85, 300);
            }
            // Mid trees (layer 2)
            for (let tx = 20; tx < 6400; tx += 120) {
                const h = 140 + (tx % 80);
                const midG = this.add.graphics().setScrollFactor(0.5);
                midG.fillStyle(0x0E2210, 1);
                midG.fillTriangle(tx, 380, tx + 55, 380 - h, tx + 110, 380);
                midG.fillStyle(0x0A1A0C, 1);
                midG.fillRect(tx + 22, 380, 22, 40);
            }
            // Near trees (layer 3, scroll with world)
            for (let tx = 0; tx < 6400; tx += 160) {
                const h = 180 + (tx % 100);
                g.fillStyle(0x122A14, 1);
                g.fillTriangle(tx - 10, 490, tx + 60, 490 - h, tx + 130, 490);
                g.fillStyle(0x1A3B1C, 1);
                g.fillTriangle(tx, 475, tx + 55, 490 - h + 20, tx + 110, 475);
                g.fillStyle(0x0E1E10, 1);
                g.fillRect(tx + 44, 490, 32, 55);
                // Moss/lichen
                g.fillStyle(0x22551A, 0.5);
                g.fillRect(tx + 44, 490, 8, 20);
            }
            // Fireflies
            g.fillStyle(0xAAFF44, 0.6);
            for (const [fx, fy] of [[180, 400], [380, 360], [640, 420], [900, 380], [1200, 410], [1500, 370], [1800, 400]]) {
                g.fillCircle(fx, fy, 3);
                g.fillStyle(0xAAFF44, 0.2);
                g.fillCircle(fx, fy, 6);
            }
            // Ground
            g.fillStyle(0x0E1E08, 1);
            g.fillRect(0, 540, 6400, 60);
            g.fillStyle(0x163010, 1);
            g.fillRect(0, 538, 6400, 8);
            // Fog
            g.fillStyle(0x88AACC, 0.04);
            for (let fx = 0; fx < 6400; fx += 300) {
                g.fillEllipse(fx + 150, 540, 400, 60);
            }
        }
        else if (zone === 'cave') {
            // ── Cave
            // Deep cave ceiling
            g.fillStyle(0x080810, 1);
            g.fillRect(0, 0, 6400, 600);
            // Rock strata bands
            g.fillStyle(0x0D0D1A, 1);
            g.fillRect(0, 80, 6400, 30);
            g.fillStyle(0x121220, 1);
            g.fillRect(0, 160, 6400, 20);
            // Ambient cave glow spots (torch/crystal light)
            for (const [cx2, cy2, color] of [
                [200, 400, 0x1A3A1A], [600, 300, 0x1A1A3A], [1000, 450, 0x3A2A1A],
                [1400, 380, 0x1A3A1A], [1800, 420, 0x2A1A3A], [2200, 350, 0x3A2A1A],
            ]) {
                for (let r = 80; r >= 20; r -= 20) {
                    g.fillStyle(color, (80 - r) / 200);
                    g.fillCircle(cx2, cy2, r);
                }
            }
            // Stalactites (ceiling)
            for (let sx = 0; sx < 6400; sx += 60) {
                const sh = 30 + (sx % 50);
                g.fillStyle(0x1A1A2A, 1);
                g.fillTriangle(sx + 5, 0, sx + 22, sh, sx + 40, 0);
                g.fillStyle(0x2A2A3A, 1);
                g.fillTriangle(sx + 8, 0, sx + 20, sh - 5, sx + 32, 0);
            }
            // Stalagmites (floor)
            for (let sx = 30; sx < 6400; sx += 90) {
                const sh = 20 + (sx % 35);
                g.fillStyle(0x1A1A2A, 1);
                g.fillTriangle(sx, 600, sx + 18, 600 - sh, sx + 36, 600);
                g.fillStyle(0x2A2A3A, 1);
                g.fillTriangle(sx + 3, 600, sx + 16, 600 - sh + 5, sx + 30, 600);
            }
            // Crystals
            for (const [kx, ky, kc] of [
                [150, 470, 0x4455AA], [350, 450, 0x3366BB], [800, 480, 0x4455AA],
                [1100, 460, 0x2244CC], [1500, 475, 0x3355BB], [2000, 465, 0x4455AA],
            ]) {
                g.fillStyle(kc, 1);
                g.fillTriangle(kx, ky, kx + 8, ky - 22, kx + 16, ky);
                g.fillTriangle(kx + 5, ky, kx + 12, ky - 18, kx + 20, ky);
                g.fillStyle(0x8899DD, 0.4);
                g.fillRect(kx + 4, ky - 18, 4, 10);
            }
            // Torches
            for (const [tx, ty] of [[300, 380], [700, 360], [1200, 390], [1700, 370]]) {
                g.fillStyle(0x663300, 1);
                g.fillRect(tx - 2, ty, 5, 20);
                g.fillStyle(0xFF6600, 0.9);
                g.fillEllipse(tx, ty - 4, 10, 14);
                g.fillStyle(0xFF9922, 0.7);
                g.fillEllipse(tx, ty - 8, 7, 10);
                g.fillStyle(0xFFFF44, 0.5);
                g.fillEllipse(tx, ty - 10, 4, 7);
                // Torch glow
                g.fillStyle(0xFF6600, 0.06);
                g.fillCircle(tx, ty - 4, 60);
            }
            // Ground
            g.fillStyle(0x0A0A16, 1);
            g.fillRect(0, 555, 6400, 45);
            g.fillStyle(0x151525, 1);
            g.fillRect(0, 552, 6400, 6);
        }
        else {
            // ── Dungeon
            g.fillStyle(0x080810, 1);
            g.fillRect(0, 0, 6400, 600);
            // Stone block walls
            g.fillStyle(0x181820, 1);
            for (let bx = 0; bx < 6400; bx += 64) {
                for (let by = 0; by < 80; by += 32) {
                    const offset = (by / 32) % 2 === 0 ? 0 : 32;
                    g.fillRect(bx + offset + 1, by + 1, 62, 30);
                }
            }
            g.fillStyle(0x222230, 0.4);
            for (let bx = 0; bx < 6400; bx += 64) {
                g.fillRect(bx, 0, 1, 80);
                g.fillRect(bx + 32, 16, 1, 48);
            }
            for (let by2 = 0; by2 < 80; by2 += 32) {
                g.fillRect(0, by2, 6400, 1);
            }
            // Chains
            for (const cx3 of [200, 600, 1000, 1400, 1800, 2200, 2600]) {
                for (let cy3 = 0; cy3 < 80; cy3 += 10) {
                    g.fillStyle(0x445566, 1);
                    g.fillCircle(cx3, cy3, 4);
                    g.fillStyle(0x334455, 1);
                    g.fillCircle(cx3, cy3, 3);
                }
            }
            // Torches
            for (const [tx, ty] of [[150, 370], [500, 350], [900, 380], [1300, 360], [1700, 375]]) {
                g.fillStyle(0x441100, 1);
                g.fillRect(tx - 2, ty, 5, 20);
                g.fillStyle(0xFF4400, 0.9);
                g.fillEllipse(tx, ty - 4, 10, 14);
                g.fillStyle(0xFF8822, 0.7);
                g.fillEllipse(tx, ty - 8, 7, 10);
                g.fillStyle(0xFF4400, 0.05);
                g.fillCircle(tx, ty - 4, 50);
            }
            // Floor
            g.fillStyle(0x101018, 1);
            g.fillRect(0, 555, 6400, 45);
            g.fillStyle(0x1A1A28, 1);
            g.fillRect(0, 552, 6400, 5);
            // Floor cracks
            g.fillStyle(0x000000, 0.5);
            for (let fx = 50; fx < 6400; fx += 200) {
                g.fillRect(fx, 556, 30, 1);
                g.fillRect(fx + 15, 556, 1, 8);
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
        this.updateClouds(delta);
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