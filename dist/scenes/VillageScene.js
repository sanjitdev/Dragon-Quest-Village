// VillageScene.ts — Hub scene: talk to NPCs, access world map, manage equipment
import { Player } from '../entities/Player.js';
import { NPC } from '../entities/NPC.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { QuestSystem } from '../systems/QuestSystem.js';
import { SceneManager } from '../core/SceneManager.js';
import { GameConfig } from '../core/GameConfig.js';
import { LevelBuilder } from '../world/LevelBuilder.js';
export class VillageScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VillageScene' });
        this.npcs = [];
        this.unlockedZones = ['village'];
        this.activeNPC = null;
    }
    init(data) {
        if (data.unlockedZones)
            this.unlockedZones = data.unlockedZones;
    }
    create() {
        this.sceneManager = new SceneManager(this.game);
        this.saveSystem = new SaveSystem();
        this.questSystem = new QuestSystem();
        this.setupWorld();
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
    // ── World setup ────────────────────────────────────────────────────────────
    setupWorld() {
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
    drawVillage() {
        const g = this.add.graphics();
        // Houses
        for (const hx of [150, 450, 800, 1100, 1350]) {
            g.fillStyle(0xcc8844, 1);
            g.fillRect(hx, 490, 80, 80);
            g.fillStyle(0xcc3322, 1);
            g.fillTriangle(hx - 10, 490, hx + 40, 440, hx + 90, 490);
            g.fillStyle(0x664422, 1);
            g.fillRect(hx + 28, 524, 24, 46);
        }
        // Well
        g.fillStyle(0x888888, 1);
        g.fillCircle(650, 560, 18);
        g.fillStyle(0x555555, 1);
        g.fillCircle(650, 560, 12);
    }
    // ── Player ─────────────────────────────────────────────────────────────────
    setupPlayer() {
        this.player = new Player(this, 120, 520);
        this.physics.add.collider(this.player.sprite, this.platforms);
    }
    // ── NPCs ───────────────────────────────────────────────────────────────────
    setupNPCs() {
        const elder = new NPC(this, 300, 535, 'npc_elder', 'Elder Theron', [
            { speaker: 'Elder Theron', text: 'Hero! Dark forces stir beyond our walls.' },
            { speaker: 'Elder Theron', text: 'Head to the Whisperwood Forest first. Goblins run rampant!' },
            { speaker: 'Elder Theron', text: 'Press [M] to open the World Map. Good luck.' },
        ]);
        const smith = new NPC(this, 580, 535, 'npc_smith', 'Bram the Smith', [
            { speaker: 'Bram', text: 'I can forge great weapons if you bring me materials.' },
            { speaker: 'Bram', text: 'For now, check your inventory [I] for what you carry.' },
        ]);
        const merchant = new NPC(this, 900, 535, 'npc_merchant', 'Mira Merchant', [
            { speaker: 'Mira', text: 'Welcome! I deal in potions and enchantments.' },
            { speaker: 'Mira', text: 'The Dragon grows bolder each day. Stock up!' },
        ]);
        this.npcs = [elder, smith, merchant];
    }
    // ── Camera ─────────────────────────────────────────────────────────────────
    setupCamera() {
        this.cameras.main.setBounds(0, 0, 1600, 600);
        this.cameras.main.startFollow(this.player.sprite, true, GameConfig.CAMERA_LERP, GameConfig.CAMERA_LERP);
    }
    // ── Input ──────────────────────────────────────────────────────────────────
    setupInput() {
        if (!this.input.keyboard)
            return;
        this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.worldMapKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    }
    // ── Dialogue UI ────────────────────────────────────────────────────────────
    setupDialogueBox() {
        const bg = this.add.rectangle(0, 0, 640, 90, 0x111111, 0.85)
            .setStrokeStyle(2, 0xffee33);
        this.dialogueText = this.add.text(-300, -30, '', {
            fontSize: '13px', color: '#ffffff',
            fontFamily: 'monospace', wordWrap: { width: 580 },
        });
        this.dialogueBox = this.add.container(400, 555, [bg, this.dialogueText])
            .setDepth(50)
            .setScrollFactor(0)
            .setVisible(false);
    }
    showDialogue(line) {
        if (!line) {
            this.dialogueBox.setVisible(false);
            this.activeNPC = null;
            return;
        }
        this.dialogueText.setText(`[${line.speaker}]: ${line.text}`);
        this.dialogueBox.setVisible(true);
    }
    showNotification(msg) {
        const t = this.add.text(GameConfig.WIDTH / 2, 40, msg, {
            fontSize: '14px', color: '#ffe033',
            fontFamily: 'monospace', stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(60);
        this.tweens.add({
            targets: t, y: 20, alpha: 0, delay: 2000, duration: 800,
            onComplete: () => t.destroy(),
        });
    }
    // ── World map overlay ──────────────────────────────────────────────────────
    showWorldMap() {
        this.scene.launch('WorldMapScene', {
            unlockedZones: this.unlockedZones,
            playerLevel: this.player.level,
            questSystem: this.questSystem,
            player: this.player,
            saveSystem: this.saveSystem,
        });
        this.scene.pause();
    }
    // ── Update ─────────────────────────────────────────────────────────────────
    update(time, delta) {
        this.player.update(time, delta);
        // Interact with NPCs
        if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
            const nearNPC = this.npcs.find(n => Math.abs(n.x - this.player.x) < 60 && Math.abs(n.y - this.player.y) < 80);
            if (nearNPC) {
                this.activeNPC = nearNPC;
                const line = nearNPC.nextDialogue();
                this.showDialogue(line);
            }
            else if (this.activeNPC) {
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
    getPlayer() { return this.player; }
    getSaveSystem() { return this.saveSystem; }
    getQuestSystem() { return this.questSystem; }
    getUnlockedZones() { return this.unlockedZones; }
    unlockZone(id) {
        if (!this.unlockedZones.includes(id)) {
            this.unlockedZones.push(id);
            this.saveSystem.save(this.player, this.unlockedZones);
        }
    }
}
//# sourceMappingURL=VillageScene.js.map