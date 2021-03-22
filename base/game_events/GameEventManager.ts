import {directions, is_close} from "../utils";
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
import {storage_types} from "../Storage";
import {TileEvent} from "../tile_events/TileEvent";
import * as _ from "lodash";
import {SummonEvent} from "./SummonEvent";
import {DjinnGetEvent} from "./DjinnGetEvent";

export enum interaction_patterns {
    NO_INTERACTION = "no_interaction",
    SIMPLE = "simple_interaction",
    TIK_TAK_TOE = "tik_tak_toe",
    CROSS = "cross",
}

export class GameEventManager {
    public game: Phaser.Game;
    public data: GoldenSun;
    public events_running_count: number;
    public control_enable: boolean;
    public allow_char_to_move: boolean;
    public force_idle_action: boolean;
    public fire_next_step: Function;
    private update_callbacks: Function[] = [];

    constructor(game, data) {
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
        return this.events_running_count;
    }

    set_controls() {
        this.data.control_manager.add_controls(
            [
                {
                    button: Button.A,
                    on_down: () => {
                        if (
                            this.data.hero.in_action() ||
                            this.data.menu_open ||
                            this.data.in_battle ||
                            this.data.shop_open ||
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

    //look for valid npcs in the nearby
    search_for_npc() {
        for (let i = 0; i < this.data.map.npcs.length; ++i) {
            const npc = this.data.map.npcs[i];
            if (
                npc.interaction_pattern === interaction_patterns.NO_INTERACTION ||
                !npc.active ||
                npc.base_collision_layer !== this.data.map.collision_layer
            )
                continue;
            const is_close_check = is_close(
                this.data.hero.current_direction,
                this.data.hero.sprite.x,
                this.data.hero.sprite.y,
                npc.sprite.x,
                npc.sprite.y,
                npc.talk_range_factor
            );
            if (is_close_check) {
                this.data.hero.stop_char();
                this.control_enable = false;
                this.set_npc_event(npc);
                break;
            }
        }
    }

    async set_npc_event(npc: NPC) {
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
                    this.data.shop_menu.open_menu(npc.shop_key, npc.voice_key, async () => {
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

    async handle_npc_interaction_start(npc: NPC, increment_event_counter: boolean = true) {
        if (increment_event_counter) {
            ++this.events_running_count;
        }
        let previous_npc_direction;
        if (npc.interaction_pattern !== interaction_patterns.SIMPLE) {
            previous_npc_direction = npc.current_direction;
            await this.set_npc_and_hero_directions(npc);
        }
        return previous_npc_direction;
    }

    async handle_npc_interaction_end(npc: NPC, previous_npc_direction: directions) {
        --this.events_running_count;
        if (npc.interaction_pattern !== interaction_patterns.SIMPLE) {
            await npc.face_direction(previous_npc_direction);
        }
        this.control_enable = true;
    }

    //make hero and npc look each other
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

    // starts common npc dialogs
    async manage_npc_dialog(npc: NPC) {
        const previous_npc_direction = await this.handle_npc_interaction_start(npc);
        const dialog_manager = new DialogManager(this.game, this.data);
        dialog_manager.set_dialog(npc.message, {
            avatar: npc.avatar,
            voice_key: npc.voice_key,
            hero_direction: this.data.hero.current_direction,
        });
        this.fire_next_step = dialog_manager.next.bind(dialog_manager, async finished => {
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

    fire_npc_events(npc: NPC) {
        this.control_enable = true;
        npc.events.forEach(event => {
            event.fire(npc);
        });
    }

    get_event_instance(info: any) {
        switch (info.type) {
            case event_types.BATTLE:
                return new BattleEvent(this.game, this.data, info.active, info.background_key, info.enemy_party_key);
            case event_types.BRANCH:
                return new BranchEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.condition,
                    info.left_comparator_value,
                    info.right_comparator_value,
                    info.has_else,
                    info.events,
                    info.else_events
                );
            case event_types.SET_VALUE:
                return new SetValueEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.event_value,
                    info.check_npc_storage_values
                );
            case event_types.MOVE:
                return new MoveEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.is_npc,
                    info.dash,
                    info.dest_unit_in_tile,
                    info.dest,
                    info.npc_index,
                    info.camera_follow,
                    info.camera_follow_time,
                    info.final_direction,
                    info.follow_hero_on_finish,
                    info.finish_events,
                    info.minimal_distance,
                    info.keep_npc_collision_disable,
                    info.deactive_char_on_end
                );
            case event_types.DIALOG:
                return new DialogEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.text,
                    info.avatar,
                    info.npc_hero_reciprocal_look,
                    info.reset_reciprocal_look,
                    info.finish_events,
                    info.voice_key
                );
            case event_types.LOOK:
                return new LookEvent(this.game, this.data, info.active, info.look, info.looker, info.target);
            case event_types.CHEST:
                return new ChestEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.item,
                    info.quantity,
                    info.finish_events,
                    info.custom_init_text,
                    info.no_chest,
                    info.hide_on_finish
                );
            case event_types.PSYNERGY_STONE:
                return new PsynergyStoneEvent(this.game, this.data, info.active, info.finish_events);
            case event_types.TIMER:
                return new TimerEvent(this.game, this.data, info.active, info.duration, info.finish_events);
            case event_types.PARTY_JOIN:
                return new PartyJoinEvent(
                    this.game,
                    this.data,
                    info.active,
                    info.char_key_name,
                    info.join,
                    info.finish_events
                );
            case event_types.SUMMON:
                return new SummonEvent(this.game, this.data, info.active, info.summon_key, info.finish_events);
            case event_types.DJINN_GET:
                return new DjinnGetEvent(this.game, this.data, info.active, info.djinn_key, info.finish_events);
        }
    }

    add_callback(callback) {
        this.update_callbacks.push(callback);
    }

    remove_callback(callback) {
        this.update_callbacks = this.update_callbacks.filter(c => callback !== c);
    }

    update() {
        if (!this.allow_char_to_move) {
            this.data.hero.stop_char(this.force_idle_action);
        }
        this.data.hero.update_on_event();
        this.data.map.npcs.forEach(npc => npc.update_on_event());
        this.update_callbacks.forEach(callback => callback());
    }

    get_value(event_value: EventValue) {
        switch (event_value.type) {
            case event_value_types.VALUE:
                return event_value.value;
            case event_value_types.STORAGE:
                const storage = this.data.storage.get_object(event_value.value.key_name);
                return storage.type === storage_types.POSITION
                    ? `${storage.value.x}/${storage.value.y}`
                    : storage.value;
            case event_value_types.GAME_INFO:
                switch (event_value.value.type) {
                    case game_info_types.CHAR:
                        const char = this.data.info.main_char_list[event_value.value.key_name];
                        return _.get(char, event_value.value.property);
                    case game_info_types.HERO:
                        return _.get(this.data.hero, event_value.value.property);
                    case game_info_types.NPC:
                        const npc = this.data.map.npcs[event_value.value.index];
                        return _.get(npc, event_value.value.property);
                    case game_info_types.INTERACTABLE_OBJECT:
                        const interactable_object = this.data.map.interactable_objects[event_value.value.index];
                        return _.get(interactable_object, event_value.value.property);
                    case game_info_types.EVENT:
                        const event = TileEvent.get_event(event_value.value.index);
                        return _.get(event, event_value.value.property);
                    default:
                        return null;
                }
            default:
                return null;
        }
    }

    static get_interaction_directions(hero_x, hero_y, target_x, target_y, interaction_pattern, target_body_radius) {
        let target_direction;
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

        let hero_direction;
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
