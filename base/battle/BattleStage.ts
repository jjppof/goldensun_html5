import * as numbers from "../magic_numbers";
import {range_360} from "../utils";
import {ability_target_types} from "../Ability";
import {fighter_types, permanent_status, Player} from "../Player";
import {GoldenSun} from "../GoldenSun";
import {Button, CButton} from "../XGamepad";
import {PlayerInfo} from "./Battle";
import * as _ from "lodash";
import {battle_actions, battle_positions, PlayerSprite} from "./PlayerSprite";
import {BattleAnimation} from "./BattleAnimation";

const SCALE_FACTOR = 0.8334;
const BG_X = 0;
const BG_Y = 17;
const BG_HEIGHT = 120;

const CENTER_X = numbers.GAME_WIDTH >> 1;
const CENTER_Y = numbers.GAME_HEIGHT - 35;
const CAMERA_SPEED = 0.009 * Math.PI;

const BG_SPEED = 2.4;
const BG_SPIN_SPEED = 0.4;

const SPACE_BETWEEN_CHARS = 35;
export const SEMI_MAJOR_AXIS = numbers.GAME_WIDTH / 2 - 50;
export const SEMI_MINOR_AXIS = numbers.GAME_HEIGHT / 50;

export const DEFAULT_POS_ANGLE = 0.7551327;
const INITIAL_POS_ANGLE = -2.120575;

const INITIAL_SCALE = 1.2;
const BG_DEFAULT_SCALE = 1.0;

const ACTION_POS_BG_SCALE = 2;

const ACTION_POS_ALLY_X = 88;
const ACTION_POS_ENEMY_CENTER_X = 106;
const ACTION_ALLY_Y = 160;
const ACTION_ENEMY_Y = 98;

const ACTION_POS_SPACE_BETWEEN = 40;
const ACTION_POS_SCALE_ADD = 0.2;

const CHOOSE_TARGET_ENEMY_SHIFT = 15;
const CHOOSE_TARGET_ALLY_SHIFT = -3;

const CHOOSE_TARGET_RIGHT = 1;
const CHOOSE_TARGET_LEFT = -1;

const RANGES = [11, 9, 7, 5, 3, 1, 3, 5, 7, 9, 11];
const BATTLE_CURSOR_SCALES = [0.1, 0.2, 0.3, 0.4, 0.6, 1, 0.6, 0.4, 0.3, 0.2, 0.1];

const INIT_TIME = 1500;
const CHOOSING_TARGET_SCREEN_SHIFT_TIME = 150;

export type CameraAngle = {
    rad: number;
    spining: boolean;
    update: Function;
};

export type Target = {
    magnitude: number;
    target: PlayerInfo;
};

export class BattleStage {
    public game: Phaser.Game;
    public data: GoldenSun;

    public camera_angle: CameraAngle;

    public background_key: string;
    public old_camera_angle: number;

    public battle_group: Phaser.Group;
    public crop_group: Phaser.Group;
    public group_enemies: Phaser.Group;
    public group_allies: Phaser.Group;

    public allies_info: PlayerInfo[];
    public enemies_info: PlayerInfo[];
    public allies_count: number;
    public enemies_count: number;

    public shift_from_middle_enemy: number;
    public shift_from_middle_ally: number;

    public sprites: PlayerSprite[];

    public x: number;
    public y: number;

    public choosing_actions: boolean;
    public choosing_targets: boolean;
    public target_type: string;
    public ability_caster: Player;

    public black_bg: Phaser.Graphics;
    public battle_bg: Phaser.TileSprite;
    public battle_bg2: Phaser.TileSprite;

    public upper_rect: Phaser.Graphics;
    public lower_rect: Phaser.Graphics;

    public first_ally_char: Phaser.Sprite;
    public last_ally_char: Phaser.Sprite;
    public first_enemy_char: Phaser.Sprite;
    public last_enemy_char: Phaser.Sprite;

    public choosing_targets_callback: Function;
    public range_cursor_position: number;
    public ability_range: string | number;
    public ability_type: string;

