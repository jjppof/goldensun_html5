import { Window } from '../../Window.js';
import { item_types } from '../../Item.js';
import { effect_types, effect_operators } from '../../Effect.js';
import { items_list } from '../../../initializers/items.js';

const BASE_WIN_WIDTH = 100;
const BASE_WIN_HEIGHT = 92;
const BASE_WIN_X = 0;
const BASE_WIN_Y = 40;
const ARROW_X = 53;
const ARROW_Y_SHIFT = 2;
const PREVIEW_TEXT_X = 94;

export class StatsCheckWithItemWindow {
    constructor(game) {
        this.game = game;
        this.char = null;
        this.window_open = false;
        this.x = BASE_WIN_X;
        this.y = BASE_WIN_Y;
        this.base_window = new Window(this.game, this.x, this.y, BASE_WIN_WIDTH, BASE_WIN_HEIGHT);
        this.avatar_group = game.add.group();
        this.avatar_group.alpha = 0;
        this.x_avatar = this.x + 8;
        this.y_avatar = this.y + 8;
        this.avatar = null;

        this.up_arrows =  {
            [effect_types.ATTACK]: this.base_window.create_at_group(ARROW_X, 48 - ARROW_Y_SHIFT, "up_arrow"),
            [effect_types.DEFENSE]: this.base_window.create_at_group(ARROW_X, 64 - ARROW_Y_SHIFT, "up_arrow"),
            [effect_types.AGILITY]: this.base_window.create_at_group(ARROW_X, 80 - ARROW_Y_SHIFT, "up_arrow")
        };
        this.down_arrows =  {
            [effect_types.ATTACK]: this.base_window.create_at_group(ARROW_X, 48 - ARROW_Y_SHIFT, "down_arrow"),
            [effect_types.DEFENSE]: this.base_window.create_at_group(ARROW_X, 64 - ARROW_Y_SHIFT, "down_arrow"),
            [effect_types.AGILITY]: this.base_window.create_at_group(ARROW_X, 80 - ARROW_Y_SHIFT, "down_arrow")
        };
        this.preview_stats_texts =  {
            [effect_types.ATTACK]: this.base_window.set_text_in_position("0", PREVIEW_TEXT_X, 48, true),
            [effect_types.DEFENSE]: this.base_window.set_text_in_position("0", PREVIEW_TEXT_X, 64, true),
            [effect_types.AGILITY]: this.base_window.set_text_in_position("0", PREVIEW_TEXT_X, 80, true)
        };
        this.hide_arrows();

        this.base_window.set_text_in_position("Lv", 48, 24);
        this.base_window.set_text_in_position("Attack", 8, 40);
        this.base_window.set_text_in_position("Defense", 8, 56);
        this.base_window.set_text_in_position("Agility", 8, 72);

        this.name_text = this.base_window.set_text_in_position("0", 40, 8);
        this.lv_text = this.base_window.set_text_in_position("0", 80, 24);
        this.attack_text = this.base_window.set_text_in_position("0", 40, 48, true);
        this.defense_text = this.base_window.set_text_in_position("0", 40, 64, true);
        this.agility_text = this.base_window.set_text_in_position("0", 40, 80, true);
    }

    update_position() {
        this.avatar_group.x = this.game.camera.x + this.x_avatar;
        this.avatar_group.y = this.game.camera.y + this.y_avatar;
    }

    hide() {
        this.base_window.group.alpha = 0;
        this.avatar_group.alpha = 0;
    }

    show() {
        if (!this.window_open) return;
        this.base_window.group.alpha = 1;
        this.avatar_group.alpha = 1;
    }

    update_info(set_compare_arrows = true) {
        this.base_window.update_text(this.char.name, this.name_text);
        this.base_window.update_text(this.char.level.toString(), this.lv_text);
        this.base_window.update_text(this.char.current_atk.toString(), this.attack_text);
        this.base_window.update_text(this.char.current_def.toString(), this.defense_text);
        this.base_window.update_text(this.char.current_agi.toString(), this.agility_text);
        if (this.avatar) {
            this.avatar.destroy();
        }
        this.avatar = this.avatar_group.create(0, 0, "avatars", this.char.key_name);
        if (set_compare_arrows) {
            this.compare_items();
        }
    }

