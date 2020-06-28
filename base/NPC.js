import { SpriteBase } from './SpriteBase.js';
import {
    BattleEvent,
    event_types as game_event_types
} from "./GameEvent.js";

export class NPC_Sprite extends SpriteBase {
    constructor (key_name, actions) {
        super(key_name, actions);
    }
}

export class NPC {
    constructor(
        type,
        key_name,
        initial_x,
        initial_y,
        ac_x,
        ac_y,
        npc_type,
        movement_type,
        message,
        thought_message,
        avatar,
        base_collider_layer,
        talk_range_factor,
        events_info
    ) {
        this.type = type;
        this.key_name = key_name;
        this.initial_x = initial_x;
        this.initial_y = initial_y;
        this.ac_x = ac_x;
        this.ac_y = ac_y;
        this.npc_type = npc_type;
        this.movement_type = movement_type;
        this.message = message;
        this.thought_message = thought_message;
        this.avatar = avatar;
        this.base_collider_layer = base_collider_layer;
        this.talk_range_factor = talk_range_factor;
        this.set_events(events_info);
    }

    set_events(events_info) {
        this.events = [];
        for (let i = 0; i < events_info.length; ++i) {
            const event_info = events_info[i];
            if (event_info.type === game_event_types.BATTLE) {
                const event = new BattleEvent(event_info.background_key, event_info.enemy_party_key);
                this.events.push(event);
            }
        }
    }

    set_sprite(sprite) {
        this.npc_sprite = sprite;
    }

    set_shadow_sprite(sprite) {
        this.npc_shadow_sprite = sprite;
    }

    update() {
        if (this.movement_type === NPC.movement_types.IDLE) {
            this.npc_sprite.body.velocity.x = this.npc_sprite.body.velocity.y = 0;
        }
        this.npc_shadow_sprite.x = this.npc_sprite.x;
        this.npc_shadow_sprite.y = this.npc_sprite.y;
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

NPC.interaction_pattern = {
    TIK_TAK_TOE: 0,
    CROSS: 1
};