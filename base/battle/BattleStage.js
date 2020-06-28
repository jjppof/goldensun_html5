
import * as numbers from '../../magic_numbers.js';
import { range_360 } from '../../utils.js';

const SCALE_FACTOR = 0.8334;
const BG_X = 0;
const BG_Y = 17;
const BG_HEIGHT = 113;
const CENTER_X = numbers.GAME_WIDTH >> 1;
const CENTER_Y = numbers.GAME_HEIGHT - 35;
const CAMERA_SPEED = 0.009 * Math.PI;
const BG_SPEED = 2.4;
const BG_SPIN_SPEED = 0.4;
const SPACE_BETWEEN_CHARS = 35;
const SEMI_MAJOR_AXIS = numbers.GAME_WIDTH/2 - 30;
const SEMI_MINOR_AXIS = numbers.GAME_HEIGHT/50;

export class BattleStage {
    constructor(game, background_key, allies_info, enemies_info) {
        this.game = game;
        this.camera_angle = {
            rad : 0,
            spining: false,
            update: this.update_sprite_properties.bind(this)
        };
        this.background_key = background_key;
        this.old_camera_angle = this.camera_angle.rad;
        this.group_enemies = this.game.add.group();
        this.group_allies = this.game.add.group();
        this.allies_info = allies_info;
        this.enemies_info = enemies_info;
        this.allies_count = allies_info.length;
        this.enemies_count = enemies_info.length;
        this.shift_from_middle_enemy = SPACE_BETWEEN_CHARS * this.allies_count * 0.5;
        this.shift_from_middle_ally = SPACE_BETWEEN_CHARS * this.enemies_count * 0.5;
        this.sprites = [];
        this.x = this.game.camera.x;
        this.y = this.game.camera.y;
    }

    initialize_sprites() {
        this.black_bg = this.game.add.graphics(0, 0);
        this.black_bg.beginFill(0x0, 1);
        this.black_bg.drawRect(this.x, this.y, numbers.GAME_WIDTH, numbers.GAME_HEIGHT);
        this.black_bg.endFill();
        this.battle_bg = this.game.add.tileSprite(this.x + BG_X, this.y + BG_Y, numbers.GAME_WIDTH, BG_HEIGHT, "battle_backgrounds", this.background_key);
        this.battle_bg2 = this.game.add.tileSprite(this.x + BG_X, this.y + BG_Y, numbers.GAME_WIDTH, BG_HEIGHT, "battle_backgrounds", this.background_key);
        const set_sprite = (group, info, is_ally, animation) => {
            const sprite = group.create(0, 0, info.sprite_key);
            sprite.anchor.setTo(0.5, 1);
            sprite.scale.setTo(info.scale, info.scale);
            sprite.ellipses_semi_major = SEMI_MAJOR_AXIS;
            sprite.ellipses_semi_minor = SEMI_MINOR_AXIS;
            sprite.is_ally = is_ally;
            sprite.animations.play(animation);
            this.sprites.push(sprite);
        };
        this.allies_info.forEach(info => {
            set_sprite(this.group_allies, info, true, "back");
        });
        this.enemies_info.forEach(info => {
            set_sprite(this.group_enemies, info, false, "front");
        });
        this.first_ally_char = this.group_allies.children[0];
        this.last_ally_char = this.group_allies.children[this.allies_count - 1];
        this.first_enemy_char = this.group_enemies.children[0];
        this.last_enemy_char = this.group_enemies.children[this.enemies_count - 1];
    }

    initialize_stage() {
        this.initialize_sprites();
    }

    set_choosing_action_position() {

    }

    prevent_camera_angle_overflow() {
        this.camera_angle.rad = range_360(this.camera_angle.rad);
    }

    update_stage() {
        this.battle_bg.x += BG_SPIN_SPEED * numbers.GAME_WIDTH * (this.camera_angle.rad - this.old_camera_angle); //tie bg x position with camera angle when spining
        this.old_camera_angle = this.camera_angle.rad;

        if (this.battle_bg.x > numbers.GAME_WIDTH) { //check bg x position surplus
            this.battle_bg.x -= Math.abs(Math.floor(this.battle_bg.x/numbers.GAME_WIDTH)) * numbers.GAME_WIDTH;
        } else if (this.battle_bg.x < -numbers.GAME_WIDTH) {
            this.battle_bg.x += Math.abs(Math.floor(this.battle_bg.x/numbers.GAME_WIDTH)) * numbers.GAME_WIDTH;
        }

        if (this.battle_bg.x > 0 && this.battle_bg.x < numbers.GAME_WIDTH) { //make mirrored bg follow default bg
            this.battle_bg2.x = this.battle_bg.x - numbers.GAME_WIDTH;
        } else if (this.battle_bg.x < 0 && this.battle_bg.x > -numbers.GAME_WIDTH) {
            this.battle_bg2.x = this.battle_bg.x + numbers.GAME_WIDTH;
        }

        if (Math.sin(this.camera_angle.rad) > 0 && this.game.world.getChildIndex(this.group_allies) < this.game.world.getChildIndex(this.group_enemies)) { //check party and enemy z index
            this.game.world.swapChildren(this.group_enemies, this.group_allies);
        } else if (Math.sin(this.camera_angle.rad) < 0 && this.game.world.getChildIndex(this.group_allies) > this.game.world.getChildIndex(this.group_enemies)) {
            this.game.world.swapChildren(this.group_enemies, this.group_allies);
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
        return angle + Math.atan(((SEMI_MINOR_AXIS-SEMI_MAJOR_AXIS) * Math.tan(angle))/(SEMI_MAJOR_AXIS + SEMI_MINOR_AXIS*Math.pow(Math.tan(angle), 2)));
    }
    
    static get_scale(default_scale, angle) {
        return (Math.sin(angle)/6 + SCALE_FACTOR) * default_scale;
    }
}