import {GoldenSun} from "../GoldenSun";
import {Shop} from "../main_menus/ShopMenu";

export function initialize_shops(data: GoldenSun, shops_db: any) {
    let shops_list = {};
    for (let i = 0; i < shops_db.length; ++i) {
        const shop_data: Shop = shops_db[i];
        if (shop_data.key_name) {
            shops_list[shop_data.key_name] = shop_data;
            shop_data.item_list.forEach(item_data => {
                item_data.global_artifact = false;
            });
        } else {
            data.logger.log_message("Shop registered without a key name. Please double-check.");
        }
    }
    return shops_list;
}
