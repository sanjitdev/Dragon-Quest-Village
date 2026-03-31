// Inventory.ts — Container that holds and manages items
import { Weapon } from './Weapon.js';
import { Potion } from './Potion.js';
import { Totem } from './Totem.js';
import { Enchantment } from './Enchantment.js';
import { EventBus, Events } from '../core/EventBus.js';
export class Inventory {
    constructor(maxSize = 24) {
        this._items = [];
        this.maxSize = maxSize;
    }
    // ── Accessors ──────────────────────────────────────────────────────────────
    get items() { return [...this._items]; }
    get size() { return this._items.length; }
    get isFull() { return this._items.length >= this.maxSize; }
    // ── Mutation ───────────────────────────────────────────────────────────────
    addItem(item) {
        if (this.isFull)
            return false;
        this._items.push(item);
        EventBus.emit(Events.ITEM_PICKED_UP, item);
        return true;
    }
    removeItem(item) {
        const idx = this._items.indexOf(item);
        if (idx !== -1)
            this._items.splice(idx, 1);
    }
    removeById(id) {
        const idx = this._items.findIndex(i => i.id === id);
        if (idx === -1)
            return undefined;
        return this._items.splice(idx, 1)[0];
    }
    hasItem(id) {
        return this._items.some(i => i.id === id);
    }
    getById(id) {
        return this._items.find(i => i.id === id);
    }
    // ── Typed views ────────────────────────────────────────────────────────────
    get weapons() { return this._items.filter((i) => i instanceof Weapon); }
    get potions() { return this._items.filter((i) => i instanceof Potion); }
    get totems() { return this._items.filter((i) => i instanceof Totem); }
    get enchantments() { return this._items.filter((i) => i instanceof Enchantment); }
    // ── Use item ───────────────────────────────────────────────────────────────
    useItem(item, player) {
        item.applyEffect(player);
        // Consumables are removed on use
        if (item instanceof Potion) {
            this.removeItem(item);
        }
        EventBus.emit(Events.UI_REFRESH);
    }
}
//# sourceMappingURL=Inventory.js.map