
import * as numbers from '../../magic_numbers.js';
import { range_360 } from '../../utils.js';
import { enemies_list } from '../../initializers/enemies.js';
import { main_char_list } from '../../initializers/main_chars.js';

const SCALE_FACTOR = 0.8334;
const BG_X = 0;
const BG_Y = 17;
const CENTER_X = numbers.GAME_WIDTH >> 1;
const CENTER_Y = numbers.GAME_HEIGHT - 35;
const CAMERA_SPEED = 0.009 * Math.PI;
const BG_SPEED = 2.4;
const BG_SPIN_SPEED = 0.4;
const SPACE_BETWEEN_CHARS = 35;
const SEMI_MAJOR_AXIS = numbers.GAME_WIDTH/2 - 50;
const SEMI_MINOR_AXIS = numbers.GAME_HEIGHT/50;
const INIT_TIME = 1500;
const DEFAULT_POS_ANGLE = 0.7551327;
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
const RANGES = [11,9,7,5,3,1,3,5,7,9,11];
const BATTLE_CURSOR_SCALES = [.1,.2,.3,.4,.6,1,.6,.4,.3,.2,.1];
const CHOOSING_TARGET_SCREEN_SHIFT_TIME = 150;

export class BattleStage {
    constructor(game, data, background_key, allies_info, enemies_info, esc_propagation_priority, enter_propagation_priority) {
        this.game = game;
        this.data = data;
        this.esc_propagation_priority = esc_propagation_priority;
        this.enter_propagation_priority = enter_propagation_priority;
        this.camera_angle = {
            rad : INITIAL_POS_ANGLE,
            spining: false,
            update: this.update_sprite_properties.bind(this)
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
        this.choose_timer_repeat = this.game.time.create(false);
        this.choose_timer_start = this.game.time.create(false);
        this.set_control();
    }

    set_control() {
        this.data.enter_input.add(() => {
            if (!this.choosing_targets) return;
            this.data.enter_input.halt();
            const party_count = this.target_is_ally ? this.allies_count : this.enemies_count;
            const party_info = this.target_is_ally ? this.allies_info : this.enemies_info;
            const targets = _.zipWith(
                RANGES.slice(this.range_cursor_position - (party_count>>1), this.range_cursor_position + (party_count>>1) + 1).reverse(),
                party_info,
                (magnitude, target) => {
                    return {magnitude: magnitude > this.ability_range ? null : magnitude, target: target};
                }
            );
            this.choosing_targets_finished(targets);
        }, this, this.enter_propagation_priority);
        this.data.esc_input.add(() => {
            if (!this.choosing_targets) return;
            this.data.esc_input.halt();
            this.choosing_targets_finished(null);
        }, this, this.esc_propagation_priority);
        this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT).onDown.add(() => {
            if (!this.choosing_targets) return;
            if (this.left_pressed) {
                this.left_pressed = false;
                this.stop_timers();
            }
            this.right_pressed = true;
            this.set_change_timers(CHOOSE_TARGET_RIGHT);
        });
        this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT).onUp.add(() => {
            if (!this.choosing_targets || !this.right_pressed) return;
            this.right_pressed = false;
            this.stop_timers();
        });
        this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT).onDown.add(() => {
            if (!this.choosing_targets) return;
            if (this.right_pressed) {
                this.right_pressed = false;
                this.stop_timers();
            }
            this.left_pressed = true;
            this.set_change_timers(CHOOSE_TARGET_LEFT);
        });
        this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT).onUp.add(() => {
            if (!this.choosing_targets || !this.left_pressed) return;
            this.left_pressed = false;
            this.stop_timers();
        });
    }

    stop_timers() {
        this.choose_timer_start.stop();
        this.choose_timer_repeat.stop();
    }

    set_change_timers(step) {
        this.change_target(step);
        this.choose_timer_start.add(Phaser.Timer.QUARTER, () => {
            this.choose_timer_repeat.loop(Phaser.Timer.QUARTER >> 1, this.change_target.bind(this, step));
            this.choose_timer_repeat.start();
        });
        this.choose_timer_start.start();
    }

    change_target(step) {
        this.range_cursor_position += step;
        const center_shift = this.range_cursor_position - (RANGES.length >> 1);
        const group = this.target_is_ally ? this.group_allies : this.group_enemies;
        const group_children = this.target_is_ally ? this.group_allies.children.slice().reverse() : this.group_enemies.children;
        const target_sprite_index = (group_children.length >> 1) + center_shift;
        if (target_sprite_index >= group_children.length) {
            this.range_cursor_position = (RANGES.length >> 1) - (group_children.length >> 1);
        } else if (target_sprite_index < 0) {
            this.range_cursor_position = (RANGES.length >> 1) + (group_children.length >> 1);
        }
        this.set_battle_cursors_position();
    }

    initialize_sprites() {
        this.black_bg = this.game.add.graphics(0, 0);
        this.battle_group.add(this.black_bg);
        this.black_bg.beginFill(0x0, 1);
        this.black_bg.drawRect(0, 0, numbers.GAME_WIDTH, numbers.GAME_HEIGHT);
        this.black_bg.endFill();
        this.battle_bg = this.game.add.sprite(BG_X, BG_Y, "battle_backgrounds", this.background_key);
        this.battle_bg2 = this.game.add.sprite(BG_X, BG_Y, "battle_backgrounds", this.background_key);
        this.bg_height = this.battle_bg.height;
        this.battle_bg.scale.setTo(BG_DEFAULT_SCALE);
        this.battle_bg2.scale.setTo(BG_DEFAULT_SCALE);
        const set_sprite = (group, info, is_ally, animation, list) => {
            const sprite = group.create(0, 0, info.sprite_key);
            sprite.anchor.setTo(0.5, 1);
            sprite.scale.setTo(info.scale, info.scale);
            sprite.ellipses_semi_major = SEMI_MAJOR_AXIS;
            sprite.ellipses_semi_minor = SEMI_MINOR_AXIS;
            sprite.is_ally = is_ally;
            const key = info.sprite_key.slice(0, info.sprite_key.lastIndexOf("_"));
            list[key].setAnimation(sprite, "battle");
            sprite.animations.play(animation);
            this.sprites.push(sprite);
        };
        this.allies_info.forEach(info => {
            set_sprite(this.group_allies, info, true, "battle_back", _.mapValues(main_char_list, char => char.sprite_base));
        });
        this.enemies_info.forEach(info => {
            set_sprite(this.group_enemies, info, false, "battle_front", enemies_list);
        });
        this.first_ally_char = this.group_allies.children[0];
        this.last_ally_char = this.group_allies.children[this.allies_count - 1];
        this.first_enemy_char = this.group_enemies.children[0];
        this.last_enemy_char = this.group_enemies.children[this.enemies_count - 1];
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
        this.right_pressed = false;
        this.left_pressed = false;
        this.initialize_sprites();
        this.intialize_crop_rectangles();
        this.battle_group.add(this.battle_bg);
        this.battle_group.add(this.battle_bg2);
        this.battle_group.add(this.group_enemies);
        this.battle_group.add(this.group_allies);
        this.game.add.tween(this.upper_rect).to({
            height: BG_Y
        }, INIT_TIME, Phaser.Easing.Linear.None, true);
        this.game.add.tween(this.lower_rect).to({
            y: BG_Y + this.bg_height - 1,
            height: numbers.GAME_HEIGHT - this.bg_height - BG_Y + 1
        }, INIT_TIME, Phaser.Easing.Linear.None, true);
        this.game.add.tween(this.camera_angle).to({
            rad: DEFAULT_POS_ANGLE
        }, INIT_TIME, Phaser.Easing.Linear.None, true).onComplete.addOnce(() => {
            if (callback) {
                callback();
            }
        });
        this.game.add.tween(this.battle_group.scale).to({
            x: 1, y: 1
        }, INIT_TIME, Phaser.Easing.Linear.None, true);
    }

    set_choosing_action_position() {
        this.choosing_actions = true;
        this.battle_bg2.x = 0;
        this.battle_bg2.scale.setTo(ACTION_POS_BG_SCALE, ACTION_POS_BG_SCALE);
        this.battle_bg2.y = -this.battle_bg.height * (ACTION_POS_BG_SCALE - 1) + BG_Y - CHOOSE_TARGET_ALLY_SHIFT;
        for (let i = 0; i < this.sprites.length; ++i) {
            const sprite = this.sprites[i];
            const index_shifted = sprite.is_ally ? i : i - this.allies_count;
            const x_shift = sprite.is_ally ? ACTION_POS_ALLY_X : ACTION_POS_ENEMY_CENTER_X - (this.enemies_count >> 1) * ACTION_POS_SPACE_BETWEEN;
            const pos_x = x_shift + index_shifted * ACTION_POS_SPACE_BETWEEN;
            const pos_y = sprite.is_ally ? ACTION_ALLY_Y : ACTION_ENEMY_Y;
            sprite.x = pos_x;
            sprite.y = pos_y;
            const this_scale_x = sprite.scale.x + Math.sign(sprite.scale.x) * ACTION_POS_SCALE_ADD;
            const this_scale_y = sprite.scale.y + Math.sign(sprite.scale.y) * ACTION_POS_SCALE_ADD;
            sprite.scale.setTo(this_scale_x, this_scale_y);
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

    set_battle_cursors_position(tween_to_pos = true) {
        const group_children = this.target_is_ally ? this.group_allies.children.slice().reverse() : this.group_enemies.children;
        const center_shift = this.range_cursor_position - (RANGES.length >> 1);
        this.cursors.forEach((cursor_sprite, i) => {
            let target_sprite_index = i - ((this.cursors.length >> 1) - (group_children.length >> 1)) + center_shift;
            let target_sprite = group_children[target_sprite_index];
            if (target_sprite) {
                const this_scale = BATTLE_CURSOR_SCALES[this.range_cursor_position - center_shift - (this.cursors.length >> 1) + i];
                cursor_sprite.scale.setTo(this_scale, this_scale);
                cursor_sprite.alpha = 1;
                if (this.cursors_tweens[i]) {
                    this.cursors_tweens[i].stop();
                }
                const dest_x = target_sprite.x;
                const dest_y = target_sprite.y - target_sprite.height - 5;
                if (tween_to_pos) {
                    this.game.add.tween(cursor_sprite).to({
                        centerX: dest_x,
                        y: dest_y
                    }, 85, Phaser.Easing.Linear.None, true).onComplete.addOnce(() => {
                        this.cursors_tweens[i] = this.game.add.tween(cursor_sprite).to({
                            y: cursor_sprite.y - 4
                        }, 100, Phaser.Easing.Linear.None, true, 0, -1, true);
                    });
                } else {
                    cursor_sprite.centerX = dest_x;
                    cursor_sprite.y = dest_y;
                    this.cursors_tweens[i] = this.game.add.tween(cursor_sprite).to({
                        y: cursor_sprite.y - 4
                    }, 100, Phaser.Easing.Linear.None, true, 0, -1, true);
                }
            } else {
                cursor_sprite.alpha = 0;
                target_sprite_index = target_sprite_index < 0 ? 0 : group_children.length - 1;
                target_sprite = group_children[target_sprite_index];
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
        this.stop_timers();
    }

    choose_targets(range, target_is_ally, ability_type, callback) {
        this.choosing_targets_callback = callback;
        this.range_cursor_position = RANGES.length >> 1;
        this.ability_range = range === "all" ? RANGES[0] : range;
        this.target_is_ally = target_is_ally;
        this.ability_type = ability_type;
        this.game.add.tween(this.battle_group).to({
            y: this.battle_group.y + (this.target_is_ally ? CHOOSE_TARGET_ALLY_SHIFT : CHOOSE_TARGET_ENEMY_SHIFT)
        }, CHOOSING_TARGET_SCREEN_SHIFT_TIME, Phaser.Easing.Linear.None, true).onComplete.addOnce(() => {
            const cursor_count = this.ability_range;
            this.cursors = new Array(cursor_count);
            this.cursors_tweens = new Array(cursor_count).fill(null);
            for (let i = 0; i < cursor_count; ++i) {
                this.cursors[i] = this.battle_group.create(0, 0, "battle_cursor");
                this.cursors[i].animations.add("anim");
                this.cursors[i].animations.play("anim", 40, true);
            }
            this.choosing_targets = true;
            this.set_battle_cursors_position(false);
        });
    }

    choosing_targets_finished(targets) {
        this.game.add.tween(this.battle_group).to({
            y: this.battle_group.y - (this.target_is_ally ? CHOOSE_TARGET_ALLY_SHIFT : CHOOSE_TARGET_ENEMY_SHIFT)
        }, CHOOSING_TARGET_SCREEN_SHIFT_TIME, Phaser.Easing.Linear.None, true);
        this.choosing_targets = false;
        this.unset_battle_cursors();
        this.choosing_targets_callback(targets);
    }

    prevent_camera_angle_overflow() {
        this.camera_angle.rad = range_360(this.camera_angle.rad);
    }

    update_stage() {
        if (this.choosing_actions) return;
        if (!this.game.input.keyboard.isDown(Phaser.Keyboard.PAGE_UP) && this.game.input.keyboard.isDown(Phaser.Keyboard.PAGE_DOWN)) {
            this.camera_angle.rad -= CAMERA_SPEED;
            this.battle_bg.x -= BG_SPEED
        } else if (this.game.input.keyboard.isDown(Phaser.Keyboard.PAGE_UP) && !this.game.input.keyboard.isDown(Phaser.Keyboard.PAGE_DOWN)) {
            this.camera_angle.rad += CAMERA_SPEED;
            this.battle_bg.x += BG_SPEED
        } else {
            const delta = range_360(this.camera_angle.rad) - range_360(this.old_camera_angle);
            this.battle_bg.x += BG_SPIN_SPEED * this.battle_bg.width * delta; //tie bg x position with camera angle when spining
        }

        this.old_camera_angle = this.camera_angle.rad;

        if (this.battle_bg.x > this.battle_bg.width || this.battle_bg.x < -this.battle_bg.width) { //check bg x position surplus
            this.battle_bg.x = this.battle_bg2.x;
        }

        if (this.battle_bg.x > 0) { //make bg2 follow default bg
            this.battle_bg2.x = this.battle_bg.x - this.battle_bg.width;
        } else if (this.battle_bg.x < 0) {
            this.battle_bg2.x = this.battle_bg.x + this.battle_bg.width;
        }

        if (Math.sin(this.camera_angle.rad) > 0 && this.battle_group.getChildIndex(this.group_allies) < this.battle_group.getChildIndex(this.group_enemies)) { //check party and enemy z index
            this.battle_group.swapChildren(this.group_enemies, this.group_allies);
        } else if (Math.sin(this.camera_angle.rad) < 0 && this.battle_group.getChildIndex(this.group_allies) > this.battle_group.getChildIndex(this.group_enemies)) {
            this.battle_group.swapChildren(this.group_enemies, this.group_allies);
        }

        if (Math.cos(this.camera_angle.rad) < 0 && this.first_ally_char.z > this.last_ally_char.z) { //check ally z index order
            this.group_allies.reverse();
        } else if (Math.cos(this.camera_angle.rad) > 0 && this.first_ally_char.z < this.last_ally_char.z) {
            this.group_allies.reverse();
        }
        if (Math.cos(this.camera_angle.rad) < 0 && this.first_enemy_char.z < this.last_enemy_char.z) { //check enemy z index order
            this.group_enemies.reverse();
        } else if (Math.cos(this.camera_angle.rad) > 0 && this.first_enemy_char.z > this.last_enemy_char.z) {
            this.group_enemies.reverse();
        }

        this.update_sprite_properties();
    }

    update_sprite_properties() {
        for (let i = 0; i < this.sprites.length; ++i) {
            const sprite = this.sprites[i];
            const relative_angle = sprite.is_ally ? this.camera_angle.rad : this.camera_angle.rad + Math.PI;
            const angle_position = BattleStage.get_angle(relative_angle);
            const pos_x = BattleStage.ellipse_position(sprite, angle_position, true);
            const pos_y = BattleStage.ellipse_position(sprite, angle_position, false);
            const shift_from_middle = sprite.is_ally ? this.shift_from_middle_ally : this.shift_from_middle_enemy;
            const index_shifted = sprite.is_ally ? i : i - this.allies_count;
            sprite.x = pos_x + ((SPACE_BETWEEN_CHARS * index_shifted - shift_from_middle) + (SPACE_BETWEEN_CHARS >> 1)) * Math.sin(relative_angle); //shift party players from base point
            sprite.y = pos_y;
            const info = sprite.is_ally ? this.allies_info[index_shifted] : this.enemies_info[index_shifted];
            const scale = BattleStage.get_scale(info.scale, relative_angle);
            sprite.scale.setTo(scale, scale);
            if (Math.sin(relative_angle) > 0 && !sprite.animations.currentAnim.name.endsWith('back')) { //change texture in function of position
                sprite.animations.play(sprite.animations.currentAnim.name.replace('front', 'back'));
            } else if (Math.sin(relative_angle) <= 0 && !sprite.animations.currentAnim.name.endsWith('front')) {
                sprite.animations.play(sprite.animations.currentAnim.name.replace('back', 'front'));
            }
            if (Math.cos(relative_angle) > 0 && sprite.scale.x < 0) { //change side in function of position
                sprite.scale.setTo(sprite.scale.x, sprite.scale.y);
            } else if (Math.cos(relative_angle) <= 0 && sprite.scale.x > 0) {
                sprite.scale.setTo(-sprite.scale.x, sprite.scale.y);
            }
        }
    }

    unset_stage() {

    }

    static ellipse(angle, a, b) { //ellipse formula
        a = a === undefined ? SEMI_MAJOR_AXIS : a;
        b = b === undefined ? SEMI_MINOR_AXIS : b;
        return a*b/Math.sqrt(Math.pow(b*Math.cos(angle), 2) + Math.pow(a*Math.sin(angle), 2));
    }
    
    static ellipse_position(sprite, angle, is_x) {
        if (is_x) {
            const a = sprite.ellipses_semi_major;
            return CENTER_X + BattleStage.ellipse(angle, a, SEMI_MINOR_AXIS) * Math.cos(angle);
        } else {
            const b = sprite.ellipses_semi_minor;
            return CENTER_Y + BattleStage.ellipse(angle, SEMI_MAJOR_AXIS, b) * Math.sin(angle);
        }
    }
    
    static get_angle(angle) { //equidistant ellipse angle formula: https://math.stackexchange.com/a/1123448/202435
        return angle + Math.atan(((SEMI_MINOR_AXIS - SEMI_MAJOR_AXIS) * Math.tan(angle))/(SEMI_MAJOR_AXIS + SEMI_MINOR_AXIS*Math.pow(Math.tan(angle), 2)));
    }
    
    static get_scale(default_scale, angle) {
        return (Math.sin(angle)/7 + SCALE_FACTOR) * default_scale;
    }
}