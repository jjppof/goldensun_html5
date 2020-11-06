import { MainChar } from "../MainChar";
import { Window } from "../Window";
import * as utils from "../utils";
import { GoldenSun } from "../GoldenSun";
import { BattleEffectTypes, BattleStatusEffect } from "../windows/battle/BattleStatusWindow";
import * as _ from "lodash";
import { temporary_status } from "../Player";
import { BitmapText } from "phaser-ce";

export enum ComponentStates {
    STATISTICS,
    PSYNERGY,
    DJINN,
    ITEMS
}

export enum Statistics {
    NAME,
    EXP,
    HP,
    PP,
    CLASS,
    DJINN,
    ELEM_LEVELS,
    ELEM_POWER,
    ELEM_RESIST
}

export class StatusMultiComponent{
    private static readonly BattleStatusMsgs={
        DELUSION: {line1: "Delusions misdirect your attacks.", line2: "Cure with Elixer or Restore."},
        STUN: {line1: "You are stunned and cannot act.", line2: "Cure with Elixer or Restore."},
        SLEEP: {line1: "Sleep prevents you from acting.", line2: "Wake with Elixer or Restore."},
        SEAL: {line1: "Your Psynergy is sealed.", line2: "Cure with Elixer or Restore."},
        DEATH_CURSE: {line1: "You will be downed in ${N} turns.", line2: "Cure wth Elixer or Restore."},
        DOWNED: {line1: "You are down. Heal at a Sanctum", line2: "or use Revive or Water of Life."},
        POISON: {line1: "A mild poison wracks your body.", line2: "Cure with Antidote or Cure Poison."},
        VENOM: {line1: "A vile poison wracks your body.", line2: "Cure with Antidote or Cure Poison."},
        EQUIP_CURSE: {line1: "A cursed item binds your actions.", line2: "Remove the item at a Sanctum."},
        HAUNT: {line1: "An evil spirit wounds you.", line2: "Exorcise it at a Sanctum."}
    };

    private static readonly BattleBuffMsgs={
        ATK_UP: {line1: "Attack increased by ${VALUE}.", line2: ""},
        DEF_UP: {line1: "Defense increased by ${VALUE}.", line2: ""},
        RES_UP: {line1: "Resistance increased by ${VALUE}.", line2: ""},
        AGI_UP: {line1: "Agility increased by ${VALUE}.", line2: ""},
        ATK_DOWN: {line1: "Attack dropped by ${VALUE}.", line2: "Increase with spells like Impact."},
        DEF_DOWN: {line1: "Defense dropped by ${VALUE}.", line2: "Increase with spells like Guard."},
        RES_DOWN: {line1: "Resistance dropped by ${VALUE}.", line2: "Increase with spells like Ward."},
        AGI_DOWN: {line1: "Agility dropped by ${VALUE}.", line2: ""}
    }

    private static readonly MenuStatusMsgs={
        DOWNED: {line1: "You are down. Revive at a Sanctum", line2: "or with the Water of Life."},
        POISON: {line1: "You're afflicted by poison.", line2: "Cure with Antidote or Cure Poison."},
        VENOM: {line1: "You're afflicted by venom.", line2: "Cure with Antidote or Cure Poison."},
        EQUIP_CURSE: {line1: "A cursed item immoblizes you.", line2: "Remove it at a Sanctum."},
        HAUNT: {line1: "You receve damage from spirits.", line2: "Exorcise the spirits at a Sanctum."}
    };

    private static readonly StatisticsMsgs={
        0: {line1: "Use the L & R Buttons to", line2: "switch between characters."},
        1: {line1: "Current experience points.", line2: "${EXP} to next level."},
        2: {line1: "Your current and maximum HP.", line2: "Affected by Djinn and equipment."},
        3: {line1: "Your current and maximum PP.", line2: "Affected by Djinn and equipment."},
        4: {line1: "Your current class. Your", line2: "class changes when you set Djinn."},
        5: {line1: "The number of Djinn currently set", line2: "and your total number of Djinn."},
        6: {line1: "Your Elemental Levels. These", line2: "reflect your skill in each element."},
        7: {line1: "Power reflects the damage you", line2: "can do with each element."},
        8: {line1: "Resist reflects your defensive", line2: "strength against each element."}
    };

