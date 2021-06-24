import {Window} from "../../Window";
import {kill_all_sprites} from "../../utils";
import {GoldenSun} from "../../GoldenSun";
import {Button} from "../../XGamepad";
import {ShopItem} from "../../Shop.js";
import {CursorManager, PointVariants} from "../../utils/CursorManager";

const MAX_PER_PAGE = 7;

const WIN_X = 0;
const WIN_Y = 96;
const WIN_WIDTH = 236;
const WIN_HEIGHT = 28;

const ITEM_X = 16;
const ITEM_Y = 16 + 96;
const TAG_X = 24;
const TAG_Y = 104;

const TEXT_X = 39;
const TEXT_END_Y = 131;
const TEXT_BG_COLOR = 0xff7300;

const BG_SHIFT_X = -3;
const BG_SHIFT_Y = 1;

const LINE_SHIFT = 32;

const CURSOR_X = 0;
const CURSOR_Y = 112;

const ARROW_GROUP_X = 224;
const ARROW_GROUP_Y = 80;
const UP_ARROW_X = 16;
const UP_ARROW_Y = 20;
const DOWN_ARROW_X = 0;
const DOWN_ARROW_Y = 52;
const ARROW_Y_DIFF = 8;

const SELECT_TWEEN_TIME = Phaser.Timer.QUARTER;
const ARROW_TWEEN_TIME = Phaser.Timer.QUARTER >> 1;

/*Displays a shopkeeper's wares to purchase
Supports multiple item pages

Input: game [Phaser:Game] - Reference to the running game object
       data [GoldenSun] - Reference to the main JS Class instance
       on_change [function] - Function callback to update the parent*/
export class BuySelectMenu {
    public game: Phaser.Game;
    public data: GoldenSun;
    public on_change: Function;

    public window: Window;
    public items: {[key_name: string]: ShopItem};
    public selected_index: number;
    public current_page: number;
    public pages: ShopItem[][];
    public tweens: {item: Phaser.Tween; bg: Phaser.Tween};
    public is_open: boolean;

    public sprite_group: Phaser.Group;
    public tag_group: Phaser.Group;
    public text_group: Phaser.Group;
    public bg_group: Phaser.Group;
    public arrow_group: Phaser.Group;

    public up_arrow: Phaser.Sprite;
    public down_arrow: Phaser.Sprite;
    public arrow_tweens: Phaser.Tween[];

    constructor(game: Phaser.Game, data: GoldenSun, on_change: Function) {
        this.game = game;
        this.data = data;
        this.on_change = on_change;

        this.window = new Window(this.game, WIN_X, WIN_Y, WIN_WIDTH, WIN_HEIGHT);
        this.items = {};
        this.selected_index = 0;
        this.current_page = 0;
        this.pages = [];
        this.tweens = {item: null, bg: null};
        this.is_open = false;

        this.sprite_group = this.game.add.group();
        this.sprite_group.x = ITEM_X;
        this.sprite_group.y = ITEM_Y;
        this.tag_group = this.game.add.group();
        this.tag_group.x = TAG_X;
        this.tag_group.y = TAG_Y;
        this.text_group = this.game.add.group();
        this.text_group.x = TEXT_X;
        this.text_group.y = TEXT_END_Y;
        this.bg_group = this.game.add.group();
        this.bg_group.x = TEXT_X + BG_SHIFT_X;
        this.bg_group.y = TEXT_END_Y + BG_SHIFT_Y;
        this.arrow_group = this.game.add.group();
        this.arrow_group.x = ARROW_GROUP_X;
        this.arrow_group.y = ARROW_GROUP_Y;

        this.up_arrow = this.arrow_group.create(UP_ARROW_X, UP_ARROW_Y, "menu", "green_arrow");
        this.up_arrow.rotation = Math.PI;
        this.down_arrow = this.arrow_group.create(DOWN_ARROW_X, DOWN_ARROW_Y, "menu", "green_arrow");
        this.up_arrow.visible = false;
        this.down_arrow.visible = false;

        this.arrow_tweens = [];
    }

