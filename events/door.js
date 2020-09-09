import { main_char_list } from '../initializers/main_chars.js';
import { maps } from '../initializers/maps.js';
import {
    config_physics_for_npcs,
    config_physics_for_map,
    config_collisions,
    config_physics_for_interactable_objects
} from '../physics/collision_bodies.js';
import * as numbers from '../magic_numbers.js';
import { reverse_directions } from '../utils.js';

export function set_door_event(game, data, current_event) {
    if (data.hero.tile_x_pos !== current_event.x || data.hero.tile_y_pos !== current_event.y || data.hero.casting_psynergy || data.hero.pushing || data.hero.climbing || data.hero.jumping || data.menu_open || data.in_battle || data.on_event) {
        return;
    }
    data.on_event = true;
    data.teleporting = true;
    if (current_event.advance_effect) {
        if (!data.hero.stop_by_colliding) {
            data.on_event = false;
            data.teleporting = false;
            return;
        }
        data.hero.sprite.loadTexture(data.hero_name + "_walk");
        data.hero.sprite_info.setAnimation(data.hero.sprite, "walk");
        data.hero.sprite.animations.play("walk_up");
        open_door(data, current_event);
        game.physics.p2.pause();
        const time = 400;
        const tween_x = maps[data.map_name].sprite.tileWidth * (current_event.x + 0.5);
        const tween_y = data.hero.sprite.y - 15;
        game.add.tween(data.hero.shadow).to({
            x: tween_x,
            y: tween_y
        }, time, Phaser.Easing.Linear.None, true);
        game.add.tween(data.hero.sprite.body).to({
            x: tween_x,
            y: tween_y
        }, time, Phaser.Easing.Linear.None, true).onComplete.addOnce(() => {
            camera_fade_in(game, data, current_event);
        });
    } else {
        camera_fade_in(game, data, current_event);
    }
}

function camera_fade_in(game, data, current_event) {
    data.hero.stop_char(true);
    data.hero.current_direction = current_event.activation_directions[0];
    data.hero.sprite.animations.play("idle_" + reverse_directions[data.hero.current_direction]);
    game.camera.fade();
    game.camera.onFadeComplete.addOnce(() => {
        game.camera.lerp.setTo(1, 1);
        change_map(game, data, current_event);
    });
}

async function change_map(game, data, current_event) {
    maps[data.map_name].unset_map(data);
    data.map_name = current_event.target;
    data.map_collider_layer = current_event.dest_collider_layer;
    data.hero.shadow.base_collider_layer = data.map_collider_layer;
    data.hero.sprite.base_collider_layer = data.map_collider_layer;
    await maps[data.map_name].mount_map(game, data);
    game.camera.setBoundsToWorld();
    if (game.camera.bounds.width < numbers.GAME_WIDTH) {
        game.camera.bounds.width = numbers.GAME_WIDTH;
    }
    if (game.camera.bounds.height < numbers.GAME_HEIGHT) {
        game.camera.bounds.height = numbers.GAME_HEIGHT;
    }
    config_physics_for_npcs(data);
    config_physics_for_interactable_objects(data);
    config_physics_for_map(data, false);
    config_collisions(data);
    game.physics.p2.updateBoundsCollisionGroup();
    data.debug.update_debug_physics(data.hero.sprite.body.debug);
    data.hero.sprite.body.x = current_event.x_target * maps[data.map_name].sprite.tileWidth;
    data.hero.sprite.body.y = current_event.y_target * maps[data.map_name].sprite.tileHeight;
    game.physics.p2.resume();
    camera_fade_out(game, data);
}

function camera_fade_out(game, data) {
    data.hero.update_shadow();
    maps[data.map_name].npcs.forEach(npc => npc.update());
    game.camera.flash(0x0);
    game.camera.onFlashComplete.addOnce(() => {
        game.camera.lerp.setTo(numbers.CAMERA_LERP, numbers.CAMERA_LERP);
        data.on_event = false;
        data.teleporting = false;
    });
}

function open_door(data, current_event) {
    const layer = _.find(maps[data.map_name].sprite.layers, {
        name : maps[data.map_name].sprite.properties.door_layer
    });
    const sample_tile = maps[data.map_name].sprite.getTile(current_event.x, current_event.y - 1, layer.name);
    const door_type_index = sample_tile.properties.door_type;
    const tiles = _.filter(maps[data.map_name].sprite.tilesets[0].tileProperties, key => {
        return key.door_type === door_type_index && "close_door" in key && key.id === sample_tile.properties.id;
    });
    let tile, source_index, close_door_index, offsets, base_x, base_y, target_index;
    for (let i = 0; i < tiles.length; ++i) {
        tile = tiles[i];
        source_index = (tile.index | 0) + 1;
        close_door_index = tile.close_door;
        offsets = tile.base_offset.split(",");
        base_x = current_event.x + (offsets[0] | 0);
        base_y = current_event.y + (offsets[1] | 0) - 1;
        target_index = (_.findKey(maps[data.map_name].sprite.tilesets[0].tileProperties, {open_door : close_door_index}) | 0) + 1;
        maps[data.map_name].sprite.replace(source_index, target_index, base_x, base_y, 1, 1, layer.name);
    }
}