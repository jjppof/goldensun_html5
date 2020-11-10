import * as _ from "lodash";

export function load_databases(game, dbs) {
    // initializing json database data
    dbs.init_db = game.cache.getJSON("init_db");
    dbs.npc_db = game.cache.getJSON("npc_db");
    dbs.interactable_objects_db = game.cache.getJSON("interactable_objects_db");
    dbs.misc_animations_db = game.cache.getJSON("misc_animations_db");
    dbs.classes_db = game.cache.getJSON("classes_db");
    dbs.abilities_db = game.cache.getJSON("abilities_db");
    dbs.items_db = game.cache.getJSON("items_db");
    dbs.djinni_db = game.cache.getJSON("djinni_db");
    dbs.enemies_db = game.cache.getJSON("enemies_db");
    dbs.enemies_parties_db = game.cache.getJSON("enemies_parties_db");
    dbs.maps_db = game.cache.getJSON("maps_db");
    dbs.main_chars_db = game.cache.getJSON("main_chars_db");
    dbs.summons_db = game.cache.getJSON("summons_db");
    dbs.shopkeep_dialog_db = game.cache.getJSON("shopkeep_dialog_db");
    dbs.shops_db = game.cache.getJSON("shops_db");

    //format some db structures
    dbs.shopkeep_dialog_db = _.mapKeys(dbs.shopkeep_dialog_db, shopkeep_dialog => shopkeep_dialog.key_name);
    dbs.interactable_objects_db = _.mapKeys(
        dbs.interactable_objects_db,
        interactable_object_data => interactable_object_data.key_name
    );
    dbs.enemies_parties_db = _.mapKeys(dbs.enemies_parties_db, enemy_party_data => enemy_party_data.key_name);
    dbs.npc_db = _.mapKeys(dbs.npc_db, npc_data => npc_data.key_name);
}
