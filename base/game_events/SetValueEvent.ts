import {GameEvent, event_types, game_info_types, EventValue, event_value_types, DetailedValues} from "./GameEvent";
import * as _ from "lodash";
import {TileEvent} from "../tile_events/TileEvent";
import {NPC} from "NPC";
import {storage_types} from "../Storage";

export class SetValueEvent extends GameEvent {
    private event_value: EventValue;
    private check_npc_storage_values: boolean;
    private npc_label: string;
    private npc_index: number;
    private increment: boolean;

    constructor(
        game,
        data,
        active,
        key_name,
        keep_reveal,
        event_value,
        check_npc_storage_values,
        npc_label,
        npc_index,
        increment
    ) {
        super(game, data, event_types.SET_VALUE, active, key_name, keep_reveal);
        this.event_value = event_value;
        this.check_npc_storage_values = check_npc_storage_values ?? false;
        this.npc_label = npc_label;
        this.npc_index = npc_index;
        this.increment = increment ?? false;
    }

    _fire() {
        const detailed_value = this.event_value.value as DetailedValues;
        let value_to_be_set = detailed_value.value;
        switch (this.event_value.type) {
            case event_value_types.STORAGE:
                if (this.increment) {
                    const storage = this.data.storage.get_object(detailed_value.key_name);
                    if (storage.type === storage_types.NUMBER || storage.type === storage_types.STRING) {
                        value_to_be_set += storage.value as any;
                    }
                }
                this.data.storage.set(detailed_value.key_name, value_to_be_set);
                break;
            case event_value_types.GAME_INFO:
                switch (detailed_value.type) {
                    case game_info_types.CHAR:
                        if (!(detailed_value.key_name in this.data.info.main_char_list)) {
                            this.data.logger.log_message(`There's no char with key '${detailed_value.key_name}'.`);
                            break;
                        }
                        const char = this.data.info.main_char_list[detailed_value.key_name];
                        if (_.hasIn(char, detailed_value.property)) {
                            if (this.increment) {
                                value_to_be_set += _.get(char, detailed_value.property);
                            }
                            _.set(char, detailed_value.property, value_to_be_set);
                        } else {
                            this.data.logger.log_message(`Char has no property named '${detailed_value.property}'.`);
                        }
                        break;
                    case game_info_types.HERO:
                        if (_.hasIn(this.data.hero, detailed_value.property)) {
                            if (this.increment) {
                                value_to_be_set += _.get(this.data.hero, detailed_value.property);
                            }
                            _.set(this.data.hero, detailed_value.property, value_to_be_set);
                        } else {
                            this.data.logger.log_message(`Hero has no property named '${detailed_value.property}'.`);
                        }
                        break;
                    case game_info_types.NPC:
                        const npc = GameEvent.get_char(this.data, {
                            is_npc: true,
                            npc_label: detailed_value.label,
                            npc_index: detailed_value.index,
                        });
                        if (npc && _.hasIn(npc, detailed_value.property)) {
                            if (this.increment) {
                                value_to_be_set += _.get(npc, detailed_value.property);
                            }
                            _.set(npc, detailed_value.property, value_to_be_set);
                        } else if (npc) {
                            this.data.logger.log_message(`NPC has no property named '${detailed_value.property}'.`);
                        }
                        break;
                    case game_info_types.INTERACTABLE_OBJECT:
                        const interactable_object = detailed_value.label
                            ? this.data.map.interactable_objects_label_map[detailed_value.label]
                            : this.data.map.interactable_objects[detailed_value.index];
                        if (!interactable_object) {
                            if (detailed_value.label) {
                                this.data.logger.log_message(
                                    `There's no interactable object with label '${detailed_value.label}'.`
                                );
                            } else {
                                this.data.logger.log_message(
                                    `There's no interactable object with index '${detailed_value.index}'.`
                                );
                            }
                            break;
                        }
                        if (_.hasIn(interactable_object, detailed_value.property)) {
                            if (this.increment) {
                                value_to_be_set += _.get(interactable_object, detailed_value.property);
                            }
                            _.set(interactable_object, detailed_value.property, value_to_be_set);
                        } else {
                            this.data.logger.log_message(
                                `Interactable object has no property named '${detailed_value.property}'.`
                            );
                        }
                        break;
                    case game_info_types.EVENT:
                        const event = detailed_value.label
                            ? TileEvent.get_labeled_event(detailed_value.label)
                            : TileEvent.get_event(detailed_value.index);
                        if (!event) {
                            if (detailed_value.label) {
                                this.data.logger.log_message(
                                    `There's no tile event with label '${detailed_value.label}'.`
                                );
                            } else {
                                this.data.logger.log_message(
                                    `There's no tile event with index '${detailed_value.index}'.`
                                );
                            }
                            break;
                        }
                        if (_.hasIn(event, detailed_value.property)) {
                            if (this.increment) {
                                value_to_be_set += _.get(event, detailed_value.property);
                            }
                            _.set(event, detailed_value.property, value_to_be_set);
                        } else {
                            this.data.logger.log_message(
                                `Tile event has no property named '${detailed_value.property}'.`
                            );
                        }
                        break;
                }
                break;
        }
        if (this.check_npc_storage_values) {
            const char =
                GameEvent.get_char(this.data, {
                    is_npc: true,
                    npc_index: this.npc_index,
                    npc_label: this.npc_label,
                }) ?? this.origin_npc;
            (char as NPC).check_storage_keys();
        }
    }

    _destroy() {}
}