    public cursors_tweens: Phaser.Tween[];
    public cursors: Phaser.Sprite[];
    public bg_height: number;

    constructor(
        game: Phaser.Game,
        data: GoldenSun,
        background_key: string,
        allies_info: PlayerInfo[],
        enemies_info: PlayerInfo[]
    ) {
        this.game = game;
        this.data = data;

        this.camera_angle = {
            rad: INITIAL_POS_ANGLE,
            spining: false,
            update: this.update_sprite_properties.bind(this),
        };

        this.background_key = background_key;
        this.old_camera_angle = this.camera_angle.rad;

        this.battle_group = this.game.add.group();
        this.crop_group = this.game.add.group();
        this.group_enemies = this.game.add.group();
        this.group_allies = this.game.add.group();

        this.allies_info = allies_info;
        this.enemies_info = enemies_info;
        this.allies_count = allies_info.length;
        this.enemies_count = enemies_info.length;

        this.shift_from_middle_enemy = SPACE_BETWEEN_CHARS * this.enemies_count * 0.5;
        this.shift_from_middle_ally = SPACE_BETWEEN_CHARS * this.allies_count * 0.5;

        this.sprites = [];

        this.x = this.game.camera.x;
        this.y = this.game.camera.y;

        this.battle_group.x = this.x;
        this.battle_group.y = this.y;
        this.battle_group.scale.setTo(INITIAL_SCALE, INITIAL_SCALE);

        this.crop_group.x = this.x;
        this.crop_group.y = this.y;
    }

    set_targets() {
        let party_count: number, party_info: PlayerInfo[];

        switch (this.target_type) {
            case ability_target_types.ALLY:
                party_count = this.allies_count;
                party_info = this.allies_info;
                break;

            case ability_target_types.ENEMY:
                party_count = this.enemies_count;
                party_info = this.enemies_info;
                break;

            case ability_target_types.USER:
                party_count =
                    this.ability_caster.fighter_type === fighter_types.ALLY ? this.allies_count : this.enemies_count;
                party_info =
                    this.ability_caster.fighter_type === fighter_types.ENEMY ? this.allies_info : this.enemies_info;
                break;
        }

        const targets = _.zipWith(
            RANGES.slice(
                this.range_cursor_position - (party_count >> 1),
                this.range_cursor_position + (party_count >> 1) + 1
            ).reverse(),
            party_info,
            (magnitude, target) => {
                let t: Target = {magnitude: magnitude > this.ability_range ? null : magnitude, target: target};
                return t;
            }
        );

        if (this.target_type === ability_target_types.USER) {
            this.choosing_targets_callback(targets);
        } else {
            this.choosing_targets_finished(targets);
        }
    }

    next_target() {
        this.change_target(CHOOSE_TARGET_LEFT);
    }

    previous_target() {
        this.change_target(CHOOSE_TARGET_RIGHT);
    }

    change_target(step: number, tween_to_pos: boolean = true) {
        if (this.target_type === ability_target_types.ENEMY) {
            step *= -1;
        }

        const group_info = this.target_type === ability_target_types.ALLY ? this.allies_info : this.enemies_info;
        const group_length = group_info.length;
        const group_half_length = group_length % 2 ? group_length >> 1 : (group_length >> 1) - 1;

        let target_sprite_index: number;

        do {
            this.range_cursor_position += step;
            if (step === 0) step = CHOOSE_TARGET_LEFT;

            const center_shift = this.range_cursor_position - (RANGES.length >> 1);
            target_sprite_index = group_half_length + center_shift;

            if (target_sprite_index >= group_length) {
                this.range_cursor_position = (RANGES.length >> 1) - group_half_length;
                target_sprite_index = 0;
            } else if (target_sprite_index < 0) {
                this.range_cursor_position = (RANGES.length >> 1) + group_half_length + +!(group_length % 2);
                target_sprite_index = group_length - 1;
            }
        } while (group_info[target_sprite_index].instance.has_permanent_status(permanent_status.DOWNED));

        this.set_battle_cursors_position(tween_to_pos);
    }

