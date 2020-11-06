import { MAX_CHARS_IN_BATTLE } from "../../battle/Battle";
import { GoldenSun } from "../../GoldenSun";
import { MainChar } from "../../MainChar";
import { ComponentStates, StatusMultiComponent } from "../../support_menus/StatusMultiComponent";
import { TextObj, Window } from "../../Window";
import { ordered_status_battle, ordered_status_menu } from "../../utils";
import * as _ from "lodash";
import { temporary_status } from "../../Player";

export type BattleStatusEffect = {
    key:string,
    type:BattleEffectTypes,
    properties?:{
        turns?:number,
        value?:number
    }
}

export enum BattleEffectTypes{
    STATUS_CONDITION,
    BUFF_DEBUFF
}

export class BattleStatusWindow{
    private static readonly WINDOW = {
        WIDTH: 236,
        HEIGHT: 156
    };
    private static readonly SEPARATOR = {
        X: 4,
        Y: 115,
        WIDTH: 232,
        SHIFT: 16
    };
    private static readonly BATTLESPRITE = {
        CENTER_X: 204,
        END_Y: 120,
        SHADOW_Y: 114
    }
    private static readonly DESCRIPTION = {
        X: 8,
        LINE1_Y: 124,
        LINE2_Y: 140
    }
    private static readonly NAME = {
        X: 8,
        Y: 8
    }
    private static readonly CLASS_NAME = {
        X: 8,
        Y: 56
    }
    private static readonly EXP = {
        LABEL_X: 8,
        LABEL_Y: 16,
        VALUE_END_X: 109,
        VALUE_Y: 16
    }
    private static readonly LEVEL = {
        LABEL_X: 64,
        LABEL_Y: 8,
        VALUE_END_X: 93,
        VALUE_Y: 8
    }
    private static readonly AVATAR = {
        X: 8,
        Y: 24
    }
    private static readonly NORMAL_STATUS = {
        X: 120,
        Y: 8
    }
    private static readonly IN_THE_BACK = {
        X: 48,
        Y: 24
    }
    private static readonly STATS = {
        LABEL_X: 144,
        LABEL_Y: 24,
        VALUE_END_X: 213,
        VALUE_Y: 24,
        LINE_SHIFT: 8
    }
    private static readonly HP = {
        LABEL_X: 48,
        LABEL_Y: 32,
        MAX_END_X: 133,
        MAX_Y: 32,
        CURR_END_X: 100,
        CURR_Y: 32
    }
    private static readonly PP = {
        LABEL_X: 48,
        LABEL_Y: 40,
        MAX_END_X: 133,
        MAX_Y: 40,
        CURR_END_X: 100,
        CURR_Y: 40
    }
    private static readonly COMPONENT = {
        X: 8,
        Y: 64,
        WIDTH: 168,
        HEIGHT: 66
    }
    private static readonly EFFECTS = {
        X: 112,
        Y: 8,
        SHIFT: 16,
    }

    private static readonly GROUP_KEY = "status_win";

    private game:Phaser.Game;
    private data:GoldenSun;
    private close_callback:Function;

    private desc_shifted:boolean;
    private selected_char:MainChar;

    private battle_effects:BattleStatusEffect[];
    private effect_sprites:Phaser.Sprite[];

    private window:Window;
    private component:StatusMultiComponent;

    private battle_sprite:Phaser.Sprite;
    private avatar:Phaser.Sprite;

    private name:TextObj;
    private level_label:TextObj;
    private level_value:TextObj;

    private exp_label:TextObj;
    private exp_value:TextObj;
    private normal_status:TextObj;

    private hp_label:TextObj;
    private max_hp:TextObj;
    private curr_hp:TextObj;

    private pp_label:TextObj;
    private max_pp:TextObj;
    private curr_pp:TextObj;

    private atk_label:TextObj;
    private atk_value:TextObj;
    private def_label:TextObj;
    private def_value:TextObj;
    private agi_label:TextObj;
    private agi_value:TextObj;
    private luk_label:TextObj;
    private luk_value:TextObj;

    private class_name:TextObj;
    private in_the_back:TextObj;

    private desc_line1:TextObj;
    private desc_line2:TextObj;

    public constructor(game:Phaser.Game, data:GoldenSun){
        this.game = game;
        this.data = data;
        this.close_callback = null;

        this.desc_shifted = null;
        this.selected_char = null;

        this.battle_effects = [];
        this.effect_sprites = [];

        this.window = new Window(this.game, 0, 0, BattleStatusWindow.WINDOW.WIDTH, BattleStatusWindow.WINDOW.HEIGHT);
        this.component = new StatusMultiComponent(this.data, this.window);

        this.window.define_internal_group(BattleStatusWindow.GROUP_KEY, {x:0, y:0});
        this.battle_sprite = null;
        this.avatar = null;

        this.init_text();
    }

