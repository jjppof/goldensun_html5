import { SpriteBase } from './SpriteBase.js';
import {
    BattleEvent,
    event_types as game_event_types
} from "./GameEvent.js";
import { mount_collision_polygon } from '../utils.js';

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

export const npc_interaction_pattern = {
    TIK_TAK_TOE: "tik_tak_toe",
    CROSS: "cross"
};

export class NPC {
    constructor(
        game,
        data,
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
        this.game = game;
        this.data = data;
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
        this.talk_range_factor = talk_range_factor === undefined ? NPC_TALK_RANGE : talk_range_factor;
        this.set_events(events_info);
    }

    initial_config(map_sprite) {
        const initial_action = this.data.npc_db[this.key_name].initial_action;
        let npc_shadow_sprite = this.data.npc_group.create(0, 0, 'shadow');
        npc_shadow_sprite.roundPx = true;
        npc_shadow_sprite.blendMode = PIXI.blendModes.MULTIPLY;
        npc_shadow_sprite.anchor.setTo(this.ac_x, this.ac_y);
        npc_shadow_sprite.base_collider_layer = this.base_collider_layer;
        const sprite_key = this.key_name + "_" + initial_action;
        const npc_sprite = this.data.npc_group.create(0, 0, sprite_key);
        this.set_shadow_sprite(npc_shadow_sprite);
        this.set_sprite(npc_sprite);
        this.npc_sprite.is_npc = true;
        this.npc_sprite.roundPx = true;
        this.npc_sprite.base_collider_layer = this.base_collider_layer;
        this.npc_sprite.anchor.y = this.data.npc_db[this.key_name].anchor_y;
        this.npc_sprite.centerX = (this.initial_x + 1.5) * map_sprite.tileWidth;
        const anchor_shift = this.data.npc_db[this.key_name].anchor_y;
        this.npc_sprite.centerY = this.initial_y * map_sprite.tileWidth - anchor_shift;
        this.sprite_info.setAnimation(this.npc_sprite, initial_action);
        const anim_key = initial_action + "_" + this.data.npc_db[this.key_name].actions[initial_action].initial_direction;
        this.npc_sprite.animations.play(anim_key);
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
        if (this.movement_type === npc_movement_types.IDLE) {
            this.npc_sprite.body.velocity.x = this.npc_sprite.body.velocity.y = 0;
        }
        this.npc_shadow_sprite.x = this.npc_sprite.x;
        this.npc_shadow_sprite.y = this.npc_sprite.y;
    }

    config_body(collision_obj) {
        this.game.physics.p2.enable(this.npc_sprite, false);
        this.npc_sprite.anchor.y = this.data.npc_db[this.key_name].anchor_y; //Important to be after the previous command
        this.npc_sprite.body.clearShapes();
        const width = this.data.npc_db[this.key_name].body_radius << 1;
        const polygon = mount_collision_polygon(width, -(width >> 1), this.data.npc_db[this.key_name].collision_body_bevel);
        this.npc_sprite.body.addPolygon({
                optimalDecomp: false,
                skipSimpleCheck: true,
                removeCollinearPoints: false
        }, polygon);
        this.npc_sprite.body.setCollisionGroup(collision_obj.npc_collision_groups[this.base_collider_layer]);
        this.npc_sprite.body.damping = 1;
        this.npc_sprite.body.angularDamping = 1;
        this.npc_sprite.body.setZeroRotation();
        this.npc_sprite.body.fixedRotation = true;
        this.npc_sprite.body.dynamic = false;
        this.npc_sprite.body.static = true;
    }
}
