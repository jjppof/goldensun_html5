import { Djinn } from '../base/Djinn.js';
import { elements } from '../base/MainChar.js';
import { SpriteBase } from '../base/SpriteBase.js';

export let djinni_list = {};
export let djinni_sprites = {}

export function initialize_djinni(game, djinni_db, load_promise_resolve) {
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

    const actions = ["set", "standby"];
    const directions = {
        set: ["down"],
        standby: ["left", "down"]
    };
    const frames_number = 4;
    const frames_rate = 4;
    const base_path = "assets/images/spritesheets/";
    let load_promises = [];
    for (let key in elements) {
        const element = elements[key];
        if (element === elements.NO_ELEMENT) continue;
        djinni_sprites[element] = new SpriteBase(element + "_djinn", actions);
        for (let j = 0; j < actions.length; ++j) {
            const action = actions[j];
            djinni_sprites[element].setActionSpritesheet(action, `${base_path}${element}_djinn.png`, `${base_path}${element}_djinn.json`);
            djinni_sprites[element].setActionDirections(action, directions[action], frames_number);
            djinni_sprites[element].setActionFrameRate(action, frames_rate);
        }
        djinni_sprites[element].addAnimations();

        let load_spritesheet_promise_resolve;
        let load_spritesheet_promise = new Promise(resolve => {
            load_spritesheet_promise_resolve = resolve;
        });
        load_promises.push(load_spritesheet_promise);
        djinni_sprites[element].loadSpritesheets(game, true, load_spritesheet_promise_resolve);
    }
    Promise.all(load_promises).then(load_promise_resolve);
}