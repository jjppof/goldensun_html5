import {NPC, npc_movement_types, npc_types} from "../NPC";
import {GameEvent, event_types} from "./GameEvent";
import {directions, get_centered_pos_in_px, promised_wait, reverse_directions} from "../utils";

export class MainCharsJoinSplitEvent extends GameEvent {
    private mode: "split" | "join";
    private main_char_key_name: string;
    private main_char_label: string;
    private destination_incremental: boolean;
    private destination_type: "px" | "tile";
    private destination: {x: number; y: number};
    private finish_events: GameEvent[];
    private final_direction: directions;
    private wait_after: number;
    private keep_npc_collision_disable: boolean;
    private dash: boolean;

    constructor(
        game,
        data,
        active,
        key_name,
        keep_reveal,
        mode,
        main_char_key_name,
        destination_incremental,
        destination_type,
        destination,
        wait_after,
        final_direction,
        finish_events,
        keep_npc_collision_disable,
        dash
    ) {
        super(game, data, event_types.MAIN_CHARS_JOIN_SPLIT, active, key_name, keep_reveal);
        this.mode = mode ?? "split";
        this.main_char_key_name = main_char_key_name;
        this.main_char_label = `${main_char_key_name}/join_split_event`;
        this.destination_incremental = destination_incremental ?? true;
        this.destination_type = destination_type ?? "tile";
        this.destination = destination ?? {};
        this.wait_after = wait_after;
        this.final_direction = final_direction !== undefined ? directions[final_direction as string] : null;
        this.keep_npc_collision_disable = keep_npc_collision_disable ?? false;
        this.dash = dash ?? false;
        this.finish_events = [];
        if (finish_events !== undefined) {
            finish_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info, this.type, this.origin_npc);
                this.finish_events.push(event);
            });
        }
    }

    async _fire() {
        ++this.data.game_event_manager.events_running_count;
        this.data.collision.disable_npc_collision();

        if (this.mode === "split") {
            await this.split();
        } else {
            await this.join();
        }
    }

    finish() {
        if (!this.keep_npc_collision_disable) {
            this.data.collision.enable_npc_collision(this.data.map.collision_layer);
        }
        --this.data.game_event_manager.events_running_count;
        this.finish_events.forEach(event => event.fire(this.origin_npc));
    }

    async split() {
        if (this.main_char_label in this.data.map.npcs_label_map) {
            this.data.logger.log_message(`NPC with '${this.main_char_label}' label already exists.`);
            return;
        }
        const npc_config = {
            key_name: this.main_char_key_name,
            label: this.main_char_label,
            x: this.data.hero.tile_pos.x,
            y: this.data.hero.tile_pos.y,
            animation: reverse_directions[directions.down],
            npc_type: npc_types.NORMAL,
            movement_type: npc_movement_types.IDLE,
            avatar: this.main_char_key_name,
            base_collision_layer: this.data.hero.collision_layer,
            visible: false,
        };
        const map_index = this.data.map.npcs.length;
        const main_char = this.data.map.create_npc(null, npc_config, false, map_index);
        if (main_char) {
            this.data.map.config_single_npc(main_char, map_index, {
                x: this.data.hero.x,
                y: this.data.hero.y,
            });
            main_char.config_body();
            let destination: MainCharsJoinSplitEvent["destination"] = {x: null, y: null};
            if (this.destination.x !== undefined) {
                if (this.destination_type === "tile") {
                    const not_centered_destination = this.destination_incremental
                        ? this.data.hero.tile_pos.x + this.destination.x
                        : this.destination.x;
                    destination.x = get_centered_pos_in_px(not_centered_destination, this.data.map.tile_width);
                } else {
                    destination.x = this.destination_incremental
                        ? this.data.hero.x + this.destination.x
                        : this.destination.x;
                }
            } else {
                destination.x = this.data.hero.x;
            }
            if (this.destination.y !== undefined) {
                if (this.destination_type === "tile") {
                    const not_centered_destination = this.destination_incremental
                        ? this.data.hero.tile_pos.y + this.destination.y
                        : this.destination.y;
                    destination.y = get_centered_pos_in_px(not_centered_destination, this.data.map.tile_height);
                } else {
                    destination.y = this.destination_incremental
                        ? this.data.hero.y + this.destination.y
                        : this.destination.y;
                }
            } else {
                destination.y = this.data.hero.y;
            }
            main_char.set_visible(true);
            const previous_force_char_stop_in_event = main_char.force_char_stop_in_event;
            main_char.force_char_stop_in_event = false;
            const previous_move_freely_in_event = main_char.move_freely_in_event;
            main_char.move_freely_in_event = false;
            const previous_dash_value = main_char.dashing;
            main_char.dashing = this.dash;
            const udpate_callback = main_char.get_move_callback(destination, () => {
                this.data.game_event_manager.remove_callback(udpate_callback);
                main_char.force_char_stop_in_event = previous_force_char_stop_in_event;
                main_char.move_freely_in_event = previous_move_freely_in_event;
                main_char.dashing = previous_dash_value;
                this.on_position_reach(main_char);
            });
            this.data.game_event_manager.add_callback(udpate_callback);
        } else {
            this.data.logger.log_message(`Could not create NPC with '${this.main_char_key_name}' key.`);
        }
    }

    async on_position_reach(char: NPC) {
        if (this.final_direction !== null) {
            await char.face_direction(this.final_direction);
        }
        if (this.wait_after) {
            await promised_wait(this.game, this.wait_after);
        }
        this.finish();
    }

    async join() {
        if (!(this.main_char_label in this.data.map.npcs_label_map)) {
            this.data.logger.log_message(`NPC with '${this.main_char_label}' does not exists.`);
            return;
        }
        const destination = {
            x: this.data.hero.x,
            y: this.data.hero.y,
        };
        const main_char = this.data.map.npcs_label_map[this.main_char_label];
        main_char.force_char_stop_in_event = false;
        main_char.move_freely_in_event = false;
        main_char.dashing = this.dash;
        const udpate_callback = main_char.get_move_callback(
            destination,
            async () => {
                this.data.game_event_manager.remove_callback(udpate_callback);
                await promised_wait(this.game, 50);
                this.data.map.remove_npc(main_char, true);
                if (this.wait_after) {
                    await promised_wait(this.game, this.wait_after);
                }
                this.finish();
            },
            2
        );
        this.data.game_event_manager.add_callback(udpate_callback);
    }

    _destroy() {}
}
