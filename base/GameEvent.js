import { Battle } from "./battle/Battle.js";

export const event_types = {
    BATTLE: "battle"
};

export class GameEvent {
    constructor(type) {
        this.type = type;
        this.id = GameEvent.id_incrementer++;
        GameEvent.events[this.id] = this;
    }

    static get_event(id) {
        return GameEvent.events[id];
    }

    static reset() {
        GameEvent.id_incrementer = 0;
        GameEvent.events = {};
    }
}

GameEvent.reset();

export class BattleEvent extends GameEvent {
    constructor(background_key, enemy_party_key) {
        super(event_types.BATTLE);
        this.background_key = background_key;
        this.enemy_party_key = enemy_party_key;
    }

    fire(game, data) {
        this.battle = new Battle(game, data, this.background_key, this.enemy_party_key);
        this.battle.start_battle();
    }
}