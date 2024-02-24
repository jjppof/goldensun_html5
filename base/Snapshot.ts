import {djinn_status} from "./Djinn";
import {GoldenSun} from "./GoldenSun";
import {GameInfo} from "./initializers/initialize_info";
import {InteractableObjects} from "./interactable_objects/InteractableObjects";
import {ItemSlot} from "./MainChar";
import {npc_movement_types} from "./NPC";
import {main_stats, permanent_status, Player} from "./Player";
import {RawStorageRecord} from "./Storage";
import {TileEvent} from "./tile_events/TileEvent";
import * as _ from "lodash";
import {Button} from "./XGamepad";
import {reverse_directions, engine_filters} from "./utils";
import {Breakable} from "./interactable_objects/Breakable";
import {RollablePillar} from "./interactable_objects/RollingPillar";
import {RopeDock} from "./interactable_objects/RopeDock";
import {Map} from "Map";
import {Pushable} from "interactable_objects/Pushable";

type FilterSettings = {
    [engine_filters.COLORIZE]?: {
        intensity: Phaser.Filter.Colorize["intensity"];
        color: Phaser.Filter.Colorize["color"];
    };
    [engine_filters.LEVELS]?: {
        min_input: number;
        max_input: number;
        gamma: number;
    };
    [engine_filters.COLOR_BLEND]?: {
        r: number;
        g: number;
        b: number;
        fake_blend: boolean;
    };
    [engine_filters.TINT]?: {
        r: number;
        g: number;
        b: number;
    };
    [engine_filters.HUE]?: {
        angle: number;
    };
    [engine_filters.GRAY]?: {
        intensity: number;
    };
    [engine_filters.OUTLINE]?: {
        texture_width: number;
        texture_height: number;
        r: number;
        g: number;
        b: number;
        keep_transparent: boolean;
    };
};

export type SnapshotData = {
    storage_data: {[key_name: string]: RawStorageRecord["value"]};
    engine_storage_data: {[key_name: string]: RawStorageRecord["value"]};
    main_chars: {
        key_name: string;
        in_party: boolean;
        current_hp: number;
        current_pp: number;
        extra_stats: Player["extra_stats"];
        permanent_status: permanent_status[];
        learnt_abilities: string[];
        items: ItemSlot[];
        djinn: {
            key_name: string;
            status: djinn_status;
            recovery_turn: number;
        }[];
    }[];
    coins: number;
    random_battle_extra_rate: number;
    game_tickets: GameInfo["party_data"]["game_tickets"];
    visited_shops: string[];
    psynergies_shortcuts: {
        L: {main_char: string; ability: string};
        R: {main_char: string; ability: string};
    };
    summons_availability: {[key_name: string]: boolean};
    artifacts_global_list: GameInfo["artifacts_global_list"];
    last_visited_town_with_sanctum: GameInfo["last_visited_town_with_sanctum"];
    internal_map_objs_storage_keys: {[map_key: string]: Map["internal_map_objs_storage_keys"]};
    map_data: {
        key_name: string;
        collision_layer: number;
        encounter_cumulator: number;
        retreat_data: Map["_retreat_data"];
        layer_changes: Map["layer_changes"];
        pc: {
            direction: string;
            position: {
                x: number;
                y: number;
            };
        };
        npcs: {
            key_name: string;
            index: number;
            position: {
                x: number;
                y: number;
                x_px: number;
                y_px: number;
            };
            scale: {
                x: number;
                y: number;
            };
            anchor: {
                x: number;
                y: number;
            };
            shadow: {
                x: number;
                y: number;
            };
            shadow_following: boolean;
            action: string;
            animation: string;
            frame: string;
            anim_is_playing: boolean;
            base_collision_layer: number;
            send_to_back: boolean;
            send_to_front: boolean;
            visible: boolean;
            movement_type: npc_movement_types;
            body_in_map: boolean;
            shapes_collision_active: boolean;
            move_freely_in_event: boolean;
            active_filters: {[key in engine_filters]?: boolean};
            filter_settings?: FilterSettings;
        }[];
        interactable_objects: {
            key_name: string;
            index: number;
            position: {
                x: number;
                y: number;
                x_px: number;
                y_px: number;
            };
            scale: {
                x: number;
                y: number;
            };
            anchor: {
                x: number;
                y: number;
            };
            shadow: {
                x: number;
                y: number;
            };
            type: {
                is_rope_dock: boolean;
                rollable: boolean;
                breakable: boolean;
            };
            state_by_type: {
                breakable?: {
                    one_level_broken: boolean;
                    two_level_broken: boolean;
                };
                rollable?: {
                    pillar_is_stuck: boolean;
                };
                pushable?: {
                    docked: boolean;
                };
                rope_dock?: {
                    tied: boolean;
                };
            };
            action: string;
            animation: string;
            frame: string;
            anim_is_playing: boolean;
            base_collision_layer: number;
            send_to_back: boolean;
            send_to_front: boolean;
            visible: boolean;
            active: boolean;
            enable: boolean;
            entangled_by_bush: boolean;
            psynergy_casted: InteractableObjects["psynergy_casted"];
            allow_jumping_over_it: boolean;
            allow_jumping_through_it: boolean;
            body_in_map: boolean;
            shapes_collision_active: boolean;
            active_filters: {[key in engine_filters]?: boolean};
            filter_settings?: FilterSettings;
        }[];
        tile_events: {
            [id: number]: {
                position: {
                    x: number;
                    y: number;
                };
                activation_directions: number[];
                activation_collision_layers: number[];
                in_map: boolean;
            };
        };
    };
    scale_factor: number;
    full_screen: boolean;
    mute: boolean;
};

