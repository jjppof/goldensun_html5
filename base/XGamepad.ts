import {GoldenSun} from "./GoldenSun";

/** GBA buttons */
export enum AdvanceButton {
    A,
    B,
    L,
    R,
    START,
    SELECT,
    LEFT,
    RIGHT,
    UP,
    DOWN,
}

/** GBA button list, for mapping */
const AdvanceButtons = ["A", "B", "L", "R", "START", "SELECT", "LEFT", "RIGHT", "UP", "DOWN"];

/** Other hardware controller buttons */
export enum ControllerButton {
    LB = AdvanceButton.L,
    RB = AdvanceButton.R,
    X = AdvanceButton.DOWN + 1,
    Y,
    LS,
    RS,
    L2,
    R2,
    LT = ControllerButton.L2,
    RT = ControllerButton.R2,
    // LX, LY, RX, RY,
    LLEFT,
    LRIGHT,
    LUP,
    LDOWN,
    RLEFT,
    RRIGHT,
    RUP,
    RDOWN,
}

/** Other hardware controller buttons, for mapping */
const ControllerButtons = [
    "LB",
    "RB",
    "X",
    "Y",
    "LS",
    "RS",
    // "L2", "R2",
    "LT",
    "RT",
    // "LX", "LY", "RX", "RY",
    "LLEFT",
    "LRIGHT",
    "LUP",
    "LDOWN",
    "RLEFT",
    "RRIGHT",
    "RUP",
    "RDOWN",
];

/** Custom engine buttons */
export enum EngineButton {
    STICK_DASHING = ControllerButton.RDOWN + 1,
    PSY1,
    PSY2,
    PSY3,
    PSY4,
    ZOOM1,
    ZOOM2,
    ZOOM3,
    ZOOM4,
    MUTE,
    VOL_UP,
    VOL_DOWN,
    DEBUG_PHYSICS,
    DEBUG_GRID,
    DEBUG_KEYS,
    DEBUG_STATS,
    DEBUG_FPS,
    DEBUG_SLIDERS,
    DEBUG_CAM_MINUS,
    DEBUG_CAM_PLUS,
    DEBUG_BATTLE_ANIMATION,
    DEBUG_BATTLE_ANIM_FIRE,
    DEBUG_BATTLE_ANIM_FIRE_ALL,
}

/** Custom engine button list, for mapping */
const EngineButtons = [
    "STICK_DASHING",
    "PSY1",
    "PSY2",
    "PSY3",
    "PSY4",
    "ZOOM1",
    "ZOOM2",
    "ZOOM3",
    "ZOOM4",
    "MUTE",
    "VOL_UP",
    "VOL_DOWN",
    "DEBUG_PHYSICS",
    "DEBUG_GRID",
    "DEBUG_KEYS",
    "DEBUG_STATS",
    "DEBUG_FPS",
    "DEBUG_SLIDERS",
    "DEBUG_CAM_MINUS",
    "DEBUG_CAM_PLUS",
    "DEBUG_BATTLE_ANIMATION",
    "DEBUG_BATTLE_ANIM_FIRE",
    "DEBUG_BATTLE_ANIM_FIRE_ALL",
];

// export type Button = AdvanceButton | EngineButton;
// export type Button = typeof AdvanceButton & typeof EngineButton;
// export type Button = typeof Button;

/** Enum regrouping GBA and engine buttons */
export const Button = {...EngineButton, ...AdvanceButton};

/** Any buttons recognized by the engine */
export type Button = AdvanceButton | EngineButton;

/** A real controller or an engine button */
export type AnyButton = Button | ControllerButton;

