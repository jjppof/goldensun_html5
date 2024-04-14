import {ControllableChar} from "../ControllableChar";
import {GameEvent, event_types} from "./GameEvent";

export class CharFallEvent extends GameEvent {
    private is_npc: boolean;
    private npc_label: string;
    private options: Parameters<ControllableChar["fall"]>[0];
    private finish_events: GameEvent[];

    constructor(
        game,
        data,
        active,
        key_name,
        keep_reveal,
        keep_custom_psynergy,
        is_npc,
        npc_label,
        y_destination_position,
        dest_collision_layer,
        show_exclamation_emoticon,
        splash_sweat_drops,
        walking_in_the_air,
        ground_hit_animation,
        teleport,
        finish_events
    ) {
        super(game, data, event_types.CHAR_FALL, active, key_name, keep_reveal, keep_custom_psynergy);
        this.is_npc = is_npc;
        this.npc_label = npc_label;
        this.options = {
            y_destination_position: y_destination_position,
            dest_collision_layer: dest_collision_layer,
            show_exclamation_emoticon: show_exclamation_emoticon,
            splash_sweat_drops: splash_sweat_drops,
            walking_in_the_air: walking_in_the_air,
            ground_hit_animation: ground_hit_animation,
            teleport: teleport,
        };
        this.finish_events = [];
        if (finish_events !== undefined) {
            finish_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info, this.type, this.origin_npc);
                this.finish_events.push(event);
            });
        }
    }

    async _fire() {
        const target_char =
            GameEvent.get_char(this.data, {
                is_npc: this.is_npc,
                npc_label: this.npc_label,
            }) ?? this.origin_npc;

        if (target_char) {
            ++this.data.game_event_manager.events_running_count;
            const prev_force_idle_action_in_event = target_char.force_idle_action_in_event;
            target_char.force_idle_action_in_event = false;
            const target_obj = Object.assign({}, this.options, {
                on_fall_finish_callback: () => {
                    if (!this.options.teleport) {
                        --this.data.game_event_manager.events_running_count;
                        target_char.force_idle_action_in_event = prev_force_idle_action_in_event;
                        this.finish_events.forEach(event => event.fire(this.origin_npc));
                    }
                },
            });
            if (target_obj.teleport) {
                target_obj.teleport.on_before_teleport = () => {
                    this.data.game_event_manager.events_running_count = 0;
                    target_char.force_idle_action_in_event = prev_force_idle_action_in_event;
                };
            }
            target_char.fall(target_obj);
        }
    }

    _destroy() {
        this.finish_events.forEach(event => event?.destroy());
    }
}
