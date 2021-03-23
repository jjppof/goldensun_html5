import {GameEvent, event_types, game_info_types, EventValue, event_value_types} from "./GameEvent";
import * as _ from "lodash";
import {TileEvent} from "../tile_events/TileEvent";
import {NPC} from "../NPC";

export class SetValueEvent extends GameEvent {
    private event_value: EventValue;
    private check_npc_storage_values: boolean;

    constructor(game, data, active, event_value, check_npc_storage_values) {
        super(game, data, event_types.SET_VALUE, active);
        this.event_value = event_value;
        this.check_npc_storage_values = check_npc_storage_values ?? false;
    }

    _fire(oringin_npc: NPC) {
        if (!this.active) return;
        this.origin_npc = oringin_npc;
        switch (this.event_value.type) {
            case event_value_types.STORAGE:
                this.data.storage.set(this.event_value.value.key_name, this.event_value.value.value);
                break;
            case event_value_types.GAME_INFO:
                switch (this.event_value.value.type) {
                    case game_info_types.CHAR:
                        const char = this.data.info.main_char_list[this.event_value.value.key_name];
                        _.set(char, this.event_value.value.property, this.event_value.value.value);
                        break;
                    case game_info_types.HERO:
                        _.set(this.data.hero, this.event_value.value.property, this.event_value.value.value);
                        break;
                    case game_info_types.NPC:
                        const npc = this.data.map.npcs[this.event_value.value.index];
                        _.set(npc, this.event_value.value.property, this.event_value.value.value);
                        break;
                    case game_info_types.INTERACTABLE_OBJECT:
                        const interactable_object = this.data.map.interactable_objects[this.event_value.value.index];
                        _.set(interactable_object, this.event_value.value.property, this.event_value.value.value);
                        break;
                    case game_info_types.EVENT:
                        const event = TileEvent.get_event(this.event_value.value.index);
                        _.set(event, this.event_value.value.property, this.event_value.value.value);
                        break;
                }
                break;
        }
        if (this.check_npc_storage_values) {
            this.origin_npc.check_storage_keys();
        }
    }

    destroy() {
        this.origin_npc = null;
    }
}