    /*Updates the groups' positions on screen*/
    update_group_pos() {
        this.sprite_group.x = ITEM_X + this.game.camera.x;
        this.sprite_group.y = ITEM_Y + this.game.camera.y;
        this.tag_group.x = TAG_X + this.game.camera.x;
        this.tag_group.y = TAG_Y + this.game.camera.y;
        this.text_group.x = TEXT_X + this.game.camera.x;
        this.text_group.y = TEXT_END_Y + this.game.camera.y;
        this.bg_group.x = TEXT_X + BG_SHIFT_X + this.game.camera.x;
        this.bg_group.y = TEXT_END_Y + BG_SHIFT_Y + this.game.camera.y;
        this.arrow_group.x = ARROW_GROUP_X + this.game.camera.x;
        this.arrow_group.y = ARROW_GROUP_Y + this.game.camera.y;
    }

    /*Hides or shows specific arrows
    
    Input: up, down [boolean] - If true, shows up/down arrow*/
    set_arrows(up: boolean = false, down: boolean = false) {
        this.up_arrow.x = UP_ARROW_X;
        this.up_arrow.y = UP_ARROW_Y;
        this.down_arrow.x = DOWN_ARROW_X;
        this.down_arrow.y = DOWN_ARROW_Y;
        if (up) this.up_arrow.visible = true;
        else this.up_arrow.visible = false;

        if (down) this.down_arrow.visible = true;
        else this.down_arrow.visible = false;
    }

    /*Checks which arrows to show or hide*/
    check_arrows() {
        let up = false;
        let down = false;

        if (this.current_page < this.pages.length - 1) down = true;
        if (this.current_page > 0) up = true;

        this.set_arrows(up, down);
        this.init_arrow_tweens();
        this.game.world.bringToTop(this.arrow_group);
    }

    /*Starts the arrow animations*/
    init_arrow_tweens() {
        let up_tween = this.game.add
            .tween(this.up_arrow)
            .to({y: UP_ARROW_Y - ARROW_Y_DIFF}, ARROW_TWEEN_TIME, Phaser.Easing.Linear.None)
            .to({y: UP_ARROW_Y}, ARROW_TWEEN_TIME, Phaser.Easing.Linear.None)
            .loop();
        this.arrow_tweens.push(up_tween);

        let down_tween = this.game.add
            .tween(this.down_arrow)
            .to({y: DOWN_ARROW_Y + ARROW_Y_DIFF}, ARROW_TWEEN_TIME, Phaser.Easing.Linear.None)
            .to({y: DOWN_ARROW_Y}, ARROW_TWEEN_TIME, Phaser.Easing.Linear.None)
            .loop();
        this.arrow_tweens.push(down_tween);

        up_tween.start();
        down_tween.start();
    }

    /*Clears the arrow animations*/
    clear_arrow_tweens() {
        for (let i = 0; i < this.arrow_tweens.length; i++) {
            this.game.tweens.remove(this.arrow_tweens.pop());
        }
    }

