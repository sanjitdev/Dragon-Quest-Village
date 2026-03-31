// LevelBuilder.ts — Procedurally assembles platforms and zones from config
export class LevelBuilder {
    constructor(scene, tileSize = 32) {
        this.scene = scene;
        this.tileSize = tileSize;
    }
    build(config) {
        const platforms = this.scene.physics.add.staticGroup();
        this.scene.physics.world.setBounds(0, 0, config.width, config.height);
        for (const p of config.platforms) {
            for (let i = 0; i < p.width; i++) {
                const px = p.x + i * this.tileSize;
                const tile = platforms.create(px, p.y, 'tile_ground');
                tile.refreshBody();
            }
        }
        return platforms;
    }
    /** Build the ground for a simple linear level */
    buildGround(worldWidth, groundY) {
        const tileCount = Math.ceil(worldWidth / this.tileSize);
        return this.build({
            width: worldWidth,
            height: 800,
            platforms: [{ x: 0, y: groundY, width: tileCount }],
            enemyZones: [],
            lootChests: [],
        });
    }
}
//# sourceMappingURL=LevelBuilder.js.map