    initialize_sprites() {
        this.black_bg = this.game.add.graphics(0, 0);
        this.battle_group.add(this.black_bg);

        this.black_bg.beginFill(0x0, 1);
        this.black_bg.drawRect(0, 0, numbers.GAME_WIDTH, numbers.GAME_HEIGHT);
        this.black_bg.endFill();

        this.battle_bg = this.game.add.tileSprite(
            BG_X,
            BG_Y,
            numbers.GAME_WIDTH,
            BG_HEIGHT,
            "battle_backgrounds",
            this.background_key
        );
        this.battle_bg2 = this.game.add.tileSprite(
            BG_X,
            BG_Y,
            numbers.GAME_WIDTH,
            BG_HEIGHT,
            "battle_backgrounds",
            this.background_key
        );

        this.bg_height = this.battle_bg.height;

        this.battle_bg.scale.setTo(BG_DEFAULT_SCALE, BG_DEFAULT_SCALE);
        this.battle_bg2.scale.setTo(BG_DEFAULT_SCALE, BG_DEFAULT_SCALE);

        this.allies_info.forEach(info => {
            const sprite_base = this.data.info.main_char_list[info.instance.key_name].sprite_base;
            const player_sprite = new PlayerSprite(
                this.game,
                this.data,
                this.group_allies,
                info,
                sprite_base,
                true,
                battle_actions.IDLE,
                battle_positions.BACK
            );
            player_sprite.initialize_player();
            info.sprite = player_sprite;
            this.sprites.push(player_sprite);
        });

        this.enemies_info.forEach(info => {
            const sprite_base = this.data.info.enemies_list[info.instance.key_name].sprite_base;
            const player_sprite = new PlayerSprite(
                this.game,
                this.data,
                this.group_enemies,
                info,
                sprite_base,
                false,
                battle_actions.IDLE,
                battle_positions.FRONT
            );
            player_sprite.initialize_player();
            info.sprite = player_sprite;
            this.sprites.push(player_sprite);
        });

        this.first_ally_char = this.group_allies.children[0] as Phaser.Sprite;
        this.last_ally_char = this.group_allies.children[this.allies_count - 1] as Phaser.Sprite;

        this.first_enemy_char = this.group_enemies.children[0] as Phaser.Sprite;
        this.last_enemy_char = this.group_enemies.children[this.enemies_count - 1] as Phaser.Sprite;
    }

    intialize_crop_rectangles() {
        const upper_x = 0;
        const upper_y = 0;

        this.upper_rect = this.game.add.graphics(upper_x, upper_y);
        this.crop_group.add(this.upper_rect);

        this.upper_rect.beginFill(0x0, 1);
        this.upper_rect.drawRect(0, 0, numbers.GAME_WIDTH, numbers.GAME_HEIGHT >> 1);
        this.upper_rect.endFill();

        const lower_x = 0;
        const lower_y = BG_Y + (this.bg_height >> 1) + 2;

        this.lower_rect = this.game.add.graphics(lower_x, lower_y);
        this.crop_group.add(this.lower_rect);

        this.lower_rect.beginFill(0x0, 1);
        this.lower_rect.drawRect(0, 0, numbers.GAME_WIDTH, (numbers.GAME_HEIGHT >> 1) + 2);
        this.lower_rect.endFill();
    }

    initialize_stage(callback) {
        this.choosing_actions = false;
        this.choosing_targets = false;

        this.initialize_sprites();
        this.intialize_crop_rectangles();

        this.battle_group.add(this.battle_bg);
        this.battle_group.add(this.battle_bg2);
        this.battle_group.add(this.group_enemies);
        this.battle_group.add(this.group_allies);

        this.game.add.tween(this.upper_rect).to(
            {
                height: BG_Y,
            },
            INIT_TIME,
            Phaser.Easing.Linear.None,
            true
        );

        this.game.add.tween(this.lower_rect).to(
            {
                y: BG_Y + this.bg_height - 1,
                height: numbers.GAME_HEIGHT - this.bg_height - BG_Y + 1,
            },
            INIT_TIME,
            Phaser.Easing.Linear.None,
            true
        );

        this.game.add
            .tween(this.camera_angle)
            .to(
                {
                    rad: DEFAULT_POS_ANGLE,
                },
                INIT_TIME,
                Phaser.Easing.Linear.None,
                true
            )
            .onComplete.addOnce(() => {
                if (callback) {
                    callback();
                }
            });

        this.game.add.tween(this.battle_group.scale).to(
            {
                x: 1,
                y: 1,
            },
            INIT_TIME,
            Phaser.Easing.Linear.None,
            true
        );
    }

