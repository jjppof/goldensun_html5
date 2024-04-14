import {GameEvent, event_types} from "./GameEvent";

enum control_types {
    INCREMENT = "increment",
    SET_VALUE = "set_value",
}

export class SetPartyCoinsEvent extends GameEvent {
    private control_type: control_types;
    private amount: number;

    constructor(game, data, active, key_name, keep_reveal, keep_custom_psynergy, control_type, amount) {
        super(game, data, event_types.SET_PARTY_COINS, active, key_name, keep_reveal, keep_custom_psynergy);
        this.control_type = control_type;
        this.amount = amount;
    }

    _fire() {
        switch (this.control_type) {
            case control_types.SET_VALUE:
                this.data.info.party_data.coins = this.amount;
                break;
            case control_types.INCREMENT:
            default:
                this.data.info.party_data.coins += this.amount;
        }
    }

    _destroy() {}
}
