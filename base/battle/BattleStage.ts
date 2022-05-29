import * as numbers from "../magic_numbers";
import {range_360} from "../utils";
import {GoldenSun} from "../GoldenSun";
import {Button} from "../XGamepad";
import {PlayerInfo} from "./Battle";
import {battle_actions, battle_positions, PlayerSprite} from "./PlayerSprite";
import {BattleAnimation} from "./BattleAnimation";
import {BattleCursorManager} from "./BattleCursorManager";

const SCALE_FACTOR = 0.8334;
const BG_X = 0;
export const BG_Y = 17;
const BG_WIDTH = 256;
export const BG_HEIGHT = 120;

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

export const CHOOSE_TARGET_ENEMY_SHIFT = 15;
export const CHOOSE_TARGET_ALLY_SHIFT = -3;

const INIT_TIME = 1500;

export type CameraAngle = {
    rad: number;
    update: Function;
};

export type Target = {
    magnitude: number;
    target: PlayerInfo;
};

export class BattleStage {
    private game: Phaser.Game;
    private data: GoldenSun;
    private _cursor_manager: BattleCursorManager;

    private _camera_angle: CameraAngle;

    private background_key: string;
    private old_camera_angle: number;

    private _battle_group: Phaser.Group;
    private crop_group: Phaser.Group;
    private _group_enemies: Phaser.Group;
    private _group_allies: Phaser.Group;

    private _allies_info: PlayerInfo[];
    private _enemies_info: PlayerInfo[];
    private _allies_count: number;
    private _enemies_count: number;

    private shift_from_middle_enemy: number;
    private shift_from_middle_ally: number;

    private _sprites: PlayerSprite[];

    private x: number;
    private y: number;

    public choosing_actions: boolean;
    public pause_update: boolean;
    public pause_players_update: boolean;

    private black_bg: Phaser.Graphics;
    private _battle_bg: Phaser.TileSprite;
    private _battle_bg2: Phaser.TileSprite;

    private upper_rect: Phaser.Graphics;
    private lower_rect: Phaser.Graphics;

    private first_ally_char: Phaser.Sprite;
    private last_ally_char: Phaser.Sprite;
    private first_enemy_char: Phaser.Sprite;
    private last_enemy_char: Phaser.Sprite;

    private bg_height: number;
    private pos_update_factor: {
        factor: number;
    };

    constructor(
        game: Phaser.Game,
        data: GoldenSun,
        background_key: string,
        allies_info: PlayerInfo[],
        enemies_info: PlayerInfo[]
    ) {
        this.game = game;
        this.data = data;
        this._cursor_manager = new BattleCursorManager(this.game, this.data, this);

        this._camera_angle = {
            rad: INITIAL_POS_ANGLE,
            update: this.update_sprite_properties.bind(this),
        };

        this.background_key = background_key;
        this.old_camera_angle = this.camera_angle.rad;

        this._battle_group = this.game.add.group();
        this.crop_group = this.game.add.group();
        this._group_enemies = this.game.add.group();
        this._group_allies = this.game.add.group();

        this._allies_info = allies_info;
        this._enemies_info = enemies_info;
        this._allies_count = allies_info.length;
        this._enemies_count = enemies_info.length;

        this.shift_from_middle_enemy = SPACE_BETWEEN_CHARS * this.enemies_count * 0.5;
        this.shift_from_middle_ally = SPACE_BETWEEN_CHARS * this.allies_count * 0.5;

        this._sprites = [];

        this.x = this.game.camera.x;
        this.y = this.game.camera.y;

        this.battle_group.x = this.x;
        this.battle_group.y = this.y;
        this.battle_group.scale.setTo(INITIAL_SCALE, INITIAL_SCALE);

        this.crop_group.x = this.x;
        this.crop_group.y = this.y;

        this.pause_update = false;
        this.pause_players_update = false;

        this.pos_update_factor = {factor: 0};
    }

    get cursor_manager() {
        return this._cursor_manager;
    }
    get sprites() {
        return this._sprites;
    }
    get group_allies() {
        return this._group_allies;
    }
    get group_enemies() {
        return this._group_enemies;
    }
    get allies_info() {
        return this._allies_info;
    }
    get enemies_info() {
        return this._enemies_info;
    }
    get allies_count() {
        return this._allies_count;
    }
    get enemies_count() {
        return this._enemies_count;
    }
    get battle_group() {
        return this._battle_group;
    }
    get camera_angle() {
        return this._camera_angle;
    }
    get battle_bg() {
        return this._battle_bg;
    }
    get battle_bg2() {
        return this._battle_bg2;
    }

    set_filters() {
        const color_filter = this.game.add.filter("ColorFilters") as Phaser.Filter.ColorFilters;
        const levels_filter = this.game.add.filter("Levels") as Phaser.Filter.Levels;
        const color_blend_filter = this.game.add.filter("ColorBlend") as Phaser.Filter.ColorBlend;
        const hue_filter = this.game.add.filter("Hue") as Phaser.Filter.Hue;

        this.battle_bg.available_filters[color_filter.key] = color_filter;
        this.battle_bg.available_filters[levels_filter.key] = levels_filter;
        this.battle_bg.available_filters[color_blend_filter.key] = color_blend_filter;
        this.battle_bg.available_filters[hue_filter.key] = hue_filter;

        this.battle_bg2.available_filters[color_filter.key] = color_filter;
        this.battle_bg2.available_filters[levels_filter.key] = levels_filter;
        this.battle_bg2.available_filters[color_blend_filter.key] = color_blend_filter;
        this.battle_bg2.available_filters[hue_filter.key] = hue_filter;
    }

