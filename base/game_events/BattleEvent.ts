import {Battle} from "../battle/Battle";
import {GameEvent, event_types} from "./GameEvent";

export class BattleEvent extends GameEvent {
    private background_key: string;
    private enemy_party_key: string;
    private battle: Battle;

    constructor(game, data, active, background_key, enemy_party_key) {
        super(game, data, event_types.BATTLE, active);
        this.background_key = background_key;
        this.enemy_party_key = enemy_party_key;
    }

    _fire() {
        if (!this.active) return;
        this.data.hero.stop_char(true);
        this.battle = new Battle(this.game, this.data, this.background_key, this.enemy_party_key);
        this.battle.start_battle();
    }
}