    private init_text(){
        this.name = this.window.set_text_in_position("", BattleStatusWindow.NAME.X, BattleStatusWindow.NAME.Y,
            false, false, undefined, false, BattleStatusWindow.GROUP_KEY);
        this.level_label = this.window.set_text_in_position("Lv", BattleStatusWindow.LEVEL.LABEL_X, BattleStatusWindow.LEVEL.LABEL_Y,
            false, false, undefined, false, BattleStatusWindow.GROUP_KEY);
        this.level_value = this.window.set_text_in_position("", BattleStatusWindow.LEVEL.VALUE_END_X, BattleStatusWindow.LEVEL.VALUE_Y,
            true, false, undefined, false, BattleStatusWindow.GROUP_KEY);

        this.exp_label = this.window.set_text_in_position("Exp", BattleStatusWindow.EXP.LABEL_X, BattleStatusWindow.EXP.LABEL_Y,
            false, false, undefined, false, BattleStatusWindow.GROUP_KEY);
        this.exp_value = this.window.set_text_in_position("", BattleStatusWindow.EXP.VALUE_END_X, BattleStatusWindow.EXP.VALUE_Y,
            true, false, undefined, false, BattleStatusWindow.GROUP_KEY);
        this.normal_status = this.window.set_text_in_position("", BattleStatusWindow.NORMAL_STATUS.X, BattleStatusWindow.NORMAL_STATUS.Y,
            false, false, undefined, false, BattleStatusWindow.GROUP_KEY);

        this.hp_label = this.window.set_text_in_position("HP", BattleStatusWindow.HP.LABEL_X, BattleStatusWindow.HP.LABEL_Y,
            false, false, undefined, false, BattleStatusWindow.GROUP_KEY);
        this.max_hp = this.window.set_text_in_position("", BattleStatusWindow.HP.MAX_END_X, BattleStatusWindow.HP.MAX_Y,
            true, false, undefined, false, BattleStatusWindow.GROUP_KEY);
        this.curr_hp = this.window.set_text_in_position("/", BattleStatusWindow.HP.CURR_END_X, BattleStatusWindow.HP.CURR_Y,
        true, false, undefined, false, BattleStatusWindow.GROUP_KEY);

        this.pp_label = this.window.set_text_in_position("PP", BattleStatusWindow.PP.LABEL_X, BattleStatusWindow.PP.LABEL_Y,
            false, false, undefined, false, BattleStatusWindow.GROUP_KEY);
        this.max_pp = this.window.set_text_in_position("", BattleStatusWindow.PP.MAX_END_X, BattleStatusWindow.PP.MAX_Y,
            true, false, undefined, false, BattleStatusWindow.GROUP_KEY);
        this.curr_pp = this.window.set_text_in_position("/", BattleStatusWindow.PP.CURR_END_X, BattleStatusWindow.PP.CURR_Y,
        true, false, undefined, false, BattleStatusWindow.GROUP_KEY);

        let shift = BattleStatusWindow.STATS.LINE_SHIFT;

        this.atk_label = this.window.set_text_in_position("Attack", BattleStatusWindow.STATS.LABEL_X, BattleStatusWindow.STATS.LABEL_Y,
            false, false, undefined, false, BattleStatusWindow.GROUP_KEY);
        this.atk_value = this.window.set_text_in_position("", BattleStatusWindow.STATS.VALUE_END_X, BattleStatusWindow.STATS.VALUE_Y,
            true, false, undefined, false, BattleStatusWindow.GROUP_KEY);
        this.def_label = this.window.set_text_in_position("Defense", BattleStatusWindow.STATS.LABEL_X, BattleStatusWindow.STATS.LABEL_Y+shift,
            false, false, undefined, false, BattleStatusWindow.GROUP_KEY);
        this.def_value = this.window.set_text_in_position("", BattleStatusWindow.STATS.VALUE_END_X, BattleStatusWindow.STATS.VALUE_Y+shift,
            true, false, undefined, false, BattleStatusWindow.GROUP_KEY);
        this.agi_label = this.window.set_text_in_position("Agility", BattleStatusWindow.STATS.LABEL_X, BattleStatusWindow.STATS.LABEL_Y+2*shift,
            false, false, undefined, false, BattleStatusWindow.GROUP_KEY);
        this.agi_value = this.window.set_text_in_position("", BattleStatusWindow.STATS.VALUE_END_X, BattleStatusWindow.STATS.VALUE_Y+2*shift,
            true, false, undefined, false, BattleStatusWindow.GROUP_KEY);
        this.luk_label = this.window.set_text_in_position("Luck", BattleStatusWindow.STATS.LABEL_X, BattleStatusWindow.STATS.LABEL_Y+3*shift,
            false, false, undefined, false, BattleStatusWindow.GROUP_KEY);
        this.luk_value = this.window.set_text_in_position("", BattleStatusWindow.STATS.VALUE_END_X, BattleStatusWindow.STATS.VALUE_Y+3*shift,
            true, false, undefined, false, BattleStatusWindow.GROUP_KEY);

        this.class_name = this.window.set_text_in_position("", BattleStatusWindow.CLASS_NAME.X, BattleStatusWindow.CLASS_NAME.Y,
            false, false, undefined, false, BattleStatusWindow.GROUP_KEY);
        
        this.in_the_back = this.window.set_text_in_position("", BattleStatusWindow.IN_THE_BACK.X, BattleStatusWindow.IN_THE_BACK.Y,
        false, false, undefined, false, BattleStatusWindow.GROUP_KEY);
        
        this.desc_line1 = this.window.set_text_in_position("", BattleStatusWindow.DESCRIPTION.X, BattleStatusWindow.DESCRIPTION.LINE1_Y,
            false, false, undefined, false, BattleStatusWindow.GROUP_KEY);
        this.desc_line2 = this.window.set_text_in_position("", BattleStatusWindow.DESCRIPTION.X, BattleStatusWindow.DESCRIPTION.LINE2_Y,
            false, false, undefined, false, BattleStatusWindow.GROUP_KEY);
    }

