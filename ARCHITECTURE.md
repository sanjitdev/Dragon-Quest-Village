# Dragon Quest Village — Architecture Documentation

## Quick Start

```bash
npm install
npm run build      # compile TypeScript → dist/
npm run dev        # serve on http://localhost:8080
```

Open `http://localhost:8080` in a browser.

---

## Controls

| Key | Action |
|-----|--------|
| ← → | Move |
| ↑ or X | Jump (double-jump with Feather Totem) |
| Z | Attack |
| E | Interact with NPC |
| M | Open / close World Map |
| I | Open / close Inventory |

---

## Project Structure

```
/src
  main.ts              ← Entry point
  Game.ts              ← Phaser bootstrap

  /core
    GameConfig.ts      ← Shared constants & zone definitions
    EventBus.ts        ← Global event emitter (decoupled comms)
    SceneManager.ts    ← Scene transition helper

  /entities
    Entity.ts          ← Abstract base (id, sprite, health, update, destroy)
    Character.ts       ← Adds movement, animation, combat stats, knockback
    Player.ts          ← Player input, inventory, leveling, equipment
    Enemy.ts           ← AI states, patrol, loot table + Goblin/Skeleton/Bat/Slime
    BossDragon.ts      ← Multi-phase boss with fire breath, fly attack, minion summon
    NPC.ts             ← Scripted dialogue, floating name label

  /inventory
    Item.ts            ← Abstract base (id, name, rarity, applyEffect)
    Weapon.ts          ← attackBonus, defenseBonus + weapon catalog
    Potion.ts          ← healAmount + potion catalog
    Totem.ts           ← activate/deactivate ability totems
    Enchantment.ts     ← Passive stat bonuses
    Inventory.ts       ← Item container with typed views

  /combat
    DamageCalculator.ts ← Pure math: variance, crits, magic penetration
    CombatSystem.ts    ← Mediates player↔enemy hits, floating numbers, death rewards

  /systems
    LootSystem.ts      ← Probabilistic drops, glow sprites, proximity pick-up
    EnemySpawner.ts    ← Spawn / update / pool enemies
    QuestSystem.ts     ← Quest definitions, objective tracking
    SaveSystem.ts      ← localStorage save/load (PlayerSaveData + unlocked zones)

  /scenes
    BootScene.ts       ← Procedurally generates all textures (no external assets needed)
    VillageScene.ts    ← Hub: NPCs, world map access, save/load
    WorldScene.ts      ← Reusable adventure scene (forest, cave)
    DungeonScene.ts    ← 3-wave combat dungeon
    BossScene.ts       ← Cinematic dragon fight
    WorldMapScene.ts   ← Classic overhead map with zone nodes
    UIScene.ts         ← Parallel HUD overlay (health, XP, gold, inventory)
    GameOverScene.ts   ← Death screen with retry / new game

  /world
    LevelBuilder.ts    ← Assembles static platform groups from config arrays
    MapLoader.ts       ← Returns LevelConfig per zone (replaceable with Tiled JSON)
```

---

## Class Hierarchy

```
Entity (abstract)
 └── Character
      ├── Player
      ├── Enemy
      │    ├── Goblin
      │    ├── Skeleton
      │    ├── Bat
      │    ├── Slime
      │    └── BossDragon
      └── NPC

Item (abstract)
 ├── Weapon
 ├── Potion
 ├── Totem (abstract)
 │    ├── DoubleJumpTotem
 │    ├── FireTotem
 │    ├── ShieldTotem
 │    └── RegenTotem
 └── Enchantment
```

---

## Entity System

Every game object extends `Entity`. It owns:
- `id` — unique random string
- `sprite` — Phaser arcade physics sprite
- `health / maxHealth / isAlive`
- `update(time, delta)` — called every game tick
- `destroy()` — cleans up sprite

`Character` adds:
- `stats` (CharacterStats: maxHealth, attack, defense, speed, luck)
- `moveLeft/moveRight/jump/stopHorizontal`
- `takeDamage` — with invincibility frames and visual flash
- `applyKnockback` — direction-aware impulse
- `playAnim / updateAnimState` — state-driven animation selection

---

## Combat System

`CombatSystem` is a pure mediator — neither `Player` nor `Enemy` knows about each other's internals during combat.

