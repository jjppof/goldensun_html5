import {BitmapText} from "phaser-ce";
import {djinn_status} from "../Djinn";
import {GoldenSun} from "../GoldenSun";
import {MainStatusMenu} from "../main_menus/MainStatusMenu";
import {elements} from "../utils";
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
    protected state_sprites: (Phaser.Sprite | BitmapText)[];
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

        if (!this.window.internal_groups[StatusComponent.GROUP_KEY])
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

    protected get selected_char() {
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

    public reset(pos?: {line: number; col: number}) {
        if (pos) {
            this.current_line = pos.line;
            this.current_col = pos.col;
        }

        this.clear();
        this.initialize();

        this.select_option();
        this.on_change();
    }

    public clear() {
        this.highlight.clear();
        this.data.cursor_manager.hide();

        for (let index in this.state_sprites) {
            this.state_sprites[index].destroy();
        }
        this.state_sprites = [];

        if (this.window.page_indicator.is_set) this.window.page_indicator.terminante();
    }

    protected get_djinn_counts(element: elements) {
        let set_count = 0;
        let total_count = 0;
        let djinn_names = [];

        switch (element) {
            case elements.VENUS:
                djinn_names = this.selected_char.venus_djinni;
                total_count = this.selected_char.venus_djinni.length;
                break;
            case elements.MERCURY:
                djinn_names = this.selected_char.mercury_djinni;
                total_count = this.selected_char.mercury_djinni.length;
                break;
            case elements.MARS:
                djinn_names = this.selected_char.mars_djinni;
                total_count = this.selected_char.mars_djinni.length;
                break;
            case elements.JUPITER:
                djinn_names = this.selected_char.jupiter_djinni;
                total_count = this.selected_char.jupiter_djinni.length;
                break;
        }

        for (let index in djinn_names) {
            if (this.data.info.djinni_list[djinn_names[index]].status === djinn_status.SET) set_count++;
        }

        return {set: set_count, total: total_count};
    }

    protected get_elemental_stats(element: elements) {
        let elemental_level = 0;
        let elemental_power = 0;
        let elemental_resistance = 0;

        switch (element) {
            case elements.VENUS:
                elemental_level = this.selected_char.venus_level_current;
                elemental_power = this.selected_char.venus_power_current;
                elemental_resistance = this.selected_char.venus_resist_current;
                break;
            case elements.MERCURY:
                elemental_level = this.selected_char.mercury_level_current;
                elemental_power = this.selected_char.mercury_power_current;
                elemental_resistance = this.selected_char.mercury_resist_current;
                break;
            case elements.MARS:
                elemental_level = this.selected_char.mars_level_current;
                elemental_power = this.selected_char.mars_power_current;
                elemental_resistance = this.selected_char.mars_resist_current;
                break;
            case elements.JUPITER:
                elemental_level = this.selected_char.jupiter_level_current;
                elemental_power = this.selected_char.jupiter_power_current;
                elemental_resistance = this.selected_char.jupiter_resist_current;
                break;
        }

        return {level: elemental_level, power: elemental_power, resistance: elemental_resistance};
    }
}
