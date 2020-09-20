import { maps } from '../initializers/maps.js';
import * as numbers from '../magic_numbers.js';
import { reverse_directions } from '../utils.js';

export function set_door_event(game, data, current_event) {
    if (data.hero.tile_x_pos !== current_event.x || data.hero.tile_y_pos !== current_event.y || data.hero.casting_psynergy || data.hero.pushing || data.hero.climbing || data.hero.jumping || data.menu_open || data.in_battle || data.tile_event_manager.on_event) {
        return;
    }
    data.tile_event_manager.on_event = true;
    data.teleporting = true;
    if (current_event.advance_effect) {
        if (!data.hero.stop_by_colliding) {
            data.tile_event_manager.on_event = false;
            data.teleporting = false;
            return;
        }
        data.hero.play("walk", "up");
        open_door(data, current_event);
        game.physics.p2.pause();
        const time = 400;
        const tween_x = data.map.sprite.tileWidth * (current_event.x + 0.5);
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
    data.map.unset_map();
    const next_map_key_name = current_event.target;
    const target_collision_layer = current_event.dest_collider_layer;
    data.hero.shadow.base_collider_layer = target_collision_layer;
    data.hero.sprite.base_collider_layer = target_collision_layer;
    data.map = await maps[next_map_key_name].mount_map(target_collision_layer);
    game.camera.setBoundsToWorld();
    if (game.camera.bounds.width < numbers.GAME_WIDTH) {
        game.camera.bounds.width = numbers.GAME_WIDTH;
    }
    if (game.camera.bounds.height < numbers.GAME_HEIGHT) {
        game.camera.bounds.height = numbers.GAME_HEIGHT;
    }
    data.collision.config_collision_groups(data.map);
    data.map.config_all_bodies(data.collision, data.map.collision_layer);
    data.collision.config_collisions(data.map, data.map.collision_layer, data.npc_group);
    game.physics.p2.updateBoundsCollisionGroup();
    data.debug.update_debug_physics(data.hero.sprite.body.debug);
    data.hero.sprite.body.x = (current_event.x_target + 0.5) * data.map.sprite.tileWidth;
    data.hero.sprite.body.y = (current_event.y_target + 0.5) * data.map.sprite.tileHeight;
    game.physics.p2.resume();
    camera_fade_out(game, data);
}

function camera_fade_out(game, data) {
    data.hero.update_shadow();
    data.map.npcs.forEach(npc => npc.update());
    game.camera.flash(0x0);
    game.camera.onFlashComplete.addOnce(() => {
        game.camera.lerp.setTo(numbers.CAMERA_LERP, numbers.CAMERA_LERP);
        data.tile_event_manager.on_event = false;
        data.teleporting = false;
    });
}

function open_door(data, current_event) {
    const layer = _.find(data.map.sprite.layers, {
        name : data.map.sprite.properties.door_layer
    });
    const sample_tile = data.map.sprite.getTile(current_event.x, current_event.y - 1, layer.name);
    const door_type_index = sample_tile.properties.door_type;
    const tiles = _.filter(data.map.sprite.tilesets[0].tileProperties, key => {
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
        target_index = (_.findKey(data.map.sprite.tilesets[0].tileProperties, {open_door : close_door_index}) | 0) + 1;
        data.map.sprite.replace(source_index, target_index, base_x, base_y, 1, 1, layer.name);
    }
}