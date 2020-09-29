import { Shop } from '../base/Shop.js';

export function initialize_shops(game, shops_db, load_promise_resolve) {
    let shops_list = {};
    for (let i = 0; i < shops_db.length; ++i) {
        const shop_data = shops_db[i];
        shops_list[shop_data.key_name] = new Shop(
            shop_data.key_name,
            shop_data.shop_type,
            shop_data.dialog_key,
            shop_data.avatar_key,
            shop_data.item_list
        );
    }
    load_promise_resolve();
    game.load.start();
    return shops_list;
}