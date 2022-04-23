import {directions} from "../utils";
import {DialogManager} from "../utils/DialogManager";
import {NPC, npc_types} from "../NPC";
import {GoldenSun} from "../GoldenSun";
import {Button} from "../XGamepad";
import {BattleEvent} from "./BattleEvent";
import {BranchEvent} from "./BranchEvent";
import {EventValue, event_types, event_value_types, game_info_types} from "./GameEvent";
import {SetValueEvent} from "./SetValueEvent";
import {MoveEvent} from "./MoveEvent";
import {DialogEvent} from "./DialogEvent";
import {LookEvent} from "./LookEvent";
import {ChestEvent} from "./ChestEvent";
import {PsynergyStoneEvent} from "./PsynergyStoneEvent";
import {TimerEvent} from "./TimerEvent";
import {PartyJoinEvent} from "./PartyJoinEvent";
import {StoragePosition, storage_types} from "../Storage";
import {TileEvent} from "../tile_events/TileEvent";
import * as _ from "lodash";
import {SummonEvent} from "./SummonEvent";
import {DjinnGetEvent} from "./DjinnGetEvent";
import {DjinnSetStatusEvent} from "./DjinnSetStatusEvent";
import {JumpEvent} from "./JumpEvent";
import {FaceDirectionEvent} from "./FaceDirectionEvent";
import {EmoticonEvent} from "./EmoticonEvent";
import {TileEventManageEvent} from "./TileEventManageEvent";
import {DestroyerEvent} from "./DestroyerEvent";
import {CharLevelChangeEvent} from "./CharLevelChangeEvent";
import {MapOpacityEvent} from "./MapOpacityEvent";
import {MapBlendModeEvent} from "./MapBlendModeEvent";
import {IOAnimPlayEvent} from "./IOAnimPlayEvent";
import {CharAnimPlayEvent} from "./CharAnimPlayEvent";

export enum interaction_patterns {
    NO_INTERACTION = "no_interaction",
    SIMPLE = "simple_interaction",
    TIK_TAK_TOE = "tik_tak_toe",
    CROSS = "cross",
}

export class GameEventManager {
    private game: Phaser.Game;
    private data: GoldenSun;
    private control_enable: boolean;
    private fire_next_step: Function;
    private update_callbacks: Function[] = [];

    /** The game events counter. This variable shows how many game events are running at the moment. */
    public events_running_count: number;
    /** If true, the hero can move while in a game event. */
    public allow_char_to_move: boolean;
    /** If false, the hero can assume any action like walk, dash, grant etc. */
    public force_idle_action: boolean;

    constructor(game: Phaser.Game, data: GoldenSun) {
        this.game = game;
        this.data = data;
        this.events_running_count = 0;
        this.control_enable = true;
        this.fire_next_step = null;
        this.allow_char_to_move = false;
        this.force_idle_action = true;
        this.set_controls();
    }

    get on_event() {
        if (this.events_running_count === 0 && !this.force_idle_action) {
            this.force_idle_action = true;
        }
        return this.events_running_count;
    }

    /**
     * Initialize the controls tha allows interaction with NPCs.
     */
    private set_controls() {
        this.data.control_manager.add_controls(
            [
                {
                    buttons: Button.A,
                    on_down: () => {
                        if (
                            this.data.hero.in_action() ||
                            this.data.menu_open ||
                            this.data.save_open ||
                            this.data.in_battle ||
                            this.data.shop_open ||
                            this.data.healer_open ||
                            this.data.inn_open ||
                            !this.control_enable
                        )
                            return;
                        if (this.on_event && this.fire_next_step) {
                            this.control_enable = false;
                            this.fire_next_step();
                        } else if (!this.on_event) {
                            this.search_for_npc();
                        }
                    },
                },
            ],
            {persist: true}
        );
    }

