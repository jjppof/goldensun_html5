import {GameEvent, event_types} from "./GameEvent";

export class CharLevelChangeEvent extends GameEvent {
    private target_char_key: string;
    private target_level_value: number;

    constructor(game, data, active, key_name, keep_reveal, keep_custom_psynergy, target_char_key, target_level_value) {
        super(game, data, event_types.CHAR_LEVEL_CHANGE, active, key_name, keep_reveal, keep_custom_psynergy);
        this.target_char_key = target_char_key;
        this.target_level_value = target_level_value;
    }

    _fire() {
        if (this.target_char_key !== undefined && this.target_char_key in this.data.info.main_char_list) {
            const target_char = this.data.info.main_char_list[this.target_char_key];
            target_char.change_level(this.target_level_value);
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