    async set_stage_default_position() {
        let promise_resolve: Function;
        const promise = new Promise(resolve => {
            promise_resolve = resolve;
        });

        this.camera_angle.rad = range_360(this.camera_angle.rad);
        const dest_angle = BattleAnimation.get_angle_by_direction(
            this.camera_angle.rad,
            DEFAULT_POS_ANGLE,
            "closest",
            true
        );
        this.game.add
            .tween(this.camera_angle)
            .to(
                {
                    rad: dest_angle,
                },
                300,
                Phaser.Easing.Linear.None,
                true
            )
            .onComplete.addOnce(promise_resolve);
        await promise;
    }

    set_choosing_action_position() {
        this.choosing_actions = true;

        this.battle_bg2.x = 0;
        this.battle_bg2.scale.setTo(ACTION_POS_BG_SCALE, ACTION_POS_BG_SCALE);
        this.battle_bg2.y = -this.battle_bg.height * (ACTION_POS_BG_SCALE - 1) + BG_Y - CHOOSE_TARGET_ALLY_SHIFT;

        for (let i = 0; i < this.sprites.length; ++i) {
            const player_prite = this.sprites[i];
            const index_shifted = player_prite.is_ally ? i : this.enemies_count - 1 - (i - this.allies_count);
            const x_shift = player_prite.is_ally
                ? ACTION_POS_ALLY_X
                : ACTION_POS_ENEMY_CENTER_X - (this.enemies_count >> 1) * ACTION_POS_SPACE_BETWEEN;

            const pos_x = x_shift + index_shifted * ACTION_POS_SPACE_BETWEEN;
            const pos_y = player_prite.is_ally ? ACTION_ALLY_Y : ACTION_ENEMY_Y;

            player_prite.x = pos_x;
            player_prite.y = pos_y;

            const this_scale_x = player_prite.scale.x + Math.sign(player_prite.scale.x) * ACTION_POS_SCALE_ADD;
            const this_scale_y = player_prite.scale.y + Math.sign(player_prite.scale.y) * ACTION_POS_SCALE_ADD;

            player_prite.scale.setTo(this_scale_x, this_scale_y);
        }
    }

    reset_positions() {
        this.battle_bg2.scale.setTo(BG_DEFAULT_SCALE, BG_DEFAULT_SCALE);
        this.battle_bg2.y = BG_Y;

        for (let i = 0; i < this.sprites.length; ++i) {
            const sprite = this.sprites[i];

            const this_scale_x = sprite.scale.x - Math.sign(sprite.scale.x) * ACTION_POS_SCALE_ADD;
            const this_scale_y = sprite.scale.y - Math.sign(sprite.scale.y) * ACTION_POS_SCALE_ADD;

            sprite.scale.setTo(this_scale_x, this_scale_y);
        }
    }

