import {Djinn} from "../Djinn";
import {GoldenSun} from "../GoldenSun";
import {SpriteBase} from "../SpriteBase";
import {elements} from "../utils";

export function initialize_djinni(djinni_db) {
    let djinni_list = {};
    for (let i = 0; i < djinni_db.length; ++i) {
        const djinn_data = djinni_db[i];
        djinni_list[djinn_data.key_name] = new Djinn(
            djinn_data.key_name,
            djinn_data.name,
            djinn_data.description,
            djinn_data.element,
            djinn_data.ability_key_name,
            djinn_data.hp_boost,
            djinn_data.pp_boost,
            djinn_data.atk_boost,
            djinn_data.def_boost,
            djinn_data.agi_boost,
            djinn_data.luk_boost,
            i
        );
    }
    return djinni_list;
}

export function initialize_djinni_sprites(game: Phaser.Game, data: GoldenSun, load_promise_resolve: () => void) {
    const actions = ["set", "standby"];
    const directions = {
        set: ["down"],
        standby: ["left", "down"],
    };
    const frames_number = 4;
    const frames_rate = {
        set: 6,
        standby: 2,
    };
    const base_path = "assets/images/spritesheets/djinn/";
    const djinni_sprites: {[element in elements]?: SpriteBase} = {};
    for (let key in elements) {
        const element: elements = elements[key];
        if (element === elements.NO_ELEMENT || element === elements.ALL_ELEMENTS) continue;
        djinni_sprites[element] = new SpriteBase(element + "_djinn", actions);
        for (let j = 0; j < actions.length; ++j) {
            const action = actions[j];
            djinni_sprites[element].setActionSpritesheet(
                action,
                `${base_path}${element}_djinn.png`,
                `${base_path}${element}_djinn.json`
            );
            djinni_sprites[element].setActionAnimations(
                action,
                directions[action],
                new Array(directions[action].length).fill(frames_number)
            );
            djinni_sprites[element].setActionFrameRate(action, frames_rate[action]);
        }
        djinni_sprites[element].generateAllFrames();
        djinni_sprites[element].loadSpritesheets(game, false);
    }
    game.load.start();
    data.loading_what = "djinn sprites";
    game.load.onLoadComplete.addOnce(load_promise_resolve);
    return djinni_sprites;
}
