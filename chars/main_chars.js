import { Classes } from '../base/Classes.js';
import { MainChar } from '../base/MainChar.js';

export let main_char_list = {};
export let classes_list = {};
export let class_table;
export let party_data = {
    members: [],
    coins: 0
};

export function initialize_classes(classes_db) {
    class_table = classes_db.class_table;
    for (let i = 0; i < classes_db.classes.length; ++i) {
        const class_data = classes_db.classes[i];
        classes_list[class_data.key_name] = new Classes(
            class_data.key_name,
            class_data.name,
            class_data.required_venus_level,
            class_data.required_mercury_level,
            class_data.required_mars_level,
            class_data.required_jupiter_level,
            class_data.hp_boost,
            class_data.pp_boost,
            class_data.atk_boost,
            class_data.def_boost,
            class_data.agi_boost,
            class_data.luk_boost,
            class_data.ability_level_pairs,
            class_data.class_type
        );
    }
}

export function initialize_main_chars(game, main_chars_db, load_promise_resolve) {
    let load_promises = [];
    for (let i = 0; i < main_chars_db.length; ++i) {
        const char_data = main_chars_db[i];
        main_char_list[char_data.key_name] = new MainChar(
            char_data.key_name,
            char_data.actions.map(action => action.key),
            i,
            char_data.walk_speed,
            char_data.dash_speed,
            char_data.climb_speed,
            char_data.push_speed,
            char_data.avatar_image_path,
            char_data.name,
            char_data.hp_curve,
            char_data.pp_curve,
            char_data.atk_curve,
            char_data.def_curve,
            char_data.agi_curve,
            char_data.luk_curve,
            char_data.exp_curve,
            char_data.starting_level,
            char_data.venus_level_base,
            char_data.mercury_level_base,
            char_data.mars_level_base,
            char_data.jupiter_level_base,
            char_data.venus_power_base,
            char_data.mercury_power_base,
            char_data.mars_power_base,
            char_data.jupiter_power_base,
            char_data.venus_resist_base,
            char_data.mercury_resist_base,
            char_data.mars_resist_base,
            char_data.jupiter_resist_base,
            char_data.innate_abilities,
            char_data.in_party
        );
        if (char_data.in_party) {
            party_data.members.push(main_char_list[char_data.key_name]);
        }
        for (let j = 0; j < char_data.actions.length; ++j) {
            const action = char_data.actions[j];
            main_char_list[char_data.key_name].setActionSpritesheet(action.key, action.spritesheet_img, action.spritesheet);
            main_char_list[char_data.key_name].setActionDirections(action.key, action.directions, action.directions_frames_number);
            main_char_list[char_data.key_name].setActionFrameRate(action.key, action.frame_rate);
        }
        main_char_list[char_data.key_name].addAnimations();

        let load_spritesheet_promise_resolve;
        let load_spritesheet_promise = new Promise(resolve => {
            load_spritesheet_promise_resolve = resolve;
        });
        load_promises.push(load_spritesheet_promise);
        main_char_list[char_data.key_name].loadSpritesheets(game, true, load_spritesheet_promise_resolve);

        let load_other_assets_promise_resolve;
        let load_other_assets_promise = new Promise(resolve => {
            load_other_assets_promise_resolve = resolve;
        });
        load_promises.push(load_other_assets_promise);
        main_char_list[char_data.key_name].load_assets(load_other_assets_promise_resolve);
    }
    Promise.all(load_promises).then(load_promise_resolve);
}