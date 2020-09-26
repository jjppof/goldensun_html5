import { SpriteBase } from './SpriteBase.js';
import { event_types as game_event_types } from "./game_events/GameEvent.js";
import { mount_collision_polygon } from '../utils.js';
import { ControllableChar } from './ControllableChar.js';
import { BattleEvent } from './game_events/BattleEvent.js';

export class NPC_Sprite extends SpriteBase {
    constructor (key_name, actions) {
        super(key_name, actions);
    }
}

const NPC_TALK_RANGE = 3.0;

export const npc_movement_types = {
    IDLE: "idle",
    WALK_AROUND: "walk_around"
};

export const npc_types = {
    NORMAL: "normal",
    INN: "inn",
    WEAPON_SHOP: "weapon_shop",
    ARMOR_SHOP: "armor_shop",
    MEDICINE_SHOP: "medicine_shop"
};

export class NPC extends ControllableChar {
    constructor(
        game,
        data,
        key_name,
        initial_x,
        initial_y,
        initial_action,
        initial_direction,
        enable_footsteps,
        npc_type,
        movement_type,
        message,
        thought_message,
        avatar,
        base_collider_layer,
        talk_range_factor,
        events_info
    ) {
        super(game, data, key_name, initial_x, initial_y, initial_action, initial_direction, enable_footsteps);
        this.npc_type = npc_type;
        this.movement_type = movement_type;
        this.message = message;
        this.thought_message = thought_message;
        this.avatar = avatar;
        this.base_collider_layer = base_collider_layer;
        this.talk_range_factor = talk_range_factor === undefined ? NPC_TALK_RANGE : talk_range_factor;
        this.events = [];
        this.set_events(events_info);
    }

    set_sprite_as_npc() {
        this.sprite.is_npc = true;
    }

    set_events(events_info) {
        for (let i = 0; i < events_info.length; ++i) {
            const event_info = events_info[i];
            switch (event_info.type) {
                case game_event_types.BATTLE:
                    this.events.push(new BattleEvent(this.game, this.data, event_info.background_key, event_info.enemy_party_key));
                    break;
            }
        }
    }

    update() {
        if (this.movement_type === npc_movement_types.IDLE) {
            this.stop_char(false);
        }
        this.update_shadow();
    }

    config_body(collision_obj) {
        this.game.physics.p2.enable(this.sprite, false);
        //Important to be after the previous command
        if (this.data.npc_db[this.key_name].anchor_x !== undefined) {
            this.sprite.anchor.x = this.data.npc_db[this.key_name].anchor_x;
        } else {
            this.reset_anchor('x');
        }
        if (this.data.npc_db[this.key_name].anchor_y !== undefined) {
            this.sprite.anchor.y = this.data.npc_db[this.key_name].anchor_y;
        } else {
            this.reset_anchor('y');
        }
        this.sprite.body.clearShapes();
        this.body_radius = this.data.npc_db[this.key_name].body_radius;
        const width = this.body_radius << 1;
        const polygon = mount_collision_polygon(width, -(width >> 1), this.data.npc_db[this.key_name].collision_body_bevel);
        this.sprite.body.addPolygon({
                optimalDecomp: false,
                skipSimpleCheck: true,
                removeCollinearPoints: false
        }, polygon);
        this.sprite.body.setCollisionGroup(collision_obj.npc_collision_groups[this.base_collider_layer]);
        this.sprite.body.damping = 1;
        this.sprite.body.angularDamping = 1;
        this.sprite.body.setZeroRotation();
        this.sprite.body.fixedRotation = true;
        this.sprite.body.dynamic = false;
        this.sprite.body.static = true;
    }
}