    set_compare_arrows(effect_type, equip_slot_property, current_stats_property, compare_removing) {
        let effect_obj = _.find(this.item.effects, {type: effect_type});
        let preview_stats;
        if (effect_obj !== undefined) {
            const equip_slot_key_name = this.char.equip_slots[equip_slot_property] === null ? null : this.char.equip_slots[equip_slot_property].key_name;
            preview_stats = this.char.preview_stats_by_effect(effect_type, effect_obj, equip_slot_key_name);
        }
        if (this.char.equip_slots[equip_slot_property] === null) {
            if (effect_obj === undefined) return;
            this.update_preview_text(preview_stats, effect_type);
            this.up_arrows[effect_type].alpha = 1;
        } else {
            const equipped_effect_obj = _.find(items_list[this.char.equip_slots[equip_slot_property].key_name].effects, {type: effect_type});
            if (equipped_effect_obj === undefined && effect_obj === undefined) return;
            if (effect_obj === undefined || compare_removing) {
                effect_obj = {
                    type: effect_type,
                    quantity: 0,
                    operator: effect_operators.PLUS
                };
                preview_stats = this.char.preview_stats_by_effect(effect_type, effect_obj, this.char.equip_slots[equip_slot_property].key_name);
            }
            const current_stats = this.char[current_stats_property];
            if (preview_stats > current_stats) {
                this.up_arrows[effect_type].alpha = 1;
                this.update_preview_text(preview_stats, effect_type);
            } else if (preview_stats < current_stats) {
                this.down_arrows[effect_type].alpha = 1;
                this.update_preview_text(preview_stats, effect_type);
            }
        }
    }

    update_preview_text(value, effect_type) {
        this.preview_stats_texts[effect_type].text.alpha = 1;
        this.preview_stats_texts[effect_type].shadow.alpha = 1;
        this.base_window.update_text(value.toString(), this.preview_stats_texts[effect_type]);
    }

    hide_arrows() {
        for (let key in this.up_arrows) {
            this.up_arrows[key].alpha = 0;
            this.down_arrows[key].alpha = 0;
            this.preview_stats_texts[key].text.alpha = 0;
            this.preview_stats_texts[key].shadow.alpha = 0;
        }
    }

    compare_items(compare_removing = false) {
        this.hide_arrows();
        if (this.item_obj.equipped && !compare_removing) return;
        if (!this.item.equipable_chars.includes(this.char.key_name)) return;
        let equip_slot_property;
        switch (this.item.type) {
            case item_types.WEAPONS: equip_slot_property = "weapon"; break;
            case item_types.HEAD_PROTECTOR: equip_slot_property = "head"; break;
            case item_types.CHEST_PROTECTOR: equip_slot_property = "chest"; break;
            case item_types.ARMOR: equip_slot_property = "body"; break;
        }
        this.set_compare_arrows(effect_types.ATTACK, equip_slot_property, "current_atk", compare_removing);
        this.set_compare_arrows(effect_types.DEFENSE, equip_slot_property, "current_def", compare_removing);
        this.set_compare_arrows(effect_types.AGILITY, equip_slot_property, "current_agi", compare_removing);
    }

    open(char, item, item_obj, callback) {
        this.update_position();
        this.avatar_group.alpha = 1;
        this.char = char;
        this.item = item;
        this.item_obj = item_obj;
        this.update_info();
        this.base_window.show(() => {
            this.window_open = true;
            if (callback !== undefined) {
                callback();
            }
        }, false);
    }

    close(callback) {
        this.avatar_group.alpha = 0;
        this.base_window.close(() => {
            this.window_open = false;
            if (callback !== undefined) {
                callback();
            }
        }, false);
    }
}
