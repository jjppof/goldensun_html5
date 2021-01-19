import {base_actions, directions, reverse_directions} from "../utils";
import {TileEvent, event_types} from "./TileEvent";
import {JumpEvent} from "./JumpEvent";
import * as numbers from "../magic_numbers";
import {interactable_object_event_types} from "../InteractableObjects";

export class ClimbEvent extends TileEvent {
    public change_to_collision_layer: number;
    public is_set: boolean;
    public climbing_only: boolean;
    public current_activation_direction: directions;

    constructor(
        game,
        data,
        x,
        y,
        activation_directions,
        activation_collision_layers,
        dynamic,
        active,
        change_to_collision_layer,
        is_set?,
        origin_interactable_object?,
        climbing_only?
    ) {
        super(
            game,
            data,
            event_types.CLIMB,
            x,
            y,
            activation_directions,
            activation_collision_layers,
            dynamic,
            active,
            origin_interactable_object
        );
        this.change_to_collision_layer = change_to_collision_layer === undefined ? null : change_to_collision_layer;
        this.is_set = is_set === undefined ? true : is_set;
        this.climbing_only = climbing_only === undefined ? false : climbing_only;
    }

    fire() {
        if (!this.data.hero.stop_by_colliding || !this.check_position() || !this.data.hero_movement_allowed()) {
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

    start_climbing(activation_direction) {
        this.game.physics.p2.pause();
        if (this.change_to_collision_layer !== null) {
            this.data.collision.change_map_body(this.data, this.change_to_collision_layer);
        }
        this.data.tile_event_manager.on_event = true;
        if (activation_direction === directions.down) {
            const turn_animation = this.data.hero.play(base_actions.CLIMB, "turn");
            turn_animation.onComplete.addOnce(() => {
                this.data.hero.shadow.visible = false;
                const x_tween = this.data.map.tile_width * (this.x + 0.5);
                const y_tween = this.data.hero.sprite.y + 25;
                this.game.add
                    .tween(this.data.hero.sprite.body)
                    .to({x: x_tween, y: y_tween}, 300, Phaser.Easing.Linear.None, true);
                const start_animation = this.data.hero.play(base_actions.CLIMB, "start");
                start_animation.onComplete.addOnce(() => {
                    this.data.hero.sprite.anchor.y -= 0.1;
                    this.data.hero.play(base_actions.CLIMB, base_actions.IDLE);
                    this.data.tile_event_manager.on_event = false;
                    this.data.hero.climbing = true;
                    this.data.hero.current_action = base_actions.CLIMB;
                    this.data.hero.idle_climbing = true;
                    if (this.dynamic) {
                        this.create_climb_collision_bodies();
                    }
                    this.game.physics.p2.resume();
                });
            });
        } else if (activation_direction === directions.up) {
            this.data.hero.play(base_actions.CLIMB, base_actions.IDLE);
            const out_time = Phaser.Timer.QUARTER / 3;
            const x_tween = this.data.map.tile_width * (this.x + 0.5);
            const y_tween = this.data.hero.sprite.y - 15;
            if (this.dynamic) {
                this.create_climb_collision_bodies();
            }
            this.game.add
                .tween(this.data.hero.sprite.body)
                .to({x: x_tween, y: y_tween}, out_time, Phaser.Easing.Linear.None, true)
                .onComplete.addOnce(() => {
                    this.data.hero.sprite.anchor.y -= 0.1;
                    this.game.physics.p2.resume();
                    this.data.tile_event_manager.on_event = false;
                    this.data.hero.climbing = true;
                });
            this.data.hero.shadow.visible = false;
            this.data.hero.current_action = base_actions.CLIMB;
            this.data.hero.idle_climbing = true;
        }
    }

    finish_climbing(activation_direction) {
        this.game.physics.p2.pause();
        if (activation_direction === directions.up) {
            for (let i = 0; i < this.data.map.interactable_objects.length; ++i) {
                const next_interactable_object = this.data.map.interactable_objects[i];
                if (next_interactable_object.current_x !== this.x || next_interactable_object.current_y !== this.y - 1)
                    continue;
                if (this.change_to_collision_layer !== next_interactable_object.base_collision_layer) continue;
                this.game.physics.p2.resume();
                return;
            }
            if (this.change_to_collision_layer !== null) {
                this.data.collision.change_map_body(this.data, this.change_to_collision_layer);
            }
            this.data.tile_event_manager.on_event = true;
            const end_animation = this.data.hero.play(base_actions.CLIMB, "end");
            this.data.hero.shadow.visible = false;
            this.game.add
                .tween(this.data.hero.sprite.body)
                .to({y: this.data.hero.sprite.y - 17}, 170, Phaser.Easing.Linear.None, true);
            const final_shadow_pos = this.data.hero.sprite.y - 17;
            this.game.time.events.add(170, () => {
                this.data.hero.shadow.y = final_shadow_pos;
                this.data.hero.shadow.visible = true;
            });
            end_animation.onComplete.addOnce(() => {
                this.game.time.events.add(
                    150,
                    () => {
                        this.data.hero.sprite.anchor.y += 0.1;
                        this.data.hero.shadow.y = this.data.hero.sprite.y;
                        this.data.hero.play(base_actions.IDLE, reverse_directions[directions.up]);
                        if (this.dynamic) {
                            this.remove_climb_collision_bodies(false);
                        }
                        this.game.time.events.add(
                            50,
                            () => {
                                this.data.tile_event_manager.on_event = false;
                                this.data.hero.climbing = false;
                                this.data.hero.current_action = base_actions.IDLE;
                                this.data.hero.idle_climbing = false;
                                this.data.hero.set_direction(directions.up);
                                this.game.physics.p2.resume();
                            },
                            this
                        );
                    },
                    this
                );
            });
        } else if (activation_direction === directions.down) {
            if (this.change_to_collision_layer !== null) {
                this.data.collision.change_map_body(this.data, this.change_to_collision_layer);
            }
            this.data.tile_event_manager.on_event = true;
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
                    this.game.time.events.add(
                        50,
                        () => {
                            this.data.tile_event_manager.on_event = false;
                            this.data.hero.climbing = false;
                            this.data.hero.idle_climbing = false;
                            this.game.physics.p2.resume();
                        },
                        this
                    );
                });
            if (this.dynamic) {
                this.remove_climb_collision_bodies();
            }
            this.data.hero.shadow.y = this.data.hero.sprite.y + 15;
            this.data.hero.shadow.visible = true;
            this.data.hero.current_action = base_actions.IDLE;
            this.data.hero.set_direction(directions.up);
        }
    }

    create_climb_collision_bodies() {
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
                x: this.origin_interactable_object.current_x + tile_shift.x,
                y: this.origin_interactable_object.current_y + tile_shift.y,
            };
        });
        JumpEvent.unset_set_jump_collision(this.data);
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
            let body = this.game.physics.p2.createBody(x_pos, y_pos, 0, true);
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
            body.collides(this.data.collision.hero_collision_group);
            this.origin_interactable_object.collision_tiles_bodies.push(body);
        }
    }

    remove_climb_collision_bodies(collide_with_map = true) {
        this.origin_interactable_object.sprite.send_to_back = false;
        JumpEvent.set_jump_collision(this.game, this.data);
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
        let bodies = this.origin_interactable_object.collision_tiles_bodies;
        for (let i = 0; i < bodies.length; ++i) {
            bodies[i].destroy();
        }
        bodies = [];
    }
}
