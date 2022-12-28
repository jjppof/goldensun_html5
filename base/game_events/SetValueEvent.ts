import {GameEvent, event_types, game_info_types, EventValue, event_value_types, DetailedValues} from "./GameEvent";
import * as _ from "lodash";
import {TileEvent} from "../tile_events/TileEvent";
import {NPC} from "NPC";

export class SetValueEvent extends GameEvent {
    private event_value: EventValue;
    private check_npc_storage_values: boolean;
    private npc_label: string;
    private npc_index: number;

    constructor(
        game,
        data,
        active,
        key_name,
        keep_reveal,
        event_value,
        check_npc_storage_values,
        npc_label,
        npc_index
    ) {
        super(game, data, event_types.SET_VALUE, active, key_name, keep_reveal);
        this.event_value = event_value;
        this.check_npc_storage_values = check_npc_storage_values ?? false;
        this.npc_label = npc_label;
        this.npc_index = npc_index;
    }

    _fire() {
        const detailed_value = this.event_value.value as DetailedValues;
        switch (this.event_value.type) {
            case event_value_types.STORAGE:
                this.data.storage.set(detailed_value.key_name, detailed_value.value);
                break;
            case event_value_types.GAME_INFO:
                switch (detailed_value.type) {
                    case game_info_types.CHAR:
                        const char = this.data.info.main_char_list[detailed_value.key_name];
                        _.set(char, detailed_value.property, detailed_value.value);
                        break;
                    case game_info_types.HERO:
                        _.set(this.data.hero, detailed_value.property, detailed_value.value);
                        break;
                    case game_info_types.NPC:
                        const npc = detailed_value.label
                            ? this.data.map.npcs_label_map[detailed_value.label]
                            : this.data.map.npcs[detailed_value.index];
                        _.set(npc, detailed_value.property, detailed_value.value);
                        break;
                    case game_info_types.INTERACTABLE_OBJECT:
                        const interactable_object = detailed_value.label
                            ? this.data.map.interactable_objects_label_map[detailed_value.label]
                            : this.data.map.interactable_objects[detailed_value.index];
                        _.set(interactable_object, detailed_value.property, detailed_value.value);
                        break;
                    case game_info_types.EVENT:
                        const event = detailed_value.label
                            ? TileEvent.get_labeled_event(detailed_value.label)
                            : TileEvent.get_event(detailed_value.index);
                        _.set(event, detailed_value.property, detailed_value.value);
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
