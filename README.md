# Dragon Quest Village

A 2D action-adventure browser game built with **Phaser 3** and **TypeScript**.

Fight through forests, caverns, and dungeons on your way to slay the ancient dragon Skarathos.

![Game Screenshot](https://img.shields.io/badge/status-playable-brightgreen) ![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue) ![Phaser](https://img.shields.io/badge/Phaser-3.60-orange)

---

## Play

> **Live:** `https://YOUR_USERNAME.github.io/dragon-quest-village/`

---

## Controls

| Key | Action |
|-----|--------|
| `← →` | Move |
| `↑` or `X` | Jump |
| `Z` | Attack |
| `E` | Interact with NPC |
| `M` | World Map |
| `I` | Inventory |

---

## World Progression

Areas unlock as you level up:

```
Eldenmere Village (Lv 0)
      ↓
Whisperwood Forest (Lv 1)  — defeat 5 goblins
      ↓
Stonepeak Caverns (Lv 3)   — defeat 4 bats
      ↓
Ruined Dungeon (Lv 5)      — 3-wave combat gauntlet
      ↓
Dragon's Lair (Lv 8)       — boss fight: Skarathos
```

---

## Features

- **OOP entity hierarchy** — `Entity → Character → Player / Enemy / NPC`
- **Multi-phase boss** — Skarathos gains new attacks at 66% and 33% HP
- **Inventory system** — Weapons, Potions, Totems, Enchantments
- **Totem abilities** — Double jump, fire aura, shield, HP regeneration
- **Quest system** — objectives tracked, rewards granted on completion
- **Save system** — progress persisted to `localStorage`
- **World map** — classic overhead progression screen
- **No external assets** — all textures generated procedurally at boot

---

## Local Development

```bash
npm install
npm run dev       # serves on http://localhost:8080
```

```bash
npm run build     # compiles TypeScript → dist/
```

---

## Project Structure

```
src/
├── core/          EventBus, GameConfig, SceneManager
├── entities/      Entity, Character, Player, Enemy, BossDragon, NPC
├── combat/        CombatSystem, DamageCalculator
├── inventory/     Item, Weapon, Potion, Totem, Enchantment, Inventory
├── systems/       LootSystem, EnemySpawner, QuestSystem, SaveSystem
├── scenes/        Boot, Village, World, Dungeon, Boss, UI, WorldMap, GameOver
└── world/         LevelBuilder, MapLoader
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for full class hierarchy, combat formulas, save format, and guides on adding new enemies and items.

---

## Deployment

Pushes to `main` automatically build and deploy via GitHub Actions.

```
git push origin main
```

→ GitHub Actions builds → deploys to GitHub Pages.