Flow:
1. Phaser overlap callback fires → `combatSystem.playerHitsEnemy(player, enemy)`
2. `DamageCalculator.calculate(attack, defense, luck)` returns `{amount, isCritical}`
3. `enemy.takeDamage(amount)` — triggers hurt animation + invincibility
4. Floating damage number spawned at enemy position
5. On death: `player.gainXP`, `player.collectGold`, `lootSystem.dropLoot`

Critical hits use `min(luck/100, 0.25)` chance and deal ×2 damage.

---

## Inventory System

`Inventory` is a typed container on `Player`. Items are abstract — each subclass overrides `applyEffect(player)`:

| Class | Effect |
|-------|--------|
| `Weapon` | `player.equipWeapon(this)` — adds `attackBonus` to `totalAttack` |
| `Potion` | `player.heal(healAmount)` then removed from inventory |
| `Totem` | `activate(player)` → persistent ability (double jump, fire, shield, regen) |
| `Enchantment` | Directly mutates `player.stats[statKey] += bonus` |

---

## World Map Progression

Zones unlock linearly:
```
Village (Lv 0) → Whisperwood Forest (Lv 1) → Stonepeak Caverns (Lv 3)
              → Ruined Dungeon (Lv 5) → Dragon's Lair (Lv 8)
```

Zones gate on `player.level >= zone.requiredLevel`. Unlocking is triggered by clearing all enemies in the previous zone. Progress is persisted to localStorage.

---

## How to Add a New Enemy

1. Open `src/entities/Enemy.ts`
2. Add a new class extending `Enemy`:

```typescript
export class Troll extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'troll',
      { maxHealth: 80, attack: 20, defense: 8, speed: 60, luck: 3 },
      [{ itemId: 'potion_medium', chance: 0.25 }],
      40, 12
    );
    this.attackRange    = 60;
    this.detectionRange = 220;
  }
}
```

3. Add `'troll'` to `EnemySpawner`'s type union and `spawn()` switch.
4. Create its texture in `BootScene.generateTextures()` via `makeCharSheet('troll', 0x997755, 0x664422)`.
5. Place it in a zone by updating `MapLoader.ts`.

---

## How to Add a New Item

1. Choose the appropriate class (`Weapon`, `Potion`, `Totem`, or `Enchantment`).
2. Add it to the catalog in its file:

```typescript
// in Weapon.ts
export const WeaponCatalog: Record<string, Weapon> = {
  ...
  thunder_axe: new Weapon(
    'thunder_axe', 'Thunder Axe', ItemRarity.EPIC, 4,
    'Crackles with lightning.', 32, 3
  ),
};
```

3. Add the item id to an enemy's `dropTable` inside `Enemy.ts` or directly award it via quest reward logic in `QuestSystem.ts`.

---

## How to Add a New Scene

1. Create `src/scenes/MyScene.ts` extending `Phaser.Scene`.
2. Register it in `src/Game.ts` inside the `scene: [...]` array.
3. Optionally update `WorldMapScene.ts` to add a navigation node.

---

## Save Format (localStorage key: `dqv_save`)

```json
{
  "playerData": {
    "level": 3,
    "experience": 140,
    "gold": 85,
    "maxHealth": 145,
    "attack": 21,
    "defense": 11,
    "speed": 190,
    "luck": 7,
    "inventoryIds": ["short_sword", "potion_small"],
    "activeWeaponId": "short_sword",
    "activeTotemId":  null,
    "completedQuests": ["q_forest_clear"],
    "currentZone": "village"
  },
  "unlockedZones": ["village", "forest", "cave"],
  "savedAt": 1711900800000
}
```

---

## Performance Notes

- All enemies go through `EnemySpawner` which removes dead instances from its array each tick — no orphan updates.
- `LootSystem` only holds sprites for dropped-and-uncollected items; everything else is cleaned up immediately.
- Texture generation in `BootScene` runs once at startup; no external image files needed.
- Object pooling can be added to `EnemySpawner` by replacing `new Goblin(...)` with a pool.recycle pattern.

---

## Boss Fight Details

| Phase | Trigger HP % | Behaviour change |
|-------|-------------|-----------------|
| I     | 100–67 %    | Standard melee + chase |
| II    | 66–34 %     | + Fire breath (every 3.5s), begins summoning Goblins |
| III   | 33–0 %      | + Fly dive attack (every 5s), purple health bar, screen shake |

Defeating the boss completes quest `q_slay_dragon` and triggers the victory sequence.
