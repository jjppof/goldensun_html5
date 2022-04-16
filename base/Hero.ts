import {ControllableChar} from "./ControllableChar";
import * as numbers from "./magic_numbers";
import {get_transition_directions, directions, base_actions, get_direction_mask, range_360} from "./utils";
import {Button} from "./XGamepad";
import {GoldenSun} from "./GoldenSun";

/**
 * This class is responsible to control the hero that is controlled by the game player in the maps.
 */
export class Hero extends ControllableChar {
    /** This variable can convert from pressed keys to the corresponding in-game rotation. */
    private static readonly ROTATION_KEY = [
        null, //no keys pressed
        directions.right, //right
        directions.left, //left
        null, //right and left
        directions.up, //up
        directions.up_right, //up and right
        directions.up_left, //up and left
        null, //up, left, and right
        directions.down, //down
        directions.down_right, //down and right
        directions.down_left, //down and left
        null, //down, left, and right
        null, //down and up
        null, //down, up, and right
        null, //down, up, and left
        null, //down, up, left, and right
    ];

    /** Speed factor values for each standard direction. */
    private static readonly SPEEDS = {
        [directions.right]: {x: 1, y: 0},
        [directions.left]: {x: -1, y: 0},
        [directions.up]: {x: 0, y: -1},
        [directions.up_right]: {x: numbers.INV_SQRT2, y: -numbers.INV_SQRT2},
        [directions.up_left]: {x: -numbers.INV_SQRT2, y: -numbers.INV_SQRT2},
        [directions.down]: {x: 0, y: 1},
        [directions.down_right]: {x: numbers.INV_SQRT2, y: numbers.INV_SQRT2},
        [directions.down_left]: {x: -numbers.INV_SQRT2, y: numbers.INV_SQRT2},
    };

    public avoid_encounter: boolean;

    constructor(
        game: Phaser.Game,
        data: GoldenSun,
        key_name: string,
        initial_x: number,
        initial_y: number,
        initial_action: string | base_actions,
        initial_direction: string,
        walk_speed: number,
        dash_speed: number,
        climb_speed: number
    ) {
        super(
            game,
            data,
            key_name,
            true,
            walk_speed,
            dash_speed,
            climb_speed,
            false,
            initial_x,
            initial_y,
            initial_action,
            initial_direction
        );
        this.avoid_encounter = false;
    }

    /** Gets the collision layer that the hero is. */
    get collision_layer() {
        return this.data.map.collision_layer;
    }

    /**
     * Checks which hero controls are being pressed. Like arrows and dash buttons.
     */
    private check_control_inputs() {
        const arrow_inputs =
            (1 * +this.data.gamepad.is_down(Button.RIGHT)) |
            (2 * +this.data.gamepad.is_down(Button.LEFT)) |
            (4 * +this.data.gamepad.is_down(Button.UP)) |
            (8 * +this.data.gamepad.is_down(Button.DOWN));
        this._required_direction = Hero.ROTATION_KEY[arrow_inputs];

        if (!this.ice_sliding_active) {
            let stick_dashing = false;
            if (!arrow_inputs) {
                stick_dashing = false;
            } else if (this.data.gamepad.is_down(Button.STICK_DASHING)) {
                stick_dashing = true;
            }
            this.dashing = stick_dashing || this.data.gamepad.is_down(Button.B);
        }
    }

    /**
     * Sets the normalized speed factors of the hero.
     * @param check_on_event if true, it will calculate the factors only when not in a tile event.
     * @param desired_direction a desired direction for the hero to go. If not passed, will pick the arrow inputs direction.
     */
    set_speed_factors(check_on_event: boolean = false, desired_direction?: directions) {
        if (check_on_event && this.data.tile_event_manager.on_event) return;
        desired_direction = desired_direction ?? this.required_direction;
        if (this.climbing) {
            //deals with climbing movement
            if (desired_direction === null) {
                this.current_speed.x = this.current_speed.y = 0;
                this.idle_climbing = true;
            } else {
                if ((desired_direction & 1) === 1) {
                    //transforms diagonal movements in non-diagonal
                    --desired_direction;
                }
                this.set_direction(desired_direction);
                this.idle_climbing = false;
                this.current_speed.x = Hero.SPEEDS[desired_direction].x;
                this.current_speed.y = Hero.SPEEDS[desired_direction].y;
            }
        } else if (!this.ice_sliding_active) {
            //Deals with walking/dashing movement.

            //When force_direction is true, it means that the hero is going to face a
            //different direction from the one specified in the keyboard arrows. Generally
            //this is due to hero collision with something.
            if (desired_direction !== null || this.force_direction) {
                if (!this.force_direction) {
                    this.set_direction(desired_direction, false, false);
                    if (this.game.time.frames % 3 === 0) {
                        //This if controls the char turn frame rate, how fast is the transition.
                        //The hero doesn't face immediately the required directrion, there's a transition to it.
                        this._transition_direction = get_transition_directions(
                            this.transition_direction,
                            desired_direction
                        );
                    }
                } else {
                    desired_direction = this.current_direction;
                }
                if (this.force_direction && (this.current_direction & 1) === 1) {
                    //sets the speed according to the collision slope
                    this.current_speed.x = this.force_diagonal_speed.x;
                    this.current_speed.y = this.force_diagonal_speed.y;
                } else {
                    this.current_speed.x = Hero.SPEEDS[desired_direction].x;
                    this.current_speed.y = Hero.SPEEDS[desired_direction].y;
                }
            } else {
                this.current_speed.x = this.current_speed.y = 0;
            }
        } else {
            //deals with ice sliding movement.
            if (!this.sliding_on_ice) {
                if (
                    this.colliding_directions_mask & get_direction_mask(desired_direction) ||
                    desired_direction === null
                ) {
                    this.current_speed.x = this.current_speed.y = 0;
                } else {
                    //checks if a diagonal direction was asked
                    if ((desired_direction & 1) === 1) {
                        //changes to a not diagonal direction. Ice sliding only happens on cardinal directions.
                        if (this.colliding_directions_mask & get_direction_mask(desired_direction - 1)) {
                            desired_direction = (desired_direction + 1) & 7;
                        } else {
                            --desired_direction;
                        }
                    }
                    //starts sliding
                    this.current_speed.x = Hero.SPEEDS[desired_direction].x;
                    this.current_speed.y = Hero.SPEEDS[desired_direction].y;
                    this._ice_slide_direction = desired_direction;
                    this.sliding_on_ice = true;
                }
            } else if (
                this.sliding_on_ice &&
                this.colliding_directions_mask & get_direction_mask(this.ice_slide_direction)
            ) {
                //stops sliding due to collision
                this.current_speed.x = this.current_speed.y = 0;
                this._ice_slide_direction = null;
                this.sliding_on_ice = false;
            } else if (this.sliding_on_ice) {
                if (desired_direction !== null) {
                    //changes the hero facing direction while sliding according to arrows input.
                    this.set_direction(desired_direction, false, false);
                    if (this.game.time.frames & 1) {
                        this._transition_direction = get_transition_directions(
                            this.transition_direction,
                            desired_direction
                        );
                    }
                }
                this.current_speed.x = Hero.SPEEDS[this.ice_slide_direction].x;
                this.current_speed.y = Hero.SPEEDS[this.ice_slide_direction].y;
            }
        }
    }

