import {BitmapText} from "phaser-ce";
import {Djinn, djinn_status} from "../Djinn";
import {GoldenSun} from "../GoldenSun";
import {MainChar} from "../MainChar";
import {MainStatusMenu} from "../main_menus/MainStatusMenu";
import {directions, elements, reverse_directions} from "../utils";
import {Window} from "../Window";
import {BattleStatusWindow} from "../windows/battle/BattleStatusWindow";

export enum StatusModes {
    BATTLE,
    MENU,
}

export abstract class StatusComponent {
    protected static readonly GROUP_KEY = "status_component";

    protected game: Phaser.Game;
    protected data: GoldenSun;
    protected window: Window;

    protected current_line: number;
    protected current_col: number;

    protected mode: StatusModes;

    protected highlight: Phaser.Graphics;
    protected state_sprites: (Phaser.Sprite | BitmapText | Phaser.Group)[];
    protected manager: BattleStatusWindow | MainStatusMenu;

    public constructor(
        game: Phaser.Game,
        data: GoldenSun,
        window: Window,
        manager: BattleStatusWindow | MainStatusMenu,
        pos?: {line: number; col: number},
        mode?: StatusModes
    ) {
        this.game = game;
        this.data = data;
        this.window = window;

        this.mode = mode ? mode : StatusModes.BATTLE;

        if (this.mode === StatusModes.BATTLE) this.manager = this.manager as BattleStatusWindow;
        else if (this.mode === StatusModes.MENU) this.manager = this.manager as MainStatusMenu;

        if (!this.window.get_internal_group(StatusComponent.GROUP_KEY))
            this.window.define_internal_group(StatusComponent.GROUP_KEY, {x: 0, y: 0});

        this.highlight = this.game.add.graphics(0, 0);
        this.highlight.blendMode = PIXI.blendModes.SCREEN;
        this.window.add_to_internal_group(StatusComponent.GROUP_KEY, this.highlight);

        this.state_sprites = [];
        this.manager = manager;

        this.current_col = pos ? pos.col : 0;
        this.current_line = pos ? pos.line : 0;
    }

    public abstract select_option(): void;
    public abstract on_change(): void;
    public abstract on_left(): void;
    public abstract on_right(): void;
    public abstract on_up(): void;
    public abstract on_down(): void;
    public abstract initialize(): void;

    protected get selected_char(): MainChar {
        let manager = null;

        if (this.mode === StatusModes.BATTLE) manager = this.manager as BattleStatusWindow;
        else if (this.mode === StatusModes.MENU) manager = this.manager as MainStatusMenu;

        return manager.selected_character;
    }

    protected get battle_status_effects() {
        let manager = null;

        if (this.mode === StatusModes.BATTLE) manager = this.manager as BattleStatusWindow;
        else if (this.mode === StatusModes.MENU) manager = this.manager as MainStatusMenu;

        return manager.battle_effects_array;
    }

    protected update_description(line1: string, line2?: string) {
        let manager = null;

        if (this.mode === StatusModes.BATTLE) manager = this.manager as BattleStatusWindow;
        else if (this.mode === StatusModes.MENU) manager = this.manager as MainStatusMenu;

        manager.update_description(line1, line2);
    }

    protected update_highlight(highlight: {x: number; y: number; width: number; height: number}) {
        this.highlight.clear();

        this.highlight.beginFill(this.window.color, 1);
        this.highlight.drawRect(highlight.x, highlight.y, highlight.width, highlight.height);
        this.highlight.endFill();
    }

    public get current_pos() {
        return {line: this.current_line, col: this.current_col};
    }

    public reset(pos?: {line: number; col: number}, keep_separator?: boolean) {
        if (pos) {
            this.current_line = pos.line;
            this.current_col = pos.col;
        }

        this.clear(keep_separator);
        this.initialize();

        this.select_option();
        this.on_change();
    }

    public clear(keep_separator?: boolean) {
        this.highlight.clear();
        this.data.cursor_manager.hide();

        for (let index in this.state_sprites) {
            this.state_sprites[index].destroy();
        }
        this.state_sprites = [];

        if (this.window.page_indicator.is_set) this.window.page_indicator.terminante();
        if (!keep_separator) this.window.clear_separators();
    }

    protected get_djinn_counts(element: elements) {
        const djinn = this.selected_char.djinn_by_element[element].map(
            (djinn_key: string) => this.data.info.djinni_list[djinn_key]
        );
        return {
            total: djinn.length,
            set: djinn.filter((djinni: Djinn) => djinni.status === djinn_status.SET).length,
        };
    }

    protected get_elemental_stats(element: elements) {
        const elemental_level = this.selected_char.current_level[element];
        const elemental_power = this.selected_char.current_power[element];
        const elemental_resistance = this.selected_char.current_resist[element];

        return {level: elemental_level, power: elemental_power, resistance: elemental_resistance};
    }

    protected get_djinni_sprite(elem: elements, group: Phaser.Group, pos: {x: number; y: number}) {
        const action_key = this.data.info.djinni_sprites[elem].getSpriteKey(djinn_status.SET);
        const sprite = group.create(pos.x, pos.y, action_key);

        sprite.anchor.setTo(0.5, 1.0);
        sprite.scale.x = -1;

        const direction = reverse_directions[directions.down];
        const action = djinn_status.SET;

        this.data.info.djinni_sprites[elem].setAnimation(sprite, action);
        sprite.animations.play(this.data.info.djinni_sprites[elem].getAnimationKey(action, direction));

        return sprite;
    }
}