    /*Sets the price for a given item's tag

    Input: text [string] - Price of the item
           index [number] - Line index of the item*/
    set_text(text: string, index: number) {
        let dead_texts = this.text_group.children.filter((t: Phaser.BitmapText) => {
            return t.alive === false && t.tint !== 0;
        });
        let dead_shadows = this.text_group.children.filter((s: Phaser.BitmapText) => {
            return s.alive === false && s.tint === 0;
        });

        let sprite = null;
        let shadow = null;

        if (dead_texts.length > 0 && dead_shadows.length > 0) {
            (dead_texts[0] as Phaser.BitmapText).text = text;
            (dead_texts[0] as Phaser.BitmapText).reset(index * LINE_SHIFT, 0);
            (dead_shadows[0] as Phaser.BitmapText).text = text;
            (dead_shadows[0] as Phaser.BitmapText).reset(index * LINE_SHIFT, 0);
            sprite = dead_texts[0];
            shadow = dead_shadows[0];
        } else {
            shadow = this.game.add.bitmapText(index * LINE_SHIFT, 0, "gs-shop-bmp-font", text);
            sprite = this.game.add.bitmapText(index * LINE_SHIFT, 0, "gs-shop-bmp-font", text);
            shadow.rotation = Math.PI / 2;
            sprite.rotation = Math.PI / 2;
            shadow.tint = 0x0;
            this.text_group.add(shadow);
            this.text_group.add(sprite);
        }

        shadow.y -= sprite.width - 1;
        sprite.y -= sprite.width;
        shadow.x -= 1;

        let dead_text_bgs = this.bg_group.children.filter((bg: Phaser.Graphics) => {
            return bg.alive === false;
        });

        if (dead_text_bgs.length > 0) {
            (dead_text_bgs[0] as Phaser.Graphics).clear();
            (dead_text_bgs[0] as Phaser.Graphics).beginFill(TEXT_BG_COLOR, 1);
            (dead_text_bgs[0] as Phaser.Graphics).drawRect(0, 0, -(sprite.height + 1), -(sprite.width + 1));
            (dead_text_bgs[0] as Phaser.Graphics).endFill();
            (dead_text_bgs[0] as Phaser.Graphics).reset(index * LINE_SHIFT, 0);
        } else {
            let bg = this.game.add.graphics(index * LINE_SHIFT, 0);
            bg.beginFill(TEXT_BG_COLOR, 1);
            bg.drawRect(0, 0, -(sprite.height + 1), -(sprite.width + 1));
            bg.endFill();
            this.bg_group.add(bg);
        }

        this.game.world.bringToTop(this.text_group);
    }

    /*Splits the shopkeeper's wares into pages*/
    make_pages() {
        let items_length = Object.keys(this.items).length;
        let keys = Array.from(Object.keys(this.items));
        let page_number =
            items_length % MAX_PER_PAGE === 0
                ? (items_length / MAX_PER_PAGE) | 0
                : ((items_length / MAX_PER_PAGE) | 0) + 1;

        for (let i = 0; i < page_number; i++) {
            let wares = [];
            for (let n = i * MAX_PER_PAGE; n < (i + 1) * MAX_PER_PAGE; n++) {
                if (!keys[n]) break;
                wares.push(this.items[keys[n]]);
            }
            this.pages[i] = wares;
        }
    }

    /*Displays the sprites for the window

    Input: page [number] - The item page index*/
    set_sprites(page: number) {
        for (let i = 0; i < this.pages[page].length; i++) {
            let dead_items = this.sprite_group.children.filter((s: Phaser.Sprite) => {
                return s.alive === false && s.key === "items_icons";
            });
            let dead_backgrounds = this.sprite_group.children.filter((s: Phaser.Sprite) => {
                return s.alive === false && s.frameName === "item_border";
            });

            if (dead_items.length > 0 && dead_backgrounds.length > 0) {
                (dead_backgrounds[0] as Phaser.Sprite).reset(i * LINE_SHIFT, 0);
                dead_backgrounds[0].scale.x = 1;
                dead_backgrounds[0].scale.y = 1;
                (dead_items[0] as Phaser.Sprite).frameName = this.pages[page][i].key_name;
                dead_items[0].scale.x = 1;
                dead_items[0].scale.y = 1;
                (dead_items[0] as Phaser.Sprite).reset(i * LINE_SHIFT, 0);
            } else {
                this.sprite_group.create(i * LINE_SHIFT, 0, "menu", "item_border").anchor.setTo(0.5, 0.5);
                this.sprite_group
                    .create(i * LINE_SHIFT, 0, "items_icons", this.pages[page][i].key_name)
                    .anchor.setTo(0.5, 0.5);
            }

            let dead_tags = this.tag_group.children.filter((t: Phaser.Sprite) => {
                return t.alive === false;
            });
            if (dead_tags.length > 0) (dead_tags[0] as Phaser.Sprite).reset(i * LINE_SHIFT, 0);
            else this.tag_group.create(i * LINE_SHIFT, 0, "menu", "price_tag");

            let price = this.data.info.items_list[this.pages[page][i].key_name].price;
            this.set_text(price.toString(), i);
        }
        this.set_item(this.selected_index % MAX_PER_PAGE);
    }