/** Class responsible for generating and restoring save files. */
export class Snapshot {
    private static readonly SNAPSHOT_FILENAME = "save.json";

    private game: Phaser.Game;
    private data: GoldenSun;
    private _snapshot: SnapshotData;

    constructor(game: Phaser.Game, data: GoldenSun, snapshot: SnapshotData) {
        this.game = game;
        this.data = data;
        this._snapshot = snapshot ?? null;
    }

    /** The snapshot info retrieved by a file when the game starts. */
    get snapshot() {
        return this._snapshot;
    }

    /**
     * Generates a snapshot of the current game state and opens the download box.
     */
    generate_snapshot() {
        const snapshot: SnapshotData = {
            storage_data: _.mapValues(this.data.storage.internal_storage, record => record.value),
            engine_storage_data: _.mapValues(this.data.storage.engine_storage, record => record.value),
            main_chars: _.map(this.data.info.main_char_list, member => {
                return {
                    key_name: member.key_name,
                    in_party: member.in_party,
                    current_hp: member.current_hp,
                    current_pp: member.current_pp,
                    extra_stats: {
                        [main_stats.MAX_HP]: member.extra_stats[main_stats.MAX_HP],
                        [main_stats.MAX_PP]: member.extra_stats[main_stats.MAX_PP],
                        [main_stats.ATTACK]: member.extra_stats[main_stats.ATTACK],
                        [main_stats.DEFENSE]: member.extra_stats[main_stats.DEFENSE],
                        [main_stats.AGILITY]: member.extra_stats[main_stats.AGILITY],
                        [main_stats.LUCK]: member.extra_stats[main_stats.LUCK],
                    },
                    permanent_status: [...member.permanent_status],
                    learnt_abilities: member.learnt_abilities,
                    items: member.items,
                    djinn: member.djinni.map(djinn_key_name => {
                        const djinn = this.data.info.djinni_list[djinn_key_name];
                        return {
                            key_name: djinn.key_name,
                            status: djinn.status,
                            recovery_turn: djinn.recovery_turn,
                        };
                    }),
                };
            }),
            coins: this.data.info.party_data.coins,
            random_battle_extra_rate: this.data.info.party_data.random_battle_extra_rate,
            game_tickets: this.data.info.party_data.game_tickets,
            visited_shops: [...this.data.info.party_data.visited_shops],
            psynergies_shortcuts: {
                L: this.data.info.party_data.psynergies_shortcuts[Button.L],
                R: this.data.info.party_data.psynergies_shortcuts[Button.R],
            },
            summons_availability: _.mapValues(this.data.info.summons_list, summon => summon.available),
            artifacts_global_list: this.data.info.artifacts_global_list,
            last_visited_town_with_sanctum: this.data.info.last_visited_town_with_sanctum,
            internal_map_objs_storage_keys: _.mapValues(
                this.data.info.maps_list,
                map => map.internal_map_objs_storage_keys
            ),
            map_data: {
                key_name: this.data.map.key_name,
                collision_layer: this.data.map.collision_layer,
                encounter_cumulator: this.data.map.encounter_cumulator,
                retreat_data: this.data.map.retreat_data,
                layer_changes: this.data.map.layer_changes,
                pc: {
                    position: {
                        x: this.data.hero.tile_x_pos,
                        y: this.data.hero.tile_y_pos,
                    },
                    direction: reverse_directions[this.data.hero.current_direction],
                },
                npcs: this.data.map.npcs.map((npc, index) => {
                    return {
                        key_name: npc.key_name,
                        index: index,
                        position: {
                            x: npc.tile_x_pos,
                            y: npc.tile_y_pos,
                            x_px: npc.x,
                            y_px: npc.y,
                        },
                        scale: {
                            x: npc.sprite?.scale.x ?? null,
                            y: npc.sprite?.scale.y ?? null,
                        },
                        anchor: {
                            x: npc.sprite?.anchor.x ?? null,
                            y: npc.sprite?.anchor.y ?? null,
                        },
                        shadow: {
                            x: npc.shadow?.x ?? null,
                            y: npc.shadow?.y ?? null,
                        },
                        shadow_following: npc.shadow_following,
                        action: npc.current_action,
                        animation: npc.current_animation,
                        frame: npc.sprite?.frameName ?? null,
                        anim_is_playing: npc.sprite?.animations?.currentAnim?.isPlaying ?? null,
                        base_collision_layer: npc.base_collision_layer,
                        send_to_back: npc.sprite?.send_to_back ?? null,
                        send_to_front: npc.sprite?.send_to_front ?? null,
                        visible: npc.sprite.visible,
                        movement_type: npc.movement_type,
                        body_in_map: this.data.map.body_in_map(npc),
                        shapes_collision_active: npc.shapes_collision_active,
                        move_freely_in_event: npc.move_freely_in_event,
                        active_filters: npc.active_filters,
                        filter_settings: {
                            ...(npc.active_filters.colorize && {
                                colorize: {
                                    intensity: npc.colorize_filter.intensity,
                                    color: npc.colorize_filter.color,
                                },
                            }),
                            ...(npc.active_filters.levels && {
                                levels: {
                                    min_input: npc.levels_filter.min_input,
                                    max_input: npc.levels_filter.max_input,
                                    gamma: npc.levels_filter.gamma,
                                },
                            }),
                            ...(npc.active_filters.color_blend && {
                                color_blend: {
                                    r: npc.color_blend_filter.r,
                                    g: npc.color_blend_filter.g,
                                    b: npc.color_blend_filter.b,
                                    fake_blend: npc.color_blend_filter.fake_blend,
                                },
                            }),
                            ...(npc.active_filters.tint && {
                                tint: {
                                    r: npc.tint_filter.r,
                                    g: npc.tint_filter.g,
                                    b: npc.tint_filter.b,
                                },
                            }),
                            ...(npc.active_filters.hue && {
                                hue: {
                                    angle: npc.hue_filter.angle,
                                },
                            }),
                            ...(npc.active_filters.gray && {
                                gray: {
                                    intensity: npc.gray_filter.intensity,
                                },
                            }),
                            ...(npc.active_filters.outline && {
                                outline: {
                                    texture_width: npc.outline_filter.texture_width,
                                    texture_height: npc.outline_filter.texture_height,
                                    r: npc.outline_filter.r,
                                    g: npc.outline_filter.g,
                                    b: npc.outline_filter.b,
                                    keep_transparent: npc.outline_filter.keep_transparent,
                                },
                            }),
                        },
                    };
                }),
                interactable_objects: this.data.map.interactable_objects.map((io, index) => {
                    return {
                        key_name: io.key_name,
                        index: index,
                        position: {
                            x: io.tile_x_pos,
                            y: io.tile_y_pos,
                            x_px: io.x,
                            y_px: io.y,
                        },
                        scale: {
                            x: io.sprite?.scale.x ?? null,
                            y: io.sprite?.scale.y ?? null,
                        },
                        anchor: {
                            x: io.sprite?.anchor.x ?? null,
                            y: io.sprite?.anchor.y ?? null,
                        },
                        shadow: {
                            x: io.shadow?.x ?? null,
                            y: io.shadow?.y ?? null,
                        },
                        type: {
                            pushable: io.pushable,
                            is_rope_dock: io.is_rope_dock,
                            rollable: io.rollable,
                            breakable: io.breakable,
                        },
                        state_by_type: {
                            ...(io.breakable && {
                                breakable: {
                                    one_level_broken: (io as Breakable).one_level_broken,
                                    two_level_broken: (io as Breakable).two_level_broken,
                                },
                            }),
                            ...(io.rollable && {
                                rollable: {
                                    pillar_is_stuck: (io as RollablePillar).pillar_is_stuck,
                                },
                            }),
                            ...(io.pushable && {
                                pushable: {
                                    docked: (io as Pushable).docked,
                                },
                            }),
                            ...(io.is_rope_dock && {
                                rope_dock: {
                                    tied: (io as RopeDock).tied,
                                },
                            }),
                        },
                        action: io.current_action,
                        animation: io.current_animation,
                        frame: io.sprite?.frameName ?? null,
                        anim_is_playing: io.sprite?.animations?.currentAnim?.isPlaying ?? null,
                        base_collision_layer: io.base_collision_layer,
                        send_to_back: io.sprite?.send_to_back ?? null,
                        send_to_front: io.sprite?.send_to_front ?? null,
                        visible: io.sprite?.visible ?? null,
                        active: io.active,
                        enable: io.enable,
                        entangled_by_bush: io.entangled_by_bush,
                        psynergy_casted: io.psynergy_casted,
                        allow_jumping_over_it: io.allow_jumping_over_it,
                        allow_jumping_through_it: io.allow_jumping_through_it,
                        body_in_map: this.data.map.body_in_map(io),
                        shapes_collision_active: io.shapes_collision_active,
                        active_filters: io.active_filters,
                        filter_settings: {
                            ...(io.active_filters.colorize && {
                                colorize: {
                                    intensity: io.colorize_filter.intensity,
                                    color: io.colorize_filter.color,
                                },
                            }),
                            ...(io.active_filters.levels && {
                                levels: {
                                    min_input: io.levels_filter.min_input,
                                    max_input: io.levels_filter.max_input,
                                    gamma: io.levels_filter.gamma,
                                },
                            }),
                            ...(io.active_filters.color_blend && {
                                color_blend: {
                                    r: io.color_blend_filter.r,
                                    g: io.color_blend_filter.g,
                                    b: io.color_blend_filter.b,
                                    fake_blend: io.color_blend_filter.fake_blend,
                                },
                            }),
                            ...(io.active_filters.tint && {
                                tint: {
                                    r: io.tint_filter.r,
                                    g: io.tint_filter.g,
                                    b: io.tint_filter.b,
                                },
                            }),
                            ...(io.active_filters.hue && {
                                hue: {
                                    angle: io.hue_filter.angle,
                                },
                            }),
                            ...(io.active_filters.gray && {
                                gray: {
                                    intensity: io.gray_filter.intensity,
                                },
                            }),
                        },
                    };
                }),
                tile_events: _.mapValues(TileEvent.events, event => {
                    return {
                        position: {
                            x: event.x,
                            y: event.y,
                        },
                        activation_directions: Array.from(event.activation_directions),
                        activation_collision_layers: Array.from(event.activation_collision_layers),
                        in_map: event.in_map,
                    };
                }),
            },
            scale_factor: this.data.scale_factor,
            full_screen: this.data.fullscreen,
            mute: this.game.sound.mute,
        };
        if (this.data.hero.on_reveal) {
            this.data.info.field_abilities_list.reveal.finish_psynergy(false, false);
        }
        if (this.data.hero.on_custom_psynergy_effect) {
            _.forEach(this.data.info.field_abilities_list, ability => {
                if (ability.is_custom_psynergy) {
                    ability.finish_psynergy(false, false);
                }
            });
        }
        Snapshot.download_json(snapshot, Snapshot.SNAPSHOT_FILENAME);
    }

    /**
     * Remove all snapshot references so they can't be accessible anymore.
     */
    clear_snapshot() {
        this.data.map.npcs.forEach(npc => npc.clear_snapshot());
        this.data.map.interactable_objects.forEach(io => io.clear_snapshot());
        this._snapshot = null;
    }

    /**
     * Downloads a json into a file.
     * @param json the js object object.
     * @param filename the destination file name.
     */
    private static download_json(json: Object, filename: string) {
        const a = document.createElement("a");
        const file = new Blob([JSON.stringify(json, null, 4)], {type: "application/json"});
        a.href = URL.createObjectURL(file);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
    }
}
