import { MainChar } from "../MainChar";
import { Window } from "../Window";
import { GoldenSun } from "../GoldenSun";
import { BattleStatusEffect } from "../windows/battle/BattleStatusWindow";
import * as _ from "lodash";
import { StatusComponent } from "./StatusComponent";
import { StatusStatistics } from "./StatusStatistics";

export enum ComponentStates {
    STATISTICS,
    PSYNERGY,
    DJINN,
    ITEMS
}

export class StatusStateManager{
    private game:Phaser.Game;
    private data:GoldenSun;
    private window:Window;

    public current_state:ComponentStates;
    private current_component:StatusComponent;
    private update_callback:Function;

    private selected_char:MainChar;
    private battle_effects:BattleStatusEffect[];

    public constructor(game:Phaser.Game, data:GoldenSun, window:Window){
        this.game = game;
        this.data = data;
        this.window = window;

        this.current_state = null;
        this.current_component = null;
        this.update_callback = null;

        this.selected_char = null;
        this.battle_effects = [];
    }

    public get selected_character(){
        return this.selected_char;
    }

    public get battle_effects_array(){
        return this.battle_effects;
    }

    public get controls(){
        return {left: this.current_component.on_left.bind(this.current_component), right: this.current_component.on_right.bind(this.current_component),
            up: this.current_component.on_up.bind(this.current_component), down: this.current_component.on_down.bind(this.current_component)}
    }

    public trigger_state_change(){
        /*
        this.unset_state();
        this.current_state++;
        this.setup_state();
        */
    }

    public char_change(char:MainChar, battle_effects:BattleStatusEffect[]){
        this.selected_char = char;
        this.battle_effects = battle_effects;
        this.change_state(this.current_state);
    }

    private change_state(new_state:ComponentStates){
        let pos = {line: 0, col: 0};
        
        if(this.current_component){
            pos = this.current_component.current_pos;
            this.current_component.destroy();
            this.current_component = null;
        }

        this.current_state = new_state;

        switch(this.current_state){
            case ComponentStates.STATISTICS:
                this.current_component = new StatusStatistics(this.game, this.data, this.window, this, pos);
                break;
            case ComponentStates.PSYNERGY:
                break;
            case ComponentStates.DJINN:
                break;
            case ComponentStates.ITEMS:
                break;
        }

        if(this.current_component) this.current_component.on_change();
    }

    public update_description(line1:string, line2?:string){
        this.update_callback(line1, line2);
    }

    public inititalize(char:MainChar, update_callback:Function, battle_effects:BattleStatusEffect[]){
        this.update_callback = update_callback;
        this.selected_char = char;
        this.battle_effects = battle_effects;
        this.change_state(ComponentStates.STATISTICS);
    }

    public clear(){
        this.current_component.destroy();
        this.current_state = null;
        this.current_component = null;
    }
}