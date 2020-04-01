import { SpriteBase } from './SpriteBase.js';

export class NPC_Sprite extends SpriteBase {
    constructor (
        key_name,
        actions
    ) {
        super(key_name, actions);
    }
}

export class NPC {
    constructor(
        type,
        key_name,
        initial_x,
        initial_y,
        npc_type,
        movement_type,
        message,
        thought_message,
        avatar
    ) {
        this.type = type,
        this.key_name = key_name,
        this.initial_x = initial_x,
        this.initial_y = initial_y,
        this.npc_type = npc_type,
        this.movement_type = movement_type,
        this.message = message,
        this.thought_message = thought_message,
        this.avatar = avatar
    }

    set_sprite(sprite) {
        this.npc_sprite = sprite;
    }
}
NPC.movement_types = {
    IDLE: 0,
    WALK_AROUND: 1
};

NPC.types = {
    NORMAL: 0,
    INN: 1,
    WEAPON_SHOP: 2,
    ARMOR_SHOP: 3,
    MEDICINE_SHOP: 4
};