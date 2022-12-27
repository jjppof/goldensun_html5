import {GameEvent, event_types, EventValue} from "./GameEvent";

enum conditions {
    EQ = "=",
    GREATER_EQ = ">=",
    LESS_EQ = "<=",
    GREATER = ">",
    LESS = "<",
    DIFF = "!=",
}

export class BranchEvent extends GameEvent {
    private condition: conditions;
    private left_comparator_value: EventValue;
    private right_comparator_value: EventValue;
    private events: GameEvent[] = [];
    private else_events: GameEvent[] = [];

    constructor(
        game,
        data,
        active,
        key_name,
        keep_reveal,
        condition,
        left_comparator_value,
        right_comparator_value,
        events,
        else_events
    ) {
        super(game, data, event_types.BRANCH, active, key_name, keep_reveal);
        this.condition = condition;
        this.left_comparator_value = left_comparator_value;
        this.right_comparator_value = right_comparator_value;
        this.initialize_events(events, else_events);
    }

    private initialize_events(events_info, else_events_info) {
        if (events_info !== undefined) {
            events_info.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info);
                this.events.push(event);
            });
        }
        if (else_events_info !== undefined) {
            else_events_info.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info);
                this.else_events.push(event);
            });
        }
    }

    _fire() {
        let result: boolean;
        switch (this.condition) {
            case conditions.EQ:
                result =
                    this.data.game_event_manager.get_value(this.right_comparator_value) ===
                    this.data.game_event_manager.get_value(this.left_comparator_value);
                break;
            case conditions.GREATER_EQ:
                result =
                    this.data.game_event_manager.get_value(this.right_comparator_value) >=
                    this.data.game_event_manager.get_value(this.left_comparator_value);
                break;
            case conditions.LESS_EQ:
                result =
                    this.data.game_event_manager.get_value(this.right_comparator_value) <=
                    this.data.game_event_manager.get_value(this.left_comparator_value);
                break;
            case conditions.GREATER:
                result =
                    this.data.game_event_manager.get_value(this.right_comparator_value) >
                    this.data.game_event_manager.get_value(this.left_comparator_value);
                break;
            case conditions.LESS:
                result =
                    this.data.game_event_manager.get_value(this.right_comparator_value) <
                    this.data.game_event_manager.get_value(this.left_comparator_value);
                break;
            case conditions.DIFF:
                result =
                    this.data.game_event_manager.get_value(this.right_comparator_value) !==
                    this.data.game_event_manager.get_value(this.left_comparator_value);
                break;
            default:
                console.warn(`Invalid condition passed to branch event: ${this.condition}`);
                break;
        }

        if (result) {
            this.events.forEach(event => event.fire(this.origin_npc));
        } else if (this.else_events.length) {
            this.else_events.forEach(event => event.fire(this.origin_npc));
        }
    }

    _destroy() {
        this.events.forEach(event => event.destroy());
    }
}
