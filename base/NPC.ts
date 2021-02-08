import {GameEvent} from "./game_events/GameEvent";
import {mount_collision_polygon} from "./utils";
import {ControllableChar} from "./ControllableChar";
import {interaction_patterns} from "./game_events/GameEventManager";
import {Map} from "./Map";
import {SpriteBase} from "./SpriteBase";

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
    public anchor_x: number;
    public anchor_y: number;
    public scale_x: number;
    public scale_y: number;
    public interaction_pattern: interaction_patterns;
    public affected_by_reveal: boolean;
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
        active,
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
        anchor_y,
        scale_x,
        scale_y,
        interaction_pattern,
        affected_by_reveal
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
            storage_keys,
            active
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
        this.base_collision_layer = base_collision_layer ?? 0;
        this.talk_range_factor = talk_range_factor ?? NPC.NPC_TALK_RANGE;
        this.no_shadow = no_shadow ?? false;
        this.ignore_world_map_scale = ignore_world_map_scale ?? false;
        this.anchor_x = anchor_x;
        this.anchor_y = anchor_y;
        this.scale_x = scale_x;
        this.scale_y = scale_y;
        this.interaction_pattern = interaction_pattern ?? interaction_patterns.NO_INTERACTION;
        this.affected_by_reveal = affected_by_reveal ?? false;
        this.events = [];
        this.set_events(events_info ?? []);
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
        if (!this.active) return;
        if (this.movement_type === npc_movement_types.IDLE) {
            this.stop_char(false);
            this.update_shadow();
        }
    }

    toggle_active(active: boolean) {
        if (active) {
            this.sprite.body.setCollisionGroup(this.data.collision.npc_collision_groups[this.base_collision_layer]);
            this.sprite.visible = true;
            this.shadow.visible = true;
            this.active = true;
        } else {
            this.sprite.body.removeCollisionGroup(this.data.collision.npc_collision_groups[this.base_collision_layer]);
            this.sprite.visible = false;
            this.shadow.visible = false;
            this.active = false;
        }
    }

    async init_npc(map: Map) {
        const npc_db = this.data.dbs.npc_db[this.key_name];
        const actions = Object.keys(npc_db.actions);
        const npc_sprite_info = new SpriteBase(this.key_name, actions);
        for (let j = 0; j < actions.length; ++j) {
            const action = actions[j];
            npc_sprite_info.setActionSpritesheet(
                action,
                npc_db.actions[action].spritesheet.image,
                npc_db.actions[action].spritesheet.json
            );
            npc_sprite_info.setActionDirections(
                action,
                npc_db.actions[action].directions,
                npc_db.actions[action].frames_count
            );
            npc_sprite_info.setActionFrameRate(action, npc_db.actions[action].frame_rate);
            npc_sprite_info.setActionLoop(action, npc_db.actions[action].loop);
        }
        npc_sprite_info.generateAllFrames();
        await new Promise<void>(resolve => {
            npc_sprite_info.loadSpritesheets(this.game, true, () => {
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
                    this.anchor_x !== undefined ? this.anchor_x : npc_db.anchor_x,
                    this.anchor_y !== undefined ? this.anchor_y : npc_db.anchor_y,
                    this.scale_x !== undefined ? this.scale_x : npc_db.scale_x,
                    this.scale_y !== undefined ? this.scale_y : npc_db.scale_y
                );
                if (this.ignore_world_map_scale) {
                    this.sprite.scale.setTo(1, 1);
                    if (this.shadow) {
                        this.shadow.scale.setTo(1, 1);
                    }
                }
                if (this.affected_by_reveal) {
                    this.sprite.visible = false;
                }
                this.set_sprite_as_npc();
                this.play(this.current_action, this.current_animation);
                resolve();
            });
        });
    }

    config_body() {
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
}