    private update_info(){
        let char = this.selected_char;
        let char_index = -1;
        let party = this.data.info.party_data.members;

        this.battle_effects = [];

        for(let index in party){
            if(party[index].key_name === this.selected_char.key_name)
                char_index = parseInt(index);
                break;
        }

        this.window.update_text(char.name, this.name);
        this.window.update_text(char.level, this.level_value);
        this.window.update_text(char.current_exp, this.exp_value);

        this.window.update_text(char.class.name, this.class_name);
        this.window.update_text((char_index >= MAX_CHARS_IN_BATTLE ? "In the back" : ""), this.in_the_back);

        if(this.update_effects() !== 0)
            this.window.update_text("", this.normal_status);
        else this.window.update_text("Normal", this.normal_status);

        this.window.update_text(char.max_hp, this.max_hp);
        this.window.update_text(char.current_hp + "/", this.curr_hp);
        this.window.update_text(char.max_pp, this.max_pp);
        this.window.update_text(char.current_pp + "/", this.curr_pp);

        this.window.update_text(char.atk, this.atk_value);
        this.window.update_text(char.def, this.def_value);
        this.window.update_text(char.agi, this.agi_value);
        this.window.update_text(char.luk, this.luk_value);

    }

    private update_effects(){
        let status_effects = this.get_status_effects();
        let buffs_debuffs = []; //get buffs/debuffs info

        let effects = [];

        for(let index in status_effects){
            let effect:BattleStatusEffect = {key: null, type:null, properties: null};

            effect.key = status_effects[index];
            effect.type = BattleEffectTypes.STATUS_CONDITION;

            if(status_effects[index] === temporary_status.DEATH_CURSE){
                let main_char_effect = _.find(this.selected_char.effects, {status_key_name: temporary_status.DEATH_CURSE});
                effect.properties.turns = this.selected_char.get_effect_turns_count(main_char_effect);
            }

            effects.push(effect);
        }

        for(let index in buffs_debuffs){
            let effect:BattleStatusEffect = {key: null, type:null, properties: null};
            
            //add buffs and debuffs to effects
            effects.push(effect);
        }

        this.battle_effects = effects;
        return this.battle_effects.length;
    }

    private get_status_effects(menu?:boolean){
        if(menu){
            return _.sortBy([...this.data.info.main_char_list[this.selected_char.key_name].permanent_status],
                s => ordered_status_menu.indexOf(s));
        }
        else{
            return _.sortBy([...this.data.info.main_char_list[this.selected_char.key_name].temporary_status].
                concat([...this.data.info.main_char_list[this.selected_char.key_name].permanent_status]),
                s => ordered_status_battle.indexOf(s));
        }
    }

