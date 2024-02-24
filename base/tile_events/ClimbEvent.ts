import {base_actions, directions, reverse_directions} from "../utils";
import {TileEvent, event_types} from "./TileEvent";
import * as numbers from "../magic_numbers";
import {InteractableObjects, interactable_object_event_types} from "../interactable_objects/InteractableObjects";
import {GoldenSun} from "../GoldenSun";
import * as _ from "lodash";

export enum climb_actions {
    IDLE = "idle",
    TURN = "turn",
    START = "start",
    END = "end",
}

export class ClimbEvent extends TileEvent {
    private change_to_collision_layer: number;
    private climbing_only: boolean;
    private current_activation_direction: directions;
    private dynamic: boolean;

    constructor(
        game: Phaser.Game,
        data: GoldenSun,
        x: number,
        y: number,
        activation_directions,
        initial_disabled_directions,
        activation_collision_layers,
        active_storage_key,
        affected_by_reveal,
        key_name: string,
        change_to_collision_layer,
        origin_interactable_object?: InteractableObjects,
        climbing_only?,
        dynamic?
    ) {
        super(
            game,
            data,
            event_types.CLIMB,
            x,
            y,
            activation_directions,
            initial_disabled_directions,
            activation_collision_layers,
            active_storage_key,
            origin_interactable_object,
            affected_by_reveal,
            key_name
        );
        this.change_to_collision_layer = change_to_collision_layer ?? null;
        this.climbing_only = climbing_only ?? false;
        this.dynamic = dynamic ?? false;
    }

    change_collision_layer_destination(collision_layer: number) {
        this.change_to_collision_layer = collision_layer;
    }

    set_current_activation_direction(direction: directions) {
        this.current_activation_direction = direction;
    }

    fire() {
        if (!this.data.hero.stop_by_colliding || !this.check_position() || !this.data.hero_movement_allowed()) {
            return;
        }
        if (this.data.hero.on_reveal) {
            this.data.info.field_abilities_list.reveal.finish_psynergy(false, false);
        }
        if (this.data.hero.on_custom_psynergy_effect) {
            _.forEach(this.data.info.field_abilities_list, ability => {
                if (ability.is_custom_psynergy) {
                    ability.finish_psynergy(false, false);
                }
            });
        }
        if (
            this.current_activation_direction !== directions.up &&
            this.current_activation_direction !== directions.down
        ) {
            return;
        }
        if (!this.data.hero.climbing && !this.climbing_only) {
            this.start_climbing(this.current_activation_direction);
        } else if (
            (this.data.hero.climbing && !this.climbing_only) ||
            (this.data.hero.climbing && this.climbing_only)
        ) {
            this.finish_climbing(this.current_activation_direction);
        }
    }

    private start_climbing(activation_direction) {
        this.data.hero.toggle_collision(false);
        if (this.change_to_collision_layer !== null) {
            this.data.collision.change_map_body(this.change_to_collision_layer);
        }
        this.data.map.sprites_sort_paused = true;
        this.data.tile_event_manager.on_event = true;
        if (activation_direction === directions.down) {
            const turn_animation = this.data.hero.play(base_actions.CLIMB, climb_actions.TURN);
            turn_animation.onComplete.addOnce(() => {
                this.data.hero.shadow.visible = false;
                const x_tween = this.data.map.tile_width * (this.x + 0.5);
                const y_tween = this.data.hero.sprite.y + 25;
                this.game.add
                    .tween(this.data.hero.sprite.body)
                    .to({x: x_tween, y: y_tween}, 300, Phaser.Easing.Linear.None, true);
                const start_animation = this.data.hero.play(base_actions.CLIMB, climb_actions.START);
                start_animation.onComplete.addOnce(() => {
                    this.data.hero.sprite.anchor.y -= 0.1;
                    this.data.hero.play(base_actions.CLIMB, climb_actions.IDLE);
                    this.data.tile_event_manager.on_event = false;
                    this.data.map.sprites_sort_paused = false;
                    this.data.hero.climbing = true;
                    this.data.hero.change_action(base_actions.CLIMB);
                    this.data.hero.idle_climbing = true;
                    if (this.origin_interactable_object && this.dynamic) {
                        this.create_climb_collision_bodies();
                    }
                    this.data.hero.toggle_collision(true);
                });
            });
        } else if (activation_direction === directions.up) {
            this.data.hero.play(base_actions.CLIMB, climb_actions.IDLE);
            const out_time = Phaser.Timer.QUARTER / 3;
            const x_tween = this.data.map.tile_width * (this.x + 0.5);
            const y_tween = this.data.hero.sprite.y - 15;
            if (this.origin_interactable_object && this.dynamic) {
                this.create_climb_collision_bodies();
            }
            this.game.add
                .tween(this.data.hero.sprite.body)
                .to({x: x_tween, y: y_tween}, out_time, Phaser.Easing.Linear.None, true)
                .onComplete.addOnce(() => {
                    this.data.hero.sprite.anchor.y -= 0.1;
                    this.data.hero.toggle_collision(true);
                    this.data.tile_event_manager.on_event = false;
                    this.data.map.sprites_sort_paused = false;
                    this.data.hero.climbing = true;
                });
            this.data.hero.shadow.visible = false;
            this.data.hero.change_action(base_actions.CLIMB);
            this.data.hero.idle_climbing = true;
        }
    }