/** Used to map a real button/key to an emulated controller */
type KeyMap = {
    /** Game button */
    game_button: AnyButton;
    /** Game button group that triggers the game button */
    game_buttons?: AnyButton[];
    /** For multi-button name chaining (reflect) */
    name?: string;
    /** For multi-buttons, raw button combinaison */
    as?: string;
    /** Button code of the controller button that triggers the game button */
    button_code?: number;
    /** Button codes of the controller buttons that trigger the game button, should match {@link KeyMap#game_buttons} */
    button_codes?: number[];
    /** Keycode of the keyboard key that triggers the game button */
    key_code?: number;
    /** Modifiers needed along the {@link KeyMap#key_code} */
    key_modifiers?: {alt?: boolean; ctrl?: boolean; shift?: boolean};
};

export class GamepadButton {
    /** Emulated gamepad controller */
    gamepad: Gamepad;
    /** Game button that will trigger */
    button: AnyButton;
    /** Debug purpose */
    name: string = undefined;
    /** Whether the gamepad button is held down */
    is_down: boolean = false;
    /** Signal to trigger when that button is pressed */
    on_down = new Phaser.Signal();
    /** Signal to trigger when that button is release */
    on_up = new Phaser.Signal();

    constructor(gamepad: Gamepad, button: AnyButton) {
        this.gamepad = gamepad;
        this.button = button;
        this.name = Button[this.button] ?? ControllerButton[this.button];
    }
    /** Whether the gamepad button is up */
    get is_up() {
        return !this.is_down;
    }
    set is_up(v: boolean) {
        this.is_down = !v;
    }
}

/**
 * An emulated gamepad.
 */
export class Gamepad {
    /** Controller gamepad buttons configuration */
    static gamepad_mapping: KeyMap[];
    /** Controller gamepad sticks configuration */
    static gamepad_stick_mapping: KeyMap[];
    /** Keyboard gamepad keys configuration */
    static keyboard_mapping: KeyMap[];
    /**
     * Loads the gamepad and keyboard configuration.
     * @param {GoldenSun} data - Master game data object
     * @param {string} [input_type=default_inputs] - Keyboard key mapping configuration name
     */
    static initialize(data: GoldenSun, input_type: string = "default_inputs") {
        // Load default gamepad buttons configuration
        const gamepad_mapping = Object.entries(data.dbs.init_db.gamepad_rinputs as {[code: string]: string}).map(
            ([button_code, game_button]): KeyMap => ({
                name: game_button,
                game_button: Button[game_button] ?? ControllerButton[game_button],
                button_code: Phaser.Gamepad[button_code],
            })
        );
        // Load custom gamepad buttons configuration
        const gamepad_custom_mapping = Object.entries(data.dbs.init_db.gamepad_inputs as {[code: string]: string}).map(
            ([game_button, button_code]): KeyMap => {
                const matches = button_code.match(/^(?:(?:(\w+) *\+ *)?(\w+) *\+ *)?(\w+)$/);
                if (!matches) console.error("Input not recognized " + button_code);
                const get_button_code = (code: string): number =>
                    gamepad_mapping.find(km => km.name === code)?.button_code ?? Phaser.Gamepad[code];
                const get_game_button = (code: string): number =>
                    gamepad_mapping.find(km => km.name === code || km.button_code === Phaser.Gamepad[code])
                        ?.game_button;
                const km: KeyMap = {name: game_button, as: button_code, game_button: EngineButton[game_button]};
                if (matches[matches.length - 2]) {
                    const buttons = matches.filter((m, i) => i && m);
                    km.button_codes = buttons.map(get_button_code).filter(bc => bc !== undefined);
                    km.game_buttons = buttons.map(get_game_button).filter(bc => bc !== undefined);
                    if (km.button_codes.length !== km.game_buttons.length)
                        data.logger.log_message(`${button_code} not well recognized!`);
                } else km.button_code = get_button_code(matches[matches.length - 1]);
                return km;
            }
        );
        // Load gamepad stick configuration
        const gamepad_stick_mapping = Object.entries(
            data.dbs.init_db.gamepad_rsticks as {[code: string]: [string, string]}
        ).map(
            ([button_code, game_buttons]): KeyMap => ({
                game_button: null,
                game_buttons: game_buttons.map(gb => ControllerButton[gb]),
                button_code: Phaser.Gamepad[button_code],
            })
        );
        Gamepad.gamepad_stick_mapping = gamepad_stick_mapping;
        Gamepad.gamepad_mapping = gamepad_mapping.concat(gamepad_custom_mapping);
        // Load keyboard keys configuration
        Gamepad.keyboard_mapping = Object.entries(data.dbs.init_db[input_type] as {[code: string]: string}).map(
            ([game_button, key_code]): KeyMap => {
                const matches = key_code.match(
                    /^(?:(?:(?:(ALT|CTRL|SHIFT) *\+ *)?(ALT|CTRL|SHIFT) *\+ *)?(ALT|CTRL|SHIFT) *\+ *)?(\w+)$/
                );
                if (!matches) console.error("Input not recognized " + key_code);
                const km: KeyMap = {
                    name: game_button,
                    as: key_code,
                    game_button: Button[game_button],
                    key_code: Phaser.Keyboard[matches[matches.length - 1]],
                };
                if (matches[matches.length - 2]) {
                    const modifiers = matches.filter((m, i) => i && m);
                    km.key_modifiers = {};
                    if (modifiers.includes("ALT")) km.key_modifiers.alt = true;
                    if (modifiers.includes("CTRL")) km.key_modifiers.ctrl = true;
                    if (modifiers.includes("SHIFT")) km.key_modifiers.shift = true;
                }
                return km;
            }
        );
    }

