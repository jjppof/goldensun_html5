import {TeleportEvent} from "../tile_events/TeleportEvent";
import {directions, reverse_directions} from "../utils";
import {Battle} from "../battle/Battle";
import {GameEvent, event_types} from "./GameEvent";

export class BattleEvent extends GameEvent {
    private background_key: string;
    private enemy_party_key: string;
    private battle: Battle;
    private return_to_sanctum: boolean;
    private finish_events: GameEvent[];
    private finish_callback: (victory: boolean) => void;
    private before_fade_finish_callback: (victory: boolean) => void;

    constructor(game, data, active, key_name, background_key, enemy_party_key, return_to_sanctum, finish_events) {
        super(game, data, event_types.BATTLE, active, key_name);
        this.background_key = background_key;
        this.enemy_party_key = enemy_party_key;
        this.return_to_sanctum = return_to_sanctum ?? true;
        this.finish_events = [];
        if (finish_events !== undefined) {
            finish_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info);
                this.finish_events.push(event);
            });
        }
    }

    _fire() {
        ++this.data.game_event_manager.events_running_count;
        this.battle = new Battle(
            this.game,
            this.data,
            this.background_key,
            this.enemy_party_key,
            (victory, party_fled) => {
                if (this.before_fade_finish_callback) {
                    this.before_fade_finish_callback(victory);
                }
                if (this.return_to_sanctum && !victory && !party_fled) {
                    const sanctum_data = this.data.info.last_visited_town_with_sanctum;
                    const event = new TeleportEvent(
                        this.game,
                        this.data,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        false,
                        undefined,
                        sanctum_data.map_key,
                        sanctum_data.tile_position.x,
                        sanctum_data.tile_position.y,
                        false,
                        false,
                        false,
                        sanctum_data.collision_layer,
                        reverse_directions[directions.up],
                        false,
                        false,
                        true,
                        false,
                        false,
                        undefined
                    );
                    let promise_resolve;
                    const end_promise = new Promise<void>(resolve => (promise_resolve = resolve));
                    event.set_finish_callback(() => {
                        event.destroy();
                        promise_resolve();
                    });
                    event.fire();
                    return end_promise;
                }
                return null;
            },
            victory => {
                --this.data.game_event_manager.events_running_count;
                if (this.finish_callback) {
                    this.finish_callback(victory);
                }
                this.finish_events.forEach(event => event.fire(this.origin_npc));
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
        this.finish_events.forEach(event => event.destroy());
    }
}
