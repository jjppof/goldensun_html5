import { Djinn } from '../Djinn.js';
import { SpriteBase } from '../SpriteBase.js';
import { elements } from '../utils.js';

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

export function initialize_djinni_sprites(game, load_promise_resolve) {
    const actions = ["set", "standby"];
    const directions = {
        set: ["down"],
        standby: ["left", "down"]
    };
    const frames_number = 4;
    const frames_rate = {
        set: 6,
        standby: 2
    };
    const base_path = "assets/images/spritesheets/djinn/";
    let load_promises = [];
    let djinni_sprites = {};
    for (let key in elements) {
        const element = elements[key];
        if (element === elements.NO_ELEMENT) continue;
        djinni_sprites[element] = new SpriteBase(element + "_djinn", actions);
        for (let j = 0; j < actions.length; ++j) {
            const action = actions[j];
            djinni_sprites[element].setActionSpritesheet(action, `${base_path}${element}_djinn.png`, `${base_path}${element}_djinn.json`);
            djinni_sprites[element].setActionDirections(action, directions[action], new Array(directions[action].length).fill(frames_number));
            djinni_sprites[element].setActionFrameRate(action, frames_rate[action]);
        }
        djinni_sprites[element].generateAllFrames();

        let load_spritesheet_promise_resolve;
        const load_spritesheet_promise = new Promise(resolve => {
            load_spritesheet_promise_resolve = resolve;
        });
        load_promises.push(load_spritesheet_promise);
        djinni_sprites[element].loadSpritesheets(game, true, load_spritesheet_promise_resolve);
    }
    Promise.all(load_promises).then(load_promise_resolve);
    return djinni_sprites;
}