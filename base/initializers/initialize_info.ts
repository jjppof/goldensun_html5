import {initialize_main_chars, initialize_classes} from "./main_chars";
import {initialize_abilities, initialize_field_abilities} from "./abilities";
import {initialize_items} from "./items";
import {initialize_djinni, initialize_djinni_sprites} from "./djinni";
import {initialize_enemies} from "./enemies";
import {initialize_maps} from "./maps";
import {initialize_misc_data} from "./misc_data";
import {initialize_shops} from "./shops";
import {initialize_inn} from "./inn";
import {initialize_interactable_objs_data} from "./interactable_objects";
import {MainChar} from "../MainChar";
import {Classes} from "../Classes";
import {Map} from "../Map";
import {SpriteBase} from "../SpriteBase";
import {Djinn} from "../Djinn";
import {Ability} from "../Ability";
import {Item} from "../Item";
import {Inn} from "../Inn";
import {Shop} from "../Shop";
import {FieldAbilities} from "../field_abilities/FieldAbilities";
import {Summon} from "../Summon";
import {GoldenSun} from "../GoldenSun";
import {initialize_summons} from "./summons";
import {initialize_se} from "./sound_effects";
import {initialize_npcs_data} from "./npcs";

export type PartyData = {
    members: MainChar[];
    coins: number;
    game_tickets: {
        coins_remaining: number;
        tickets_bought: number;
    };
};

export type GameInfo = {
    maps_list: {[map_key: string]: Map};
    classes_list: {[class_key: string]: Classes};
    enemies_list: {
        [enemy_key: string]: {
            data: any;
            sprite_base: SpriteBase;
        };
    };
    djinni_list: {[djinn_key: string]: Djinn};
    djinni_sprites: {[djinn_key: string]: SpriteBase};
    abilities_list: {[ability_key: string]: Ability};
    items_list: {[item_key: string]: Item};
    party_data: PartyData;
    main_char_list: {[main_char_key: string]: MainChar};
    misc_sprite_base_list: {[misc_key: string]: SpriteBase};
    iter_objs_sprite_base_list: {[iter_obj_key: string]: SpriteBase};
    npcs_sprite_base_list: {[npc_key: string]: SpriteBase};
    shops_list: {[shop_key: string]: Shop};
    inn_list: {[inn_id: string]: Inn};
    summons_list: {[summon_key: string]: Summon};
    field_abilities_list: {[field_psynergy_key: string]: FieldAbilities};
};

export async function initialize_game_data(game: Phaser.Game, data: GoldenSun) {
    let load_maps_promise_resolve;
    const load_maps_promise = new Promise(resolve => {
        load_maps_promise_resolve = resolve;
    });
    data.info.maps_list = initialize_maps(game, data, data.dbs.maps_db, load_maps_promise_resolve);
    await load_maps_promise;

    data.info.classes_list = initialize_classes(data.dbs.classes_db);

    let load_enemies_sprites_promise_resolve;
    const load_enemies_sprites_promise = new Promise(resolve => {
        load_enemies_sprites_promise_resolve = resolve;
    });
    data.info.enemies_list = initialize_enemies(game, data, data.dbs.enemies_db, load_enemies_sprites_promise_resolve);
    await load_enemies_sprites_promise;

    data.info.djinni_list = initialize_djinni(data.dbs.djinni_db);

    let load_djinni_sprites_promise_resolve;
    const load_djinni_sprites_promise = new Promise(resolve => {
        load_djinni_sprites_promise_resolve = resolve;
    });
    data.info.djinni_sprites = initialize_djinni_sprites(game, data, load_djinni_sprites_promise_resolve);
    await load_djinni_sprites_promise;

    let load_abilities_promise_resolve;
    const load_abilities_promise = new Promise(resolve => {
        load_abilities_promise_resolve = resolve;
    });
    data.info.abilities_list = initialize_abilities(game, data, data.dbs.abilities_db, load_abilities_promise_resolve);
    await load_abilities_promise;

    let load_items_promise_resolve;
    const load_items_promise = new Promise(resolve => {
        load_items_promise_resolve = resolve;
    });
    data.info.items_list = initialize_items(game, data, data.dbs.items_db, load_items_promise_resolve);
    await load_items_promise;

    data.info.party_data = {
        members: [],
        coins: data.dbs.init_db.coins,
        game_tickets: {coins_remaining: 300, tickets_bought: 0},
    };

    let load_chars_promise_resolve;
    const load_chars_promise = new Promise(resolve => {
        load_chars_promise_resolve = resolve;
    });
    data.info.main_char_list = initialize_main_chars(
        game,
        data,
        data.dbs.main_chars_db,
        data.dbs.classes_db,
        data.dbs.npc_db,
        load_chars_promise_resolve
    );
    await load_chars_promise;

    let load_misc_promise_resolve;
    const load_misc_promise = new Promise(resolve => {
        load_misc_promise_resolve = resolve;
    });
    data.info.misc_sprite_base_list = initialize_misc_data(
        game,
        data,
        data.dbs.misc_animations_db,
        load_misc_promise_resolve
    );
    await load_misc_promise;

    let load_iter_objs_promise_resolve;
    const load_iter_objs_promise = new Promise(resolve => {
        load_iter_objs_promise_resolve = resolve;
    });
    data.info.iter_objs_sprite_base_list = initialize_interactable_objs_data(
        game,
        data,
        data.dbs.interactable_objects_db,
        load_iter_objs_promise_resolve
    );
    await load_iter_objs_promise;

    let load_npcs_promise_resolve;
    const load_npcs_promise = new Promise(resolve => {
        load_npcs_promise_resolve = resolve;
    });
    data.info.npcs_sprite_base_list = initialize_npcs_data(game, data, data.dbs.npc_db, load_npcs_promise_resolve);
    await load_npcs_promise;

    data.info.shops_list = initialize_shops(data.dbs.shops_db);

    data.info.inn_list = initialize_inn(data.dbs.inn_db);

    data.info.summons_list = initialize_summons(data.dbs.summons_db);

    data.info.field_abilities_list = initialize_field_abilities(game, data);

    let load_se_promise_resolve;
    const load_se_promise = new Promise(resolve => {
        load_se_promise_resolve = resolve;
    });
    const se_data = game.cache.getJSON("se_data");
    initialize_se(game, data, se_data, load_se_promise_resolve);
    await load_se_promise;
}
