// Item.ts — Abstract base class for all inventory items
export var ItemRarity;
(function (ItemRarity) {
    ItemRarity["COMMON"] = "Common";
    ItemRarity["UNCOMMON"] = "Uncommon";
    ItemRarity["RARE"] = "Rare";
    ItemRarity["EPIC"] = "Epic";
    ItemRarity["LEGENDARY"] = "Legendary";
})(ItemRarity || (ItemRarity = {}));
export const RarityColor = {
    [ItemRarity.COMMON]: '#aaaaaa',
    [ItemRarity.UNCOMMON]: '#44bb44',
    [ItemRarity.RARE]: '#4444ff',
    [ItemRarity.EPIC]: '#aa44ff',
    [ItemRarity.LEGENDARY]: '#ffaa00',
};
export class Item {
    constructor(id, name, rarity, iconFrame, description) {
        this.id = id;
        this.name = name;
        this.rarity = rarity;
        this.iconFrame = iconFrame;
        this.description = description;
    }
}
//# sourceMappingURL=Item.js.map