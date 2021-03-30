import {GameEvent} from "./game_events/GameEvent";
import {mount_collision_polygon} from "./utils";
import {ControllableChar} from "./ControllableChar";
import {interaction_patterns} from "./game_events/GameEventManager";
import {Map} from "./Map";

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

    private movement_type: npc_movement_types;
    private _npc_type: npc_types;
    private _message: string;
    private _thought_message: string;
    private _avatar: string;
    private _voice_key: string;
    private _base_collision_layer: number;
    private _talk_range_factor: number;
    private _events: GameEvent[];
    private _shop_key: string;
    private _inn_key: string;
    private no_shadow: boolean;
    private _ignore_world_map_scale: boolean;
    private anchor_x: number;
    private anchor_y: number;
    private scale_x: number;
    private scale_y: number;
    private _interaction_pattern: interaction_patterns;
    private _affected_by_reveal: boolean;
    public visible: boolean;
    protected storage_keys: {
        position?: string;
        action?: string;
        direction?: string;
        base_collision_layer?: string;
        affected_by_reveal?: string;
        visible?: string;
    };
    private sprite_misc_db_key: string;
    private ignore_physics: boolean;

    constructor(
        game,
        data,
        key_name,
        active,
        initial_x,
        initial_y,
        storage_keys,
        initial_action,
        initial_animation,
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
        anchor_y,
        scale_x,
        scale_y,
        interaction_pattern,
        affected_by_reveal,
        sprite_misc_db_key,
        ignore_physics,
        visible,
        voice_key
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
            initial_animation,
            storage_keys,
            active
        );
        this._npc_type = npc_type;
        this.movement_type = movement_type;
        this._message = message;
        this._thought_message = thought_message;
        this._avatar = avatar ? avatar : null;
        this._voice_key = voice_key ? voice_key : "";
        this._shop_key = shop_key;
        this._inn_key = inn_key;
        if (this.storage_keys.base_collision_layer !== undefined) {
            base_collision_layer = this.data.storage.get(this.storage_keys.base_collision_layer);
        }
        this._base_collision_layer = base_collision_layer ?? 0;
        this._talk_range_factor = talk_range_factor ?? NPC.NPC_TALK_RANGE;
        this.no_shadow = no_shadow ?? false;
        this._ignore_world_map_scale = ignore_world_map_scale ?? false;
        this.anchor_x = anchor_x;
        this.anchor_y = anchor_y;
        this.scale_x = scale_x;
        this.scale_y = scale_y;
        this._interaction_pattern = interaction_pattern ?? interaction_patterns.NO_INTERACTION;
        if (this.storage_keys.affected_by_reveal !== undefined) {
            affected_by_reveal = this.data.storage.get(this.storage_keys.affected_by_reveal);
        }
        this._affected_by_reveal = affected_by_reveal ?? false;
        if (this.storage_keys.visible !== undefined) {
            visible = this.data.storage.get(this.storage_keys.visible);
        }
        this.visible = visible ?? true;
        this.ignore_physics = ignore_physics ?? false;
        this._events = [];
        this.set_events(events_info ?? []);
        this.sprite_misc_db_key = sprite_misc_db_key;
    }

    get events() {
        return this._events;
    }
    get message() {
        return this._message;
    }
    get thought_message() {
        return this._thought_message;
    }
    get avatar() {
        return this._avatar;
    }
    get voice_key() {
        return this._voice_key;
    }
    get interaction_pattern() {
        return this._interaction_pattern;
    }
    get talk_range_factor() {
        return this._talk_range_factor;
    }
    get base_collision_layer() {
        return this._base_collision_layer;
    }
    get affected_by_reveal() {
        return this._affected_by_reveal;
    }
    get ignore_world_map_scale() {
        return this._ignore_world_map_scale;
    }
    get npc_type() {
        return this._npc_type;
    }
    get shop_key() {
        return this._shop_key;
    }
    get inn_key() {
        return this._inn_key;
    }

    check_storage_keys() {
        if (this.storage_keys.base_collision_layer !== undefined) {
            const storage_value = this.data.storage.get(this.storage_keys.base_collision_layer);
            if (this.base_collision_layer !== storage_value) {
                this._base_collision_layer = storage_value;
            }
        }
        if (this.storage_keys.affected_by_reveal !== undefined) {
            const storage_value = this.data.storage.get(this.storage_keys.affected_by_reveal);
            if (this.affected_by_reveal !== storage_value) {
                this._affected_by_reveal = storage_value;
            }
        }
        if (this.storage_keys.visible !== undefined) {
            const storage_value = this.data.storage.get(this.storage_keys.visible);
            if (this.visible !== storage_value) {
                this.visible = storage_value;
            }
        }
    }

    private set_events(events_info) {
        for (let i = 0; i < events_info.length; ++i) {
            const event = this.data.game_event_manager.get_event_instance(events_info[i]);
            this.events.push(event);
        }
    }

    update() {
        if (!this.active) return;
        if (this.movement_type === npc_movement_types.IDLE) {
            this.stop_char(false);
            this.update_shadow();
        }
        this.update_tile_position();
    }

    toggle_active(active: boolean) {
        if (active) {
            this.sprite.body.collides(this.data.collision.hero_collision_group);
            this.sprite.visible = true;
            if (this.shadow) {
                this.shadow.visible = true;
            }
            this._active = true;
        } else {
            this.sprite.body.removeCollisionGroup(this.data.collision.hero_collision_group);
            this.sprite.visible = false;
            if (this.shadow) {
                this.shadow.visible = false;
            }
            this._active = false;
        }
    }

    init_npc(map: Map) {
        const npc_db = this.data.dbs.npc_db[this.key_name];
        const npc_sprite_info =
            this.sprite_misc_db_key !== undefined
                ? this.data.info.misc_sprite_base_list[this.sprite_misc_db_key]
                : this.data.info.npcs_sprite_base_list[this.key_name];
        if (!this.no_shadow) {
            this.set_shadow(
                npc_db.shadow_key,
                this.data.npc_group,
                this.base_collision_layer,
                npc_db.shadow_anchor_x,
                npc_db.shadow_anchor_y
            );
        }
        this.set_sprite(
            this.data.npc_group,
            npc_sprite_info,
            this.base_collision_layer,
            map,
            map.is_world_map,
            this.anchor_x ?? npc_db.anchor_x,
            this.anchor_y ?? npc_db.anchor_y,
            this.scale_x ?? npc_db.scale_x,
            this.scale_y ?? npc_db.scale_y
        );
        if (this.ignore_world_map_scale) {
            this.sprite.scale.setTo(1, 1);
            if (this.shadow) {
                this.shadow.scale.setTo(1, 1);
            }
        }
        if (this.affected_by_reveal || !this.visible) {
            this.sprite.visible = false;
        }
        this.sprite.is_npc = true;
        this.play(this.current_action, this.current_animation);
    }

    config_body() {
        if (this.ignore_physics) return;
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
        this._body_radius = this.data.dbs.npc_db[this.key_name].body_radius;
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
        if (this.active) {
            this.sprite.body.setCollisionGroup(this.data.collision.npc_collision_groups[this.base_collision_layer]);
        }
        this.sprite.body.damping = 1;
        this.sprite.body.angularDamping = 1;
        this.sprite.body.setZeroRotation();
        this.sprite.body.fixedRotation = true;
        this.sprite.body.dynamic = false;
        this.sprite.body.static = true;
    }

    unset(remove_from_npc_group: boolean = true) {
        if (this.sprite) {
            this.sprite.destroy();
        }
        if (this.shadow) {
            this.shadow.destroy();
        }
        if (this.footsteps) {
            this.footsteps.destroy();
        }
        this._events.forEach(event => event.destroy());
        this.look_target = null;
        if (remove_from_npc_group) {
            this.data.npc_group.removeChild(this.sprite);
        }
    }
}
