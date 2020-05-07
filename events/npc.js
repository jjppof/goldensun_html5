import { DialogManager, set_dialog } from '../base/Window.js';
import { NPC } from '../base/NPC.js';
import * as utils from '../utils.js';
import * as numbers from '../magic_numbers.js';
import { change_hero_sprite } from '../chars/hero_control.js';

export function trigger_npc_dialog(data) {
    if (!data.in_dialog && !data.menu_open) {
        for (let i = 0; i < maps[data.map_name].npcs.length; ++i) {
            let npc = maps[data.map_name].npcs[i];
            let is_close = utils.is_close(
                data.actual_direction,
                data.hero.x,
                data.hero.y,
                npc.npc_sprite.x,
                npc.npc_sprite.y,
                npc.talk_range_factor
            );
            if (is_close) {
                data.actual_action = "idle";
                change_hero_sprite(data);
                data.npc_event = true;
                data.active_npc = npc;
                break;
            }
        }
    } else if (data.in_dialog && data.waiting_for_enter_press) {
        data.waiting_for_enter_press = false;
        data.dialog_manager.next(() => {
            if (data.dialog_manager.finished) {
                data.in_dialog = false;
                data.dialog_manager = null;
                data.npc_event = false;
                data.active_npc.npc_sprite.animations.play([
                    data.npc_db[data.active_npc.key_name].initial_action,
                    data.npc_db[data.active_npc.key_name].actions[data.npc_db[data.active_npc.key_name].initial_action].initial_direction
                ].join("_"));
            } else {
                data.waiting_for_enter_press = true;
            }
        });
    }
}

export function set_npc_event (data) {
    if (!data.waiting_for_enter_press) {
        if (!data.in_dialog && data.active_npc.npc_type === NPC.types.NORMAL) {
            let parts = set_dialog(game, data.active_npc.message);
            let npc_x = data.active_npc.npc_sprite.x;
            let npc_y = data.active_npc.npc_sprite.y;
            let interaction_directions = get_interaction_directions(data, data.hero.x, data.hero.y, npc_x, npc_y, data.active_npc.key_name);
            data.actual_direction = interaction_directions.hero_direction;
            data.hero.animations.play("idle_" + interaction_directions.hero_direction);
            data.active_npc.npc_sprite.animations.play("idle_" + interaction_directions.npc_direction);
            data.dialog_manager = new DialogManager(game, parts, data.actual_direction);
            data.in_dialog = true;
            data.dialog_manager.next(() => {
                data.waiting_for_enter_press = true;
            });
        }
    }
}

export function get_interaction_directions(data, hero_x, hero_y, npc_x, npc_y, sprite_key) {
    let interaction_pattern = data.npc_db[sprite_key].interaction_pattern;
    let npc_direction;
    if (interaction_pattern === NPC.interaction_pattern.CROSS) {
        let positive_limit = hero_x + (-npc_y - npc_x);
        let negative_limit = -hero_x + (-npc_y + npc_x);
        if (-hero_y >= positive_limit && -hero_y >= negative_limit) {
            npc_direction = "up";
        } else if (-hero_y <= positive_limit && -hero_y >= negative_limit) {
            npc_direction = "right";
        } else if (-hero_y <= positive_limit && -hero_y <= negative_limit) {
            npc_direction = "down";
        } else if (-hero_y >= positive_limit && -hero_y <= negative_limit) {
            npc_direction = "left";
        }
    }

    let hero_direction;
    const radius = data.npc_db[sprite_key].body_radius;
    if (hero_x <= npc_x - radius && hero_y >= npc_y + radius) {
        hero_direction = "up_right";
        npc_direction = interaction_pattern === NPC.interaction_pattern.TIK_TAK_TOE ? "down_left" : npc_direction;
    } else if (hero_x <= npc_x - radius && hero_y >= npc_y - radius && hero_y <= npc_y + radius) {
        hero_direction = "right";
        npc_direction = interaction_pattern === NPC.interaction_pattern.TIK_TAK_TOE ? "left" : npc_direction;
    } else if (hero_x <= npc_x - radius && hero_y <= npc_y - radius) {
        hero_direction = "down_right";
        npc_direction = interaction_pattern === NPC.interaction_pattern.TIK_TAK_TOE ? "up_left" : npc_direction;
    } else if (hero_x >= npc_x - radius && hero_x <= npc_x + radius && hero_y <= npc_y - radius) {
        hero_direction = "down";
        npc_direction = interaction_pattern === NPC.interaction_pattern.TIK_TAK_TOE ? "up" : npc_direction;
    } else if (hero_x >= npc_x + radius && hero_y <= npc_y - radius) {
        hero_direction = "down_left";
        npc_direction = interaction_pattern === NPC.interaction_pattern.TIK_TAK_TOE ? "up_right" : npc_direction;
    } else if (hero_x >= npc_x + radius && hero_y >= npc_y - radius && hero_y <= npc_y + radius) {
        hero_direction = "left";
        npc_direction = interaction_pattern === NPC.interaction_pattern.TIK_TAK_TOE ? "right" : npc_direction;
    } else if (hero_x >= npc_x + radius && hero_y >= npc_y + radius) {
        hero_direction = "up_left";
        npc_direction = interaction_pattern === NPC.interaction_pattern.TIK_TAK_TOE ? "dow_right" : npc_direction;
    } else if (hero_x >= npc_x - radius && hero_x <= npc_x + radius && hero_y >= npc_y + radius) {
        hero_direction = "up";
        npc_direction = interaction_pattern === NPC.interaction_pattern.TIK_TAK_TOE ? "down" : npc_direction;
    }

    return {hero_direction: hero_direction, npc_direction: npc_direction};
}
