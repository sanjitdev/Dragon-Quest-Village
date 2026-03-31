// GameConfig.ts — Shared constants and configuration values
export const GameConfig = {
    WIDTH: 800,
    HEIGHT: 600,
    TILE_SIZE: 32,
    GRAVITY: 600,
    // Player defaults
    PLAYER_SPEED: 180,
    PLAYER_JUMP_VELOCITY: -380,
    PLAYER_START_HEALTH: 100,
    PLAYER_START_ATTACK: 12,
    PLAYER_START_DEFENSE: 5,
    PLAYER_START_SPEED: 180,
    PLAYER_START_LUCK: 5,
    // XP scaling
    XP_PER_LEVEL_BASE: 100,
    XP_LEVEL_MULTIPLIER: 1.4,
    // Combat
    ATTACK_COOLDOWN_MS: 500,
    KNOCKBACK_FORCE: 200,
    CRIT_MULTIPLIER: 2.0,
    // Camera
    CAMERA_LERP: 0.1,
    BOSS_CAMERA_ZOOM: 1.3,
    // Loot
    LOOT_GLOW_DURATION: 800,
    GOLD_DROP_MIN: 1,
    GOLD_DROP_MAX: 10,
    // World map zones (id, display name, required level)
    ZONES: [
        { id: 'village', name: 'Eldenmere Village', requiredLevel: 0 },
        { id: 'forest', name: 'Whisperwood Forest', requiredLevel: 1 },
        { id: 'cave', name: 'Stonepeak Caverns', requiredLevel: 3 },
        { id: 'dungeon', name: 'Ruined Dungeon', requiredLevel: 5 },
        { id: 'boss', name: "Dragon's Lair", requiredLevel: 8 },
    ],
};
//# sourceMappingURL=GameConfig.js.map