// Potion.ts

import { Item, ItemRarity } from './Item.js';
import type { Player } from '../entities/Player.js';

export class Potion extends Item {
  readonly healAmount: number;

  constructor(
    id: string,
    name: string,
    rarity: ItemRarity,
    iconFrame: number,
    description: string,
    healAmount: number
  ) {
    super(id, name, rarity, iconFrame, description);
    this.healAmount = healAmount;
  }

  applyEffect(player: Player): void {
    player.heal(this.healAmount);
  }
}

export const PotionCatalog: Record<string, Potion> = {
  potion_small: new Potion(
    'potion_small', 'Small Potion', ItemRarity.COMMON, 10,
    'Restores 20 HP.', 20
  ),
  potion_medium: new Potion(
    'potion_medium', 'Potion', ItemRarity.UNCOMMON, 11,
    'Restores 50 HP.', 50
  ),
  potion_large: new Potion(
    'potion_large', 'Mega Potion', ItemRarity.RARE, 12,
    'Restores 100 HP.', 100
  ),
};
