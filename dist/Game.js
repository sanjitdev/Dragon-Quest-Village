// Game.ts — Bootstraps Phaser and registers all scenes
import { GameConfig as GC } from './core/GameConfig.js';
import { BootScene } from './scenes/BootScene.js';
import { VillageScene } from './scenes/VillageScene.js';
import { WorldScene } from './scenes/WorldScene.js';
import { DungeonScene } from './scenes/DungeonScene.js';
import { BossScene } from './scenes/BossScene.js';
import { UIScene } from './scenes/UIScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { WorldMapScene } from './scenes/WorldMapScene.js';
export class Game {
    constructor() {
        const config = {
            type: Phaser.AUTO,
            width: GC.WIDTH,
            height: GC.HEIGHT,
            parent: 'game-container',
            backgroundColor: '#1a1a2e',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { x: 0, y: GC.GRAVITY },
                    debug: false,
                },
            },
            scene: [
                BootScene,
                VillageScene,
                WorldScene,
                DungeonScene,
                BossScene,
                UIScene,
                GameOverScene,
                WorldMapScene,
            ],
        };
        this.phaserGame = new Phaser.Game(config);
    }
    destroy() {
        this.phaserGame.destroy(true);
    }
}
//# sourceMappingURL=Game.js.map