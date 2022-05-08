import {MainChar} from "../MainChar";
import {GameEvent, event_types} from "./GameEvent";

export class AddItemToPartyEvent extends GameEvent {
    private item_key: string;
    private quantity: number;

    constructor(game, data, active, key_name, item_key, quantity) {
        super(game, data, event_types.ADD_ITEM_TO_PARTY, active, key_name);
        this.item_key = item_key;
        this.quantity = quantity ?? 1;
    }

    _fire() {
        const item = this.data.info.items_list[this.item_key];
        if (!item) {
            console.warn(`Could not find item for "${this.item_key}". Check "item_key" property.`);
            return;
        }
        MainChar.add_item_to_party(this.data.info.party_data, item, this.quantity);
    }

    _destroy() {}
}
