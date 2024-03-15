import {event_types, GameEvent} from "./GameEvent";
import {directions} from "../utils";
import {NPC} from "NPC";

export class JumpEvent extends GameEvent {
    private npc_index: number;
    private npc_label: string;
    private is_npc: boolean;
    private jump_height: number;
    private duration: number;
    private wait_after: number;
    private dest: {
        tile_x?: number;
        tile_y?: number;
        x?: number;
        y?: number;
        distance?: number;
    };
    private jump_direction: directions;
    private dont_play_jump_animation: boolean;
    private sfx_key: string;
    private finish_events: GameEvent[];

    constructor(
        game,
        data,
        active,
        key_name,
        keep_reveal,
        keep_custom_psynergy,
        is_npc,
        npc_index,
        npc_label,
        finish_events,
        jump_height,
        duration,
        dest,
        jump_direction,
        sfx_key,
        wait_after,
        dont_play_jump_animation
    ) {
        super(game, data, event_types.JUMP, active, key_name, keep_reveal, keep_custom_psynergy);
        this.is_npc = is_npc;
        this.npc_index = npc_index;
        this.npc_label = npc_label;
        this.jump_height = jump_height;
        this.duration = duration;
        this.wait_after = wait_after;
        this.dest = dest;
        this.jump_direction = jump_direction !== undefined ? directions[jump_direction as string] : undefined;
        this.sfx_key = sfx_key;
        this.dont_play_jump_animation = dont_play_jump_animation;
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

        const char =
            GameEvent.get_char(this.data, {
                is_npc: this.is_npc,
                npc_index: this.npc_index,
                npc_label: this.npc_label,
            }) ?? this.origin_npc;
        const previous_force_char_stop_in_event = char.force_char_stop_in_event;
        char.force_char_stop_in_event = false;
        let previous_move_freely_in_event: boolean;
        if (char.is_npc) {
            previous_move_freely_in_event = (char as NPC).move_freely_in_event;
            (char as NPC).move_freely_in_event = false;
        }

        await char.jump({
            jump_height: this.jump_height,
            duration: this.duration,
            jump_direction: this.jump_direction,
            dest: this.dest,
            time_on_finish: this.wait_after,
            sfx_key: this.sfx_key,
            dont_play_jump_animation: this.dont_play_jump_animation,
        });

        char.force_char_stop_in_event = previous_force_char_stop_in_event;
        if (char.is_npc) {
            (char as NPC).move_freely_in_event = previous_move_freely_in_event;
        }

        --this.data.game_event_manager.events_running_count;
        this.finish_events.forEach(event => event.fire(this.origin_npc));
    }

    _destroy() {
        this.finish_events.forEach(event => event?.destroy());
    }
}
