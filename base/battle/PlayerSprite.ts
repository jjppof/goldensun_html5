import {GoldenSun} from "../GoldenSun";
import {weapon_types} from "../Item";
import {permanent_status, Player, temporary_status} from "../Player";
import {SpriteBase} from "../SpriteBase";
import {base_actions} from "../utils";
import {PlayerInfo} from "./Battle";
import {SEMI_MAJOR_AXIS, SEMI_MINOR_AXIS} from "./BattleStage";
import * as _ from "lodash";
import {Observable, Subject, Subscription} from "rxjs";
import {MainChar} from "../MainChar";
import {Enemy} from "../Enemy";

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

const status_sprites = [
    temporary_status.DEATH_CURSE,
    permanent_status.POISON,
    permanent_status.VENOM,
    temporary_status.SEAL,
    temporary_status.STUN,
    temporary_status.SLEEP,
    permanent_status.HAUNT,
    temporary_status.DELUSION,
];

const sprites_height_factors = {
    [temporary_status.DEATH_CURSE]: 1.2,
    [permanent_status.POISON]: 1.0,
    [permanent_status.VENOM]: 1.0,
    [temporary_status.SEAL]: 1.2,
    [temporary_status.STUN]: 0.7,
    [temporary_status.SLEEP]: 1.0,
    [permanent_status.HAUNT]: 1.0,
    [temporary_status.DELUSION]: 1.0,
};

const STATUS_SPRITES_KEY_NAME = "battle_status_sprites";

