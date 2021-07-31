import {ControllableChar} from "./ControllableChar";
import {GoldenSun} from "./GoldenSun";
import {Map} from "./Map";
import * as numbers from "./magic_numbers";
import {range_360, base_actions, get_direction_mask, directions} from "./utils";

/**
 * This class manages collision between the main concepts of the engine:
 * map, hero, npcs and interactable objects.
 */
export class Collision {
    private static readonly SPEED_LIMIT_TO_STOP = 13;
    private static readonly SPEED_LIMIT_TO_STOP_WORLD_MAP = 9;
    private static readonly MINIMAL_SLOPE = 0.1;

    /** This variable converts from normal_angle region (floor((angle-15)/30)) to in-game rotation. */
    private static readonly ROTATION_NORMAL = [
        directions.right, //345-15 degrees
        directions.up_right, //15-45 degrees
        directions.up_right, //45-75 degrees
        directions.up, //75-105 degrees
        directions.up_left, //105-135 degrees
        directions.up_left, //135-165 degrees
        directions.left, //165-195 degrees
        directions.down_left, //195-225 degrees
        directions.down_left, //225-255 degrees
        directions.down, //255-285 degrees
        directions.down_right, //285-315 degrees
        directions.down_right, //315-345 degrees
    ];

    private game: Phaser.Game;
    private data: GoldenSun;
    private _hero_collision_group: Phaser.Physics.P2.CollisionGroup;
    private _dynamic_events_collision_group: Phaser.Physics.P2.CollisionGroup;
    private _map_collision_group: Phaser.Physics.P2.CollisionGroup;
    private _npc_collision_groups: {[layer_index: number]: Phaser.Physics.P2.CollisionGroup};
    private _interactable_objs_collision_groups: {[layer_index: number]: Phaser.Physics.P2.CollisionGroup};
    private max_layers_created: number;
    private _dynamic_events_col_bodies: Phaser.Physics.P2.Body[];

    constructor(game: Phaser.Game, data: GoldenSun) {
        this.game = game;
        this.data = data;
        this.config_world();
        this._hero_collision_group = this.game.physics.p2.createCollisionGroup();
        this._dynamic_events_collision_group = this.game.physics.p2.createCollisionGroup();
        this._map_collision_group = game.physics.p2.createCollisionGroup();
        this._npc_collision_groups = {};
        this._interactable_objs_collision_groups = {};
        this.max_layers_created = 0;
        this._dynamic_events_col_bodies = [];
    }

    get hero_collision_group() {
        return this._hero_collision_group;
    }
    get dynamic_events_collision_group() {
        return this._dynamic_events_collision_group;
    }
    get map_collision_group() {
        return this._map_collision_group;
    }
    get npc_collision_groups() {
        return this._npc_collision_groups;
    }
    get interactable_objs_collision_groups() {
        return this._interactable_objs_collision_groups;
    }
    get dynamic_events_col_bodies() {
        return this._dynamic_events_col_bodies;
    }

    /**
     * Configs the world physics attributes.
     */
    private config_world() {
        this.game.physics.startSystem(Phaser.Physics.P2JS);
        this.game.physics.p2.setImpactEvents(true);
        this.game.physics.p2.world.defaultContactMaterial.restitution = 0;
        this.game.physics.p2.world.defaultContactMaterial.relaxation = 8;
        this.game.physics.p2.world.defaultContactMaterial.friction = 0;
        this.game.physics.p2.world.defaultContactMaterial.contactSkinSize = 1e-3;
        this.game.physics.p2.world.setGlobalStiffness(1e5);
        this.game.physics.p2.restitution = 0;
    }

    /**
     * Creates npcs and interactable objects collision groups.
     * @param map the current map.
     */
    config_collision_groups(map: Map) {
        //p2 has a limit number of collision groups that can be created. Then, NPCs and I. Objs. groups will be created on demand.
        for (let layer_index = this.max_layers_created; layer_index < map.collision_layers_number; ++layer_index) {
            this._npc_collision_groups[layer_index] = this.game.physics.p2.createCollisionGroup();
            this._interactable_objs_collision_groups[layer_index] = this.game.physics.p2.createCollisionGroup();
        }
        this.max_layers_created = Math.max(this.max_layers_created, map.collision_layers_number);
    }