    private set_sprites(){
        this.component.clear();
        if(this.battle_sprite) this.battle_sprite.destroy();
        if(this.avatar) this.avatar.destroy();

        if(this.effect_sprites.length > 0){
            for(let index in this.effect_sprites){
                this.effect_sprites[index].destroy();
            }
            this.effect_sprites = [];
        }

        this.avatar = this.window.create_at_group(BattleStatusWindow.AVATAR.X, BattleStatusWindow.AVATAR.Y,
            "avatars", undefined, this.selected_char.key_name, BattleStatusWindow.GROUP_KEY);
        
        let sprite_key = this.selected_char.key_name + "_battle";
        let sprite_base = this.data.info.main_char_list[this.selected_char.key_name].sprite_base;

        this.battle_sprite = this.window.create_at_group(BattleStatusWindow.BATTLESPRITE.CENTER_X, BattleStatusWindow.BATTLESPRITE.END_Y,
            sprite_key, undefined, undefined, BattleStatusWindow.GROUP_KEY);
        this.battle_sprite.anchor.setTo(0.5, 1);

        sprite_base.setAnimation(this.battle_sprite, "battle");
        this.battle_sprite.animations.play("battle_back");

        //TO DO: add shadow
        //TO DO: add weapon

        if(this.battle_effects.length > 0){
            for(let index in this.battle_effects){
                let effect = this.battle_effects[index];

                let x_pos = BattleStatusWindow.EFFECTS.X + parseInt(index)*BattleStatusWindow.EFFECTS.SHIFT;
                let y_pos = BattleStatusWindow.EFFECTS.Y;

                let sprite = this.window.create_at_group(x_pos, y_pos, "battle_effect_icons", undefined, effect.key, BattleStatusWindow.GROUP_KEY);
                this.effect_sprites.push(sprite);
            }
        }

        this.component.inititalize(this.selected_char, this.on_change.bind(this), this.battle_effects);
    }

    private change_character(new_char:MainChar){
        this.selected_char = new_char;
        this.update_info();
        this.set_sprites();
        
        this.component.clear();
        this.component.char_change(this.selected_char, this.battle_effects);
    }

    private next_char(){
        let char_index = -1;
        let party = this.data.info.party_data.members;

        for(let index in party){
            if(party[index].key_name === this.selected_char.key_name){
                char_index = parseInt(index);
                break;
            }
        }

        let party_size = party.length;
        this.change_character(party[(char_index+1)%party_size]);
    }

    private previous_char(){
        let char_index = -1;
        let party = this.data.info.party_data.members;

        for(let index in party){
            if(party[index].key_name === this.selected_char.key_name){
                char_index = parseInt(index);
                break;
            }
        }

        let party_size = party.length;
        this.change_character(party[(char_index+party_size-1)%party_size]);
    }

    public grant_control(){
        let controls = [
            {key: this.data.gamepad.A, on_down: this.component.trigger_state_change.bind(this.component)},
            {key: this.data.gamepad.B, on_down: this.close.bind(this, this.close_callback)},
            {key: this.data.gamepad.L, on_down: this.previous_char.bind(this)},
            {key: this.data.gamepad.R, on_down: this.next_char.bind(this)},
            {key: this.data.gamepad.LEFT, on_down: this.component.on_left.bind(this.component)},
            {key: this.data.gamepad.RIGHT, on_down: this.component.on_right.bind(this.component)},
            {key: this.data.gamepad.UP, on_down: this.component.on_up.bind(this.component)},
            {key: this.data.gamepad.DOWN, on_down: this.component.on_down.bind(this.component)},
        ];

        this.data.control_manager.set_control(controls, {loop_configs:{vertical: true, horizontal: true, shoulder: true}});
    }

    private check_shift(shift:boolean){
        if(this.desc_shifted === shift) return;

        this.window.clear_separators();

        let separator_x = BattleStatusWindow.SEPARATOR.X;
        let separator_y = BattleStatusWindow.SEPARATOR.Y + (shift ? BattleStatusWindow.SEPARATOR.SHIFT : 0);
        let separator_width = BattleStatusWindow.SEPARATOR.WIDTH;

        this.window.draw_separator(separator_x, separator_y, separator_x+separator_width, separator_y, false);

        this.desc_shifted = shift;
    }

    private on_change(line1:string, line2:string, highlight_pos?:{index:number, vertical:boolean}){
        this.window.update_text(line1, this.desc_line1);
        this.window.update_text(line2, this.desc_line2);
        this.check_shift(this.component.current_state !== ComponentStates.STATISTICS);
    }

    public open(selected_char?:MainChar, close_callback?:Function, open_callback?:Function){
        if(!selected_char) this.selected_char = this.data.info.party_data.members[0];
        else this.selected_char = selected_char;

        this.close_callback = close_callback;

        this.window.show(() =>{
            this.update_info();
            this.set_sprites();
            this.check_shift(this.component.current_state !== ComponentStates.STATISTICS);
            
            if(open_callback){
                open_callback();
            }
        });
    }

    public close(callback?:Function){
        this.component.clear();
        this.window.close(callback);
    }
}