export class PlayerSprite {
    private game: Phaser.Game;
    private data: GoldenSun;
    public is_ally: boolean;
    private battle_action: battle_actions;
    private battle_position: battle_positions;
    private current_status_index: number;
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
    public stage_angle: number;
    private status_sprite_base: SpriteBase;
    private status_timer: Phaser.Timer;
    private on_status_change_obs: Observable<Player["on_status_change"] extends Subject<infer T> ? T : never>;
    private on_status_change_subs: Subscription;
    public player_instance: MainChar | Enemy;

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
        this.group.onDestroy.addOnce(() => {
            this.on_status_change_subs.unsubscribe();
            this.status_timer.stop();
            this.status_timer.destroy();
        });
        this.player_info = player_info;
        this.player_instance = this.player_info.instance;
        this.sprite_base = sprite_base;
        this.is_ally = is_ally;
        this.battle_action = initial_action;
        this.battle_position = initial_position;
        this.current_status_index = 0;
        this.status_sprite_base = this.data.info.misc_sprite_base_list[STATUS_SPRITES_KEY_NAME];
        this.status_timer = this.game.time.create(false);
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
        return this.group.width;
    }
    set width(width: number) {
        this.group.width = width;
    }

    get height() {
        return this.group.height;
    }
    set height(height: number) {
        this.group.height = height;
    }

    get rotation() {
        return this.group.rotation;
    }
    set rotation(rotation: number) {
        this.group.rotation = rotation;
    }

    get alpha() {
        return this.group.alpha;
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
        return `${this.battle_action}_${this.battle_position}`;
    }

    get animations() {
        return this.char_sprite.animations;
    }

    initialize_player() {
        this.shadow_sprite = this.group.create(0, 0, "battle_shadows", this.player_instance.battle_shadow_key);
        this.shadow_sprite.anchor.setTo(0.5, 1);
        this.shadow_sprite.scale.setTo(this.player_instance.battle_scale, this.player_instance.battle_scale);

        this.char_sprite = this.group.create(0, 0, this.player_info.sprite_key);
        this.char_sprite.anchor.setTo(0.5, 1);
        this.char_sprite.scale.setTo(this.player_instance.battle_scale, this.player_instance.battle_scale);
        this.char_sprite.filters = [this.game.add.filter("ColorFilters")];

        if (this.is_ally) {
            const player = this.player_instance as MainChar;
            const weapon_slot = player.equip_slots.weapon;
            if (weapon_slot !== null) {
                this.current_weapon_type = this.data.info.items_list[weapon_slot.key_name].weapon_type;
                if (player.weapons_sprite_base.hasAction(this.current_weapon_type)) {
                    const weapon_sprite_key = player.weapons_sprite_base.getSpriteKey(this.current_weapon_type);
                    this.weapon_sprite = this.group.create(0, 0, weapon_sprite_key);
                    this.weapon_sprite.anchor.setTo(0.5, 1);
                    this.weapon_sprite.y += player.weapon_sprite_shift;
                    player.weapons_sprite_base.setAnimation(this.weapon_sprite, this.current_weapon_type);
                }
            }
        }

        const status_key = this.status_sprite_base.getSpriteKey(STATUS_SPRITES_KEY_NAME);
        this.status_sprite = this.group.create(0, 0, status_key);
        this.status_sprite.anchor.setTo(0.5, 0.5);
        this.status_sprite_base.setAnimation(this.status_sprite, STATUS_SPRITES_KEY_NAME);
        this.status_sprite.visible = false;
        this.status_timer.loop(4000, this.set_next_status_sprite.bind(this));
        this.status_timer.start();
        this.on_status_change_obs = this.player_instance.on_status_change.asObservable();
        this.on_status_change_subs = this.on_status_change_obs.subscribe(this.set_next_status_sprite.bind(this));

        this.ellipses_semi_major = SEMI_MAJOR_AXIS;
        this.ellipses_semi_minor = SEMI_MINOR_AXIS;
        this.stage_angle = 0;

        this.sprite_base.setAnimation(this.char_sprite, base_actions.BATTLE);
        this.play_position();
    }

    play_position(frame_rate?: number, loop?: boolean) {
        const anim_key = this.sprite_base.getAnimationKey(base_actions.BATTLE, this.battle_key);
        this.char_sprite.animations.play(anim_key, frame_rate, loop);
        this.char_sprite.animations.currentAnim.restart();
        if (this.weapon_sprite) {
            const player = this.player_instance as MainChar;
            const weapon_anim_key = player.weapons_sprite_base.getAnimationKey(
                this.current_weapon_type,
                this.battle_key
            );
            this.weapon_sprite.animations.play(weapon_anim_key, frame_rate, loop);
            this.weapon_sprite.animations.currentAnim.restart();
        }
    }

    set_position(position: battle_positions, play: boolean = true) {
        this.battle_position = position;
        if (play) {
            this.play_position();
        }
    }

    set_action(action: battle_actions, play: boolean = true) {
        this.battle_action = action;
        if (play) {
            this.play_position();
        }
    }

    get_animation_key(action: battle_actions, position: battle_positions) {
        return this.sprite_base.getAnimationKey(base_actions.BATTLE, `${action}_${position}`);
    }

    set_next_status_sprite() {
        for (let i = 0; i < status_sprites.length; ++i) {
            const status = status_sprites[this.current_status_index++];
            if (this.current_status_index === status_sprites.length) {
                this.current_status_index = 0;
            }
            if (
                this.player_instance.has_permanent_status(status as permanent_status) ||
                this.player_instance.has_temporary_status(status as temporary_status)
            ) {
                this.status_sprite.visible = true;
                this.status_sprite.y =
                    -(this.char_sprite.height * sprites_height_factors[status]) +
                    this.player_instance.status_sprite_shift * this.player_instance.battle_scale;
                let status_key: string = status;
                if ((status as temporary_status) === temporary_status.DEATH_CURSE) {
                    const effect = _.find(this.player_instance.effects, {
                        status_key_name: temporary_status.DEATH_CURSE,
                    });
                    const remaining_turns = effect ? this.player_instance.get_effect_turns_count(effect) : 1;
                    status_key = `${status}_${remaining_turns - 1}`;
                }
                const animation_key = this.status_sprite_base.getAnimationKey(STATUS_SPRITES_KEY_NAME, status_key);
                this.status_sprite.animations.play(animation_key);
                return;
            }
        }
        this.status_sprite.visible = false;
    }

    destroy() {
        this.on_status_change_subs.unsubscribe();
        this.status_timer.stop();
        this.status_timer.destroy();
        this.parent_group.remove(this.group);
        this.group.destroy(true);
    }
}