    private finish_climbing(activation_direction) {
        this.data.hero.toggle_collision(false);
        if (activation_direction === directions.up) {
            for (let i = 0; i < this.data.map.interactable_objects.length; ++i) {
                const next_interactable_object = this.data.map.interactable_objects[i];
                if (
                    next_interactable_object.tile_x_pos !== this.x ||
                    next_interactable_object.tile_y_pos !== this.y - 1
                )
                    continue;
                if (this.change_to_collision_layer !== next_interactable_object.base_collision_layer) continue;
                this.data.hero.toggle_collision(true);
                return;
            }
            if (this.change_to_collision_layer !== null) {
                this.data.collision.change_map_body(this.change_to_collision_layer, true);
            }
            this.data.tile_event_manager.on_event = true;
            this.data.map.sprites_sort_paused = true;
            const end_animation = this.data.hero.play(base_actions.CLIMB, climb_actions.END);
            this.data.hero.shadow.visible = false;
            this.game.add
                .tween(this.data.hero.sprite.body)
                .to({y: this.data.hero.sprite.y - 17}, 170, Phaser.Easing.Linear.None, true);
            const final_shadow_pos = this.data.hero.sprite.y - 17;
            const timer_event = this.game.time.events.add(170, () => {
                this.data.hero.shadow.y = final_shadow_pos;
                this.data.hero.shadow.visible = true;
            });
            timer_event.timer.start();
            end_animation.onComplete.addOnce(() => {
                const timer_event = this.game.time.events.add(
                    150,
                    () => {
                        this.data.hero.sprite.anchor.y += 0.1;
                        this.data.hero.shadow.y = this.data.hero.sprite.y;
                        this.data.hero.play(base_actions.IDLE, reverse_directions[directions.up]);
                        if (this.origin_interactable_object && this.dynamic) {
                            this.remove_climb_collision_bodies(false);
                        }
                        const timer_event = this.game.time.events.add(
                            50,
                            () => {
                                this.data.tile_event_manager.on_event = false;
                                this.data.map.sprites_sort_paused = false;
                                this.data.hero.climbing = false;
                                this.data.hero.change_action(base_actions.IDLE);
                                this.data.hero.idle_climbing = false;
                                this.data.hero.set_direction(directions.up);
                                this.data.hero.toggle_collision(true);
                            },
                            this
                        );
                        timer_event.timer.start();
                    },
                    this
                );
                timer_event.timer.start();
            });
        } else if (activation_direction === directions.down) {
            if (this.change_to_collision_layer !== null) {
                this.data.collision.change_map_body(this.change_to_collision_layer, true);
            }
            this.data.tile_event_manager.on_event = true;
            this.data.map.sprites_sort_paused = true;
            this.data.hero.sprite.anchor.y += 0.1;
            this.data.hero.play(base_actions.IDLE, reverse_directions[directions.up]);
            const out_time = Phaser.Timer.QUARTER >> 1;
            this.game.add
                .tween(this.data.hero.sprite.body)
                .to(
                    {y: [this.data.hero.sprite.y - 4, this.data.hero.sprite.y + 15]},
                    out_time,
                    Phaser.Easing.Linear.None,
                    true
                )
                .onComplete.addOnce(() => {
                    this.data.hero.toggle_collision(true);
                    const timer_event = this.game.time.events.add(
                        100,
                        () => {
                            this.data.tile_event_manager.on_event = false;
                            this.data.map.sprites_sort_paused = false;
                            this.data.hero.climbing = false;
                            this.data.hero.idle_climbing = false;
                        },
                        this
                    );
                    timer_event.timer.start();
                });
            if (this.origin_interactable_object && this.dynamic) {
                this.remove_climb_collision_bodies();
            }
            this.data.hero.shadow.y = this.data.hero.sprite.y + 15;
            this.data.hero.shadow.visible = true;
            this.data.hero.change_action(base_actions.IDLE);
            this.data.hero.set_direction(directions.up);
        }
    }