    /**
     * Disables collision between hero and npcs.
     * @param collision_layer if given, disables only on this layer.
     */
    disable_npc_collision(collision_layer?: number) {
        if (collision_layer !== undefined && collision_layer in this._npc_collision_groups) {
            this.data.hero.sprite.body.removeCollisionGroup(this._npc_collision_groups[collision_layer], true);
        } else {
            for (let collision_layer in this._npc_collision_groups) {
                this.data.hero.sprite.body.removeCollisionGroup(this._npc_collision_groups[collision_layer], true);
            }
        }
    }

    /**
     * Enables collision between hero and npcs.
     * @param collision_layer if given, enables only on this layer.
     */
    enable_npc_collision(collision_layer?: number) {
        if (collision_layer !== undefined && collision_layer in this._npc_collision_groups) {
            this.data.hero.sprite.body.collides(this._npc_collision_groups[collision_layer]);
        } else {
            for (let collision_layer in this._npc_collision_groups) {
                this.data.hero.sprite.body.collides(this._npc_collision_groups[collision_layer]);
            }
        }
    }

    /**
     * Disables collision between hero and map.
     * @param sensor_method if true, disables collision by only setting the map shapes as a sensor.
     */
    disable_map_collision(sensor_method = false) {
        if (sensor_method) {
            this.data.map.collision_sprite.body.data.shapes.forEach(shape => (shape.sensor = true));
        } else {
            this.data.hero.sprite.body.removeCollisionGroup(this.data.collision._map_collision_group);
            this.data.map.collision_sprite.body.removeCollisionGroup(this.data.collision._hero_collision_group);
        }
    }

    /**
     * Enables collision between hero and map.
     * @param sensor_method if true, enables collision by only setting the map shapes as not a sensor.
     */
    enable_map_collision(sensor_method = false) {
        if (sensor_method) {
            this.data.map.collision_sprite.body.data.shapes.forEach(shape => (shape.sensor = false));
        } else {
            this.data.hero.sprite.body.collides(this.data.collision._map_collision_group);
            this.data.map.collision_sprite.body.collides(this.data.collision._hero_collision_group);
        }
    }

    /**
     * Configs collisions between hero, map, npcs and interactable objects.
     * @param collision_layer the current collision layer.
     */
    config_collisions(collision_layer: number) {
        this.data.hero.sprite.body.collides(this._map_collision_group);
        this.data.map.collision_sprite.body.collides(this._hero_collision_group);

        this.disable_npc_collision();
        this.enable_npc_collision(collision_layer);

        for (let collide_index in this._interactable_objs_collision_groups) {
            this.data.hero.sprite.body.removeCollisionGroup(
                this._interactable_objs_collision_groups[collide_index],
                true
            );
        }
        if (collision_layer in this._interactable_objs_collision_groups) {
            this.data.hero.sprite.body.collides(this._interactable_objs_collision_groups[collision_layer]);
        }

        for (let i = 0; i < this.data.npc_group.children.length; ++i) {
            const sprite = this.data.npc_group.children[i] as Phaser.Sprite;
            if (!sprite.is_npc && !sprite.is_interactable_object) continue;
            if (!sprite.body) continue;
            sprite.body.collides(this._hero_collision_group);
        }
        this.data.hero.sprite.body.collides(this._dynamic_events_collision_group);
    }

    /**
     * Changes the map body according to a given collision layer index.
     * @param new_collision_layer_index Target collision layer.
     */
    change_map_body(new_collision_layer_index: number) {
        if (this.data.map.collision_layer === new_collision_layer_index) return;
        this.data.map.config_body(new_collision_layer_index);
        this.data.hero.set_collision_layer(new_collision_layer_index);
        this.config_collision_groups(this.data.map);
        this.config_collisions(new_collision_layer_index);
        this.data.map.reset_layers();
    }

    /**
     * Clears the collision bodies created dynamically
     * @param enable_map_collision if true, enables map collision.
     */
    clear_dynamic_events_bodies(enable_map_collision: boolean = true) {
        if (enable_map_collision) {
            this.enable_map_collision();
        }
        for (let j = 0; j < this.dynamic_events_col_bodies.length; ++j) {
            this.dynamic_events_col_bodies[j].destroy();
        }
        this._dynamic_events_col_bodies = [];
    }

