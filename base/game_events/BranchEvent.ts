import {GameEvent, event_types, EventValue} from "./GameEvent";

enum conditions {
    EQ = "=",
    GREATER_EQ = ">=",
    LESS_EQ = "<=",
    GREATER = ">",
    LESS = "<",
    DIFF = "!=",
}

enum combinations {
    OR = "or",
    AND = "and",
    NOT = "not",
}

export class BranchEvent extends GameEvent {
    private combination: combinations;
    private comparator_pairs: {
        left_comparator_value: EventValue;
        right_comparator_value: EventValue;
        condition: conditions;
    }[];
    private events: GameEvent[] = [];
    private else_events: GameEvent[] = [];

    constructor(game, data, active, key_name, keep_reveal, combination, comparator_pairs, events, else_events) {
        super(game, data, event_types.BRANCH, active, key_name, keep_reveal);
        this.combination = combination ?? combinations.OR;
        this.comparator_pairs = comparator_pairs ?? [];
        this.initialize_events(events, else_events);
    }

    private initialize_events(events_info, else_events_info) {
        if (events_info !== undefined) {
            events_info.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info, this.type, this.origin_npc);
                this.events.push(event);
            });
        }
        if (else_events_info !== undefined) {
            else_events_info.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info, this.type, this.origin_npc);
                this.else_events.push(event);
            });
        }
    }

    private apply_combination(current: boolean, next: boolean) {
        switch (this.combination) {
            case combinations.AND:
                return current && next;
            case combinations.OR:
                return current || next;
            case combinations.NOT:
                return !next;
            default:
                console.warn(`Invalid combination passed to branch event: ${this.combination}`);
                return next;
        }
    }

    _fire() {
        let result: boolean = false;
        for (let comparator_pair of this.comparator_pairs) {
            switch (comparator_pair.condition) {
                case conditions.EQ:
                    result = this.apply_combination(
                        result,
                        this.data.game_event_manager.get_value(comparator_pair.left_comparator_value) ===
                            this.data.game_event_manager.get_value(comparator_pair.right_comparator_value)
                    );
                    break;
                case conditions.GREATER_EQ:
                    result = this.apply_combination(
                        result,
                        this.data.game_event_manager.get_value(comparator_pair.left_comparator_value) >=
                            this.data.game_event_manager.get_value(comparator_pair.right_comparator_value)
                    );
                    break;
                case conditions.LESS_EQ:
                    result = this.apply_combination(
                        result,
                        this.data.game_event_manager.get_value(comparator_pair.left_comparator_value) <=
                            this.data.game_event_manager.get_value(comparator_pair.right_comparator_value)
                    );
                    break;
                case conditions.GREATER:
                    result = this.apply_combination(
                        result,
                        this.data.game_event_manager.get_value(comparator_pair.left_comparator_value) >
                            this.data.game_event_manager.get_value(comparator_pair.right_comparator_value)
                    );
                    break;
                case conditions.LESS:
                    result = this.apply_combination(
                        result,
                        this.data.game_event_manager.get_value(comparator_pair.left_comparator_value) <
                            this.data.game_event_manager.get_value(comparator_pair.right_comparator_value)
                    );
                    break;
                case conditions.DIFF:
                    result = this.apply_combination(
                        result,
                        this.data.game_event_manager.get_value(comparator_pair.left_comparator_value) !==
                            this.data.game_event_manager.get_value(comparator_pair.right_comparator_value)
                    );
                    break;
                default:
                    console.warn(`Invalid condition passed to branch event: ${comparator_pair.condition}`);
                    break;
            }
        }

        if (result) {
            this.events.forEach(event => event.fire(this.origin_npc));
        } else if (this.else_events.length) {
            this.else_events.forEach(event => event.fire(this.origin_npc));
        }
    }

    _destroy() {
        this.events.forEach(event => event?.destroy());
    }
}
