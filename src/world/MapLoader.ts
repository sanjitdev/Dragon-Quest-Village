// MapLoader.ts — Loads Tiled JSON maps or falls back to LevelBuilder configs.
// Currently provides hardcoded level configs for each zone.

import { LevelConfig } from './LevelBuilder.js';

export class MapLoader {
  /**
   * Returns a LevelConfig for the requested zone.
   * In a full build, this would parse a Tiled .json file.
   */
  static getConfig(zoneId: string): LevelConfig {
    switch (zoneId) {
      case 'forest':  return MapLoader.forestConfig();
      case 'cave':    return MapLoader.caveConfig();
      case 'dungeon': return MapLoader.dungeonConfig();
      case 'boss':    return MapLoader.bossConfig();
      default:        return MapLoader.villageConfig();
    }
  }

  private static villageConfig(): LevelConfig {
    return {
      width: 1600, height: 600,
      platforms: [
        { x: 0,    y: 568, width: 50 }, // ground
        { x: 300,  y: 440, width: 5 },
        { x: 700,  y: 400, width: 5 },
        { x: 1100, y: 440, width: 5 },
      ],
      enemyZones: [],
      lootChests: [],
    };
  }

  private static forestConfig(): LevelConfig {
    return {
      width: 3200, height: 600,
      platforms: [
        { x: 0,    y: 568, width: 100 },
        { x: 400,  y: 460, width: 6 },
        { x: 800,  y: 420, width: 5 },
        { x: 1200, y: 480, width: 7 },
        { x: 1700, y: 440, width: 6 },
        { x: 2100, y: 460, width: 5 },
        { x: 2600, y: 400, width: 8 },
      ],
      enemyZones: [
        { x: 600,  y: 530, type: 'goblin' },
        { x: 900,  y: 530, type: 'goblin' },
        { x: 1400, y: 530, type: 'slime'  },
        { x: 1800, y: 530, type: 'goblin' },
        { x: 2300, y: 530, type: 'slime'  },
        { x: 2800, y: 530, type: 'goblin' },
      ],
      lootChests: [{ x: 1600, y: 530 }, { x: 3000, y: 530 }],
    };
  }

  private static caveConfig(): LevelConfig {
    return {
      width: 3200, height: 600,
      platforms: [
        { x: 0,    y: 568, width: 100 },
        { x: 300,  y: 480, width: 5 },
        { x: 700,  y: 440, width: 5 },
        { x: 1000, y: 520, width: 6 },
        { x: 1400, y: 460, width: 5 },
        { x: 1900, y: 420, width: 6 },
        { x: 2400, y: 480, width: 5 },
        { x: 2800, y: 500, width: 6 },
      ],
      enemyZones: [
        { x: 500,  y: 530, type: 'bat'      },
        { x: 800,  y: 410, type: 'bat'      },
        { x: 1200, y: 530, type: 'skeleton' },
        { x: 1600, y: 530, type: 'bat'      },
        { x: 2000, y: 530, type: 'skeleton' },
        { x: 2500, y: 530, type: 'bat'      },
        { x: 2900, y: 530, type: 'skeleton' },
      ],
      lootChests: [{ x: 1800, y: 530 }, { x: 3000, y: 530 }],
    };
  }

  private static dungeonConfig(): LevelConfig {
    return {
      width: 3200, height: 600,
      platforms: [
        { x: 0,    y: 568, width: 100 },
        { x: 400,  y: 440, width: 4 },
        { x: 800,  y: 400, width: 5 },
        { x: 1100, y: 460, width: 5 },
        { x: 1500, y: 420, width: 6 },
        { x: 2000, y: 380, width: 5 },
        { x: 2400, y: 440, width: 5 },
        { x: 2800, y: 480, width: 6 },
      ],
      enemyZones: [
        { x: 500,  y: 530, type: 'skeleton' },
        { x: 900,  y: 530, type: 'goblin'   },
        { x: 1200, y: 530, type: 'skeleton' },
        { x: 1600, y: 530, type: 'bat'      },
        { x: 1900, y: 530, type: 'skeleton' },
        { x: 2200, y: 530, type: 'slime'    },
        { x: 2600, y: 530, type: 'skeleton' },
        { x: 2900, y: 530, type: 'goblin'   },
      ],
      lootChests: [{ x: 1500, y: 530 }, { x: 2700, y: 530 }, { x: 3000, y: 530 }],
    };
  }

  private static bossConfig(): LevelConfig {
    return {
      width: 1600, height: 600,
      platforms: [
        { x: 0,   y: 568, width: 50 },
        { x: 200, y: 440, width: 4 },
        { x: 1200, y: 440, width: 4 },
        { x: 700,  y: 380, width: 5 },
      ],
      enemyZones: [],
      lootChests: [],
    };
  }
}