    /**
     * Checks whether there's a necessity to change hero direction due to
     * any custom circumstances.
     */
    check_custom_directions_change() {
        if (
            this.walking_over_rope &&
            [base_actions.DASH, base_actions.WALK].includes(this.current_action as base_actions)
        ) {
            //transforms retrieved direction from speed in non diagonal direction
            const angle_direction = range_360(Math.atan2(this.current_speed.y, this.current_speed.x));
            const corresponding_dir = (angle_direction / numbers.degree45) | 0;
            const non_diagonal_direction = (corresponding_dir + (corresponding_dir % 2)) % 8; //nearest even number
            this.set_direction(non_diagonal_direction);
        }
    }

    /**
     * Activates or deactivates the hero.
     * @param active whether you want to activate it or not.
     */
    toggle_active(active: boolean) {
        if (active) {
            this.sprite.body.setCollisionGroup(this.data.collision.hero_collision_group);
            this.sprite.visible = true;
            if (this.shadow) {
                this.shadow.visible = true;
            }
            this._active = true;
        } else {
            this.sprite.body.clearCollision(this.data.collision.hero_collision_group);
            this.sprite.visible = false;
            if (this.shadow) {
                this.shadow.visible = false;
            }
            this._active = false;
        }
    }

    /**
     * Gets the hero battle encounter factor that depends on the type of the map (if
     * it's world map or not) and whether it's dashing or not.
     * @returns the encounter factor.
     */
    get_encounter_speed_factor() {
        if (this.data.map.is_world_map) {
            return this.dashing ? 1 : 0.5;
        } else {
            return this.dashing ? 1.5 : 1;
        }
    }

    /**
     * Initializes the hero.
     */
    initialize() {
        const hero_sprite_base = this.data.info.main_char_list[this.key_name].sprite_base;
        this.set_sprite(this.data.middlelayer_group, hero_sprite_base, this.data.map.collision_layer, this.data.map);
        this.set_shadow(this.data.middlelayer_group, {
            is_world_map: this.data.map.is_world_map,
        });
        if (this.data.map.is_world_map) {
            this.create_half_crop_mask();
        }
        this.data.camera.follow(this);
        this.play();
    }

    /**
     * The main hero update function.
     */
    update() {
        if (!this.active) return;
        this.check_control_inputs(); //checks which arrow keys are being pressed
        this.set_speed_factors(true); //sets the direction of the movement
        this.choose_action_based_on_char_state(true); //chooses which sprite the hero shall assume
        this.calculate_speed(); //calculates the final speed
        this.data.collision.check_char_collision(this); //checks if the hero is colliding and its consequences
        this.check_custom_directions_change();
        this.apply_speed(); //applies the final speed
        this.play_current_action(true); //sets the hero sprite
        this.update_shadow(); //updates the hero's shadow position
        this.update_half_crop(); //halves the hero texture if needed
    }

    /**
     * Initializes and configs the hero collision body.
     * @param body_radius the hero collision body radius.
     */
    config_body(body_radius: number = numbers.HERO_BODY_RADIUS) {
        this.game.physics.p2.enable(this.sprite, false);
        this.reset_anchor(); //Important to be after the previous command
        this.sprite.body.clearShapes();
        this._body_radius = body_radius;
        this.sprite.body.setCircle(this.body_radius, 0, 0);
        this.sprite.body.setCollisionGroup(this.data.collision.hero_collision_group);
        this.sprite.body.mass = 1.0;
        this.sprite.body.damping = 0;
        this.sprite.body.angularDamping = 0;
        this.sprite.body.inertia = 0;
        this.sprite.body.dynamic = true;
        this.sprite.body.setZeroRotation();
        this.sprite.body.fixedRotation = true;
        this.sprite.body.data.shapes[0].extra_radius = 0.005;
        this.sprite.body.data.ccdIterations = 1;
        this._shapes_collision_active = true;
    }
}
