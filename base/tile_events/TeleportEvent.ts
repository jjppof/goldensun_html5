import {base_actions, directions, reverse_directions} from "../utils";
import {event_types, TileEvent} from "./TileEvent";
import * as numbers from "../magic_numbers";
import * as _ from "lodash";

export class TeleportEvent extends TileEvent {
    public target: string;
    public x_target: number;
    public y_target: number;
    public advance_effect: boolean;
    public dest_collision_layer: number;
    public destination_direction: string;

    constructor(
        game,
        data,
        x,
        y,
        activation_directions,
        activation_collision_layers,
        dynamic,
        active,
        target,
        x_target,
        y_target,
        advance_effect,
        dest_collision_layer,
        destination_direction
    ) {
        super(
            game,
            data,
            event_types.TELEPORT,
            x,
            y,
            activation_directions,
            activation_collision_layers,
            dynamic,
            active,
            null
        );
        this.target = target;
        this.x_target = x_target;
        this.y_target = y_target;
        this.advance_effect = advance_effect;
        this.dest_collision_layer = dest_collision_layer;
        this.destination_direction = destination_direction;
    }

    fire() {
        if (!this.check_position() || !this.data.hero_movement_allowed()) {
            return;
        }
        this.data.tile_event_manager.on_event = true;
        this.data.hero.teleporting = true;
        if (this.advance_effect) {
            if (!this.data.hero.stop_by_colliding) {
                this.data.tile_event_manager.on_event = false;
                this.data.hero.teleporting = false;
                return;
            }
            this.data.hero.play(base_actions.WALK, reverse_directions[directions.up]);
            this.open_door();
            this.game.physics.p2.pause();
            const time = 400;
            const tween_x = this.data.map.sprite.tileWidth * (this.x + 0.5);
            const tween_y = this.data.hero.sprite.y - 15;
            this.game.add.tween(this.data.hero.shadow).to(
                {
                    x: tween_x,
                    y: tween_y,
                },
                time,
                Phaser.Easing.Linear.None,
                true
            );
            this.game.add
                .tween(this.data.hero.sprite.body)
                .to(
                    {
                        x: tween_x,
                        y: tween_y,
                    },
                    time,
                    Phaser.Easing.Linear.None,
                    true
                )
                .onComplete.addOnce(() => {
                    this.camera_fade_in();
                });
        } else {
            this.camera_fade_in();
        }
    }

    camera_fade_in() {
        this.data.hero.stop_char(true);
        this.game.camera.fade();
        this.game.camera.onFadeComplete.addOnce(() => {
            const destination_direction =
                directions[this.destination_direction] !== undefined
                    ? directions[this.destination_direction]
                    : this.activation_directions[0];
            this.data.hero.set_direction(destination_direction);
            this.data.hero.play(base_actions.IDLE, reverse_directions[this.data.hero.current_direction]);
            this.game.camera.lerp.setTo(1, 1);
            this.change_map();
        });
    }

    async change_map() {
        this.data.map.unset_map();
        const next_map_key_name = this.target;
        const target_collision_layer = this.dest_collision_layer;
        this.data.hero.shadow.base_collision_layer = target_collision_layer;
        this.data.hero.sprite.base_collision_layer = target_collision_layer;
        this.data.map = await this.data.info.maps_list[next_map_key_name].mount_map(target_collision_layer);
        this.game.camera.setBoundsToWorld();
        if (this.game.camera.bounds?.width < numbers.GAME_WIDTH) {
            this.game.camera.bounds.width = numbers.GAME_WIDTH;
        }
        if (this.game.camera.bounds?.height < numbers.GAME_HEIGHT) {
            this.game.camera.bounds.height = numbers.GAME_HEIGHT;
        }
        this.data.collision.config_collision_groups(this.data.map);
        this.data.map.config_all_bodies(this.data.collision, this.data.map.collision_layer);
        this.data.collision.config_collisions(this.data.map, this.data.map.collision_layer, this.data.npc_group);
        this.game.physics.p2.updateBoundsCollisionGroup();
        this.data.debug.update_debug_physics(this.data.hero.sprite.body.debug);
        this.data.hero.sprite.body.x = (this.x_target + 0.5) * this.data.map.sprite.tileWidth;
        this.data.hero.sprite.body.y = (this.y_target + 0.5) * this.data.map.sprite.tileHeight;
        this.game.physics.p2.resume();
        this.camera_fade_out();
    }

    camera_fade_out() {
        this.data.hero.update_shadow();
        this.data.hero.update_half_crop(true);
        this.data.map.sort_sprites();
        this.data.map.npcs.forEach(npc => npc.update());
        this.game.camera.flash(0x0);
        this.game.camera.onFlashComplete.addOnce(() => {
            this.game.camera.lerp.setTo(numbers.CAMERA_LERP, numbers.CAMERA_LERP);
            this.data.tile_event_manager.on_event = false;
            this.data.hero.teleporting = false;
        });
    }

    open_door() {
        const layer = _.find(this.data.map.sprite.layers, {
            name: this.data.map.sprite.properties.door_layer,
        });
        const sample_tile = this.data.map.sprite.getTile(this.x, this.y - 1, layer.name);
        const door_type_index = sample_tile.properties.door_type;
        const tiles = _.filter(this.data.map.sprite.tilesets[0].tileProperties, key => {
            return key.door_type === door_type_index && "close_door" in key && key.id === sample_tile.properties.id;
        });
        let tile, source_index, close_door_index, offsets, base_x, base_y, target_index;
        for (let i = 0; i < tiles.length; ++i) {
            tile = tiles[i];
            source_index = (tile.index | 0) + 1;
            close_door_index = tile.close_door;
            offsets = tile.base_offset.split(",");
            base_x = this.x + (offsets[0] | 0);
            base_y = this.y + (offsets[1] | 0) - 1;
            target_index =
                parseInt(
                    _.findKey(this.data.map.sprite.tilesets[0].tileProperties, {
                        open_door: close_door_index,
                    })
                ) + 1;
            this.data.map.sprite.replace(source_index, target_index, base_x, base_y, 1, 1, layer.name);
        }
    }
}