    /**
     * Checks everything related to char collision. This function checks whether is necessary
     * to stop when colliding or change the char direction in order to adapt its movement to the
     * collision slope.
     */
    check_char_collision(char: ControllableChar) {
        let normals = [];
        for (let i = 0; i < this.game.physics.p2.world.narrowphase.contactEquations.length; ++i) {
            const contact = this.game.physics.p2.world.narrowphase.contactEquations[i];
            if (contact.bodyA === char.sprite.body.data) {
                //check if char collided with something
                normals.push(contact.normalA); //collision normals (one normal for each contact point)
            }
            char.check_interactable_objects(contact);
        }
        //normals having length, means that a collision is happening
        char.colliding_directions_mask = normals.reduce((acc, normal) => {
            const angle = range_360(Math.atan2(-normal[1], -normal[0]));
            const direction = (1 + Math.floor((angle - numbers.degree45_half) / numbers.degree45)) & 7;
            return acc | get_direction_mask(direction);
        }, 0);
        if (normals.length && char.in_movement()) {
            const speed_limit = this.data.map.is_world_map
                ? Collision.SPEED_LIMIT_TO_STOP_WORLD_MAP
                : Collision.SPEED_LIMIT_TO_STOP;
            //speeds below SPEED_LIMIT_TO_STOP are not considered
            if (
                Math.abs(char.sprite.body.velocity.x) < speed_limit &&
                Math.abs(char.sprite.body.velocity.y) < speed_limit
            ) {
                //a contact point direction is the opposite direction of the contact normal vector
                const contact_point_direction_angles = new Array(normals.length);
                normals.forEach((normal, index) => {
                    const abs_normal_x = Math.abs(normal[0]);
                    const abs_normal_y = Math.abs(normal[1]);
                    //slopes outside the MINIMAL_SLOPE range will be desconsidered
                    if (abs_normal_x < Collision.MINIMAL_SLOPE) normal[0] = 0;
                    if (abs_normal_y < Collision.MINIMAL_SLOPE) normal[1] = 0;
                    if (abs_normal_x > 1 - Collision.MINIMAL_SLOPE) normal[0] = Math.sign(normal[0]);
                    if (abs_normal_y > 1 - Collision.MINIMAL_SLOPE) normal[1] = Math.sign(normal[1]);

                    //storing the angle as if it is in the 1st quadrant
                    contact_point_direction_angles[index] = range_360(Math.atan2(normal[1], -normal[0]));
                });
                //storing the angle as if it is in the 1st quadrant
                const desired_direction_angle = range_360(Math.atan2(-char.temp_speed.y, char.temp_speed.x));
                contact_point_direction_angles.forEach(direction => {
                    //check if the desired direction is going towards at least one contact direction with a error margin of 30 degrees
                    if (
                        direction >= desired_direction_angle - numbers.degree15 &&
                        direction <= desired_direction_angle + numbers.degree15
                    ) {
                        //if true, it means that the char is going the in the direction of the collision obejct, then it must stop
                        char.set_temporary_speed(0, 0);
                        return;
                    }
                });
                char.stop_by_colliding = true;
                char.force_direction = false;
            } else if (char.current_action !== base_actions.CLIMB && char.current_action !== base_actions.ROPE) {
                char.stop_by_colliding = false;
                if (normals.length === 1) {
                    //Everything inside this if is to deal with direction changing when colliding.
                    //Finds which 30 degree sector the normal angle lies within, and converts to a direction.
                    const normal = normals[0];
                    const wall_direction =
                        Collision.ROTATION_NORMAL[
                            (range_360(Math.atan2(normal[1], -normal[0]) + numbers.degree15) / numbers.degree30) | 0
                        ];
                    const relative_direction = (char.required_direction - wall_direction) & 7;
                    //if player's direction is within 1 of wall_direction
                    if (relative_direction === 1 || relative_direction === 7) {
                        char.force_direction = true;
                        const direction = (wall_direction + (relative_direction << 1)) & 7;
                        if ((direction & 1) === 1) {
                            //adapting the velocity to the contact slope
                            const going_up = (direction >> 1) & 2;
                            const is_ccw = going_up ? normal[0] >= 0 : normal[0] < 0;
                            //rotates normal vector 90deg
                            char.force_diagonal_speed.x = is_ccw ? normal[1] : -normal[1];
                            char.force_diagonal_speed.y = is_ccw ? -normal[0] : normal[0];
                        }
                        char.set_direction(direction);
                    } else {
                        char.force_direction = false;
                    }
                } else {
                    char.force_direction = false;
                }
            } else {
                char.stop_by_colliding = false;
            }
        } else {
            char.stop_by_colliding = false;
            char.force_direction = false;
        }
    }
}