    private static readonly STATISTICS = {
        LINES: 9,
        STARS_X: 65,
        STARS_Y: 73,
        STARS_SHIFT: 32,
        LABEL_X: 8,
        LABEL_Y: 80,
        LABEL_SHIFT: 8,
        NUMBERS_END_X: 69,
        NUMBERS_Y: 80,
        NUMBERS_X_SHIFT: 32,
        NUMBERS_Y_SHIFT: 8 
    }

    private static readonly GROUP_KEY = "status_component";

    private data:GoldenSun;
    private window:Window;

    private current_line:number;
    private current_col:number;

    private update_callback:Function;
    public current_state:ComponentStates;
    private state_sprites:(Phaser.Sprite|BitmapText)[];

    private selected_char:MainChar;
    private battle_effects:BattleStatusEffect[];

    public constructor(data:GoldenSun, window:Window){
        this.data = data;
        this.window = window;

        this.current_line = 0;
        this.current_col = 0;

        this.window.define_internal_group(StatusMultiComponent.GROUP_KEY, {x:0, y:0});

        this.update_callback = null;
        this.current_state = null;
        this.state_sprites = [];

        this.selected_char = null;
        this.battle_effects = [];
    }

    private on_change(){
        switch(this.current_state){
            case ComponentStates.STATISTICS:
                if(this.current_col===0){
                    let msgs = {line1: StatusMultiComponent.StatisticsMsgs[this.current_line].line1,
                        line2: StatusMultiComponent.StatisticsMsgs[this.current_line].line2};

                    if(this.current_line === Statistics.EXP){
                        let exp = this.selected_char.exp_curve[this.selected_char.level] - this.selected_char.current_exp;
                        msgs.line2 = msgs.line2.replace("${EXP}", exp);
                    }

                    this.update_callback(msgs.line1, msgs.line2, {index: this.current_line, vertical: true});
                }
                else{
                    let effect = this.battle_effects[this.current_col-1];

                    let msgs = null;
                    if(effect.type === BattleEffectTypes.STATUS_CONDITION){
                        let name = (effect.key as string).toUpperCase();
                        msgs = {line1: StatusMultiComponent.BattleStatusMsgs[name].line1,
                            line2: StatusMultiComponent.BattleStatusMsgs[name].line2};

                        if(effect.key === temporary_status.DEATH_CURSE){
                            let turns = (effect.properties.turns ? effect.properties.turns : 0);
                            msgs.line1 = msgs.line1.replace("${N}", turns);
                        }
                    }
                    else if(effect.type === BattleEffectTypes.BUFF_DEBUFF){
                        let name = (effect.key as string).toUpperCase();
                        msgs = {line1: StatusMultiComponent.BattleBuffMsgs[name].line1,
                            line2: StatusMultiComponent.BattleBuffMsgs[name].line2};

                        let value = (effect.properties.value ? effect.properties.value : 0);
                        msgs.line1 = msgs.line1.replace("${VALUE}", value);
                    }
                    this.update_callback(msgs.line1, msgs.line2, {index: this.current_col, vertical: false});
                }
                break;
            case ComponentStates.PSYNERGY:
                break;
            case ComponentStates.DJINN:
                break;
            case ComponentStates.ITEMS:
                break;      
        }
    }

    public trigger_state_change(){
        /*
        this.unset_state();
        this.current_state++;
        this.setup_state();
        */
    }

    public on_up(){
        switch(this.current_state){
            case ComponentStates.STATISTICS:
                if(this.current_col !== 0){
                    this.current_col = 0;
                    this.on_change();
                }
                else{
                    this.current_line = (this.current_line+StatusMultiComponent.STATISTICS.LINES-1)%StatusMultiComponent.STATISTICS.LINES;
                    this.on_change();
                }
                break;
            case ComponentStates.PSYNERGY:
                break;
            case ComponentStates.DJINN:
                break;
            case ComponentStates.ITEMS:
                break;      
        }
    }