    /**
     * Look for valid npcs in the nearby.
     */
    private search_for_npc() {
        for (let i = 0; i < this.data.map.npcs.length; ++i) {
            const npc = this.data.map.npcs[i];
            if (
                npc.interaction_pattern === interaction_patterns.NO_INTERACTION ||
                !npc.active ||
                npc.base_collision_layer !== this.data.map.collision_layer
            ) {
                continue;
            }
            const is_close_check = this.data.hero.is_close(npc, npc.talk_range);
            if (is_close_check) {
                this.data.hero.stop_char();
                npc.stop_char();
                this.control_enable = false;
                this.set_npc_event(npc);
                break;
            }
        }
    }

    /**
     * Checks and configs the type of interaction that the given NPC yields.
     * @param npc the NPC.
     */
    private async set_npc_event(npc: NPC) {
        switch (npc.npc_type) {
            case npc_types.NORMAL:
            case npc_types.SPRITE:
                if (npc.message) {
                    this.manage_npc_dialog(npc);
                } else {
                    this.fire_npc_events(npc);
                }
                break;
            case npc_types.SHOP:
                if (!this.data.shop_open) {
                    const previous_npc_direction = await this.handle_npc_interaction_start(npc);
                    this.data.shop_menu.open_menu(npc.shop_key, npc.avatar, npc.voice_key, async () => {
                        await this.handle_npc_interaction_end(npc, previous_npc_direction);
                    });
                }
                break;
            case npc_types.HEALER:
                if (!this.data.healer_open) {
                    const previous_npc_direction = await this.handle_npc_interaction_start(npc);
                    this.data.healer_menu.open_menu(npc, async () => {
                        await this.handle_npc_interaction_end(npc, previous_npc_direction);
                    });
                }
                break;
            case npc_types.INN:
                if (!this.data.inn_open) {
                    const previous_npc_direction = await this.handle_npc_interaction_start(npc);
                    this.data.inn_menu.start(npc.inn_key, npc.voice_key, async () => {
                        await this.handle_npc_interaction_end(npc, previous_npc_direction);
                    });
                }
                break;
            default:
                this.control_enable = true;
        }
    }

    /**
     * Initializes the hero and npc interaction.
     * @param npc The NPC to interact.
     * @returns returns the previous npc direction.
     */
    private async handle_npc_interaction_start(npc: NPC) {
        ++this.events_running_count;
        let previous_npc_direction: directions;
        if (npc.interaction_pattern !== interaction_patterns.SIMPLE) {
            previous_npc_direction = npc.current_direction;
            await this.set_npc_and_hero_directions(npc);
        }
        return previous_npc_direction;
    }

    /**
     * Ends the hero and npc interaction.
     * @param npc The NPC to end interaction.
     * @param previous_npc_direction the previous npc interaction before it start.
     */
    private async handle_npc_interaction_end(npc: NPC, previous_npc_direction: directions) {
        --this.events_running_count;
        if (npc.interaction_pattern !== interaction_patterns.SIMPLE) {
            await npc.face_direction(previous_npc_direction);
        }
        this.control_enable = true;
    }

    /**
     * Make hero and npc look each other.
     * @param npc The NPC that the hero is interacting with.
     */
    async set_npc_and_hero_directions(npc: NPC) {
        const npc_x = npc.sprite.x;
        const npc_y = npc.sprite.y;
        const interaction_pattern = npc.interaction_pattern;
        const interaction_directions = GameEventManager.get_interaction_directions(
            this.data.hero.sprite.x,
            this.data.hero.sprite.y,
            npc_x,
            npc_y,
            interaction_pattern,
            npc.body_radius
        );
        const hero_promise = this.data.hero.face_direction(interaction_directions.hero_direction);
        const npc_promise = npc.face_direction(interaction_directions.target_direction);
        await Promise.all([hero_promise, npc_promise]);
    }

