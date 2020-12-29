import {GoldenSun} from "../GoldenSun";
import {weapon_types} from "../Item";
import {permanent_status, temporary_status} from "../Player";
import {SpriteBase} from "../SpriteBase";
import {base_actions} from "../utils";
import {PlayerInfo} from "./Battle";
import {SEMI_MAJOR_AXIS, SEMI_MINOR_AXIS} from "./BattleStage";

export enum battle_actions {
    IDLE = "idle",
    ATTACK = "attack",
    CAST_INIT = "cast_init",
    CAST = "cast",
    DAMAGE = "damage",
    DOWNED = "downed",
}

export enum battle_positions {
    FRONT = "front",
    BACK = "back",
}

export class PlayerSprite {
    private game: Phaser.Game;
    private data: GoldenSun;
    public is_ally: boolean;
    private battle_action: battle_actions;
    private battle_position: battle_positions;
    private current_status: permanent_status | temporary_status;
    private current_weapon_type: weapon_types;
    private sprite_base: SpriteBase;
    private player_info: PlayerInfo;
    private char_sprite: Phaser.Sprite;
    private shadow_sprite: Phaser.Sprite;
    private status_sprite: Phaser.Sprite;
    private weapon_sprite: Phaser.Sprite;
    private parent_group: Phaser.Group;
    private group: Phaser.Group;
    public ellipses_semi_major: number;
    public ellipses_semi_minor: number;

    constructor(
        game: Phaser.Game,
        data: GoldenSun,
        parent_group: Phaser.Group,
        player_info: PlayerInfo,
        sprite_base: SpriteBase,
        is_ally: boolean,
        initial_action: battle_actions,
        initial_position: battle_positions
    ) {
        this.game = game;
        this.data = data;
        this.parent_group = parent_group;
        this.group = this.game.add.group();
        this.parent_group.add(this.group);
        this.player_info = player_info;
        this.sprite_base = sprite_base;
        this.is_ally = is_ally;
        this.battle_action = initial_action;
        this.battle_position = initial_position;
    }

    get x() {
        return this.group.x;
    }
    set x(x: number) {
        this.group.x = x;
    }

    get y() {
        return this.group.y;
    }
    set y(y: number) {
        this.group.y = y;
    }

    get scale() {
        return this.group.scale;
    }
    set scale(scale: Phaser.Sprite["scale"]) {
        this.group.scale = scale;
    }

    get anchor() {
        return this.char_sprite.anchor;
    }
    set anchor(anchor: Phaser.Sprite["anchor"]) {
        this.char_sprite.anchor = anchor;
    }

    get width() {
        return this.char_sprite.width;
    }
    set width(width: number) {
        this.group.width = width;
    }

    get height() {
        return this.char_sprite.height;
    }
    set height(height: number) {
        this.group.height = height;
    }

    get rotation() {
        return this.char_sprite.rotation;
    }
    set rotation(rotation: number) {
        this.group.rotation = rotation;
    }

    get alpha() {
        return this.char_sprite.alpha;
    }
    set alpha(alpha: number) {
        this.group.alpha = alpha;
    }

    get filters() {
        return this.char_sprite.filters;
    }
    set filters(filters) {
        this.char_sprite.filters = filters;
    }

    get action() {
        return this.battle_action;
    }
    get position() {
        return this.battle_position;
    }
    get battle_key() {
        return this.battle_action + "_" + this.battle_position;
    }

    get animations() {
        return this.char_sprite.animations;
    }

    initialize_player() {
        this.char_sprite = this.group.create(0, 0, this.player_info.sprite_key);
        this.char_sprite.anchor.setTo(0.5, 1);
        this.char_sprite.scale.setTo(this.player_info.scale, this.player_info.scale);

        this.ellipses_semi_major = SEMI_MAJOR_AXIS;
        this.ellipses_semi_minor = SEMI_MINOR_AXIS;

        this.sprite_base.setAnimation(this.char_sprite, base_actions.BATTLE);
        const anim_key = this.sprite_base.getAnimationKey(base_actions.BATTLE, this.battle_key);
        this.char_sprite.animations.play(anim_key);
    }

    set_position(position: battle_positions) {
        this.battle_position = position;
        const anim_key = this.sprite_base.getAnimationKey(base_actions.BATTLE, this.battle_key);
        this.char_sprite.animations.play(anim_key);
    }

    set_action(action: battle_actions) {
        this.battle_action = action;
        const anim_key = this.sprite_base.getAnimationKey(base_actions.BATTLE, this.battle_key);
        this.char_sprite.animations.play(anim_key);
    }

    destroy() {
        this.parent_group.remove(this.group);
        this.group.destroy(true);
    }
}
