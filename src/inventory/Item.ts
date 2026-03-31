// Item.ts — Abstract base class for all inventory items

import type { Player } from '../entities/Player.js';

export enum ItemRarity {
  COMMON    = 'Common',
  UNCOMMON  = 'Uncommon',
  RARE      = 'Rare',
  EPIC      = 'Epic',
  LEGENDARY = 'Legendary',
}

export const RarityColor: Record<ItemRarity, string> = {
  [ItemRarity.COMMON]:    '#aaaaaa',
  [ItemRarity.UNCOMMON]:  '#44bb44',
  [ItemRarity.RARE]:      '#4444ff',
  [ItemRarity.EPIC]:      '#aa44ff',
  [ItemRarity.LEGENDARY]: '#ffaa00',
};

export abstract class Item {
  readonly id: string;
  readonly name: string;
  readonly rarity: ItemRarity;
  readonly iconFrame: number;
  readonly description: string;

  constructor(
    id: string,
    name: string,
    rarity: ItemRarity,
    iconFrame: number,
    description: string
  ) {
    this.id          = id;
    this.name        = name;
    this.rarity      = rarity;
    this.iconFrame   = iconFrame;
    this.description = description;
  }

  /** Apply this item's effect to the player. Override in subclasses. */
  abstract applyEffect(player: Player): void;
}