    set_battle_cursors_position(tween_to_pos: boolean = true) {
        const group_info = this.target_type === ability_target_types.ALLY ? this.allies_info : this.enemies_info;
        const group_half_length = group_info.length % 2 ? group_info.length >> 1 : (group_info.length >> 1) - 1;
        const center_shift = this.range_cursor_position - (RANGES.length >> 1);

        this.cursors.forEach((cursor_sprite, i) => {
            let target_index = i - ((this.cursors.length >> 1) - group_half_length) + center_shift;
            const target_info = group_info[target_index];

            if (target_info && !target_info.instance.has_permanent_status(permanent_status.DOWNED)) {
                const target_sprite = target_info.sprite;
                const this_scale =
                    BATTLE_CURSOR_SCALES[this.range_cursor_position - center_shift - (this.cursors.length >> 1) + i];

                cursor_sprite.scale.setTo(this_scale, this_scale);
                cursor_sprite.alpha = 1;

                if (this.cursors_tweens[i]) {
                    this.cursors_tweens[i].stop();
                }

                const dest_x = target_sprite.x;
                const dest_y = target_sprite.y - target_sprite.height;

                if (tween_to_pos) {
                    this.game.add
                        .tween(cursor_sprite)
                        .to(
                            {
                                centerX: dest_x,
                                y: dest_y,
                            },
                            85,
                            Phaser.Easing.Linear.None,
                            true
                        )
                        .onComplete.addOnce(() => {
                            this.cursors_tweens[i] = this.game.add.tween(cursor_sprite).to(
                                {
                                    y: cursor_sprite.y - 4,
                                },
                                100,
                                Phaser.Easing.Linear.None,
                                true,
                                0,
                                -1,
                                true
                            );
                        });
                } else {
                    cursor_sprite.centerX = dest_x;
                    cursor_sprite.y = dest_y;

                    this.cursors_tweens[i] = this.game.add.tween(cursor_sprite).to(
                        {
                            y: cursor_sprite.y - 4,
                        },
                        100,
                        Phaser.Easing.Linear.None,
                        true,
                        0,
                        -1,
                        true
                    );
                }
            } else {
                cursor_sprite.alpha = 0;
                target_index = target_index < 0 ? 0 : group_info.length - 1;

                const target_sprite = group_info[target_index].sprite;
                cursor_sprite.centerX = target_sprite.x;
                cursor_sprite.y = target_sprite.y - target_sprite.height;
            }
        });
    }

    unset_battle_cursors() {
        this.cursors.forEach((sprite, i) => {
            sprite.destroy();
            if (this.cursors_tweens[i]) {
                this.cursors_tweens[i].stop();
            }
        });
    }

    choose_targets(
        range: string | number,
        target_type: string,
        ability_type: string,
        ability_caster: Player,
        callback: Function
    ) {
        this.choosing_targets_callback = callback;
        this.range_cursor_position = RANGES.length >> 1;

        this.ability_range = range === "all" ? RANGES[0] : range;
        this.ability_type = ability_type;
        this.ability_caster = ability_caster;

        this.target_type = target_type;
        if (this.target_type === ability_target_types.USER) {
            this.set_targets();
        } else {
            this.game.add
                .tween(this.battle_group)
                .to(
                    {
                        y:
                            this.battle_group.y +
                            (this.target_type === ability_target_types.ALLY
                                ? CHOOSE_TARGET_ALLY_SHIFT
                                : CHOOSE_TARGET_ENEMY_SHIFT),
                    },
                    CHOOSING_TARGET_SCREEN_SHIFT_TIME,
                    Phaser.Easing.Linear.None,
                    true
                )
                .onComplete.addOnce(() => {
                    const cursor_count = this.ability_range;

                    this.cursors = new Array<Phaser.Sprite>(cursor_count as number);
                    this.cursors_tweens = new Array<Phaser.Tween>(cursor_count as number).fill(null);

                    for (let i = 0; i < cursor_count; ++i) {
                        this.cursors[i] = this.battle_group.create(0, 0, "battle_cursor");
                        this.cursors[i].animations.add("anim");
                        this.cursors[i].animations.play("anim", 40, true);
                    }

                    this.choosing_targets = true;
                    this.change_target(0, false);

                    // Sound for A key unavailable, using Menu Positive instead
                    const controls = [
                        {button: Button.LEFT, onDown: this.next_target.bind(this), sfx: {down: "menu/move"}},
                        {button: Button.RIGHT, onDown: this.previous_target.bind(this), sfx: {down: "menu/move"}},
                        {button: Button.A, onDown: this.set_targets.bind(this), sfx: {down: "menu/positive"}},
                        {
                            button: Button.B,
                            onDown: this.choosing_targets_finished.bind(this, null),
                            sfx: {down: "menu/negative"},
                        },
                    ];
                    this.data.control_manager.addControls(controls, {loopConfig: {horizontal: true}});
                });
        }
    }