    /**
     * Gets the GBA button(s) attached to the controller button.
     * @param {number} button_code - Controller button code.
     * @return {AnyButton[]} - GBA (custom) button(s)
     */
    static transcode_gamepad_button(button_code: number): AnyButton[] {
        // return Gamepad.keyboard_mapping.find(km => km.button_code === button_code)?.game_button;
        return Gamepad.gamepad_mapping.filter(km => km.button_code === button_code).map(km => km.game_button);
    }
    /**
     * Gets the GBA button(s) attached to the Phaser keyboard key.
     * @param {number} key_code - Phaser keyboard key code.
     * @return {AnyButton[]} - GBA (custom) button(s)
     */
    static transcode_keyboard_key(key_code: number): AnyButton[] {
        // Use a single array Gamepad.keyboard_fast_mapping[key_code]?
        return Gamepad.keyboard_mapping.filter(km => km.key_code === key_code).map(km => km.game_button);
    }

    /**
     * Gets the oppposite button.
     * @param {Button} game_button - GBA button
     * @return {?Button} - Opposite GBA button
     */
    static get_opposite_button(game_button: Button): Button {
        switch (game_button) {
            // Advance buttons
            case Button.LEFT:
                return Button.RIGHT;
            case Button.RIGHT:
                return Button.LEFT;
            case Button.UP:
                return Button.DOWN;
            case Button.DOWN:
                return Button.UP;
            case Button.L:
                return Button.R;
            case Button.R:
                return Button.L;
            // Engine buttons
            case Button.VOL_UP:
                return Button.VOL_DOWN;
            case Button.VOL_DOWN:
                return Button.VOL_UP;
            default:
                return null;
        }
    }

    /** Every game buttons of the emulated gamepad */
    buttons: {[button in AnyButton]?: GamepadButton} = [];
    /** The stick dead zone */
    stick_dead_zone: number;
    /** The trigger dead zone */
    trigger_dead_zone: number;
    /** Whether the last button pressed comes from the keybord or the controller */
    is_last_input_gamepad: boolean;

