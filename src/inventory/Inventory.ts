// Inventory.ts — Container that holds and manages items

import { Item } from './Item.js';
import { Weapon } from './Weapon.js';
import { Potion } from './Potion.js';
import { Totem } from './Totem.js';
import { Enchantment } from './Enchantment.js';
import { EventBus, Events } from '../core/EventBus.js';
import type { Player } from '../entities/Player.js';

export class Inventory {
  private _items: Item[] = [];
  private readonly maxSize: number;

  constructor(maxSize: number = 24) {
    this.maxSize = maxSize;
  }

  // ── Accessors ──────────────────────────────────────────────────────────────

  get items(): Item[] { return [...this._items]; }
  get size(): number  { return this._items.length; }
  get isFull(): boolean { return this._items.length >= this.maxSize; }

  // ── Mutation ───────────────────────────────────────────────────────────────

  addItem(item: Item): boolean {
    if (this.isFull) return false;
    this._items.push(item);
    EventBus.emit(Events.ITEM_PICKED_UP, item);
    return true;
  }

  removeItem(item: Item): void {
    const idx = this._items.indexOf(item);
    if (idx !== -1) this._items.splice(idx, 1);
  }

  removeById(id: string): Item | undefined {
    const idx = this._items.findIndex(i => i.id === id);
    if (idx === -1) return undefined;
    return this._items.splice(idx, 1)[0];
  }

  hasItem(id: string): boolean {
    return this._items.some(i => i.id === id);
  }

  getById(id: string): Item | undefined {
    return this._items.find(i => i.id === id);
  }

  // ── Typed views ────────────────────────────────────────────────────────────

  get weapons():      Weapon[]      { return this._items.filter((i): i is Weapon      => i instanceof Weapon);      }
  get potions():      Potion[]      { return this._items.filter((i): i is Potion      => i instanceof Potion);      }
  get totems():       Totem[]       { return this._items.filter((i): i is Totem       => i instanceof Totem);       }
  get enchantments(): Enchantment[] { return this._items.filter((i): i is Enchantment => i instanceof Enchantment); }

  // ── Use item ───────────────────────────────────────────────────────────────

  useItem(item: Item, player: Player): void {
    item.applyEffect(player);
    // Consumables are removed on use
    if (item instanceof Potion) {
      this.removeItem(item);
    }
    EventBus.emit(Events.UI_REFRESH);
  }
}
