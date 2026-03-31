// LootSystem.ts — Handles probabilistic item drops and loot spawning

import { Enemy } from '../entities/Enemy.js';
import { Item, ItemRarity } from '../inventory/Item.js';
import { WeaponCatalog } from '../inventory/Weapon.js';
import { PotionCatalog } from '../inventory/Potion.js';
import { TotemCatalog }  from '../inventory/Totem.js';
import { EnchantmentCatalog } from '../inventory/Enchantment.js';
import { EventBus, Events } from '../core/EventBus.js';

/** All known items by id */
const ALL_ITEMS: Record<string, Item> = {
  ...WeaponCatalog,
  ...PotionCatalog,
  ...TotemCatalog,
  ...EnchantmentCatalog,
};

export interface DroppedLoot {
  item: Item;
  sprite: Phaser.GameObjects.Sprite;
}

export class LootSystem {
  private droppedLoot: DroppedLoot[] = [];

  dropLoot(enemy: Enemy, scene: Phaser.Scene): void {
    for (const entry of enemy.dropTable) {
      if (Math.random() < entry.chance) {
        const item = ALL_ITEMS[entry.itemId];
        if (!item) continue;
        this.spawnLootSprite(scene, enemy.x, enemy.y, item);
      }
    }
    // Small baseline gold coin
    if (Math.random() < 0.5) {
      this.spawnGoldCoins(scene, enemy.x, enemy.y, enemy.goldReward);
    }
  }

  private spawnLootSprite(scene: Phaser.Scene, x: number, y: number, item: Item): void {
    const lootSprite = scene.add.sprite(x, y + 10, 'items', item.iconFrame)
      .setDepth(5);

    // Glow tween
    scene.tweens.add({
      targets:  lootSprite,
      alpha:    0.4,
      yoyo:     true,
      repeat:   -1,
      duration: 400,
    });

    // Bounce-in
    scene.tweens.add({
      targets: lootSprite,
      y:       y - 30,
      duration: 200,
      yoyo:     true,
    });

    const dropped: DroppedLoot = { item, sprite: lootSprite };
    this.droppedLoot.push(dropped);
    EventBus.emit(Events.LOOT_SPAWNED, dropped, x, y);
  }

  private spawnGoldCoins(scene: Phaser.Scene, x: number, y: number, amount: number): void {
    const coin = scene.add.text(x, y, `+${amount}g`, {
      fontSize: '11px', color: '#ffee00',
      fontFamily: 'monospace', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(6);

    scene.tweens.add({
      targets: coin, y: y - 40, alpha: 0, duration: 900,
      onComplete: () => coin.destroy(),
    });
  }

  /** Called by scenes to check proximity pick-up */
  tryPickUp(
    playerX: number,
    playerY: number,
    pickupRadius: number,
    onPickUp: (item: Item) => void
  ): void {
    for (let i = this.droppedLoot.length - 1; i >= 0; i--) {
      const loot   = this.droppedLoot[i];
      const distX  = Math.abs(loot.sprite.x - playerX);
      const distY  = Math.abs(loot.sprite.y - playerY);
      if (distX < pickupRadius && distY < pickupRadius) {
        onPickUp(loot.item);
        loot.sprite.destroy();
        this.droppedLoot.splice(i, 1);
      }
    }
  }

  clearAll(): void {
    for (const loot of this.droppedLoot) loot.sprite.destroy();
    this.droppedLoot = [];
  }
}
