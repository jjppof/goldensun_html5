import {weapon_types} from "../Item";
import {permanent_status, temporary_status} from "../Player";
import {SpriteBase} from "../SpriteBase";

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
    private is_ally: boolean;
    private battle_action: battle_actions;
    private battle_position: battle_positions;
    private default_scale: number;
    private current_status: permanent_status | temporary_status;
    private current_weapon_type: weapon_types;
    private sprite_base: SpriteBase;
    private player_sprite: Phaser.Sprite;
    private shadow_sprite: Phaser.Sprite;
    private status_sprite: Phaser.Sprite;
    private weapon_sprite: Phaser.Sprite;

    constructor(game, data) {}
}
