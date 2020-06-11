import { main_char_list } from '../chars/main_chars.js';
import { maps } from '../maps/maps.js';
import {
    config_physics_for_npcs,
    config_physics_for_map,
    config_collisions,
    set_speed_factors,
    config_physics_for_interactable_objects
} from '../physics/physics.js';
import * as numbers from '../magic_numbers.js';

export function set_door_event(data, current_event) {
    data.on_event = true;
    data.event_activation_process = false;
    data.door_event_data = {
        event: current_event
    };
    if (current_event.advance_effect) {
        if (!data.stop_by_colliding) {
            data.on_event = false;
            data.door_event_data = null;
            return;
        }
        data.hero.loadTexture(data.hero_name + "_walk");
        main_char_list[data.hero_name].setAnimation(data.hero, "walk");
        data.hero.animations.play("walk_up");
        open_door(data, current_event);
        game.physics.p2.pause();
        const time = Phaser.Timer.HALF;
        const tween_x = maps[data.map_name].sprite.tileWidth * (current_event.x + 0.5);
        const tween_y = data.hero.y - 15;
        game.add.tween(data.shadow).to({
            x: tween_x,
            y: tween_y
        }, time, Phaser.Easing.Linear.None, true);
        game.add.tween(data.hero.body).to({
            x: tween_x,
            y: tween_y
        }, time, Phaser.Easing.Linear.None, true).onComplete.addOnce(() => {
            data.teleporting = true;
        });
    } else {
        data.teleporting = true;
    }
}

export function door_event_phases(data) {
    const current_event = data.door_event_data.event;
    if (data.teleporting) {
        data.teleporting = false;
        data.hero.loadTexture(data.hero_name + "_idle");
        main_char_list[data.hero_name].setAnimation(data.hero, "idle");
        data.hero.animations.play("idle_" + current_event.activation_directions);
        data.actual_direction = current_event.activation_directions;
        data.actual_action = "idle";
        game.camera.fade();
        game.camera.onFadeComplete.addOnce(() => {
            data.processing_teleport = true;
            game.camera.lerp.setTo(1, 1);
        }, this);
    } else if (data.processing_teleport) {
        data.processing_teleport = false;
        data.underlayer_group.removeAll();
        data.overlayer_group.removeAll();

        let sprites_to_remove = []
        for (let i = 0; i < data.npc_group.children.length; ++i) {
            let sprite = data.npc_group.children[i];
            if (!sprite.is_npc && !sprite.is_interactable_object) continue;
            sprites_to_remove.push(sprite);
        }
        for (let i = 0; i < sprites_to_remove.length; ++i) {
            let sprite = sprites_to_remove[i];
            data.npc_group.remove(sprite, true);
        }

        maps[data.map_name].npcs = [];
        maps[data.map_name].interactable_objects = [];
        data.npc_group.removeAll();
        data.npc_group.add(data.shadow);
        data.npc_group.add(data.hero);
        data.map_name = current_event.target;
        data.map_collider_layer = current_event.dest_collider_layer;
        data.shadow.base_collider_layer = data.map_collider_layer;
        data.hero.base_collider_layer = data.map_collider_layer;

        maps[data.map_name].setLayers(
            game,
            data,
            maps,
            data.npc_db,
            data.interactable_objects_db,
            data.map_name,
            data.underlayer_group,
            data.overlayer_group,
            data.map_collider_layer,
            data.npc_group
        ).then(() => {
            game.camera.setBoundsToWorld();
            if (game.camera.bounds.width < numbers.GAME_WIDTH) {
                game.camera.bounds.width = numbers.GAME_WIDTH;
            }
            if (game.camera.bounds.height < numbers.GAME_HEIGHT) {
                game.camera.bounds.height = numbers.GAME_HEIGHT;
            }

            data.hero.body.x = current_event.x_target * maps[data.map_name].sprite.tileWidth;
            data.hero.body.y = current_event.y_target * maps[data.map_name].sprite.tileHeight;

            game.physics.p2.resume();

            config_physics_for_npcs(data);
            config_physics_for_interactable_objects(data);
            config_physics_for_map(data, false);
            config_collisions(data);
            game.physics.p2.updateBoundsCollisionGroup();

            for (let i = 0; i < data.npc_group.children.length; ++i) {
                let sprite = data.npc_group.children[i];
                if (!sprite.is_npc && !sprite.is_interactable_object) continue;
                sprite.body.debug = data.hero.body.debug;
            }

            data.fading_out = true;
        });
    } else if (data.fading_out) {
        data.fading_out = false;
        game.camera.flash(0x0);
        game.camera.onFlashComplete.addOnce(() => {
            set_speed_factors(data, true);
            game.camera.lerp.setTo(numbers.CAMERA_LERP, numbers.CAMERA_LERP);
            data.on_event = false;
            data.door_event_data = null;
        }, this);
        data.shadow.x = data.hero.body.x;
        data.shadow.y = data.hero.body.y;
    }
}

export function open_door(data, current_event) {
    let layer = _.findWhere(maps[data.map_name].sprite.layers, {name : maps[data.map_name].sprite.properties.door_layer});
    let sample_tile = maps[data.map_name].sprite.getTile(current_event.x, current_event.y - 1, layer.name);
    let door_type_index = sample_tile.properties.door_type;
    let tiles = _.filter(maps[data.map_name].sprite.tilesets[0].tileProperties, key => {
        return key.door_type === door_type_index && "close_door" in key && key.id === sample_tile.properties.id;
    })
    let tile, source_index, close_door_index, offsets, base_x, base_y, target_index;
    for (let i = 0; i < tiles.length; ++i) {
        tile = tiles[i];
        source_index = parseInt(tile.index) + 1;
        close_door_index = tile.close_door;
        offsets = tile.base_offset.split(",");
        base_x = current_event.x + parseInt(offsets[0]);
        base_y = current_event.y + parseInt(offsets[1]) - 1;
        target_index = parseInt(_.findKey(maps[data.map_name].sprite.tilesets[0].tileProperties, {open_door : close_door_index})) + 1;
        maps[data.map_name].sprite.replace(source_index, target_index, base_x, base_y, 1, 1, layer.name);
    }
}