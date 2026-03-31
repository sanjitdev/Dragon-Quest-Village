// Potion.ts
import { Item, ItemRarity } from './Item.js';
export class Potion extends Item {
    constructor(id, name, rarity, iconFrame, description, healAmount) {
        super(id, name, rarity, iconFrame, description);
        this.healAmount = healAmount;
    }
    applyEffect(player) {
        player.heal(this.healAmount);
    }
}
export const PotionCatalog = {
    potion_small: new Potion('potion_small', 'Small Potion', ItemRarity.COMMON, 10, 'Restores 20 HP.', 20),
    potion_medium: new Potion('potion_medium', 'Potion', ItemRarity.UNCOMMON, 11, 'Restores 50 HP.', 50),
    potion_large: new Potion('potion_large', 'Mega Potion', ItemRarity.RARE, 12, 'Restores 100 HP.', 100),
};
//# sourceMappingURL=Potion.js.map