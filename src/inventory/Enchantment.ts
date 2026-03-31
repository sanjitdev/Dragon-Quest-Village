// Enchantment.ts — Passive stat modifiers that apply when added to inventory

import { Item, ItemRarity } from './Item.js';
import type { Player } from '../entities/Player.js';

export class Enchantment extends Item {
  readonly statKey: 'attack' | 'defense' | 'speed' | 'luck';
  readonly bonus: number;

  constructor(
    id: string,
    name: string,
    rarity: ItemRarity,
    iconFrame: number,
    description: string,
    statKey: 'attack' | 'defense' | 'speed' | 'luck',
    bonus: number
  ) {
    super(id, name, rarity, iconFrame, description);
    this.statKey = statKey;
    this.bonus   = bonus;
  }

  applyEffect(player: Player): void {
    (player as unknown as { stats: Record<string, number> }).stats[this.statKey] += this.bonus;
  }
}

export const EnchantmentCatalog: Record<string, Enchantment> = {
  speed_rune: new Enchantment(
    'speed_rune', 'Speed Rune', ItemRarity.UNCOMMON, 30,
    '+15 movement speed.', 'speed', 15
  ),
  lucky_charm: new Enchantment(
    'lucky_charm', 'Lucky Charm', ItemRarity.RARE, 31,
    '+12 luck (better drops).', 'luck', 12
  ),
  iron_will: new Enchantment(
    'iron_will', 'Iron Will', ItemRarity.EPIC, 32,
    '+8 defense.', 'defense', 8
  ),
};