    /**
     * Starts common npc dialogs.
     * @param npc The NPC to dialog with.
     */
    private async manage_npc_dialog(npc: NPC) {
        const previous_npc_direction = await this.handle_npc_interaction_start(npc);
        const dialog_manager = new DialogManager(this.game, this.data);
        dialog_manager.set_dialog(npc.message, {
            avatar: npc.avatar,
            voice_key: npc.voice_key,
            hero_direction: this.data.hero.current_direction,
        });
        this.fire_next_step = dialog_manager.next.bind(dialog_manager, async (finished: boolean) => {
            if (finished) {
                this.fire_next_step = null;
                await this.handle_npc_interaction_end(npc, previous_npc_direction);
                this.fire_npc_events(npc);
            } else {
                this.control_enable = true;
            }
        });
        this.fire_next_step();
    }

    /**
     * Starts all related game events to a NPC.
     * @param npc The NPC.
     */
    private fire_npc_events(npc: NPC) {
        this.control_enable = true;
        npc.events.forEach(event => {
            event.fire(npc);
        });
    }

    /**
     * The GameEvent factory. Returns a specific GameEvent child instance depending on the input.
     * @param info The parsed raw properties of a game event.
     * @returns The GameEvent child class instance.
     */
    get_event_instance(info: any) {
        switch (info.type) {
            case event_types.BATTLE:
                return new BattleEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.background_key,
                    info.enemy_party_key
                );
            case event_types.BRANCH:
                return new BranchEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.condition,
                    info.left_comparator_value,
                    info.right_comparator_value,
                    info.events,
                    info.else_events
                );
            case event_types.SET_VALUE:
                return new SetValueEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.event_value,
                    info.check_npc_storage_values
                );
            case event_types.MOVE:
                return new MoveEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.is_npc,
                    info.dash,
                    info.dest_unit_in_tile,
                    info.dest,
                    info.npc_index,
                    info.npc_label,
                    info.camera_follow,
                    info.camera_follow_time,
                    info.final_direction,
                    info.follow_hero_on_finish,
                    info.finish_events,
                    info.minimal_distance,
                    info.keep_npc_collision_disable,
                    info.deactive_char_on_end,
                    info.keep_camera_follow,
                    info.wait_after,
                    info.update_initial_position
                );
            case event_types.DIALOG:
                return new DialogEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.dialog_info,
                    info.npc_hero_reciprocal_look,
                    info.reset_reciprocal_look,
                    info.end_with_yes_no,
                    info.yes_no_events,
                    info.finish_events
                );
            case event_types.LOOK:
                return new LookEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.look,
                    info.looker,
                    info.target
                );
            case event_types.CHEST:
                return new ChestEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.item,
                    info.quantity,
                    info.finish_events,
                    info.custom_init_text,
                    info.no_chest,
                    info.hide_on_finish
                );
            case event_types.PSYNERGY_STONE:
                return new PsynergyStoneEvent(this.game, this.data, info.active, info.key_name, info.finish_events);
            case event_types.TIMER:
                return new TimerEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.duration,
                    info.finish_events
                );
            case event_types.PARTY_JOIN:
                return new PartyJoinEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.char_key_name,
                    info.join,
                    info.finish_events
                );
            case event_types.SUMMON:
                return new SummonEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.summon_key,
                    info.finish_events
                );
            case event_types.DJINN_GET:
                return new DjinnGetEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.djinn_key,
                    info.has_fight,
                    info.enemy_party_key,
                    info.custom_battle_bg,
                    info.finish_events,
                    info.on_battle_defeat_events
                );
            case event_types.DJINN_SET_STATUS:
                return new DjinnSetStatusEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.djinn_key,
                    info.character_key,
                    info.status_key
                );
            case event_types.JUMP:
                return new JumpEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.is_npc,
                    info.npc_index,
                    info.npc_label,
                    info.camera_follow,
                    info.camera_follow_time,
                    info.follow_hero_on_finish,
                    info.finish_events,
                    info.jump_height,
                    info.duration,
                    info.dest,
                    info.jump_direction,
                    info.keep_camera_follow,
                    info.wait_after,
                    info.camera_follow_while_jumping
                );
            case event_types.FACE_DIRECTION:
                return new FaceDirectionEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.direction,
                    info.is_npc,
                    info.npc_index,
                    info.npc_label,
                    info.time_between_frames,
                    info.finish_events,
                    info.camera_follow,
                    info.camera_follow_time,
                    info.follow_hero_on_finish,
                    info.keep_camera_follow,
                    info.wait_after
                );
            case event_types.EMOTICON:
                return new EmoticonEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.emoticon,
                    info.duration,
                    info.sound_effect,
                    info.is_npc,
                    info.npc_index,
                    info.npc_label,
                    info.location,
                    info.face_hero,
                    info.finish_events
                );
            case event_types.TILE_EVENT_MANAGE:
                return new TileEventManageEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.tile_event_key,
                    info.activate_at,
                    info.pos,
                    info.collision_layers
                );
            case event_types.DESTROYER:
                return new DestroyerEvent(this.game, this.data, info.active, info.key_name, info.target_event_key);
            case event_types.CHAR_LEVEL_CHANGE:
                return new CharLevelChangeEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.target_char_key,
                    info.target_level_value
                );
            case event_types.MAP_OPACITY:
                return new MapOpacityEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.map_layer_name,
                    info.finish_events,
                    info.opacity,
                    info.duration
                );
            case event_types.MAP_BLEND_MODE:
                return new MapBlendModeEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.map_layer_name,
                    info.blend_mode
                );
            case event_types.IO_ANIM_PLAY:
                return new IOAnimPlayEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.io_label,
                    info.action,
                    info.animation,
                    info.frame_rate,
                    info.loop,
                    info.stop_animation,
                    info.finish_events
                );
            case event_types.CHAR_ANIM_PLAY:
                return new CharAnimPlayEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.is_npc,
                    info.npc_label,
                    info.action,
                    info.animation,
                    info.frame_rate,
                    info.loop,
                    info.stop_animation,
                    info.finish_events
                );
            default:
                console.warn(`Game event type ${info.type} not found.`);
                return null;
        }
    }

    /**
     * Sets any custom callback to be called on update function while any game event is in action.
     * @param callback the callback to be called.
     */
    add_callback(callback: Function) {
        this.update_callbacks.push(callback);
    }

    /**
     * Removes the given callback of the list of callbacks that are called while any game event is in action.
     * The given callback must be already added by calling GameEventManager.add_callback method.
     * @param callback the callback to be removed.
     */
    remove_callback(callback: Function) {
        this.update_callbacks = this.update_callbacks.filter(c => callback !== c);
    }

    /**
     * The main game event update function. Whenever a game event is running, this function is called
     * every single frame.
     */
    update() {
        if (!this.allow_char_to_move) {
            this.data.hero.stop_char(this.force_idle_action);
        }
        this.data.hero.update_on_event();
        this.data.map.npcs.forEach(npc => npc.update_on_event());
        this.update_callbacks.forEach(callback => callback());
    }

    /**
     * Gets any kind of engine value that the engine user may want use in game events.
     * This function is used in BranchEvents, for instance. The values used for comparison
     * in this kind of event are retrieved using this function.
     * @param event_value The value specification.
     * @returns The engine value issued by the user.
     */
    get_value(event_value: EventValue) {
        switch (event_value.type) {
            case event_value_types.VALUE:
                return event_value.value;
            case event_value_types.STORAGE:
                const storage = this.data.storage.get_object(event_value.value.key_name);
                return storage.type === storage_types.POSITION
                    ? `${(storage.value as StoragePosition).x}/${(storage.value as StoragePosition).y}`
                    : storage.value;
            case event_value_types.GAME_INFO:
                switch (event_value.value.type) {
                    case game_info_types.CHAR:
                        const char = this.data.info.main_char_list[event_value.value.key_name];
                        return _.get(char, event_value.value.property);
                    case game_info_types.HERO:
                        return _.get(this.data.hero, event_value.value.property);
                    case game_info_types.NPC:
                        const npc = event_value.value.label
                            ? this.data.map.npcs_label_map[event_value.value.label]
                            : this.data.map.npcs[event_value.value.index];
                        return _.get(npc, event_value.value.property);
                    case game_info_types.INTERACTABLE_OBJECT:
                        const interactable_object = event_value.value.label
                            ? this.data.map.interactable_objects_label_map[event_value.value.label]
                            : this.data.map.interactable_objects[event_value.value.index];
                        return _.get(interactable_object, event_value.value.property);
                    case game_info_types.EVENT:
                        const event = event_value.value.label
                            ? TileEvent.get_labeled_event(event_value.value.label)
                            : TileEvent.get_event(event_value.value.index);
                        return _.get(event, event_value.value.property);
                    default:
                        return null;
                }
            default:
                return null;
        }
    }

    static get_interaction_directions(
        hero_x: number,
        hero_y: number,
        target_x: number,
        target_y: number,
        interaction_pattern: interaction_patterns,
        target_body_radius: number
    ) {
        let target_direction: directions;
        if (interaction_pattern === interaction_patterns.CROSS) {
            let positive_limit = hero_x + (-target_y - target_x);
            let negative_limit = -hero_x + (-target_y + target_x);
            if (-hero_y >= positive_limit && -hero_y >= negative_limit) {
                target_direction = directions.up;
            } else if (-hero_y <= positive_limit && -hero_y >= negative_limit) {
                target_direction = directions.right;
            } else if (-hero_y <= positive_limit && -hero_y <= negative_limit) {
                target_direction = directions.down;
            } else if (-hero_y >= positive_limit && -hero_y <= negative_limit) {
                target_direction = directions.left;
            }
        }

        let hero_direction: directions;
        if (hero_x <= target_x - target_body_radius && hero_y >= target_y + target_body_radius) {
            hero_direction = directions.up_right;
            target_direction =
                interaction_pattern === interaction_patterns.TIK_TAK_TOE ? directions.down_left : target_direction;
        } else if (
            hero_x <= target_x - target_body_radius &&
            hero_y >= target_y - target_body_radius &&
            hero_y <= target_y + target_body_radius
        ) {
            hero_direction = directions.right;
            target_direction =
                interaction_pattern === interaction_patterns.TIK_TAK_TOE ? directions.left : target_direction;
        } else if (hero_x <= target_x - target_body_radius && hero_y <= target_y - target_body_radius) {
            hero_direction = directions.down_right;
            target_direction =
                interaction_pattern === interaction_patterns.TIK_TAK_TOE ? directions.up_left : target_direction;
        } else if (
            hero_x >= target_x - target_body_radius &&
            hero_x <= target_x + target_body_radius &&
            hero_y <= target_y - target_body_radius
        ) {
            hero_direction = directions.down;
            target_direction =
                interaction_pattern === interaction_patterns.TIK_TAK_TOE ? directions.up : target_direction;
        } else if (hero_x >= target_x + target_body_radius && hero_y <= target_y - target_body_radius) {
            hero_direction = directions.down_left;
            target_direction =
                interaction_pattern === interaction_patterns.TIK_TAK_TOE ? directions.up_right : target_direction;
        } else if (
            hero_x >= target_x + target_body_radius &&
            hero_y >= target_y - target_body_radius &&
            hero_y <= target_y + target_body_radius
        ) {
            hero_direction = directions.left;
            target_direction =
                interaction_pattern === interaction_patterns.TIK_TAK_TOE ? directions.right : target_direction;
        } else if (hero_x >= target_x + target_body_radius && hero_y >= target_y + target_body_radius) {
            hero_direction = directions.up_left;
            target_direction =
                interaction_pattern === interaction_patterns.TIK_TAK_TOE ? directions.down_right : target_direction;
        } else if (
            hero_x >= target_x - target_body_radius &&
            hero_x <= target_x + target_body_radius &&
            hero_y >= target_y + target_body_radius
        ) {
            hero_direction = directions.up;
            target_direction =
                interaction_pattern === interaction_patterns.TIK_TAK_TOE ? directions.down : target_direction;
        }

        return {hero_direction: hero_direction, target_direction: target_direction};
    }
}
