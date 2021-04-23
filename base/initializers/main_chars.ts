import {Classes} from "../Classes";
import {GoldenSun} from "../GoldenSun";
import {MainChar} from "../MainChar";
import {SpriteBase} from "../SpriteBase";
import {base_actions} from "../utils";

export function initialize_classes(classes_db) {
    let classes_list = {};
    for (let i = 0; i < classes_db.classes.length; ++i) {
        const class_data = classes_db.classes[i];
        classes_list[class_data.key_name] = new Classes(
            class_data.key_name,
            class_data.name,
            class_data.required_level,
            class_data.hp_boost,
            class_data.pp_boost,
            class_data.atk_boost,
            class_data.def_boost,
            class_data.agi_boost,
            class_data.luk_boost,
            class_data.ability_level_pairs,
            class_data.class_type,
            class_data.vulnerabilities
        );
    }
    return classes_list;
}

export function initialize_main_chars(
    game: Phaser.Game,
    data: GoldenSun,
    main_chars_db,
    classes_db,
    npc_db,
    load_promise_resolve: () => void
) {
    const main_char_list = {};
    for (let i = 0; i < main_chars_db.length; ++i) {
        const char_data = main_chars_db[i];
        const char_db = npc_db[char_data.key_name];
        const sprite_base = new SpriteBase(char_data.key_name, Object.keys(char_db.actions));
        const weapons_sprite_base = new SpriteBase(
            `${char_data.key_name}_weapons`,
            Object.keys(char_data.weapons_sprites)
        );
        main_char_list[char_data.key_name] = new MainChar(
            char_data.key_name,
            data.info,
            sprite_base,
            weapons_sprite_base,
            char_data.name,
            char_data.hp_curve,
            char_data.pp_curve,
            char_data.atk_curve,
            char_data.def_curve,
            char_data.agi_curve,
            char_data.luk_curve,
            char_data.exp_curve,
            char_data.starting_level,
            classes_db.class_table,
            char_data.battle_scale,
            char_data.base_level,
            char_data.base_power,
            char_data.base_resist,
            char_data.innate_abilities,
            char_data.in_party,
            char_data.djinni,
            char_data.items,
            char_data.battle_animations_variations,
            char_data.battle_shadow_key,
            char_data.status_sprite_shift,
            char_data.special_class_type,
            char_data.weapon_sprite_shift
        );
        if (char_data.in_party) {
            MainChar.add_member_to_party(data.info.party_data, main_char_list[char_data.key_name]);
        }

        for (let action_key in char_db.actions) {
            const action = char_db.actions[action_key];
            sprite_base.setActionSpritesheet(action_key, action.spritesheet.image, action.spritesheet.json);
            sprite_base.setActionAnimations(action_key, action.animations, action.frames_count);
            sprite_base.setActionFrameRate(action_key, action.frame_rate);
            sprite_base.setActionLoop(action_key, action.loop);
        }
        sprite_base.generateAllFrames();
        sprite_base.loadSpritesheets(game, false);

        if (Object.keys(char_data.weapons_sprites).length && base_actions.BATTLE in char_db.actions) {
            const action = char_db.actions[base_actions.BATTLE];
            for (let weapon_type in char_data.weapons_sprites) {
                const paths = char_data.weapons_sprites[weapon_type].spritesheet;
                weapons_sprite_base.setActionSpritesheet(weapon_type, paths.image, paths.json);
                weapons_sprite_base.setActionAnimations(weapon_type, action.animations, action.frames_count);
                weapons_sprite_base.setActionFrameRate(weapon_type, action.frame_rate);
                weapons_sprite_base.setActionLoop(weapon_type, action.loop);
            }
            weapons_sprite_base.generateAllFrames();
            weapons_sprite_base.loadSpritesheets(game, false);
        }
    }
    game.load.start();
    data.loading_what = "main chars sprites";
    game.load.onLoadComplete.addOnce(load_promise_resolve);
    return main_char_list;
}
