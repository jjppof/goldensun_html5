import {directions} from "../utils";
import {DialogManager} from "../utils/DialogManager";
import {NPC, npc_types} from "../NPC";
import {GoldenSun} from "../GoldenSun";
import {Button} from "../XGamepad";
import {BattleEvent} from "./BattleEvent";
import {BranchEvent} from "./BranchEvent";
import {DetailedValues, EventValue, event_types, event_value_types, game_info_types} from "./GameEvent";
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
import {CharSetActivationEvent} from "./CharSetActivationEvent";
import {AudioPlayEvent} from "./AudioPlayEvent";
import {ControlBgmEvent} from "./ControlBgmEvent";
import {SetPartyCoinsEvent} from "./SetPartyCoinsEvent";
import {SetCharExpEvent} from "./SetCharExpEvent";
import {CharItemManipulationEvent} from "./CharItemManipulationEvent";
import {CameraShakeEvent} from "./CameraShakeEvent";
import {CameraMoveEvent} from "./CameraMoveEvent";
import {CameraFadeEvent} from "./CameraFadeEvent";
import {ColorizeMapEvent} from "./ColorizeMapEvent";
import {ColorizeCharEvent} from "./ColorizeCharEvent";
import {TintCharEvent} from "./TintCharEvent";
import {OutlineCharEvent} from "./OutlineCharEvent";
import {CastingAuraEvent} from "./CastingAuraEvent";
import {CustomCollisionBodyEvent} from "./CustomCollisionBodyEvent";
import {SetCharCollisionEvent} from "./SetCharCollisionEvent";
import {SetIoCollisionEvent} from "./SetIoCollisionEvent";
import {GrantAbilityEvent} from "./GrantAbilityEvent";
import {StorageChangeEvent} from "./StorageChangeEvent";
import {CameraFollowEvent} from "./CameraFollowEvent";
import {SetPermanentStatusEvent} from "./SetPermanentStatusEvent";
import {ChangeCollisionLayerEvent} from "./ChangeCollisionLayerEvent";
import {CreateStorageVarEvent} from "./CreateStorageVarEvent";
import {ItemChecksEvent} from "./ItemChecksEvent";
import {AddItemToPartyEvent} from "./AddItemToPartyEvent";
import {GenericSpriteEvent} from "./GenericSpriteEvent";
import {ParticlesEvent} from "./ParticlesEvent";
import {CharHueEvent} from "./CharHueEvent";
import {FlameCharEvent} from "./FlameCharEvent";
import {CharBlendModeEvent} from "./CharBlendModeEvent";
import {EventCallerEvent} from "./EventCallerEvent";
import {EventActivationEvent} from "./EventActivationEvent";
import {SetCharVisibilityEvent} from "./SetCharVisibilityEvent";
import {EventsHolderEvent} from "./EventsHolderEvent";
import {EventsLoopEvent} from "./EventsLoopEvent";

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

    constructor(game: Phaser.Game, data: GoldenSun) {
        this.game = game;
        this.data = data;
        this.events_running_count = 0;
        this.control_enable = true;
        this.fire_next_step = null;
        this.set_controls();
    }

    get on_event() {
        if (this.events_running_count === 0 && !this.data.hero.force_idle_action_in_event) {
            this.data.hero.force_idle_action_in_event = true;
        }
        return this.events_running_count;
    }

    /**
     * Initialize the controls that allow interaction with NPCs.
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
                !(npc.active || npc.allow_interaction_when_inactive) ||
                npc.base_collision_layer !== this.data.map.collision_layer
            ) {
                continue;
            }
            const is_close_check = this.data.hero.is_close(npc);
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
        if (npc.back_interaction_message && this.data.hero.interacting_from_back(npc)) {
            this.manage_npc_dialog(npc, npc.back_interaction_message);
            return;
        }
        switch (npc.npc_type) {
            case npc_types.NORMAL:
            case npc_types.SPRITE:
                if (npc.message) {
                    this.manage_npc_dialog(npc, npc.message);
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
                    this.data.inn_menu.start(npc.inn_key, npc.voice_key, npc.avatar, async () => {
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
        const interaction_pattern = npc.interaction_pattern;
        const interaction_directions = GameEventManager.get_interaction_directions(
            this.data.hero.x,
            this.data.hero.y,
            npc.x,
            npc.y,
            interaction_pattern,
            npc.body_radius
        );
        const promises = [];
        promises.push(this.data.hero.face_direction(interaction_directions.hero_direction));
        if (interaction_directions.target_direction !== undefined) {
            promises.push(npc.face_direction(interaction_directions.target_direction));
        }
        await Promise.all(promises);
    }

    /**
     * Starts common npc dialogs.
     * @param npc The NPC to dialog with.
     * @param message The NPC dialog message.
     */
    private async manage_npc_dialog(npc: NPC, message: string) {
        const previous_npc_direction = await this.handle_npc_interaction_start(npc);
        const previous_move_freely = npc.move_freely_in_event;
        npc.move_freely_in_event = false;
        const previous_force_char_stop_in_event = npc.force_char_stop_in_event;
        npc.force_char_stop_in_event = true;
        const previous_force_idle_action_in_event = npc.force_idle_action_in_event;
        npc.force_idle_action_in_event = true;
        const dialog_manager = new DialogManager(this.game, this.data);
        dialog_manager.set_dialog(message, {
            avatar: npc.avatar,
            voice_key: npc.voice_key,
            hero_direction: this.data.hero.current_direction,
        });
        this.fire_next_step = dialog_manager.next.bind(dialog_manager, async (finished: boolean) => {
            if (finished) {
                this.fire_next_step = null;
                await this.handle_npc_interaction_end(npc, previous_npc_direction);
                npc.move_freely_in_event = previous_move_freely;
                npc.force_char_stop_in_event = previous_force_char_stop_in_event;
                npc.force_idle_action_in_event = previous_force_idle_action_in_event;
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
                    info.keep_reveal,
                    info.background_key,
                    info.enemy_party_key,
                    info.return_to_sanctum,
                    info.bgm,
                    info.reset_previous_bgm,
                    info.all_enemies_fled_events,
                    info.victory_events,
                    info.defeat_events,
                    info.before_fade_victory_events,
                    info.before_fade_defeat_events
                );
            case event_types.BRANCH:
                return new BranchEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.combination,
                    info.comparator_pairs,
                    info.events,
                    info.else_events
                );
            case event_types.SET_VALUE:
                return new SetValueEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.event_value,
                    info.check_npc_storage_values,
                    info.npc_label,
                    info.npc_index
                );
            case event_types.MOVE:
                return new MoveEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.is_npc,
                    info.dash,
                    info.dest_unit_in_tile,
                    info.dest,
                    info.npc_label,
                    info.camera_follow,
                    info.camera_follow_duration,
                    info.final_direction,
                    info.follow_hero_on_finish,
                    info.finish_events,
                    info.minimal_distance,
                    info.keep_npc_collision_disable,
                    info.deactive_char_on_end,
                    info.camera_unfollow_char_on_finish,
                    info.wait_after,
                    info.reset_previous_camera_target
                );
            case event_types.DIALOG:
                return new DialogEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
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
                    info.keep_reveal,
                    info.look,
                    info.looker_is_npc,
                    info.looker_npc_label,
                    info.target_is_npc,
                    info.target_npc_label
                );
            case event_types.CHEST:
                return new ChestEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.item,
                    info.quantity,
                    info.finish_events,
                    info.inventory_full_events,
                    info.custom_init_text,
                    info.no_chest,
                    info.hide_on_finish
                );
            case event_types.PSYNERGY_STONE:
                return new PsynergyStoneEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.key_name,
                    info.finish_events
                );
            case event_types.TIMER:
                return new TimerEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.duration,
                    info.finish_events
                );
            case event_types.PARTY_JOIN:
                return new PartyJoinEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.char_key_name,
                    info.join,
                    info.show_dialog,
                    info.finish_events
                );
            case event_types.SUMMON:
                return new SummonEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.summon_key,
                    info.animate,
                    info.finish_events
                );
            case event_types.DJINN_GET:
                return new DjinnGetEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.djinn_key,
                    info.has_fight,
                    info.enemy_party_key,
                    info.custom_battle_bg,
                    info.finish_events,
                    info.on_battle_defeat_events,
                    info.no_animation,
                    info.add_djinn
                );
            case event_types.DJINN_SET_STATUS:
                return new DjinnSetStatusEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.djinn_key,
                    info.status_key
                );
            case event_types.JUMP:
                return new JumpEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.is_npc,
                    info.npc_index,
                    info.npc_label,
                    info.finish_events,
                    info.jump_height,
                    info.duration,
                    info.dest,
                    info.jump_direction,
                    info.sfx_key,
                    info.wait_after
                );
            case event_types.FACE_DIRECTION:
                return new FaceDirectionEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.direction,
                    info.is_npc,
                    info.npc_index,
                    info.npc_label,
                    info.time_between_frames,
                    info.finish_events,
                    info.wait_after
                );
            case event_types.EMOTICON:
                return new EmoticonEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.emoticon,
                    info.duration,
                    info.sound_effect,
                    info.is_npc,
                    info.npc_index,
                    info.npc_label,
                    info.location,
                    info.face_hero,
                    info.reset_direction,
                    info.finish_events
                );
            case event_types.TILE_EVENT_MANAGE:
                return new TileEventManageEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.tile_event_key,
                    info.activate_at,
                    info.pos,
                    info.collision_layers
                );
            case event_types.DESTROYER:
                return new DestroyerEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.key_name,
                    info.target_event_key
                );
            case event_types.CHAR_LEVEL_CHANGE:
                return new CharLevelChangeEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.target_char_key,
                    info.target_level_value
                );
            case event_types.MAP_OPACITY:
                return new MapOpacityEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
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
                    info.keep_reveal,
                    info.map_layer_name,
                    info.blend_mode
                );
            case event_types.IO_ANIM_PLAY:
                return new IOAnimPlayEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.io_label,
                    info.action,
                    info.animation,
                    info.frame_rate,
                    info.loop,
                    info.stop_animation,
                    info.reset_frame_on_stop,
                    info.finish_events
                );
            case event_types.CHAR_ANIM_PLAY:
                return new CharAnimPlayEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.is_npc,
                    info.npc_label,
                    info.action,
                    info.animation,
                    info.frame_rate,
                    info.loop,
                    info.stop_animation,
                    info.reset_frame_on_stop,
                    info.finish_events
                );
            case event_types.CHAR_SET_ACTIVATION:
                return new CharSetActivationEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.is_npc,
                    info.npc_label,
                    info.active
                );
            case event_types.AUDIO_PLAY:
                return new AudioPlayEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.audio_type,
                    info.audio_key,
                    info.volume,
                    info.loop,
                    info.finish_events
                );
            case event_types.CONTROL_BGM:
                return new ControlBgmEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.control_type,
                    info.volume
                );
            case event_types.SET_PARTY_COINS:
                return new SetPartyCoinsEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.control_type,
                    info.amount
                );
            case event_types.CHAR_EXP:
                return new SetCharExpEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.char_key,
                    info.control_type,
                    info.amount
                );
            case event_types.CHAR_ITEM_MANIPULATION:
                return new CharItemManipulationEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.char_key,
                    info.control_type,
                    info.item_key,
                    info.equip,
                    info.equip_slot,
                    info.slot_index,
                    info.broken,
                    info.amount
                );
            case event_types.CAMERA_SHAKE:
                return new CameraShakeEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.key_name,
                    info.enable
                );
            case event_types.CAMERA_MOVE:
                return new CameraMoveEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.positions,
                    info.reset_follow,
                    info.return_to_target_duration,
                    info.finish_events
                );
            case event_types.CAMERA_FADE:
                return new CameraFadeEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.fade_type,
                    info.duration,
                    info.finish_events
                );
            case event_types.COLORIZE_MAP:
                return new ColorizeMapEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.color_key,
                    info.intensity,
                    info.gray,
                    info.duration,
                    info.finish_events
                );
            case event_types.COLORIZE_CHAR:
                return new ColorizeCharEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.is_npc,
                    info.npc_label,
                    info.color_key,
                    info.intensity,
                    info.gray
                );
            case event_types.TINT_CHAR:
                return new TintCharEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.is_npc,
                    info.npc_label,
                    info.enable,
                    info.color
                );
            case event_types.OUTLINE_CHAR:
                return new OutlineCharEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.is_npc,
                    info.npc_label,
                    info.enable,
                    info.color,
                    info.keep_transparent
                );
            case event_types.CASTING_AURA:
                return new CastingAuraEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.is_npc,
                    info.npc_label,
                    info.enable
                );
            case event_types.CUSTOM_COLLISION_BODY:
                return new CustomCollisionBodyEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.label,
                    info.create,
                    info.x,
                    info.y,
                    info.body_type,
                    info.properties
                );
            case event_types.SET_CHAR_COLLISION:
                return new SetCharCollisionEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.is_npc,
                    info.npc_label,
                    info.control_type
                );
            case event_types.SET_IO_COLLISION:
                return new SetIoCollisionEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.io_label,
                    info.control_type
                );
            case event_types.GRANT_ABILITY:
                return new GrantAbilityEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.char_key,
                    info.ability
                );
            case event_types.STORAGE_CHANGE:
                return new StorageChangeEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.keys,
                    info.change_events,
                    info.callback_call_type
                );
            case event_types.CAMERA_FOLLOW:
                return new CameraFollowEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.follow,
                    info.is_hero,
                    info.npc_label,
                    info.io_label,
                    info.transition_duration,
                    info.transition_end_events
                );
            case event_types.PERMANENT_STATUS:
                return new SetPermanentStatusEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.target_char_key,
                    info.permanent_status,
                    info.add,
                    info.revive_target_hp
                );
            case event_types.CHANGE_COLLISION_LAYER:
                return new ChangeCollisionLayerEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.target_collision_layer
                );
            case event_types.CREATE_STORAGE_VAR:
                return new CreateStorageVarEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.var_name,
                    info.initial_value,
                    info.add
                );
            case event_types.ITEM_CHECKS:
                return new ItemChecksEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.char_key,
                    info.control_type,
                    info.item_key,
                    info.slot_index,
                    info.quantity,
                    info.check_ok_events,
                    info.check_fail_events
                );
            case event_types.ADD_ITEM_TO_PARTY:
                return new AddItemToPartyEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.item_key,
                    info.quantity
                );
            case event_types.GENERIC_SPRITE:
                return new GenericSpriteEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.control_type,
                    info.generic_sprite_key_name,
                    info.misc_sprite_key,
                    info.x,
                    info.y,
                    info.group,
                    info.frame,
                    info.alpha,
                    info.anchor_x,
                    info.anchor_y,
                    info.scale_x,
                    info.scale_y,
                    info.rotation,
                    info.play,
                    info.frame_rate,
                    info.loop,
                    info.action,
                    info.animation,
                    info.collision_layer
                );
            case event_types.PARTICLES:
                return new ParticlesEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.particles_info,
                    info.group
                );
            case event_types.CHAR_HUE:
                return new CharHueEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.is_npc,
                    info.npc_label,
                    info.enable,
                    info.angle
                );
            case event_types.FLAME_CHAR:
                return new FlameCharEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.is_npc,
                    info.npc_label,
                    info.enable
                );
            case event_types.CHAR_BLEND_MODE:
                return new CharBlendModeEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.is_npc,
                    info.npc_label,
                    info.blend_mode
                );
            case event_types.EVENT_CALLER:
                return new EventCallerEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.event_label,
                    info.activate_event_before
                );
            case event_types.EVENT_ACTIVATION:
                return new EventActivationEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.event_label,
                    info.activate
                );
            case event_types.SET_CHAR_VISIBILITY:
                return new SetCharVisibilityEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.is_npc,
                    info.npc_label,
                    info.visible
                );
            case event_types.EVENTS_HOLDER:
                return new EventsHolderEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.events
                );
            case event_types.EVENTS_LOOP:
                return new EventsLoopEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.key_name,
                    info.keep_reveal,
                    info.interval,
                    info.events
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
        if (this.data.hero.force_char_stop_in_event) {
            this.data.hero.stop_char(this.data.hero.force_idle_action_in_event);
        }
        this.data.hero.update_on_event();
        this.data.map.npcs.forEach(npc => {
            if (npc.move_freely_in_event) {
                npc.update();
            } else {
                if (npc.force_char_stop_in_event) {
                    npc.stop_char(npc.force_idle_action_in_event);
                }
            }
            npc.update_on_event();
        });
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
        const detailed_value = event_value.value as DetailedValues;
        switch (event_value.type) {
            case event_value_types.VALUE:
                return event_value.value;
            case event_value_types.STORAGE:
                const storage = this.data.storage.get_object(detailed_value.key_name);
                return storage.type === storage_types.POSITION
                    ? `${(storage.value as StoragePosition).x}/${(storage.value as StoragePosition).y}`
                    : storage.value;
            case event_value_types.GAME_INFO:
                switch (detailed_value.type) {
                    case game_info_types.CHAR:
                        const char = this.data.info.main_char_list[detailed_value.key_name];
                        return _.get(char, detailed_value.property);
                    case game_info_types.HERO:
                        return _.get(this.data.hero, detailed_value.property);
                    case game_info_types.NPC:
                        const npc = detailed_value.label
                            ? this.data.map.npcs_label_map[detailed_value.label]
                            : this.data.map.npcs[detailed_value.index];
                        return _.get(npc, detailed_value.property);
                    case game_info_types.INTERACTABLE_OBJECT:
                        const interactable_object = detailed_value.label
                            ? this.data.map.interactable_objects_label_map[detailed_value.label]
                            : this.data.map.interactable_objects[detailed_value.index];
                        return _.get(interactable_object, detailed_value.property);
                    case game_info_types.EVENT:
                        const event = detailed_value.label
                            ? TileEvent.get_labeled_event(detailed_value.label)
                            : TileEvent.get_event(detailed_value.index);
                        return _.get(event, detailed_value.property);
                    default:
                        console.warn(`Invalid value type passed to game_info: ${detailed_value.type}`);
                        return null;
                }
            default:
                console.warn(`Invalid value type passed to event: ${event_value.type}`);
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
