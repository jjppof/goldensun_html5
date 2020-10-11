import { Shop } from '../Shop.js';

export function initialize_shops(game, shops_db) {
    let shops_list = {};
    for (let i = 0; i < shops_db.length; ++i) {
        const shop_data = shops_db[i];
        shops_list[shop_data.key_name] = new Shop(
            shop_data.key_name,
            shop_data.dialog_key,
            shop_data.avatar_key,
            shop_data.item_list
        );
    }
    return shops_list;
}