    choosing_targets_finished(targets: Target[]) {
        this.choosing_targets = false;

        this.game.add.tween(this.battle_group).to(
            {
                y:
                    this.battle_group.y -
                    (this.target_type === ability_target_types.ALLY
                        ? CHOOSE_TARGET_ALLY_SHIFT
                        : CHOOSE_TARGET_ENEMY_SHIFT),
            },
            CHOOSING_TARGET_SCREEN_SHIFT_TIME,
            Phaser.Easing.Linear.None,
            true
        );

        this.unset_battle_cursors();
        this.choosing_targets_callback(targets);
    }

    prevent_camera_angle_overflow() {
        this.camera_angle.rad = range_360(this.camera_angle.rad);
    }

    update_stage() {
        if (this.choosing_actions) return;

        if (!this.data.gamepad.isDown(CButton.DEBUG_CAM_PLUS) && this.data.gamepad.isDown(CButton.DEBUG_CAM_MINUS)) {
            this.camera_angle.rad -= CAMERA_SPEED;
            this.battle_bg.x -= BG_SPEED;
        } else if (
            this.data.gamepad.isDown(CButton.DEBUG_CAM_PLUS) &&
            !this.data.gamepad.isDown(CButton.DEBUG_CAM_MINUS)
        ) {
            this.camera_angle.rad += CAMERA_SPEED;
            this.battle_bg.x += BG_SPEED;
        } else {
            const delta = range_360(this.camera_angle.rad) - range_360(this.old_camera_angle);
            this.battle_bg.x += BG_SPIN_SPEED * this.battle_bg.width * delta; //tie bg x position with camera angle when spining
        }

        this.old_camera_angle = this.camera_angle.rad;

        if (this.battle_bg.x > this.battle_bg.width || this.battle_bg.x < -this.battle_bg.width) {
            //check bg x position surplus
            this.battle_bg.x = this.battle_bg2.x;
        }

        if (this.battle_bg.x > 0) {
            //make bg2 follow default bg
            this.battle_bg2.x = this.battle_bg.x - this.battle_bg.width;
        } else if (this.battle_bg.x < 0) {
            this.battle_bg2.x = this.battle_bg.x + this.battle_bg.width;
        }

        if (
            Math.sin(this.camera_angle.rad) > 0 &&
            this.battle_group.getChildIndex(this.group_allies) < this.battle_group.getChildIndex(this.group_enemies)
        ) {
            //check party and enemy z index
            this.battle_group.swapChildren(this.group_enemies, this.group_allies);
        } else if (
            Math.sin(this.camera_angle.rad) < 0 &&
            this.battle_group.getChildIndex(this.group_allies) > this.battle_group.getChildIndex(this.group_enemies)
        ) {
            this.battle_group.swapChildren(this.group_enemies, this.group_allies);
        }

        if (Math.cos(this.camera_angle.rad) < 0 && this.first_ally_char.z > this.last_ally_char.z) {
            //check ally z index order
            this.group_allies.reverse();
        } else if (Math.cos(this.camera_angle.rad) > 0 && this.first_ally_char.z < this.last_ally_char.z) {
            this.group_allies.reverse();
        }

        if (Math.cos(this.camera_angle.rad) < 0 && this.first_enemy_char.z < this.last_enemy_char.z) {
            //check enemy z index order
            this.group_enemies.reverse();
        } else if (Math.cos(this.camera_angle.rad) > 0 && this.first_enemy_char.z > this.last_enemy_char.z) {
            this.group_enemies.reverse();
        }

        this.update_sprite_properties();
    }