    public on_down(){
        switch(this.current_state){
            case ComponentStates.STATISTICS:
                if(this.current_col !== 0){
                    this.current_col = 0;
                    this.on_change();
                }
                else{
                    this.current_line = (this.current_line+1)%StatusMultiComponent.STATISTICS.LINES;
                    this.on_change();
                }
                break;
            case ComponentStates.PSYNERGY:
                break;
            case ComponentStates.DJINN:
                break;
            case ComponentStates.ITEMS:
                break;      
        }
    }

    public on_left(){
        switch(this.current_state){
            case ComponentStates.STATISTICS:
                let effects_count = this.battle_effects.length;
                if(effects_count === 0) return;

                this.current_col = (this.current_col+(effects_count+1)-1)%(effects_count+1);
                this.on_change();
                break;
            case ComponentStates.PSYNERGY:
                break;
            case ComponentStates.DJINN:
                break;
            case ComponentStates.ITEMS:
                break;      
        }
    }

    public on_right(){
        switch(this.current_state){
            case ComponentStates.STATISTICS:
                let effects_count = this.battle_effects.length;
                if(effects_count === 0) return;

                this.current_col = (this.current_col+1)%(effects_count+1);
                this.on_change();
                break;
            case ComponentStates.PSYNERGY:
                break;
            case ComponentStates.DJINN:
                break;
            case ComponentStates.ITEMS:
                break;      
        }
    }

    private setup_state(){
        switch(this.current_state){
            case ComponentStates.STATISTICS:
                let stars = ["venus_star", "mercury_star", "mars_star", "jupiter_star"];
                for(let index in stars){
                    let x_pos = StatusMultiComponent.STATISTICS.STARS_X + parseInt(index)*StatusMultiComponent.STATISTICS.STARS_SHIFT;  
                    let y_pos = StatusMultiComponent.STATISTICS.STARS_Y;

                    let star = this.window.create_at_group(x_pos, y_pos, stars[index], undefined, undefined, StatusMultiComponent.GROUP_KEY);
                    this.state_sprites.push(star);
                };

                let labels = ["Djinn", "Lv", "Power", "Resist"];

                for(let index in labels){
                    let x_pos = StatusMultiComponent.STATISTICS.LABEL_X;
                    let y_pos = StatusMultiComponent.STATISTICS.LABEL_Y + parseInt(index)*StatusMultiComponent.STATISTICS.LABEL_SHIFT;

                    let label = this.window.set_text_in_position(labels[index], x_pos, y_pos, false, false, undefined, false, StatusMultiComponent.GROUP_KEY);
                    this.state_sprites.push(label.text, label.shadow);
                }

                for(let index in utils.ordered_elements){
                    let djinn_counts = this.get_djinn_counts(utils.ordered_elements[index]);
                    let elemental_stats = this.get_elemental_stats(utils.ordered_elements[index]);

                    let x_pos = StatusMultiComponent.STATISTICS.NUMBERS_END_X + parseInt(index)*StatusMultiComponent.STATISTICS.NUMBERS_X_SHIFT;
                    let y_pos = StatusMultiComponent.STATISTICS.NUMBERS_Y;
                    let text = djinn_counts.set + "/" + djinn_counts.total;

                    let numbers = this.window.set_text_in_position(text, x_pos, y_pos, true, false, undefined, false, StatusMultiComponent.GROUP_KEY);
                    this.state_sprites.push(numbers.text, numbers.shadow);

                    y_pos += StatusMultiComponent.STATISTICS.NUMBERS_Y_SHIFT;
                    text = String(elemental_stats.level);

                    numbers = this.window.set_text_in_position(text, x_pos, y_pos, true, false, undefined, false, StatusMultiComponent.GROUP_KEY);
                    this.state_sprites.push(numbers.text, numbers.shadow);

                    y_pos += StatusMultiComponent.STATISTICS.NUMBERS_Y_SHIFT;
                    text = String(elemental_stats.power);

                    numbers = this.window.set_text_in_position(text, x_pos, y_pos, true, false, undefined, false, StatusMultiComponent.GROUP_KEY);
                    this.state_sprites.push(numbers.text, numbers.shadow);

                    y_pos += StatusMultiComponent.STATISTICS.NUMBERS_Y_SHIFT;
                    text = String(elemental_stats.resistance);

                    numbers = this.window.set_text_in_position(text, x_pos, y_pos, true, false, undefined, false, StatusMultiComponent.GROUP_KEY);
                    this.state_sprites.push(numbers.text, numbers.shadow);
                }
                break;
            case ComponentStates.PSYNERGY:
                break;
            case ComponentStates.DJINN:
                break;
            case ComponentStates.ITEMS:
                break;      
        }
    }

