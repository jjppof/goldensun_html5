import {GoldenSun} from "../GoldenSun";
import {Item} from "../Item";
import {GameInfo} from "./initialize_info";

export function initialize_items(game: Phaser.Game, data: GoldenSun, items_db: any, load_promise_resolve: () => void) {
    const items_list: GameInfo["items_list"] = {};
    for (let i = 0; i < items_db.length; ++i) {
        const item_data = items_db[i];
        if (item_data.key_name) {
            items_list[item_data.key_name] = new Item(
                item_data.key_name,
                item_data.name,
                item_data.type,
                item_data.description,
                item_data.use_type,
                item_data.curses_when_equipped,
                item_data.cant_be_removed,
                item_data.rare_item,
                item_data.important_item,
                item_data.carry_up_to_30,
                item_data.effects,
                item_data.element,
                item_data.attack_ability,
                item_data.unleash_ability,
                item_data.unleash_rate,
                item_data.use_ability,
                item_data.equipable_chars,
                item_data.price,
                item_data.granted_ability,
                item_data.granted_class_type,
                item_data.weapon_type,
                item_data.items_after_forge,
                i
            );
        } else {
            data.logger.log_message("Item registered without a key name. Please double-check.");
        }
    }
    const loader = game.load.atlasJSONHash(
        "items_icons",
        "assets/images/icons/items/items_icons.png",
        "assets/images/icons/items/items_icons.json"
    );
    loader.onLoadComplete.addOnce(load_promise_resolve);
    game.load.start();
    data.set_whats_loading("items icons");
    return items_list;
}
