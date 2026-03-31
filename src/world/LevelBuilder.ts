// LevelBuilder.ts — Procedurally assembles platforms and zones from config

export interface PlatformConfig {
  x: number;
  y: number;
  width: number;  // in tiles
}

export interface LevelConfig {
  width:     number;  // world pixel width
  height:    number;  // world pixel height
  platforms: PlatformConfig[];
  enemyZones: Array<{ x: number; y: number; type: string }>;
  lootChests: Array<{ x: number; y: number }>;
}

export class LevelBuilder {
  private scene: Phaser.Scene;
  private tileSize: number;

  constructor(scene: Phaser.Scene, tileSize: number = 32) {
    this.scene    = scene;
    this.tileSize = tileSize;
  }

  build(config: LevelConfig): Phaser.Physics.Arcade.StaticGroup {
    const platforms = this.scene.physics.add.staticGroup();
    this.scene.physics.world.setBounds(0, 0, config.width, config.height);

    for (const p of config.platforms) {
      for (let i = 0; i < p.width; i++) {
        const px = p.x + i * this.tileSize;
        const tile = platforms.create(px, p.y, 'tile_ground') as Phaser.Physics.Arcade.Sprite;
        tile.refreshBody();
      }
    }
    return platforms;
  }

  /** Build the ground for a simple linear level */
  buildGround(worldWidth: number, groundY: number): Phaser.Physics.Arcade.StaticGroup {
    const tileCount = Math.ceil(worldWidth / this.tileSize);
    return this.build({
      width:      worldWidth,
      height:     800,
      platforms:  [{ x: 0, y: groundY, width: tileCount }],
      enemyZones: [],
      lootChests: [],
    });
  }
}
