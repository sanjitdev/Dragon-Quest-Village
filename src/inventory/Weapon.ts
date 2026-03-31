// Weapon.ts

import { Item, ItemRarity } from './Item.js';
import type { Player } from '../entities/Player.js';

export class Weapon extends Item {
  readonly attackBonus: number;
  readonly defenseBonus: number;

  constructor(
    id: string,
    name: string,
    rarity: ItemRarity,
    iconFrame: number,
    description: string,
    attackBonus: number,
    defenseBonus: number = 0
  ) {
    super(id, name, rarity, iconFrame, description);
    this.attackBonus  = attackBonus;
    this.defenseBonus = defenseBonus;
  }

  applyEffect(player: Player): void {
    player.equipWeapon(this);
  }
}

// ── Predefined weapons ─────────────────────────────────────────────────────

export const WeaponCatalog: Record<string, Weapon> = {
  short_sword: new Weapon(
    'short_sword', 'Short Sword', ItemRarity.COMMON, 0,
    'A worn iron blade.', 6
  ),
  long_sword: new Weapon(
    'long_sword', 'Long Sword', ItemRarity.UNCOMMON, 1,
    'A trusty adventurer\'s sword.', 14
  ),
  flame_blade: new Weapon(
    'flame_blade', 'Flame Blade', ItemRarity.RARE, 2,
    'Sears with every strike.', 22, 2
  ),
  dragon_slayer: new Weapon(
    'dragon_slayer', 'Dragon Slayer', ItemRarity.LEGENDARY, 3,
    'Forged to end the ancient evil.', 40, 5
  ),
};
