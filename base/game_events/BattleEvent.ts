import { Battle } from "../battle/Battle.js";
import { GameEvent, event_types } from "./GameEvent.js";

export class BattleEvent extends GameEvent {
    public background_key: string;
    public enemy_party_key: string;
    public battle: Battle;

    constructor(game, data, background_key, enemy_party_key) {
        super(game, data, event_types.BATTLE);
        this.background_key = background_key;
        this.enemy_party_key = enemy_party_key;
    }

    fire() {
        this.data.hero.stop_char(true);
        this.battle = new Battle(this.game, this.data, this.background_key, this.enemy_party_key);
        this.battle.start_battle();
    }
}