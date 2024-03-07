import {equip_slots, ItemSlot, MainChar} from "../MainChar";
import {GameEvent, event_types} from "./GameEvent";

enum control_types {
    ADD = "add",
    SET_EQUIP = "set_equip",
    REMOVE = "remove",
    SET_BROKEN = "set_broken",
}

export class CharItemManipulationEvent extends GameEvent {
    private char_key: string;
    private control_type: control_types;
    private item_key: string;
    private equip: boolean;
    private equip_slot: equip_slots;
    private slot_index: number;
    private broken: boolean;
    private amount: number;
    private manipulation_done_events: GameEvent[];
    private manipulation_fail_events: GameEvent[];

    constructor(
        game,
        data,
        active,
        key_name,
        keep_reveal,
        keep_custom_psynergy,
        char_key,
        control_type,
        item_key,
        equip,
        equip_slot,
        slot_index,
        broken,
        amount,
        manipulation_done_events,
        manipulation_fail_events
    ) {
        super(game, data, event_types.CHAR_ITEM_MANIPULATION, active, key_name, keep_reveal, keep_custom_psynergy);
        this.char_key = char_key;
        this.control_type = control_type;
        this.item_key = item_key;
        this.equip = equip ?? true;
        this.equip_slot = equip_slot;
        this.slot_index = slot_index;
        this.broken = broken ?? false;
        this.amount = amount ?? 1;
        this.manipulation_done_events = [];
        if (manipulation_done_events !== undefined) {
            manipulation_done_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info, this.type, this.origin_npc);
                this.manipulation_done_events.push(event);
            });
        }
        this.manipulation_fail_events = [];
        if (manipulation_fail_events !== undefined) {
            manipulation_fail_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info, this.type, this.origin_npc);
                this.manipulation_fail_events.push(event);
            });
        }
    }

    _fire() {
        if (!(this.item_key in this.data.info.items_list)) {
            this.data.logger.log_message(`Item '${this.item_key}' is not registered.`);
            return;
        }
        if (!this.char_key) {
            let action_done = false;
            switch (this.control_type) {
                case control_types.ADD:
                    action_done = MainChar.add_item_to_party(
                        this.data.info.party_data,
                        this.data.info.items_list[this.item_key],
                        this.amount
                    );
                    break;
                case control_types.REMOVE:
                    action_done = MainChar.remove_item_from_party(
                        this.data.info.party_data,
                        this.data.info.items_list[this.item_key],
                        this.amount
                    );
                    break;
            }
            if (action_done) {
                this.manipulation_done_events.forEach(event => event.fire(this.origin_npc));
            } else {
                this.manipulation_fail_events.forEach(event => event.fire(this.origin_npc));
            }
            return;
        }

        const char = this.data.info.main_char_list[this.char_key];
        if (!char) {
            this.data.logger.log_message(
                `Could not manipulate items for ${this.char_key} char. Check "char_key" property.`
            );
            return;
        }
        let item_slot: ItemSlot = null;
        if (this.control_type !== control_types.ADD) {
            if (this.equip_slot) {
                item_slot = char.equip_slots[this.equip_slot];
            } else if (this.slot_index !== undefined) {
                item_slot = char.items.find(item_slot => item_slot.index === this.slot_index);
            } else if (this.item_key) {
                item_slot = char.items.find(item_slot => item_slot.key_name === this.item_key);
            }
            if (!item_slot) {
                this.data.logger.log_message(`Could not find an item slot with given info.`);
                return;
            }
        }
        switch (this.control_type) {
            case control_types.ADD:
                if (char.add_item(this.item_key, this.amount, this.equip)) {
                    this.manipulation_done_events.forEach(event => event.fire(this.origin_npc));
                } else {
                    this.manipulation_fail_events.forEach(event => event.fire(this.origin_npc));
                }
                break;
            case control_types.REMOVE:
                char.remove_item(item_slot, this.amount, true);
                break;
            case control_types.SET_BROKEN:
                item_slot.broken = this.broken;
                break;
            case control_types.SET_EQUIP:
                if (this.equip) {
                    char.equip_item(item_slot.index);
                } else {
                    char.unequip_item(item_slot.index, true);
                }
                break;
        }
    }

    _destroy() {
        this.manipulation_done_events.forEach(event => event?.destroy());
        this.manipulation_fail_events.forEach(event => event?.destroy());
    }
}
