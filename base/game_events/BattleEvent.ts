import {Battle} from "../battle/Battle";
import {GameEvent, event_types} from "./GameEvent";

export class BattleEvent extends GameEvent {
    private background_key: string;
    private enemy_party_key: string;
    private battle: Battle;
    private finish_callback: (victory: boolean) => void;
    private before_fade_finish_callback: (victory: boolean) => void;

    constructor(game, data, active, key_name, background_key, enemy_party_key) {
        super(game, data, event_types.BATTLE, active, key_name);
        this.background_key = background_key;
        this.enemy_party_key = enemy_party_key;
    }

    _fire() {
        ++this.data.game_event_manager.events_running_count;
        this.battle = new Battle(
            this.game,
            this.data,
            this.background_key,
            this.enemy_party_key,
            victory => {
                if (this.before_fade_finish_callback) {
                    this.before_fade_finish_callback(victory);
                }
            },
            victory => {
                --this.data.game_event_manager.events_running_count;
                if (this.finish_callback) {
                    this.finish_callback(victory);
                }
            }
        );
        this.battle.start_battle();
    }

    assign_finish_callback(callback: BattleEvent["finish_callback"]) {
        this.finish_callback = callback;
    }

    assign_before_fade_finish_callback(callback: BattleEvent["before_fade_finish_callback"]) {
        this.before_fade_finish_callback = callback;
    }

    _destroy() {
        this.battle = null;
    }
}