    private unset_state(){
        for(let index in this.state_sprites){
            this.state_sprites[index].destroy();
        }
        this.state_sprites = [];
        /*
        switch(this.current_state){
            case ComponentStates.STATISTICS:
                break;
            case ComponentStates.PSYNERGY:
                break;
            case ComponentStates.DJINN:
                break;
            case ComponentStates.ITEMS:
                break;      
        }
        */
    }

    private get_djinn_counts(element:string){
        let set_count = 0;
        let total_count = 0;
        let djinn_names = [];

        switch(element){
            case utils.elements.VENUS:
                djinn_names = this.selected_char.venus_djinni;
                total_count = this.selected_char.venus_djinni.length;
                break;
            case utils.elements.MERCURY:
                djinn_names = this.selected_char.mercury_djinni;
                total_count = this.selected_char.mercury_djinni.length;
                break;
            case utils.elements.MARS:
                djinn_names = this.selected_char.mars_djinni;
                total_count = this.selected_char.mars_djinni.length;
                break;
            case utils.elements.JUPITER:
                djinn_names = this.selected_char.jupiter_djinni;
                total_count = this.selected_char.jupiter_djinni.length;
                break;
        };

        for(let index in djinn_names){
            if(this.data.info.djinni_list[djinn_names[index]].status === "set")
                set_count++;
        }

        return {set: set_count, total: total_count};
    }

    private get_elemental_stats(element:string){
        let elemental_level = 0;
        let elemental_power = 0;
        let elemental_resistance = 0;

        switch(element){
            case utils.elements.VENUS:
                elemental_level = this.selected_char.venus_level_current;
                elemental_power = this.selected_char.venus_power_current;
                elemental_resistance = this.selected_char.venus_resist_current;
                break;
            case utils.elements.MERCURY:
                elemental_level = this.selected_char.mercury_level_current;
                elemental_power = this.selected_char.mercury_power_current;
                elemental_resistance = this.selected_char.mercury_resist_current;
                break;
            case utils.elements.MARS:
                elemental_level = this.selected_char.mars_level_current;
                elemental_power = this.selected_char.mars_power_current;
                elemental_resistance = this.selected_char.mars_resist_current;
                break;
            case utils.elements.JUPITER:
                elemental_level = this.selected_char.jupiter_level_current;
                elemental_power = this.selected_char.jupiter_power_current;
                elemental_resistance = this.selected_char.jupiter_resist_current;
                break;
        }

        return {level: elemental_level, power: elemental_power, resistance: elemental_resistance};
    }

    public char_change(char:MainChar, battle_effects:BattleStatusEffect[]){
        this.selected_char = char;
        this.battle_effects = battle_effects;
        this.change_state(ComponentStates.STATISTICS);
    }

    private change_state(new_state:ComponentStates){
        this.unset_state();
        this.current_state = new_state;
        this.current_col = 0;
        this.current_line = 0;

        this.setup_state();
        this.on_change();
    }

    public inititalize(char:MainChar, update_callback:Function, battle_effects:BattleStatusEffect[]){
        if(update_callback) this.update_callback = update_callback;
        this.selected_char = char;
        this.battle_effects = battle_effects;
        this.change_state(ComponentStates.STATISTICS);
    }

    public clear(){
        this.unset_state();
        this.current_state = null;
        this.current_col = 0;
        this.current_line = 0;
    }
}