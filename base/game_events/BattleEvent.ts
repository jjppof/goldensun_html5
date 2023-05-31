import {TeleportEvent} from "../tile_events/TeleportEvent";
import {directions, reverse_directions} from "../utils";
import {Battle} from "../battle/Battle";
import {GameEvent, event_types} from "./GameEvent";

export class BattleEvent extends GameEvent {
    private background_key: string;
    private enemy_party_key: string;
    private battle: Battle;
    private return_to_sanctum: boolean;
    private bgm: string;
    private reset_previous_bgm: boolean;
    private all_enemies_fled_events: GameEvent[];
    private victory_events: GameEvent[];
    private defeat_events: GameEvent[];
    private before_fade_victory_events: GameEvent[];
    private before_fade_defeat_events: GameEvent[];
    private finish_callback: (victory: boolean, all_party_fled: boolean) => void;
    private before_fade_finish_callback: (victory: boolean, all_party_fled: boolean) => void;

    constructor(
        game,
        data,
        active,
        key_name,
        keep_reveal,
        background_key,
        enemy_party_key,
        return_to_sanctum,
        bgm,
        reset_previous_bgm,
        all_enemies_fled_events,
        victory_events,
        defeat_events,
        before_fade_victory_events,
        before_fade_defeat_events
    ) {
        super(game, data, event_types.BATTLE, active, key_name, keep_reveal);
        this.background_key = background_key;
        this.enemy_party_key = enemy_party_key;
        this.return_to_sanctum = return_to_sanctum ?? true;
        this.bgm = bgm;
        this.reset_previous_bgm = reset_previous_bgm ?? true;
        this.all_enemies_fled_events = [];
        if (all_enemies_fled_events !== undefined) {
            all_enemies_fled_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info, this.type, this.origin_npc);
                this.all_enemies_fled_events.push(event);
            });
        }
        this.victory_events = [];
        if (victory_events !== undefined) {
            victory_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info, this.type, this.origin_npc);
                this.victory_events.push(event);
            });
        }
        this.defeat_events = [];
        if (defeat_events !== undefined) {
            defeat_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info, this.type, this.origin_npc);
                this.defeat_events.push(event);
            });
        }
        this.before_fade_victory_events = [];
        if (before_fade_victory_events !== undefined) {
            before_fade_victory_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info, this.type, this.origin_npc);
                this.before_fade_victory_events.push(event);
            });
        }
        this.before_fade_defeat_events = [];
        if (before_fade_defeat_events !== undefined) {
            before_fade_defeat_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info, this.type, this.origin_npc);
                this.before_fade_defeat_events.push(event);
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
            this.bgm,
            this.reset_previous_bgm,
            (victory, all_party_fled) => {
                if (this.before_fade_finish_callback) {
                    this.before_fade_finish_callback(victory, all_party_fled);
                }
                if (victory) {
                    this.before_fade_victory_events.forEach(event => event.fire(this.origin_npc));
                } else {
                    this.before_fade_defeat_events.forEach(event => event.fire(this.origin_npc));
                }
                if (!victory && (this.defeat_events.length || this.before_fade_defeat_events.length)) {
                    return null;
                }
                if (this.return_to_sanctum && !victory && !all_party_fled) {
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
                        undefined,
                        undefined,
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
            (victory, all_party_fled) => {
                --this.data.game_event_manager.events_running_count;
                if (this.finish_callback) {
                    this.finish_callback(victory, all_party_fled);
                }
                if (victory && !all_party_fled) {
                    this.all_enemies_fled_events.forEach(event => event.fire(this.origin_npc));
                } else if (victory) {
                    this.victory_events.forEach(event => event.fire(this.origin_npc));
                } else {
                    this.defeat_events.forEach(event => event.fire(this.origin_npc));
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
        this.victory_events.forEach(event => event?.destroy());
        this.defeat_events.forEach(event => event?.destroy());
        this.before_fade_defeat_events.forEach(event => event?.destroy());
        this.before_fade_victory_events.forEach(event => event?.destroy());
    }
}
