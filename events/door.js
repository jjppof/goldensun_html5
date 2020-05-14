import { main_char_list } from '../chars/main_chars.js';
import { maps } from '../maps/maps.js';
import { config_physics_for_npcs, config_physics_for_map, config_collisions, set_speed_factors, config_physics_for_psynergy_items } from '../physics/physics.js';

export function set_door_event(data) {
    data.on_event = true;
    data.event_activation_process = false;
    if (data.current_event.advance_effect) {
        data.hero.loadTexture(data.hero_name + "_walk");
        main_char_list[data.hero_name].setAnimation(data.hero, "walk");
        data.hero.animations.play("walk_up");
        open_door(data);
        game.physics.p2.pause();
        const time = Phaser.Timer.HALF;
        const tween_x = maps[data.map_name].sprite.tileWidth*(parseFloat(data.current_event.x) + 1/2);
        const tween_y = data.hero.y - 15;
        game.add.tween(data.shadow).to({
            x: tween_x,
            y: tween_y
        }, time, Phaser.Easing.Linear.None, true);
        game.add.tween(data.hero.body).to({
            x: tween_x,
            y: tween_y
        }, time, Phaser.Easing.Linear.None, true);
        game.time.events.add(time + 50, () => { data.teleporting = true; }, this);
    } else
        data.teleporting = true;
}

export function door_event_phases(data) {
    if (data.teleporting) {
        data.teleporting = false;
        data.hero.loadTexture(data.hero_name + "_idle");
        main_char_list[data.hero_name].setAnimation(data.hero, "idle");
        data.hero.animations.play("idle_" + data.current_event.activation_direction);
        data.actual_direction = data.current_event.activation_direction;
        data.actual_action = "idle";
        game.camera.fade();
        game.camera.onFadeComplete.add(() => { data.processing_teleport = true; }, this);
    } else if (data.processing_teleport) {
        data.processing_teleport = false;
        data.underlayer_group.removeAll();
        data.overlayer_group.removeAll();

        for (let i = 0; i < data.npc_group.children.length; ++i) {
            let sprite = data.npc_group.children[i];
            if (!sprite.is_npc && !sprite.is_psynergy_item) continue;
            sprite.body.destroy()
        }

        maps[data.map_name].npcs = [];
        maps[data.map_name].psynergy_items = [];
        data.npc_group.removeAll();
        data.npc_group.add(data.shadow);
        data.npc_group.add(data.hero);
        data.map_name = data.current_event.target;
        data.map_collider_layer = data.current_event.dest_collider_layer;
        data.shadow.base_collider_layer = data.map_collider_layer;
        data.hero.base_collider_layer = data.map_collider_layer;


        maps[data.map_name].setLayers(
            game,
            data,
            maps,
            data.npc_db,
            data.psynergy_items_db,
            data.map_name,
            data.underlayer_group,
            data.overlayer_group,
            data.map_collider_layer,
            data.npc_group
        ).then(() => {
            game.camera.setBoundsToWorld();
            data.hero.body.x = data.current_event.x_target * maps[data.map_name].sprite.tileWidth;
            data.hero.body.y = data.current_event.y_target * maps[data.map_name].sprite.tileHeight;

            game.physics.p2.resume();

            config_physics_for_npcs(data, false);
            config_physics_for_psynergy_items(data, false);
            config_physics_for_map(data, false);
            config_collisions(data);
            game.physics.p2.updateBoundsCollisionGroup();

            for (let i = 0; i < data.npc_group.children.length; ++i) {
                let sprite = data.npc_group.children[i];
                if (!sprite.is_npc && !sprite.is_psynergy_item) continue;
                sprite.body.debug = data.hero.body.debug;
            }

            data.fading_out = true;
        });
    } else if (data.fading_out) {
        data.fading_out = false;
        game.camera.flash(0x0);
        game.camera.onFlashComplete.add(() => {
            set_speed_factors(data, true);
            data.on_event = false;
            data.current_event = null;
        }, this);
        data.shadow.x = data.hero.body.x;
        data.shadow.y = data.hero.body.y;
    }
}

export function open_door(data) {
    let layer = _.findWhere(maps[data.map_name].sprite.layers, {name : maps[data.map_name].sprite.properties.door_layer});
    let sample_tile = maps[data.map_name].sprite.getTile(data.current_event.x, data.current_event.y - 1, layer.name);
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
        base_x = data.current_event.x + parseInt(offsets[0]);
        base_y = data.current_event.y + parseInt(offsets[1]) - 1;
        target_index = parseInt(_.findKey(maps[data.map_name].sprite.tilesets[0].tileProperties, {open_door : close_door_index})) + 1;
        maps[data.map_name].sprite.replace(source_index, target_index, base_x, base_y, 1, 1, layer.name);
    }
}