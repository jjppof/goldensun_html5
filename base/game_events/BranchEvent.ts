import {GameEvent, event_types, game_info_types, EventValue, event_value_types} from "./GameEvent";
import * as _ from "lodash";
import {TileEvent} from "../tile_events/TileEvent";

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

    private get_value(comparator_value: EventValue) {
        switch (comparator_value.type) {
            case event_value_types.VALUE:
                return comparator_value.value;
            case event_value_types.STORAGE:
                return this.data.storage.get(comparator_value.value.key_name);
            case event_value_types.GAME_INFO:
                switch (comparator_value.value.type) {
                    case game_info_types.CHAR:
                        const char = this.data.info.main_char_list[comparator_value.value.key_name];
                        return _.get(char, comparator_value.value.property);
                    case game_info_types.HERO:
                        return _.get(this.data.hero, comparator_value.value.property);
                    case game_info_types.NPC:
                        const npc = this.data.map.npcs[comparator_value.value.index];
                        return _.get(npc, comparator_value.value.property);
                    case game_info_types.INTERACTABLE_OBJECT:
                        const interactable_object = this.data.map.interactable_objects[comparator_value.value.index];
                        return _.get(interactable_object, comparator_value.value.property);
                    case game_info_types.EVENT:
                        const event = TileEvent.get_event(comparator_value.value.index);
                        return _.get(event, comparator_value.value.property);
                    default:
                        return null;
                }
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
