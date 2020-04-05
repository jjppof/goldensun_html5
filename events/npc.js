import { DialogManager, set_dialog } from '../base/Window.js';
import { NPC } from '../base/NPC.js';

export function set_npc_event (data) {
    if (!data.waiting_for_enter_press) {
        if (!data.in_dialog && data.active_npc.npc_type === NPC.types.NORMAL) {
            let parts = set_dialog(game, data.active_npc.message);
            let npc_x = parseInt(data.active_npc.npc_sprite.x/maps[data.map_name].sprite.tileWidth);
            let npc_y = parseInt(data.active_npc.npc_sprite.y/maps[data.map_name].sprite.tileHeight);
            let interaction_directions = get_interaction_directions(data.hero_tile_pos_x, data.hero_tile_pos_y, npc_x, npc_y);
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

export function get_interaction_directions(hero_x, hero_y, npc_x, npc_y) {
    if (npc_x > hero_x && npc_y < hero_y) {
        return {hero_direction: "up_right", npc_direction: "down_left"};
    } else if (npc_x > hero_x && npc_y === hero_y) {
        return {hero_direction: "right", npc_direction: "left"};
    } else if (npc_x > hero_x && npc_y > hero_y) {
        return {hero_direction: "down_right", npc_direction: "up_left"};
    } else if (npc_x === hero_x && npc_y > hero_y) {
        return {hero_direction: "down", npc_direction: "up"};
    } else if (npc_x < hero_x && npc_y > hero_y) {
        return {hero_direction: "down_left", npc_direction: "up_right"};
    } else if (npc_x < hero_x && npc_y === hero_y) {
        return {hero_direction: "left", npc_direction: "right"};
    } else if (npc_x < hero_x && npc_y < hero_y) {
        return {hero_direction: "up_left", npc_direction: "down_right"};
    } else if (npc_x === hero_x && npc_y < hero_y) {
        return {hero_direction: "up", npc_direction: "down"};
    }
}