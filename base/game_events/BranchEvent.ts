import {GameEvent, event_types} from "./GameEvent";

enum conditions {
    EQ = "=",
    GREATER_EQ = ">=",
    LESS_EQ = "<=",
    GREATER = ">",
    LESS = "<",
    DIFF = "!=",
}

enum comparator_types {
    VALUE = "value",
    STORAGE = "storage",
}

type ComparatorValue = {
    type: comparator_types;
    value: any;
};

export class BranchEvent extends GameEvent {
    private condition: conditions;
    private left_comparator_value: ComparatorValue;
    private right_comparator_value: ComparatorValue;
    private has_else: boolean;
    private events: GameEvent[] = [];
    private else_events: GameEvent[] = [];

    constructor(game, data, condition, left_comparator_value, right_comparator_value, has_else, events, else_events) {
        super(game, data, event_types.BRANCH);
        this.condition = condition;
        this.left_comparator_value = left_comparator_value;
        this.right_comparator_value = right_comparator_value;
        this.has_else = has_else;
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

    private get_value(comparator_value: ComparatorValue) {
        switch (comparator_value.type) {
            case comparator_types.VALUE:
                return comparator_value.value;
            case comparator_types.STORAGE:
                return this.data.storage.get(comparator_value.value);
            default:
                return null;
        }
    }

    fire() {
        let result: boolean;
        switch (this.condition) {
            case conditions.EQ:
                result = this.get_value(this.right_comparator_value) === this.get_value(this.left_comparator_value);
                break;
            case conditions.GREATER_EQ:
                result = this.get_value(this.right_comparator_value) >= this.get_value(this.left_comparator_value);
                break;
            case conditions.LESS_EQ:
                result = this.get_value(this.right_comparator_value) <= this.get_value(this.left_comparator_value);
                break;
            case conditions.GREATER:
                result = this.get_value(this.right_comparator_value) > this.get_value(this.left_comparator_value);
                break;
            case conditions.LESS:
                result = this.get_value(this.right_comparator_value) < this.get_value(this.left_comparator_value);
                break;
            case conditions.DIFF:
                result = this.get_value(this.right_comparator_value) !== this.get_value(this.left_comparator_value);
                break;
        }

        if (result) {
            this.events.forEach(event => event.fire());
        } else if (this.has_else) {
            this.else_events.forEach(event => event.fire());
        }
    }
}