    initialize_sprites() {
        this.black_bg = this.game.add.graphics(0, 0);
        this.battle_group.add(this.black_bg);

        this.black_bg.beginFill(0x0, 1);
        this.black_bg.drawRect(0, 0, numbers.GAME_WIDTH, numbers.GAME_HEIGHT);
        this.black_bg.endFill();

        this._battle_bg = this.game.add.tileSprite(
            BG_X,
            BG_Y,
            BG_WIDTH,
            BG_HEIGHT,
            "battle_backgrounds",
            this.background_key
        );
        this._battle_bg2 = this.game.add.tileSprite(
            BG_X,
            BG_Y,
            BG_WIDTH,
            BG_HEIGHT,
            "battle_backgrounds",
            this.background_key
        );

        this.set_filters();

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

        this.initialize_sprites();
        this.intialize_crop_rectangles();

        this.data.game.camera.resetFX();

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

    set_update_factor(factor: number) {
        this.pos_update_factor.factor = factor;
    }

    async reset_chars_position() {
        for (let i = 0; i < this.sprites.length; ++i) {
            const player = this.sprites[i];
            if (player.player_instance.is_paralyzed(true, true)) {
                player.set_action(battle_actions.DOWNED);
            } else {
                player.set_action(battle_actions.IDLE);
            }
            player.ellipses_semi_major = SEMI_MAJOR_AXIS;
            player.ellipses_semi_minor = SEMI_MINOR_AXIS;
        }
        let promise_resolve;
        const promise = new Promise(resolve => (promise_resolve = resolve));
        this.game.add
            .tween(this.pos_update_factor)
            .to(
                {
                    factor: 0,
                },
                300,
                Phaser.Easing.Quadratic.Out,
                true
            )
            .onComplete.addOnce(promise_resolve);
        await promise;
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
                500,
                Phaser.Easing.Quadratic.Out,
                true
            )
            .onComplete.addOnce(promise_resolve);
        await promise;
    }

    private get_player_position_in_stage(sprite_index: number, target_angle?: number) {
        const player_sprite = this.sprites[sprite_index];
        target_angle = target_angle ?? this.camera_angle.rad;
        const relative_angle = player_sprite.is_ally ? target_angle : target_angle + Math.PI;

        player_sprite.stage_angle = BattleStage.get_angle(relative_angle);
        const ellipse_pos_x = BattleStage.ellipse_position(player_sprite, player_sprite.stage_angle, true);
        const ellipse_pos_y = BattleStage.ellipse_position(player_sprite, player_sprite.stage_angle, false);

        const shift_from_middle = player_sprite.is_ally ? this.shift_from_middle_ally : this.shift_from_middle_enemy;
        const index_shifted = player_sprite.is_ally ? sprite_index : sprite_index - this.allies_count;

        const pos_x =
            ellipse_pos_x +
            (SPACE_BETWEEN_CHARS * index_shifted - shift_from_middle + (SPACE_BETWEEN_CHARS >> 1)) *
                Math.sin(relative_angle); //shift party players from base point
        const pos_y = ellipse_pos_y;

        return {x: pos_x, y: pos_y};
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

    prevent_camera_angle_overflow() {
        this.camera_angle.rad = range_360(this.camera_angle.rad);
    }

    update_stage() {
        if (this.choosing_actions || this.pause_update) return;
        this.update_stage_rotation();
        this.update_sprite_properties();
    }

    update_stage_rotation() {
        if (this.data.gamepad.is_down(Button.DEBUG_CAM_MINUS) && !this.data.gamepad.is_down(Button.DEBUG_CAM_PLUS)) {
            this.camera_angle.rad -= CAMERA_SPEED;
            this.battle_bg.x -= BG_SPEED;
        } else if (
            this.data.gamepad.is_down(Button.DEBUG_CAM_PLUS) &&
            !this.data.gamepad.is_down(Button.DEBUG_CAM_MINUS)
        ) {
            this.camera_angle.rad += CAMERA_SPEED;
            this.battle_bg.x += BG_SPEED;
        } else {
            const delta = range_360(this.camera_angle.rad) - range_360(this.old_camera_angle);
            this.battle_bg.x += BG_SPIN_SPEED * this.battle_bg.width * delta; //tie bg x position with camera angle when spining
        }

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

        if (this.old_camera_angle === this.camera_angle.rad) return;
        this.old_camera_angle = this.camera_angle.rad;

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
    }

    update_sprite_properties() {
        for (let i = 0; i < this.sprites.length; ++i) {
            const player_sprite = this.sprites[i];

            if (this.pause_players_update && !player_sprite.force_stage_update) continue;

            const pos = this.get_player_position_in_stage(i);
            player_sprite.x =
                this.pos_update_factor.factor * player_sprite.x + (1 - this.pos_update_factor.factor) * pos.x;
            player_sprite.y =
                this.pos_update_factor.factor * player_sprite.y + (1 - this.pos_update_factor.factor) * pos.y;

            const relative_angle = player_sprite.is_ally ? this.camera_angle.rad : this.camera_angle.rad + Math.PI;
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
            this.sprites.forEach(sprite => {
                sprite.destroy();
            });
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
        a = a ?? SEMI_MAJOR_AXIS;
        b = b ?? SEMI_MINOR_AXIS;
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
