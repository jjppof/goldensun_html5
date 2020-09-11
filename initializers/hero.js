import { directions } from '../utils.js';
import { Hero } from '../base/Hero.js';

export function config_hero(game, data) {
    data.hero = new Hero(
        game,
        data,
        data.hero_name,
        data.init_db.x_tile_position,
        data.init_db.y_tile_position,
        data.init_db.initial_action,
        directions[data.init_db.initial_direction]
    );
    data.hero.set_sprite(data.npc_group, main_char_list[data.hero_name].sprite_base, maps[data.map_name].sprite, data.map_collider_layer);
    data.hero.set_shadow('shadow', data.npc_group, data.map_collider_layer);
    data.hero.camera_follow();
    data.hero.play();
}