    private create_climb_collision_bodies() {
        this.origin_interactable_object.sprite.send_to_back = true;
        const interactable_object_db = this.data.dbs.interactable_objects_db[this.origin_interactable_object.key_name];
        const relative_positions = interactable_object_db.events.flatMap(event_info => {
            if (event_info.type !== interactable_object_event_types.CLIMB || !event_info.collision_tiles_relative_pos)
                return [];
            else {
                return event_info.collision_tiles_relative_pos;
            }
        });
        const positions = relative_positions.map(tile_shift => {
            return {
                x: this.origin_interactable_object.tile_x_pos + tile_shift.x,
                y: this.origin_interactable_object.tile_y_pos + tile_shift.y,
            };
        });
        this.data.hero.sprite.body.removeCollisionGroup(this.data.collision.map_collision_group, true);
        this.data.map.collision_sprite.body.removeCollisionGroup(this.data.collision.hero_collision_group, true);
        for (let collide_index in this.data.collision.interactable_objs_collision_groups) {
            this.data.hero.sprite.body.removeCollisionGroup(
                this.data.collision.interactable_objs_collision_groups[collide_index],
                true
            );
        }
        for (let i = 0; i < positions.length; ++i) {
            const x_pos = (positions[i].x + 0.5) * this.data.map.tile_width;
            const y_pos = (positions[i].y + 0.5) * this.data.map.tile_height;
            const body = this.game.physics.p2.createBody(x_pos, y_pos, 0, true);
            body.clearShapes();
            body.setRectangle(this.data.map.tile_width, this.data.map.tile_height, 0, 0);
            body.setCollisionGroup(this.data.collision.dynamic_events_collision_group);
            body.damping = numbers.MAP_DAMPING;
            body.angularDamping = numbers.MAP_DAMPING;
            body.setZeroRotation();
            body.fixedRotation = true;
            body.dynamic = false;
            body.static = true;
            body.debug = this.data.hero.sprite.body.debug;
            if (this.origin_interactable_object.active) {
                body.collides(this.data.collision.hero_collision_group);
            }
            this.origin_interactable_object.collision_tiles_bodies.push(body);
        }
    }

    private remove_climb_collision_bodies(collide_with_map = true) {
        this.origin_interactable_object.sprite.send_to_back = false;
        if (collide_with_map) {
            this.data.hero.sprite.body.collides(this.data.collision.map_collision_group);
            this.data.map.collision_sprite.body.collides(this.data.collision.hero_collision_group);
        }
        for (let collide_index in this.data.collision.interactable_objs_collision_groups) {
            this.data.hero.sprite.body.removeCollisionGroup(
                this.data.collision.interactable_objs_collision_groups[collide_index],
                true
            );
        }
        if (this.data.map.collision_layer in this.data.collision.interactable_objs_collision_groups) {
            this.data.hero.sprite.body.collides(
                this.data.collision.interactable_objs_collision_groups[this.data.map.collision_layer]
            );
        }
        this.origin_interactable_object.destroy_collision_tiles_bodies();
    }

    destroy() {
        this._origin_interactable_object = null;
        this.deactivate();
    }
}
