import {GameEvent, event_types} from "./GameEvent";

export class GrantAbilityEvent extends GameEvent {
    private ability: string;
    private char_key: string;

    constructor(game, data, active, key_name, keep_reveal, char_key, ability) {
        super(game, data, event_types.GRANT_ABILITY, active, key_name, keep_reveal);
        this.char_key = char_key;
        this.ability = ability;
    }

    _fire() {
        const char = this.data.info.main_char_list[this.char_key];
        if (!char) {
            this.data.logger.log_message(
                `Could not grant ability for "${this.char_key}" char. Check "char_key" property.`
            );
            return;
        }
        char.learn_ability(this.ability, true);
    }

    _destroy() {}
}
