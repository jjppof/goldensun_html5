import { Window } from "../../Window";
import * as numbers from "../../magic_numbers.js";
import { elements, ordered_elements } from "../../utils.js";

const BASE_WIN_HEIGHT = 20;
const BASE_WIN_Y = 136;
const ABILITY_NAME_Y = 8;
const ICON_X = 9;
const ICON_Y = 5;

const ABILITY_NAME_X = 24;
const ABILITY_NAME_ITEM_X = 32;

const BASE_WIN_X_ATK = 88;
const BASE_WIN_WIDTH_ATK = 84;
const BASE_WIN_X_PSY = 64;
const BASE_WIN_WIDTH_PSY = 140;
const BASE_WIN_X_DJINN = 88;
const BASE_WIN_WIDTH_DJINN = 76;
const BASE_WIN_X_SUMMON = 80;
const BASE_WIN_WIDTH_SUMMON = 132;
const BASE_WIN_X_ITEM = 72;
const BASE_WIN_WIDTH_ITEM = 124;
const BUTTON_WIDTH = 24;

const STAR_WIDTH = 6;
const STAR_Y = 9;
const STAR_X_PSY = 129;
const STAR_X_DJINN = 9;
const STAR_X_SUMOON_1 = 97;
const STAR_X_SUMOON_2 = 113;

const PP_X = 123;
const PP_Y = 8;
const PP_TEXT_X = 96;

const SUB_ICON_X = 0;
const SUB_ICON_Y = 0;

export class ChoosingTargetWindow {
    constructor(game, data) {
        this.game = game;
        this.data = data;
        this.base_window = new Window(this.game, 0, BASE_WIN_Y, 0, BASE_WIN_HEIGHT);
        this.window_open = false;
        this.group = this.game.add.group();
    }

    update_position() {
        this.group.x = this.game.camera.x;
        this.group.y = this.game.camera.y;
    }

    set_button() {
        const button = this.group.create(this.x - BUTTON_WIDTH, BASE_WIN_Y, "buttons", this.action);
        this.sprites.push(button);
    }

    set_info() {
        const name = this.base_window.set_text_in_position(this.ability_name, this.ability_name_x, ABILITY_NAME_Y);
        this.texts.push(name);
        if (this.element && this.element !== elements.NO_ELEMENT && this.action !== "summon") {
            const star = this.base_window.create_at_group(this.star_x, STAR_Y, this.element + "_star");
            this.window_sprites.push(star);
        }
        if (this.icon_sprite_sheet && this.action !== "item") {
            const icon = this.base_window.create_at_group(ICON_X, ICON_Y, this.icon_sprite_sheet, undefined, this.ability_key_name);
            this.window_sprites.push(icon);
        }
        if (this.action === "psynergy") {
            const pp_value = this.base_window.set_text_in_position(this.quantities[0].toString(), PP_X, PP_Y, true);
            this.texts.push(pp_value);
            const pp_text = this.base_window.set_text_in_position("PP", PP_TEXT_X, PP_Y);
            this.texts.push(pp_text);
        } else if (this.action === "summon") {
            const reqs = _.pickBy(this.data.dbs.summons_db[this.ability_key_name].requirements, req => req);
            let counter = 0;
            ordered_elements.forEach(element => {
                if (!(element in reqs)) return;
                const star_x = counter === 0 ? STAR_X_SUMOON_1 : STAR_X_SUMOON_2;
                const star = this.base_window.create_at_group(star_x, STAR_Y, element + "_star");
                this.window_sprites.push(star);
                const req_text = this.base_window.set_text_in_position(reqs[element].toString(), star_x + STAR_WIDTH + 1, ABILITY_NAME_Y);
                this.texts.push(req_text);
                ++counter;
            });
        } else if (this.action === "item") {
            this.icon_group = this.game.add.group();
            let icon_sprite = this.icon_group.create(0, 0, this.icon_sprite_sheet, this.ability_key_name);
            icon_sprite.anchor.setTo(0.5, 0.5);
            if (this.item_obj.equipped) {
                this.icon_group.create(SUB_ICON_X, SUB_ICON_Y, "equipped");
            }
            if (this.item_obj.quantity > 1) {
                let item_count = this.game.add.bitmapText(SUB_ICON_X, SUB_ICON_Y, 'gs-item-bmp-font', this.item_obj.quantity.toString());
                this.icon_group.add(item_count);
            }
            this.base_window.add_sprite_to_group(this.icon_group);
            this.icon_group.x = ICON_X + (numbers.ICON_WIDTH >> 1);
            this.icon_group.y = ICON_Y + (numbers.ICON_HEIGHT >> 1);
            this.window_sprites.push(this.icon_group);
        }
    }

    open(action, ability_name, element, ability_key_name, quantities, item_obj) {
        this.action = action;
        this.ability_name = ability_name;
        this.element = element;
        this.ability_key_name = ability_key_name;
        this.quantities = quantities;
        switch (this.action) {
            case "attack":
                this.width = BASE_WIN_WIDTH_ATK;
                this.x = BASE_WIN_X_ATK;
                this.ability_name_x = ABILITY_NAME_X;
                break;
            case "psynergy":
                this.width = BASE_WIN_WIDTH_PSY;
                this.x = BASE_WIN_X_PSY;
                this.ability_name_x = ABILITY_NAME_X;
                this.star_x = STAR_X_PSY;
                this.icon_sprite_sheet = "abilities_icons";
                break;
            case "djinni":
                this.width = BASE_WIN_WIDTH_DJINN;
                this.x = BASE_WIN_X_DJINN;
                this.ability_name_x = ABILITY_NAME_X;
                this.star_x = STAR_X_DJINN;
                break;
            case "summon":
                this.width = BASE_WIN_WIDTH_SUMMON;
                this.x = BASE_WIN_X_SUMMON;
                this.ability_name_x = ABILITY_NAME_X;
                this.icon_sprite_sheet = "abilities_icons";
                break;
            case "item":
                this.width = BASE_WIN_WIDTH_ITEM;
                this.x = BASE_WIN_X_ITEM;
                this.ability_name_x = ABILITY_NAME_ITEM_X;
                this.icon_sprite_sheet = "items_icons";
                this.item_obj = item_obj;
                break;
        }
        this.base_window.update_size({width: this.width});
        this.base_window.update_position({x: this.x});
        this.base_window.show(undefined, false);
        this.sprites = [];
        this.window_sprites = [];
        this.texts = [];
        this.update_position();
        this.set_button();
        this.set_info();
        this.window_open = true;
    }

    close() {
        this.sprites.forEach(sprite => {
            sprite.destroy();
        });
        this.texts.forEach(text => {
            this.base_window.remove_text(text);
        });
        this.window_sprites.forEach(sprite => {
            this.base_window.remove_from_group(sprite, true);
        });
        this.sprites = [];
        this.window_sprites = [];
        this.texts = [];
        this.base_window.close(undefined, false);
        if (this.icon_group) {
            this.icon_group.destroy();
            this.icon_group = null;
        }
        this.window_open = false;
        this.element = undefined;
        this.icon_sprite_sheet = undefined;
    }

    destroy() {
        this.base_window.destroy(false);
        this.group.destroy();
        if (this.icon_group) {
            this.icon_group.destroy();
        }
    }
}