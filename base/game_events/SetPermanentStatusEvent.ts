import {equip_slots} from "MainChar";
import {permanent_status} from "../Player";
import {GameEvent, event_types} from "./GameEvent";

export class SetPermanentStatusEvent extends GameEvent {
    private target_char_key: string;
    private permanent_status: permanent_status;
    private add: boolean;
    /** When removing DOWNED status, the target hp to be recovered in percentage [0-1]. Default is 1. */
    private revive_target_hp: number;

    constructor(game, data, active, key_name, keep_reveal, target_char_key, permanent_status, add, revive_target_hp) {
        super(game, data, event_types.PERMANENT_STATUS, active, key_name, keep_reveal);
        this.target_char_key = target_char_key;
        this.permanent_status = permanent_status;
        this.add = add ?? true;
        this.revive_target_hp = revive_target_hp ?? 1.0;
    }

    _fire() {
        if (this.permanent_status === permanent_status.EQUIP_CURSE && this.add) {
            this.data.logger.log_message("Equip curse can only be added by equipping a cursed item.");
            return;
        }
        if (this.target_char_key !== undefined && this.target_char_key in this.data.info.main_char_list) {
            const target_char = this.data.info.main_char_list[this.target_char_key];
            if (this.add) {
                if (this.permanent_status === permanent_status.DOWNED) {
                    target_char.current_hp = 0;
                }
                target_char.add_permanent_status(this.permanent_status);
            } else {
                if (this.permanent_status === permanent_status.DOWNED) {
                    target_char.current_hp = (target_char.max_hp * this.revive_target_hp) | 0;
                } else if (this.permanent_status === permanent_status.EQUIP_CURSE) {
                    for (let slot_type in target_char.equip_slots) {
                        const slot = target_char.equip_slots[slot_type as equip_slots];
                        if (slot) {
                            const item = this.data.info.items_list[slot.key_name];
                            if (item.curses_when_equipped) {
                                target_char.unequip_item(slot.index, false);
                            }
                        }
                    }
                }
                target_char.remove_permanent_status(this.permanent_status);
            }
        } else {
            this.data.logger.log_message(
                `Could not find a char to change level.${
                    this.target_char_key ?? ` Could not find ${this.target_char_key}.`
                }`
            );
        }
    }

    _destroy() {}
}
