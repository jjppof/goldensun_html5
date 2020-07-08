import { party_data } from "../../initializers/main_chars.js";
import { BattleStage } from "./BattleStage.js";
import { enemies_list } from "../../initializers/enemies.js";
import { BattleLog } from "./BattleLog.js";
import { BattleMenuScreen } from "../../screens/battle_menus.js";

const MAX_CHAR_AT_BATTLE = 4;

/* ACTIONS:
- Attack
- Psynergy
- Djinni Use
- Djinni Recovery
- Item
- Enemy Action
- Defend
- Total Defense (yes, this is defined differently from Defend for some reason)
- Counterattack
- Daedalus
- Retreat
*/

const battle_phases = {
    NONE: 0, // (not in a battle)
    START: 1, // Start (camera pan, shows enemies, move to menu)
    MENU: 2, // (includes submenus, this phase doesn't end until the player has entered their final command)
    ROUND_START: 3, // Start (turn order is determined, enemies may commit to certain actions)
    COMBAT: 4, // (all actions are queued and take place here, you could further break up combat actions into subactions, which should be governed by a separate sub-state variable)
    ROUND_END: 5, // End (djinn recovery, status/buff/debuff timers decrement)
    END: 6 // End (the last enemy has fallen, exp/gold/drops are awarded)
};

export class Battle {
    constructor(game, data, background_key, enemy_party_key) {
        this.game = game;
        this.data = data;
        this.allies_info = party_data.members.slice(0, MAX_CHAR_AT_BATTLE).map(char => {
            return {
                sprite_key: char.key_name + "_battle",
                scale: char.battle_scale
            };
        });
        this.enemies_party_data = this.data.enemies_parties_db[enemy_party_key];
        this.enemies_info = [];
        this.enemies_party_data.members.forEach(member_info => {
            const qtd = _.random(member_info.min, member_info.max);
            for (let i = 0; i < qtd; ++i) {
                this.enemies_info.push({
                    sprite_key: member_info.key + "_battle",
                    scale: enemies_list[member_info.key].battle_scale
                });
            }
        });
        this.enter_propagation_priority = 0;
        this.battle_stage = new BattleStage(this.game, this.data, background_key, this.allies_info, this.enemies_info);
        this.battle_log = new BattleLog(this.game);
        this.battle_menu = new BattleMenuScreen(this.game, this.data, this.enter_propagation_priority, this.on_abilities_choose.bind(this), this.choose_targets.bind(this));
        this.battle_phase = battle_phases.NONE;
        this.controls_enabled = false;
        ++this.enter_propagation_priority;
        this.set_controls();
    }

    set_controls() {
        this.data.enter_input.add(() => {
            if (!this.data.in_battle || !this.controls_enabled) return;
            this.data.enter_input.halt();
            this.controls_enabled = false;
            switch (this.battle_phase) {
                case battle_phases.START:
                    this.battle_log.clear();
                    this.battle_phase = battle_phases.MENU;
                    this.check_phases();
                    break;
            }
        }, this, this.enter_propagation_priority);
    }

    start_battle() {
        this.check_phases();
    }

    on_abilities_choose(abilities) {
        //...
        this.battle_phase = battle_phases.ROUND_START;
        this.check_phases();
    }

    choose_targets(ability_key, callback) {

    }

    check_phases() {
        switch (this.battle_phase) {
            case battle_phases.NONE:
                this.battle_phase_none();
                break;
            case battle_phases.START:
            case battle_phases.MENU:
                this.battle_phase_menu();
                break;
            case battle_phases.ROUND_START:
                this.battle_phase_round_start();
                break;
        }
    }

    battle_phase_none() {
        this.battle_phase = battle_phases.START;
        this.data.in_battle = true;
        this.data.battle_instance = this;
        this.battle_log.add(this.enemies_party_data.name + " appeared!");
        this.battle_stage.initialize_stage(() => {
            this.controls_enabled = true;
        });
    }

    battle_phase_menu() {
        this.battle_stage.set_choosing_action_position();
        this.battle_menu.open_menu();
    }

    battle_phase_round_start() {

    }

    update() {
        this.battle_stage.update_stage()
    }
}
