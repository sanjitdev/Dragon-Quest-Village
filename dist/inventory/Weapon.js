// Weapon.ts
import { Item, ItemRarity } from './Item.js';
export class Weapon extends Item {
    constructor(id, name, rarity, iconFrame, description, attackBonus, defenseBonus = 0) {
        super(id, name, rarity, iconFrame, description);
        this.attackBonus = attackBonus;
        this.defenseBonus = defenseBonus;
    }
    applyEffect(player) {
        player.equipWeapon(this);
    }
}
// ── Predefined weapons ─────────────────────────────────────────────────────
export const WeaponCatalog = {
    short_sword: new Weapon('short_sword', 'Short Sword', ItemRarity.COMMON, 0, 'A worn iron blade.', 6),
    long_sword: new Weapon('long_sword', 'Long Sword', ItemRarity.UNCOMMON, 1, 'A trusty adventurer\'s sword.', 14),
    flame_blade: new Weapon('flame_blade', 'Flame Blade', ItemRarity.RARE, 2, 'Sears with every strike.', 22, 2),
    dragon_slayer: new Weapon('dragon_slayer', 'Dragon Slayer', ItemRarity.LEGENDARY, 3, 'Forged to end the ancient evil.', 40, 5),
};
//# sourceMappingURL=Weapon.js.map