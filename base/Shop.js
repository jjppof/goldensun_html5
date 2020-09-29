export const shop_types = {
    WEAPON: "weapon_shop",
    ARMOR: "armor_shop",
    MEDICINE: "medicine_shop",
    GENERAL: "general_shop",
};

export class Shop {
    constructor(
        key_name,
        shop_type,
        dialog_key,
        avatar_key,
        item_list,
    ) {
        this.key_name = key_name;
        this.shop_type = shop_type;
        this.dialog_key = dialog_key;
        this.avatar_key = avatar_key;
        this.item_list = item_list;
    }
}