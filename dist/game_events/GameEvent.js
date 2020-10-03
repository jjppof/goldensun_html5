export const event_types = {
    BATTLE: "battle"
};

export class GameEvent {
    constructor(game, data, type) {
        this.game = game;
        this.data = data;
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