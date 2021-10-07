import {Game} from "phaser-ce";
import {GameEvent, event_types} from "./GameEvent";

export class CharLevelChangeEvent extends GameEvent {
    private target_char_key: string;
    private target_level_value: number;

    constructor(game, data, active, key_name, target_char_key, target_level_value) {
        super(game, data, event_types.CHAR_LEVEL_CHANGE, active, key_name);
        this.target_char_key = target_char_key;
        this.target_level_value = target_level_value;
    }

    _fire() {
        if (!this.active) return;
        if (this.target_char_key !== undefined) {
            let target_char = this.data.info.main_char_list[this.target_char_key];
            target_char.change_level(this.target_level_value);
            this.destroy();
        } else {
            console.warn("Char is undefined");
        }
    }

    destroy() {
        this.origin_npc = null;
        this.active = false;
        this.target_char_key = null;
        this.target_level_value = null;
    }
}
