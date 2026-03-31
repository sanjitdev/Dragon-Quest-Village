// Totem.ts — Special items that grant persistent abilities
import { Item, ItemRarity } from './Item.js';
export class Totem extends Item {
    constructor(id, name, rarity, iconFrame, description) {
        super(id, name, rarity, iconFrame, description);
        this.active = false;
    }
    activate(player) {
        if (this.active)
            return;
        this.active = true;
        this.applyEffect(player);
    }
    deactivate(player) {
        if (!this.active)
            return;
        this.active = false;
        this.removeEffect(player);
    }
}
// ── Concrete totems ────────────────────────────────────────────────────────
export class DoubleJumpTotem extends Totem {
    constructor() {
        super('totem_doublejump', 'Feather Totem', ItemRarity.UNCOMMON, 20, 'Grants the power of double jump.');
    }
    applyEffect(player) { player.canDoubleJump = true; }
    removeEffect(player) { player.canDoubleJump = false; }
}
export class FireTotem extends Totem {
    constructor() {
        super('totem_fire', 'Flame Totem', ItemRarity.RARE, 21, 'Wreath your attacks in fire. +8 attack.');
    }
    applyEffect(player) { player.stats.attack += 8; }
    removeEffect(player) { player.stats.attack -= 8; }
}
export class ShieldTotem extends Totem {
    constructor() {
        super('totem_shield', 'Shield Totem', ItemRarity.RARE, 22, 'A protective aura. +10 defense.');
    }
    applyEffect(player) { player.stats.defense += 10; }
    removeEffect(player) { player.stats.defense -= 10; }
}
export class RegenTotem extends Totem {
    constructor() {
        super('totem_regen', 'Life Totem', ItemRarity.EPIC, 23, 'Slowly regenerates HP over time.');
    }
    applyEffect(player) {
        this.interval = setInterval(() => { if (player.isAlive)
            player.heal(2); }, 2000);
    }
    removeEffect(_player) {
        if (this.interval !== undefined)
            clearInterval(this.interval);
    }
}
export const TotemCatalog = {
    totem_doublejump: new DoubleJumpTotem(),
    totem_fire: new FireTotem(),
    totem_shield: new ShieldTotem(),
    totem_regen: new RegenTotem(),
};
//# sourceMappingURL=Totem.js.map