// Enchantment.ts — Passive stat modifiers that apply when added to inventory
import { Item, ItemRarity } from './Item.js';
export class Enchantment extends Item {
    constructor(id, name, rarity, iconFrame, description, statKey, bonus) {
        super(id, name, rarity, iconFrame, description);
        this.statKey = statKey;
        this.bonus = bonus;
    }
    applyEffect(player) {
        player.stats[this.statKey] += this.bonus;
    }
}
export const EnchantmentCatalog = {
    speed_rune: new Enchantment('speed_rune', 'Speed Rune', ItemRarity.UNCOMMON, 30, '+15 movement speed.', 'speed', 15),
    lucky_charm: new Enchantment('lucky_charm', 'Lucky Charm', ItemRarity.RARE, 31, '+12 luck (better drops).', 'luck', 12),
    iron_will: new Enchantment('iron_will', 'Iron Will', ItemRarity.EPIC, 32, '+8 defense.', 'defense', 8),
};
//# sourceMappingURL=Enchantment.js.map