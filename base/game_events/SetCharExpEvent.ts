import {GameEvent, event_types} from "./GameEvent";

enum control_types {
    INCREMENT = "increment",
    SET_VALUE = "set_value",
}

export class SetCharExpEvent extends GameEvent {
    private control_type: control_types;
    private amount: number;
    private char_key: string;

    constructor(game, data, active, key_name, keep_reveal, keep_custom_psynergy, char_key, control_type, amount) {
        super(game, data, event_types.CHAR_EXP, active, key_name, keep_reveal, keep_custom_psynergy);
        this.char_key = char_key;
        this.control_type = control_type;
        this.amount = amount;
    }

    _fire() {
        const char = this.data.info.main_char_list[this.char_key];
        if (!char) {
            this.data.logger.log_message(`Could not set exp. for ${this.char_key} char. Check "char_key" property.`);
            return;
        }
        switch (this.control_type) {
            case control_types.SET_VALUE:
                const final_value = this.amount - char.current_exp;
                char.add_exp(final_value);
                break;
            case control_types.INCREMENT:
            default:
                char.add_exp(this.amount);
        }
    }

    _destroy() {}
}
