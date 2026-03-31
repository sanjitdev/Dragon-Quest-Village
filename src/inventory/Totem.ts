// Totem.ts — Special items that grant persistent abilities

import { Item, ItemRarity } from './Item.js';
import type { Player } from '../entities/Player.js';

export abstract class Totem extends Item {
  protected active: boolean = false;

  constructor(
    id: string,
    name: string,
    rarity: ItemRarity,
    iconFrame: number,
    description: string
  ) {
    super(id, name, rarity, iconFrame, description);
  }

  activate(player: Player): void {
    if (this.active) return;
    this.active = true;
    this.applyEffect(player);
  }

  deactivate(player: Player): void {
    if (!this.active) return;
    this.active = false;
    this.removeEffect(player);
  }

  abstract removeEffect(player: Player): void;
}

// ── Concrete totems ────────────────────────────────────────────────────────

export class DoubleJumpTotem extends Totem {
  constructor() {
    super('totem_doublejump', 'Feather Totem', ItemRarity.UNCOMMON, 20,
      'Grants the power of double jump.');
  }
  applyEffect(player: Player): void  { player.canDoubleJump = true; }
  removeEffect(player: Player): void { player.canDoubleJump = false; }
}

export class FireTotem extends Totem {
  constructor() {
    super('totem_fire', 'Flame Totem', ItemRarity.RARE, 21,
      'Wreath your attacks in fire. +8 attack.');
  }
  applyEffect(player: Player): void  { (player as unknown as { stats: { attack: number } }).stats.attack += 8; }
  removeEffect(player: Player): void { (player as unknown as { stats: { attack: number } }).stats.attack -= 8; }
}

export class ShieldTotem extends Totem {
  constructor() {
    super('totem_shield', 'Shield Totem', ItemRarity.RARE, 22,
      'A protective aura. +10 defense.');
  }
  applyEffect(player: Player): void  { (player as unknown as { stats: { defense: number } }).stats.defense += 10; }
  removeEffect(player: Player): void { (player as unknown as { stats: { defense: number } }).stats.defense -= 10; }
}

export class RegenTotem extends Totem {
  private interval?: ReturnType<typeof setInterval>;

  constructor() {
    super('totem_regen', 'Life Totem', ItemRarity.EPIC, 23,
      'Slowly regenerates HP over time.');
  }
  applyEffect(player: Player): void {
    this.interval = setInterval(() => { if (player.isAlive) player.heal(2); }, 2000);
  }
  removeEffect(_player: Player): void {
    if (this.interval !== undefined) clearInterval(this.interval);
  }
}

export const TotemCatalog: Record<string, Totem> = {
  totem_doublejump: new DoubleJumpTotem(),
  totem_fire:       new FireTotem(),
  totem_shield:     new ShieldTotem(),
  totem_regen:      new RegenTotem(),
};
