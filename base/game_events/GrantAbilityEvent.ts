import {GameEvent, event_types} from "./GameEvent";

export class GrantAbilityEvent extends GameEvent {
    private ability: string;
    private char_key: string;

    constructor(game, data, active, key_name, char_key, ability) {
        super(game, data, event_types.GRANT_ABILITY, active, key_name);
        this.char_key = char_key;
        this.ability = ability;
    }

    _fire() {
        const char = this.data.info.main_char_list[this.char_key];
        if (!char) {
            console.warn(`Could not set exp. for ${this.char_key} char. Check "char_key" property.`);
            return;
        }
        char.learn_ability(this.ability, true);
    }

    _destroy() {}
}