    /**
     * @param {GoldenSun} data - Master game data object
     */
    constructor(data: GoldenSun) {
        Gamepad.initialize(data, navigator.language === "fr-FR" ? "azerty_inputs" : "default_inputs");
        this.register_handle_events(data.game);

        // Create a state for every buttons
        AdvanceButtons.forEach(button_name => {
            this.buttons[Button[button_name]] = new GamepadButton(this, Button[button_name]);
        });
        ControllerButtons.forEach(button_name => {
            this.buttons[ControllerButton[button_name]] = new GamepadButton(this, ControllerButton[button_name]);
        });
        EngineButtons.filter(bn => bn).forEach(button_name => {
            this.buttons[EngineButton[button_name]] = new GamepadButton(this, EngineButton[button_name]);
        });

        /** Triggers another button along a specific button */
        const mirror_button = (button: ControllerButton, to: AdvanceButton) => {
            this.buttons[button].on_down.add(() => this.on_gamepad_down(to));
            this.buttons[button].on_up.add(() => this.on_gamepad_up(to));
        };
        if (data.dbs.init_db.gamepad?.use_trigger_as_button === true) {
            mirror_button(ControllerButton.LT, Button.L);
            mirror_button(ControllerButton.RT, Button.R);
        }
        if (data.dbs.init_db.gamepad?.left_stick_as_dpad === true) {
            mirror_button(ControllerButton.LLEFT, Button.LEFT);
            mirror_button(ControllerButton.LRIGHT, Button.RIGHT);
            mirror_button(ControllerButton.LUP, Button.UP);
            mirror_button(ControllerButton.LDOWN, Button.DOWN);
        }
        if (data.dbs.init_db.gamepad?.right_stick_as_dpad === true) {
            mirror_button(ControllerButton.RLEFT, Button.LEFT);
            mirror_button(ControllerButton.RRIGHT, Button.RIGHT);
            mirror_button(ControllerButton.RUP, Button.UP);
            mirror_button(ControllerButton.RDOWN, Button.DOWN);
        }
        this.stick_dead_zone = data.dbs.init_db.gamepad?.stick_dead_zone ?? 0.5;
        this.trigger_dead_zone = data.dbs.init_db.gamepad?.trigger_dead_zone ?? 0.6;
        this.is_last_input_gamepad = false;
    }

    /**
     * Press the game button if it is up then triggers the listeners.
     * @param {AnyButton} game_button - The game button to press
     * @param {?KeyboardEvent} event - The keyboard event if any
     */
    private _on_down(game_button: AnyButton, event?: KeyboardEvent): GamepadButton {
        const btn = this.buttons[game_button];
        if (btn.is_down) return null;
        btn.is_down = true;
        btn.on_down.dispatch(event);
        return btn;
    }

    /**
     * Releases the game button if it is held down then triggers the listeners.
     * @param {AnyButton} game_button - The game button to release
     * @param {?KeyboardEvent} event - The keyboard event if any
     */
    private _on_up(game_button: AnyButton, event?: KeyboardEvent): GamepadButton {
        const btn = this.buttons[game_button];
        if (btn.is_up) return null;
        btn.is_up = true;
        btn.on_up.dispatch(event);
        return btn;
    }

    /**
     * Press any multi-buttons involved if none the button itself.
     * @param {AnyButton} game_button - The game button getting pressed
     */
    on_gamepad_down(game_button: AnyButton) {
        const group_game_buttons = Gamepad.gamepad_mapping.filter(
            km =>
                km.game_button &&
                // Check if it's the LAST button of any combo
                km.game_buttons?.[km.game_buttons.length - 1] === game_button &&
                // Check if it's any button of any combo
                // km.game_buttons?.includes(game_button) &&
                // Then if the others buttons are held down
                km.game_buttons.every(gb => gb === game_button || this.is_down(gb))
            // .filter(gb => gb !== game_button)
            // .every(gb => this.is_down(gb))
        );
        if (group_game_buttons.length) return group_game_buttons.forEach(km => this._on_down(km.game_button));
        this._on_down(game_button);
    }

    /**
     * Releases any multi-buttons involved and the button itself.
     * @param {AnyButton} game_button - The game button getting released
     */
    on_gamepad_up(game_button: AnyButton) {
        const group_game_buttons = Gamepad.gamepad_mapping.filter(
            km => km.game_button && km.game_buttons?.includes(game_button)
        );
        group_game_buttons.forEach(km => this._on_up(km.game_button));
        this._on_up(game_button);
    }

