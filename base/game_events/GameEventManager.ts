import { base_actions, directions, is_close, reverse_directions } from "../utils.js";
import { DialogManager } from "../DialogManager.js";
import { npc_types } from "../NPC.js";
import { GoldenSun } from "../GoldenSun";

export const interaction_patterns = {
    TIK_TAK_TOE: "tik_tak_toe",
    CROSS: "cross"
};

export class GameEventManager {
    public game: Phaser.Game;
    public data: GoldenSun;
    public on_event: boolean;
    public control_enable: boolean;
    public fire_next_step: Function;

    constructor(game, data) {
        this.game = game;
        this.data = data;
        this.on_event = false;
        this.control_enable = true;
        this.fire_next_step = () => {};
        this.set_controls();
    }

    set_controls() {
        this.data.enter_input.add(() => {
            if (this.data.hero.in_action() || this.data.in_battle || !this.control_enable) return;
            if (this.on_event) {
                this.control_enable = false;
                this.fire_next_step();
            } else {
                this.search_for_npc();
            }
        });
    }

    search_for_npc() {
        for (let i = 0; i < this.data.map.npcs.length; ++i) {
            const npc = this.data.map.npcs[i];
            const is_close_check = is_close(
                this.data.hero.current_direction,
                this.data.hero.sprite.x,
                this.data.hero.sprite.y,
                npc.sprite.x,
                npc.sprite.y,
                npc.talk_range_factor
            );
            if (is_close_check) {
                this.data.hero.stop_char()
                this.on_event = true;
                this.control_enable = false;
                this.set_npc_event(npc);
                break;
            }
        }
    }

    set_npc_event(npc) {
        if (npc.npc_type === npc_types.NORMAL) {
            if (npc.message) {
                const dialog_manager = new DialogManager(this.game, this.data);
                dialog_manager.set_dialog(npc.message, npc.avatar, this.data.hero.current_direction);
                const npc_x = npc.sprite.x;
                const npc_y = npc.sprite.y;
                const interaction_pattern = this.data.dbs.npc_db[npc.key_name].interaction_pattern;
                const interaction_directions = GameEventManager.get_interaction_directions(
                    this.data.hero.sprite.x, this.data.hero.sprite.y, npc_x, npc_y, interaction_pattern, npc.body_radius);
                this.data.hero.set_direction(interaction_directions.hero_direction);
                this.data.hero.play(base_actions.IDLE, reverse_directions[interaction_directions.hero_direction]);
                npc.play(base_actions.IDLE, reverse_directions[interaction_directions.target_direction]);
                this.fire_next_step = dialog_manager.next.bind(dialog_manager, () => {
                    if (dialog_manager.finished) {
                        this.on_event = false;
                        const initial_action = this.data.dbs.npc_db[npc.key_name].initial_action;
                        const initial_direction = this.data.dbs.npc_db[npc.key_name].actions[initial_action].initial_direction;
                        npc.play(initial_action, initial_direction);
                        this.fire_npc_events(npc);
                    }
                    this.control_enable = true;
                });
                this.fire_next_step();
            } else {
                this.fire_npc_events(npc);
            }
        }
    }

    fire_npc_events(npc) {
        npc.events.forEach(event => {
            event.fire();
        });
    }

    static get_interaction_directions(hero_x, hero_y, target_x, target_y, interaction_pattern, target_body_radius) {
        let target_direction;
        if (interaction_pattern === interaction_patterns.CROSS) {
            let positive_limit = hero_x + (-target_y - target_x);
            let negative_limit = -hero_x + (-target_y + target_x);
            if (-hero_y >= positive_limit && -hero_y >= negative_limit) {
                target_direction = directions.up;
            } else if (-hero_y <= positive_limit && -hero_y >= negative_limit) {
                target_direction = directions.right;
            } else if (-hero_y <= positive_limit && -hero_y <= negative_limit) {
                target_direction = directions.down;
            } else if (-hero_y >= positive_limit && -hero_y <= negative_limit) {
                target_direction = directions.left;
            }
        }

        let hero_direction;
        if (hero_x <= target_x - target_body_radius && hero_y >= target_y + target_body_radius) {
            hero_direction = directions.up_right;
            target_direction = interaction_pattern === interaction_patterns.TIK_TAK_TOE ? directions.down_left : target_direction;
        } else if (hero_x <= target_x - target_body_radius && hero_y >= target_y - target_body_radius && hero_y <= target_y + target_body_radius) {
            hero_direction = directions.right;
            target_direction = interaction_pattern === interaction_patterns.TIK_TAK_TOE ? directions.left : target_direction;
        } else if (hero_x <= target_x - target_body_radius && hero_y <= target_y - target_body_radius) {
            hero_direction = directions.down_right;
            target_direction = interaction_pattern === interaction_patterns.TIK_TAK_TOE ? directions.up_left : target_direction;
        } else if (hero_x >= target_x - target_body_radius && hero_x <= target_x + target_body_radius && hero_y <= target_y - target_body_radius) {
            hero_direction = directions.down;
            target_direction = interaction_pattern === interaction_patterns.TIK_TAK_TOE ? directions.up : target_direction;
        } else if (hero_x >= target_x + target_body_radius && hero_y <= target_y - target_body_radius) {
            hero_direction = directions.down_left;
            target_direction = interaction_pattern === interaction_patterns.TIK_TAK_TOE ? directions.up_right : target_direction;
        } else if (hero_x >= target_x + target_body_radius && hero_y >= target_y - target_body_radius && hero_y <= target_y + target_body_radius) {
            hero_direction = directions.left;
            target_direction = interaction_pattern === interaction_patterns.TIK_TAK_TOE ? directions.right : target_direction;
        } else if (hero_x >= target_x + target_body_radius && hero_y >= target_y + target_body_radius) {
            hero_direction = directions.up_left;
            target_direction = interaction_pattern === interaction_patterns.TIK_TAK_TOE ? directions.down_right : target_direction;
        } else if (hero_x >= target_x - target_body_radius && hero_x <= target_x + target_body_radius && hero_y >= target_y + target_body_radius) {
            hero_direction = directions.up;
            target_direction = interaction_pattern === interaction_patterns.TIK_TAK_TOE ? directions.down : target_direction;
        }

        return {hero_direction: hero_direction, target_direction: target_direction};
    }
}