    update_sprite_properties() {
        for (let i = 0; i < this.sprites.length; ++i) {
            const player_sprite = this.sprites[i];
            const relative_angle = player_sprite.is_ally ? this.camera_angle.rad : this.camera_angle.rad + Math.PI;

            const angle_position = BattleStage.get_angle(relative_angle);
            const pos_x = BattleStage.ellipse_position(player_sprite, angle_position, true);
            const pos_y = BattleStage.ellipse_position(player_sprite, angle_position, false);

            const shift_from_middle = player_sprite.is_ally
                ? this.shift_from_middle_ally
                : this.shift_from_middle_enemy;
            const index_shifted = player_sprite.is_ally ? i : i - this.allies_count;

            player_sprite.x =
                pos_x +
                (SPACE_BETWEEN_CHARS * index_shifted - shift_from_middle + (SPACE_BETWEEN_CHARS >> 1)) *
                    Math.sin(relative_angle); //shift party players from base point
            player_sprite.y = pos_y;

            const scale = BattleStage.get_scale(relative_angle);
            player_sprite.scale.setTo(scale, scale);

            if (Math.sin(relative_angle) > 0 && player_sprite.position !== battle_positions.BACK) {
                //change texture in function of position
                player_sprite.set_position(battle_positions.BACK);
            } else if (Math.sin(relative_angle) <= 0 && player_sprite.position !== battle_positions.FRONT) {
                player_sprite.set_position(battle_positions.FRONT);
            }

            if (Math.cos(relative_angle) > 0 && player_sprite.scale.x < 0) {
                //change side in function of position
                player_sprite.scale.setTo(player_sprite.scale.x, player_sprite.scale.y);
            } else if (Math.cos(relative_angle) <= 0 && player_sprite.scale.x > 0) {
                player_sprite.scale.setTo(-player_sprite.scale.x, player_sprite.scale.y);
            }
        }
    }

    unset_stage(on_fade_complete: Function, on_flash_complete: Function) {
        this.game.camera.fade();
        this.game.camera.onFadeComplete.addOnce(() => {
            if (on_fade_complete) {
                on_fade_complete();
            }
            this.group_allies.destroy(true);
            this.group_enemies.destroy(true);
            this.battle_group.destroy(true);
            this.upper_rect.height = this.lower_rect.height = numbers.GAME_HEIGHT >> 1;
            this.upper_rect.y = 0;
            this.lower_rect.y = numbers.GAME_HEIGHT >> 1;
            const fade_time = 300;
            this.game.camera.resetFX();
            this.game.add
                .tween(this.upper_rect)
                .to(
                    {
                        height: 0,
                    },
                    fade_time,
                    Phaser.Easing.Linear.None,
                    true
                )
                .onComplete.addOnce(() => {
                    if (on_flash_complete) {
                        on_flash_complete();
                    }
                    this.crop_group.destroy();
                });
            this.game.add.tween(this.lower_rect).to(
                {
                    height: 0,
                    y: numbers.GAME_HEIGHT,
                },
                fade_time,
                Phaser.Easing.Linear.None,
                true
            );
        }, this);
    }

    static ellipse(angle: number, a: number, b: number) {
        //ellipse formula
        a = a === undefined ? SEMI_MAJOR_AXIS : a;
        b = b === undefined ? SEMI_MINOR_AXIS : b;
        return (a * b) / Math.sqrt(Math.pow(b * Math.cos(angle), 2) + Math.pow(a * Math.sin(angle), 2));
    }

    static ellipse_position(player_sprite: PlayerSprite, angle: number, is_x: boolean) {
        if (is_x) {
            const a = player_sprite.ellipses_semi_major;
            return CENTER_X + BattleStage.ellipse(angle, a, SEMI_MINOR_AXIS) * Math.cos(angle);
        } else {
            const b = player_sprite.ellipses_semi_minor;
            return CENTER_Y + BattleStage.ellipse(angle, SEMI_MAJOR_AXIS, b) * Math.sin(angle);
        }
    }

    static get_angle(angle: number) {
        //equidistant ellipse angle formula: https://math.stackexchange.com/a/1123448/202435
        return (
            angle +
            Math.atan(
                ((SEMI_MINOR_AXIS - SEMI_MAJOR_AXIS) * Math.tan(angle)) /
                    (SEMI_MAJOR_AXIS + SEMI_MINOR_AXIS * Math.pow(Math.tan(angle), 2))
            )
        );
    }

    static get_scale(angle: number, default_scale: number = 1.0) {
        return (Math.sin(angle) / 7 + SCALE_FACTOR) * default_scale;
    }
}