    /*Displays a specific page of items

    Input: index [number] - Index of the page to be displayed*/
    change_page(page: number, force_index?: number) {
        if (this.pages.length === 1) return;
        this.clear_arrow_tweens();

        let items_length = Object.keys(this.items).length;
        if (items_length < MAX_PER_PAGE * page) return;

        this.current_page = page;

        if (force_index !== undefined) {
            this.selected_index = force_index;
        } else if (this.selected_index !== null && this.selected_index >= this.pages[this.current_page].length) {
            this.selected_index = this.pages[this.current_page].length - 1;
        }

        kill_all_sprites(this.sprite_group);
        kill_all_sprites(this.tag_group);
        kill_all_sprites(this.text_group);
        kill_all_sprites(this.bg_group);
        this.unset_item(this.selected_index);
        this.set_sprites(page);
        this.check_arrows();
        this.change_item(this.selected_index);
    }

    /**
     * Grants user control on the current window.
     * @param {Function} on_cancel - Called when B is pressed
     * @param {Function} on_select - Called when A is pressed
     */
    grant_control(on_cancel: Function, on_select: Function) {
        const controls = [
            {button: Button.LEFT, on_down: this.previous_item.bind(this), sfx: {down: "menu/move"}},
            {button: Button.RIGHT, on_down: this.next_item.bind(this), sfx: {down: "menu/move"}},
            {button: Button.UP, on_down: this.previous_page.bind(this), sfx: {down: "menu/move"}},
            {button: Button.DOWN, on_down: this.next_page.bind(this), sfx: {down: "menu/move"}},
            {button: Button.A, on_down: on_select, params: {reset_controls: true}, sfx: {down: "menu/positive"}},
            {button: Button.B, on_down: on_cancel, params: {reset_controls: true}, sfx: {down: "menu/negative"}},
        ];
        this.data.control_manager.add_controls(controls, {loop_config: {horizontal: true}});
    }

    /*Changes to the next item page
    Used as a callback for controls*/
    next_page(force_index?: number) {
        if (this.pages.length === 1 || this.current_page + 1 === this.pages.length) return;
        let index = this.current_page + 1;

        this.change_page(index, force_index);
    }

    /*Changes to the previous item page
    Used as a callback for controls*/
    previous_page(force_index?: number) {
        if (this.pages.length === 1 || this.current_page - 1 < 0) return;
        let index = this.current_page - 1;

        this.change_page(index, force_index);
    }

    /*Selects a specific item on screen

    Input: step [number] - Step index for new item selection*/
    change_item(index: number) {
        this.unset_item(this.selected_index);

        this.selected_index = index;

        this.set_item(this.selected_index);
        this.set_cursor(this.selected_index);
        this.on_change(this.pages[this.current_page][this.selected_index].key_name);
    }

    /*Returns the item with the next index
    Cycles to next page if necessary
    Used as a callback for controls*/
    next_item() {
        if (this.pages[this.current_page].length === 1 && this.pages.length === 1) return;

        if (this.selected_index + 1 === this.pages[this.current_page].length) {
            if (this.current_page + 1 === this.pages.length) {
                if (this.pages.length === 1) this.change_item(0);
                else this.change_page(0, 0);
            } else this.next_page(0);
        } else {
            this.change_item(this.selected_index + 1);
        }
    }

    /*Returns the item with the previous index
    Cycles to previous page if necessary
    Used as a callback for controls*/
    previous_item() {
        if (this.pages[this.current_page].length === 1 && this.pages.length === 1) return;

        if (this.selected_index - 1 < 0) {
            if (this.current_page - 1 < 0) {
                if (this.pages.length === 1) this.change_item(this.pages[this.current_page].length - 1);
                else this.change_page(this.pages.length - 1, this.pages[this.pages.length - 1].length - 1);
            } else this.previous_page(this.pages[this.current_page - 1].length - 1);
        } else {
            this.change_item(this.selected_index - 1);
        }
    }

