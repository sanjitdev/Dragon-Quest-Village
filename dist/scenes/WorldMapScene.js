// WorldMapScene.ts — Classic world map progression overlay
import { GameConfig } from '../core/GameConfig.js';
export class WorldMapScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WorldMapScene' });
        this.nodes = [];
    }
    init(data) {
        this.mapData = data;
    }
    create() {
        // Dim overlay
        this.add.rectangle(0, 0, GameConfig.WIDTH, GameConfig.HEIGHT, 0x000000, 0.75)
            .setOrigin(0).setDepth(0);
        this.add.text(GameConfig.WIDTH / 2, 30, '— WORLD MAP —', {
            fontSize: '20px', color: '#ffe033',
            fontFamily: 'Georgia, serif',
            stroke: '#000', strokeThickness: 4,
        }).setOrigin(0.5).setDepth(10);
        this.add.text(GameConfig.WIDTH / 2, GameConfig.HEIGHT - 18, '[M] or [ESC] to close', {
            fontSize: '10px', color: '#888888', fontFamily: 'monospace',
        }).setOrigin(0.5).setDepth(10);
        this.buildNodes();
        this.drawConnectors();
        this.renderNodes();
        if (this.input.keyboard) {
            this.closeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
            this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => this.close());
            this.closeKey.on('down', () => this.close());
        }
    }
    // ── Node construction ──────────────────────────────────────────────────────
    buildNodes() {
        const positions = {
            village: { x: 140, y: 300 },
            forest: { x: 300, y: 230 },
            cave: { x: 450, y: 310 },
            dungeon: { x: 590, y: 220 },
            boss: { x: 730, y: 300 },
        };
        for (const zone of GameConfig.ZONES) {
            const pos = positions[zone.id];
            this.nodes.push({
                id: zone.id,
                name: zone.name,
                x: pos.x,
                y: pos.y,
                unlocked: this.mapData.unlockedZones.includes(zone.id),
                requiredLevel: zone.requiredLevel,
                nextScene: this.zoneToScene(zone.id),
            });
        }
    }
    zoneToScene(id) {
        switch (id) {
            case 'village': return 'VillageScene';
            case 'forest': return 'WorldScene';
            case 'cave': return 'WorldScene';
            case 'dungeon': return 'DungeonScene';
            case 'boss': return 'BossScene';
        }
    }
    drawConnectors() {
        const g = this.add.graphics().setDepth(1);
        const ids = this.nodes.map(n => n.id);
        const pairs = [
            ['village', 'forest'],
            ['forest', 'cave'],
            ['cave', 'dungeon'],
            ['dungeon', 'boss'],
        ];
        for (const [a, b] of pairs) {
            const na = this.nodes.find(n => n.id === a);
            const nb = this.nodes.find(n => n.id === b);
            if (!na || !nb)
                continue;
            const bothUnlocked = na.unlocked && nb.unlocked;
            g.lineStyle(3, bothUnlocked ? 0xffee33 : 0x444444, bothUnlocked ? 0.9 : 0.4);
            g.lineBetween(na.x, na.y, nb.x, nb.y);
        }
    }
    renderNodes() {
        for (const node of this.nodes) {
            const g = this.add.graphics().setDepth(5);
            const color = node.unlocked ? 0xffee33 : 0x444444;
            g.fillStyle(color, 1);
            g.fillCircle(node.x, node.y, 20);
            g.lineStyle(2, 0x000000, 1);
            g.strokeCircle(node.x, node.y, 20);
            const label = this.add.text(node.x, node.y + 28, node.name, {
                fontSize: '9px',
                color: node.unlocked ? '#ffffff' : '#555555',
                fontFamily: 'monospace',
                align: 'center',
                stroke: '#000', strokeThickness: 2,
            }).setOrigin(0.5).setDepth(6);
            if (!node.unlocked) {
                const lockLabel = this.add.text(node.x, node.y, `Lv.${node.requiredLevel}`, {
                    fontSize: '9px', color: '#888888', fontFamily: 'monospace',
                }).setOrigin(0.5).setDepth(7);
            }
            if (node.unlocked) {
                // Hover / click
                const btn = this.add.zone(node.x, node.y, 50, 50)
                    .setInteractive()
                    .setDepth(8);
                btn.on('pointerover', () => {
                    g.clear();
                    g.fillStyle(0xffffff, 1);
                    g.fillCircle(node.x, node.y, 22);
                    this.showNodeInfo(node);
                });
                btn.on('pointerout', () => {
                    g.clear();
                    g.fillStyle(0xffee33, 1);
                    g.fillCircle(node.x, node.y, 20);
                    g.lineStyle(2, 0x000000, 1);
                    g.strokeCircle(node.x, node.y, 20);
                    this.clearNodeInfo();
                });
                btn.on('pointerdown', () => this.travelToZone(node));
            }
        }
    }
    showNodeInfo(node) {
        this.clearNodeInfo();
        const bg = this.add.rectangle(0, 0, 220, 60, 0x111133, 0.9)
            .setStrokeStyle(1, 0x9988ff);
        const txt = this.add.text(-105, -22, `${node.name}\nReq. Level: ${node.requiredLevel}`, {
            fontSize: '10px', color: '#ffffff', fontFamily: 'monospace',
        });
        this.infoBox = this.add.container(GameConfig.WIDTH / 2, 500, [bg, txt]).setDepth(20);
    }
    clearNodeInfo() {
        this.infoBox?.destroy();
        this.infoBox = undefined;
    }
    travelToZone(node) {
        if (this.mapData.playerLevel < node.requiredLevel) {
            this.showTempMsg(`Need Level ${node.requiredLevel} to enter.`);
            return;
        }
        this.close();
        // Resume the caller (VillageScene) to grab references, then switch
        const caller = this.scene.get('VillageScene');
        this.scene.stop('WorldMapScene');
        this.scene.resume('VillageScene');
        if (node.id === 'village')
            return; // already there
        const sharedData = {
            zoneId: node.id,
            player: this.mapData.player,
            questSystem: this.mapData.questSystem,
            saveSystem: this.mapData.saveSystem,
            unlockedZones: this.mapData.unlockedZones,
        };
        caller.scene.start(node.nextScene, sharedData);
    }
    close() {
        this.scene.stop('WorldMapScene');
        this.scene.resume('VillageScene');
    }
    showTempMsg(msg) {
        const t = this.add.text(GameConfig.WIDTH / 2, 460, msg, {
            fontSize: '13px', color: '#ff6666',
            fontFamily: 'monospace', stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(30);
        this.tweens.add({
            targets: t, alpha: 0, delay: 1800, duration: 500, onComplete: () => t.destroy(),
        });
    }
}
//# sourceMappingURL=WorldMapScene.js.map