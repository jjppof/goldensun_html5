import { FieldPsynergyWindow } from './windows/FieldPsynergyWindow.js';
import { MoveFieldPsynergy } from '../field_abilities/move.js';
import { FrostFieldPsynergy } from '../field_abilities/frost.js';
import { GrowthFieldPsynergy } from '../field_abilities/growth.js';

/*Defines and manages the usage of field psynergy

Input: game [Phaser:Game] - Reference to the running game object
       data [GoldenSun] - Reference to the main JS Class instance*/
export class FieldAbilities{
    constructor(game, data) {
    this.game = game;
    this.data = data;

    this.field_psynergy_window = new FieldPsynergyWindow(this.game, this.data);
    this.field_abilities_list = [];
    this.set_field_abilities();
    }

    /*Sets up the complete field ability list*/
    set_field_abilities(){
        this.field_abilities_list.push({key: "move", object: new MoveFieldPsynergy(this.game, this.data)});
        this.field_abilities_list.push({key: "frost", object: new FrostFieldPsynergy(this.game, this.data)});
        this.field_abilities_list.push({key: "growth", object: new GrowthFieldPsynergy(this.game, this.data)});

        this.field_abilities_list = _.mapKeys(this.field_abilities_list, field_ability_data => field_ability_data.key);
    }

    /*Returns the field abilities according to the list
    
    Input: abilitiy_list [array] = List of abilities to return (array of string)
    Output: [array] = Array of abilities*/
    get_abilities(ability_list=undefined){
        let abilities = [];
        if(ability_list === undefined){
            return this.field_abilities_list;
        }
        else{
            for(let i=0; i<ability_list.length; i++){
                if(this.field_abilities_list[ability_list[i]]) abilities.push(this.field_abilities_list[ability_list[i]]);
            }
        }
        abilities = _.mapKeys(abilities, data => data.key);
        return abilities;
    }
}