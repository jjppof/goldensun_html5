import {GameEvent} from "./game_events/GameEvent";
import {mount_collision_polygon, range_360} from "./utils";
import {ControllableChar} from "./ControllableChar";
import {Collision} from "./Collision";
import * as numbers from "./magic_numbers";

export enum npc_movement_types {
    IDLE = "idle",
    WALK_AROUND = "walk_around",
}

export enum npc_types {
    NORMAL = "normal",
    INN = "inn",
    SHOP = "shop",
    SPRITE = "sprite",
}

export class NPC extends ControllableChar {
    private static readonly NPC_TALK_RANGE = 3.0;

    public movement_type: npc_movement_types;
    public npc_type: npc_types;
    public message: string;
    public thought_message: string;
    public avatar: string;
    public base_collision_layer: number;
    public talk_range_factor: number;
    public events: GameEvent[];
    public shop_key: string;
    public inn_key: string;
    public no_shadow: boolean;
    public ignore_world_map_scale: boolean;
    public anchor_x: boolean;
    public anchor_y: boolean;
    public storage_keys: {
        position?: string;
        action?: string;
        direction?: string;
        base_collision_layer?: string;
    };

    constructor(
        game,
        data,
        key_name,
        initial_x,
        initial_y,
        storage_keys,
        initial_action,
        initial_direction,
        enable_footsteps,
        walk_speed,
        dash_speed,
        climb_speed,
        npc_type,
        movement_type,
        message,
        thought_message,
        avatar,
        shop_key,
        inn_key,
        base_collision_layer,
        talk_range_factor,
        events_info,
        no_shadow,
        ignore_world_map_scale,
        anchor_x,
        anchor_y
    ) {
        super(
            game,
            data,
            key_name,
            enable_footsteps,
            walk_speed,
            dash_speed,
            climb_speed,
            initial_x,
            initial_y,
            initial_action,
            initial_direction,
            storage_keys
        );
        this.npc_type = npc_type;
        this.movement_type = movement_type;
        this.message = message;
        this.thought_message = thought_message;
        this.avatar = avatar ? avatar : null;
        this.shop_key = shop_key;
        this.inn_key = inn_key;
        if (this.storage_keys.base_collision_layer !== undefined) {
            base_collision_layer = this.data.storage.get(this.storage_keys.base_collision_layer);
        }
        this.base_collision_layer = base_collision_layer === undefined ? 0 : base_collision_layer;
        this.talk_range_factor = talk_range_factor === undefined ? NPC.NPC_TALK_RANGE : talk_range_factor;
        this.no_shadow = no_shadow === undefined ? false : no_shadow;
        this.ignore_world_map_scale = ignore_world_map_scale === undefined ? false : ignore_world_map_scale;
        this.anchor_x = anchor_x;
        this.anchor_y = anchor_y;
        this.events = [];
        this.set_events(events_info === undefined ? [] : events_info);
    }

    set_sprite_as_npc() {
        this.sprite.is_npc = true;
    }

    set_events(events_info) {
        for (let i = 0; i < events_info.length; ++i) {
            const event = this.data.game_event_manager.get_event_instance(events_info[i]);
            this.events.push(event);
        }
    }

    update() {
        if (this.movement_type === npc_movement_types.IDLE) {
            this.stop_char(false);
            this.update_shadow();
        }
    }

    config_body(collision_obj: Collision) {
        this.game.physics.p2.enable(this.sprite, false);
        //Important to be after the previous command
        if (this.data.dbs.npc_db[this.key_name].anchor_x !== undefined) {
            this.sprite.anchor.x = this.data.dbs.npc_db[this.key_name].anchor_x;
        } else {
            this.reset_anchor("x");
        }
        if (this.data.dbs.npc_db[this.key_name].anchor_y !== undefined) {
            this.sprite.anchor.y = this.data.dbs.npc_db[this.key_name].anchor_y;
        } else {
            this.reset_anchor("y");
        }
        this.sprite.body.clearShapes();
        this.body_radius = this.data.dbs.npc_db[this.key_name].body_radius;
        const width = this.body_radius << 1;
        const polygon = mount_collision_polygon(
            width,
            -(width >> 1),
            this.data.dbs.npc_db[this.key_name].collision_body_bevel
        );
        this.sprite.body.addPolygon(
            {
                optimalDecomp: false,
                skipSimpleCheck: true,
                removeCollinearPoints: false,
            },
            polygon
        );
        this.sprite.body.setCollisionGroup(collision_obj.npc_collision_groups[this.base_collision_layer]);
        this.sprite.body.damping = 1;
        this.sprite.body.angularDamping = 1;
        this.sprite.body.setZeroRotation();
        this.sprite.body.fixedRotation = true;
        this.sprite.body.dynamic = false;
        this.sprite.body.static = true;
    }
}