    /**
     * Registers internal listeners on the gamepad and the keyboard to trigger emulated game button.
     * @param {Phaser.Game} game - Phaser game
     */
    register_handle_events(game: Phaser.Game) {
        game.input.gamepad.start();
        game.input.gamepad.onDownCallback = (button_code: number) => {
            this.is_last_input_gamepad = true;

            const game_buttons = Gamepad.transcode_gamepad_button(button_code);
            game_buttons.forEach(game_button => this.on_gamepad_down(game_button));
        };
        game.input.gamepad.onUpCallback = (button_code: number) => {
            this.is_last_input_gamepad = true;

            const game_buttons = Gamepad.transcode_gamepad_button(button_code);
            game_buttons.forEach(game_button => this.on_gamepad_up(game_button));
        };
        game.input.gamepad.onAxisCallback = (pad: Phaser.SinglePad, index: number, value: number) => {
            this.is_last_input_gamepad = true;

            const game_buttons = Gamepad.gamepad_stick_mapping.filter(km => km.button_code === index);
            game_buttons.forEach(km => {
                if (value < -this.stick_dead_zone) this.on_gamepad_down(km.game_buttons[0]);
                else if (value > this.stick_dead_zone) this.on_gamepad_down(km.game_buttons[1]);
                else {
                    this.on_gamepad_up(km.game_buttons[0]);
                    this.on_gamepad_up(km.game_buttons[1]);
                }
            });
        };
        game.input.gamepad.onFloatCallback = (button_code: number, value: number) => {
            this.is_last_input_gamepad = true;

            const game_buttons = Gamepad.transcode_gamepad_button(button_code);
            game_buttons.forEach(game_button =>
                value > this.trigger_dead_zone ? this.on_gamepad_down(game_button) : this.on_gamepad_up(game_button)
            );
        };

        // Not using .onPressCallback since it triggers with a char, not a key
        game.input.keyboard.onDownCallback = (event: KeyboardEvent) => {
            this.is_last_input_gamepad = false;

            const game_buttons = Gamepad.keyboard_mapping
                .filter(
                    km =>
                        km.key_code === event.keyCode &&
                        (km.key_modifiers?.alt != undefined ? km.key_modifiers.alt === event.altKey : true) &&
                        (km.key_modifiers?.ctrl != undefined ? km.key_modifiers.ctrl === event.ctrlKey : true) &&
                        (km.key_modifiers?.shift != undefined ? km.key_modifiers.shift === event.shiftKey : true)
                )
                .map(km => km.game_button);
            game_buttons.forEach(game_button => this._on_down(game_button, event));
        };
        game.input.keyboard.onUpCallback = (event: KeyboardEvent) => {
            this.is_last_input_gamepad = true;

            const game_buttons = Gamepad.transcode_keyboard_key(event.keyCode);
            game_buttons.forEach(game_button => this._on_up(game_button, event));
        };
    }

    /**
     * Returns a gamepad button state with its signal attached.
     * @param buttons - GBA (custom) button (or array of buttons)
     * @return - GBA button (or array of buttons) state
     */
    get_button<T extends AnyButton | AnyButton[]>(buttons: T): T extends AnyButton ? GamepadButton : GamepadButton[];
    get_button(buttons: AnyButton | AnyButton[]): GamepadButton | GamepadButton[] {
        if (Array.isArray(buttons)) {
            return buttons.map(button => this.buttons[button]);
        }
        return this.buttons[buttons];
    }

    /**
     * Checks if a gamepad button is currently down.
     * @param {AnyButton} button - GBA (custom) button
     * @return {boolean} - Whether the gamepad button is held down
     */
    is_down(button: AnyButton): boolean {
        return this.buttons[button].is_down;
    }

    /**
     * Checks if a gamepad button is currently up.
     * @param {AnyButton} button - GBA (custom) button
     * @return {boolean} - Whether the gamepad button is up
     */
    is_up(button: AnyButton): boolean {
        return this.buttons[button].is_up;
    }
}