    /*Sets the scaling animation for the selected item

    Input: index [number] - Item index (on screen)*/
    set_item(index: number) {
        this.game.world.bringToTop(this.sprite_group);
        this.data.cursor_manager.bring_to_top();
        let itm_list = this.sprite_group.children.filter((s: Phaser.Sprite) => {
            return s.alive === true && s.key === "items_icons";
        });
        let bg_list = this.sprite_group.children.filter((s: Phaser.Sprite) => {
            return s.alive === true && s.frameName === "item_border";
        });

        let tweens = [this.tweens.item, this.tweens.bg];
        let lists = [itm_list, bg_list];

        for (let i = 0; i < 2; i++) {
            tweens[i] = this.game.add
                .tween(lists[i][index].scale)
                .to({x: 1.55, y: 1.55}, SELECT_TWEEN_TIME, Phaser.Easing.Linear.None, true, 0, -1, true);
        }
        this.tweens = {item: tweens[0], bg: tweens[1]};
    }

    /*Checks wether this is the last item on the list

    Input: page[number] - The item's page
           index[number] - The item's index
    
    Output: [boolean] - True if last, false otherwise*/
    is_last(page: number, index: number) {
        if (page === this.pages.length - 1 && index === this.pages[page].length - 1) return true;
        else return false;
    }

    /*Removes the scaling animation from the selected item

    Input: index [number] - Item index (on screen)*/
    unset_item(index: number) {
        let itm_list = this.sprite_group.children.filter((s: Phaser.Sprite) => {
            return s.alive === true && s.key === "items_icons";
        });
        let bg_list = this.sprite_group.children.filter((s: Phaser.Sprite) => {
            return s.alive === true && s.frameName === "item_border";
        });

        let tweens = [this.tweens.item, this.tweens.bg];
        let lists = [itm_list, bg_list];

        for (let i = 0; i < 2; i++) {
            if (lists[i][index]) {
                (lists[i][index] as Phaser.Sprite).scale.setTo(1.0, 1.0);
            }
            if (tweens[i]) {
                this.game.tweens.remove(tweens[i]);
                tweens[i] = null;
            }
        }
    }

    /*Sets the cursor to the current item's index

    Input: index [number] - Selected item's index*/
    set_cursor(index: number, on_complete?: Function) {
        let cursor_x = CURSOR_X + index * LINE_SHIFT;
        let cursor_y = CURSOR_Y;
        this.data.cursor_manager.move_to(
            {x: cursor_x, y: cursor_y},
            {animate: false, tween_config: {type: CursorManager.CursorTweens.POINT, variant: PointVariants.LONG}},
            on_complete
        );
    }

    /*Opens this window at page 0

    Input: items [array] - The item list to display (array of Item)
           index [number] - Initial selected item index
           page [number] - Initial selected page index
           open_callback [function] - Callback function (Optional)*/
    open(items: {[key_name: string]: ShopItem}, index: number = 0, page: number = 0, open_callback?: () => void) {
        this.items = items;
        this.current_page = page;
        this.selected_index = index;
        this.is_open = true;
        this.make_pages();

        this.check_arrows();
        this.set_sprites(this.current_page);
        this.set_cursor(this.selected_index);
        this.update_group_pos();

        this.window.show(open_callback, false);
    }

    /*Clears information and closes the window

    Input: destroy [boolean] - If true, sprites are destroyed*/
    close(callback?: () => void, destroy: boolean = false) {
        this.unset_item(this.selected_index);

        kill_all_sprites(this.sprite_group, destroy);
        kill_all_sprites(this.tag_group, destroy);
        kill_all_sprites(this.text_group, destroy);
        kill_all_sprites(this.bg_group, destroy);

        this.items = {};
        this.pages = [];
        this.selected_index = 0;
        this.current_page = 0;
        this.is_open = false;

        this.set_arrows(false, false);

        this.window.close(callback, false);
    }
}
