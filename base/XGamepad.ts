import {GoldenSun} from "./GoldenSun";

// export type GamepadState = {
// 	A: number = 1 << 0;
// 	B: number = 1 << 1;
// 	L: number = 1 << 2;
// 	R: number = 1 << 3;

// 	START: number = 1 << 4;
// 	SELECT: number = 1 << 5;

// 	LEFT: number = 1 << 6;
// 	RIGHT: number = 1 << 7;
// 	UP: number = 1 << 8;
// 	DOWN: number = 1 << 9;
// };

/** GBA buttons */
export enum Button {
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
const Buttons = ["A", "B", "L", "R", "START", "SELECT", "LEFT", "RIGHT", "UP", "DOWN"];

/** Custom buttons */
export enum CButton {
    LB = Button.L,
    RB = Button.R,
    BUTTON = Button.DOWN,
    X,
    Y,
    LS,
    RS,
    L2,
    R2,
    LT = CButton.L2,
    RT = CButton.R2,
    // LX, LY, RX, RY,
    LLEFT,
    LRIGHT,
    LUP,
    LDOWN,
    RLEFT,
    RRIGHT,
    RUP,
    RDOWN,
    PSY1,
    PSY2,
    PSY3,
    PSY4,
    ZOOM1,
    ZOOM2,
    ZOOM3,
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
}

/** Custom button list, for mapping */
const CButtons = [
    "X",
    "Y",
    "LS",
    "RS",
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
    "PSY1",
    "PSY2",
    "PSY3",
    "PSY4",
    "ZOOM1",
    "ZOOM2",
    "ZOOM3",
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
];

/** Default XBOX360 controller buttons mapping */
const XBOX360_MAPPING = {
    XBOX360_A: "A",
    XBOX360_B: "B",
    XBOX360_LEFT_BUMPER: "LB",
    XBOX360_RIGHT_BUMPER: "RB",

    XBOX360_X: "X",
    XBOX360_Y: "Y",
    XBOX360_LEFT_TRIGGER: "LT",
    XBOX360_RIGHT_TRIGGER: "RT",
    XBOX360_STICK_LEFT_BUTTON: "LS",
    XBOX360_STICK_RIGHT_BUTTON: "RS",
    XBOX360_STICK_LEFT_X: "LX",
    XBOX360_STICK_LEFT_Y: "LY",
    XBOX360_STICK_RIGHT_X: "RX",
    XBOX360_STICK_RIGHT_Y: "RY",
};

/** Used to map a real button/key to an emulated controller */
type KeyMap = {
    /** Game button */
    gameButton: Button | CButton;
    /** Game button group that triggers the game button */
    gameButtons?: (Button | CButton)[];
    /** For multi-button name chaining (reflect) */
    name?: string;
    /** For multi-buttons, raw button combinaison */
    as?: string;
    /** Keycode of the keyboard key that triggers the game button */
    keyCode?: number;
    /** Button code of the controller button that triggers the game button */
    buttonCode?: number;
    /** Button codes of the controller buttons that trigger the game button, should match {@link KeyMap#gameButtons} */
    buttonCodes?: number[];
};

export class GamepadButton {
    /** Emulated gamepad controller */
    gamepad: Gamepad;
    /** Game button that will trigger */
    button: Button | CButton;
    /** Debug purpose */
    name: string = undefined;
    /** Whether the gamepad button is held down */
    isDown: boolean = false;
    /** Signal to trigger when that button is pressed */
    onDown = new Phaser.Signal();
    /** Signal to trigger when that button is release */
    onUp = new Phaser.Signal();

    constructor(gamepad: Gamepad, button: Button | CButton) {
        this.gamepad = gamepad;
        this.button = button;
        this.name = Button[this.button] ?? CButton[this.button];
    }
    /** Whether the gamepad button is up */
    get isUp() {
        return !this.isDown;
    }
    set isUp(v: boolean) {
        this.isDown = !v;
    }
}

/**
 * An emulated gamepad.
 */
export class Gamepad {
    /** Default gamepad buttons configuration */
    static gamepadMapping: KeyMap[];
    /** Custom gamepad buttons configuration */
    static gamepadStickMapping: KeyMap[];
    /** Custom gamepad buttons configuration */
    static keyboardMapping: KeyMap[];
    /**
     * Loads the gamepad and keyboard configuration.
     * @param {GoldenSun} data - Master game data object
     * @param {string} [input_type=default_inputs] - Keyboard key mapping configuration name
     */
    static initialize(data: GoldenSun, input_type: string = "default_inputs") {
        // Load default gamepad buttons configuration
        const gamepadMapping = Object.entries(data.dbs.init_db.gamepad_rinputs as {[code: string]: string}).map(
            ([buttonCode, gameButton]): KeyMap => ({
                name: gameButton,
                gameButton: Button[gameButton] ?? CButton[gameButton],
                buttonCode: Phaser.Gamepad[buttonCode],
            })
        );
        // Load custom gamepad buttons configuration
        const gamepadCustomMapping = Object.entries(data.dbs.init_db.gamepad_inputs as {[code: string]: string})
            .map(
                ([gameButton, buttonCode]): KeyMap => {
                    const matches = buttonCode.match(/^(?:(?:(\w+) *\+ *)?(\w+) *\+ *)?(\w+)$/);
                    if (!matches) throw new Error("Input not recognized " + buttonCode);
                    const getButtonCode = (code: string): number =>
                        gamepadMapping.find(km => km.name === code)?.buttonCode ?? Phaser.Gamepad[code];
                    const getGameButton = (code: string): number =>
                        gamepadMapping.find(km => km.name === code || km.buttonCode === Phaser.Gamepad[code])
                            ?.gameButton;
                    const km: KeyMap = {name: gameButton, as: buttonCode, gameButton: CButton[gameButton]};
                    if (matches[matches.length - 2]) {
                        const buttons = Array.prototype.filter.call(matches, (m, i) => i && m);
                        km.buttonCodes = buttons.map(getButtonCode).filter(bc => bc !== undefined);
                        km.gameButtons = buttons.map(getGameButton).filter(bc => bc !== undefined);
                        if (km.buttonCodes.length !== km.gameButtons.length)
                            console.warn(`${buttonCode} not well recognized!`);
                    } else km.buttonCode = getButtonCode(matches[matches.length - 1]);
                    return km;
                }
            )
            .filter(km => km);
        // Load gamepad stick configuration
        const gamepadStickMapping = Object.entries(
            data.dbs.init_db.gamepad_rsticks as {[code: string]: [string, string]}
        ).map(
            ([buttonCode, gameButtons]): KeyMap => ({
                gameButton: null,
                gameButtons: gameButtons.map(gb => CButton[gb]),
                buttonCode: Phaser.Gamepad[buttonCode],
            })
        );
        Gamepad.gamepadStickMapping = gamepadStickMapping;
        Gamepad.gamepadMapping = gamepadMapping.concat(gamepadCustomMapping);
        // Load keyboard keys configuration
        Gamepad.keyboardMapping = Object.entries(data.dbs.init_db[input_type] as {[code: string]: string}).map(
            ([gameButton, keyCode]): KeyMap => ({
                gameButton: Button[gameButton] ?? CButton[gameButton],
                keyCode: Phaser.Keyboard[keyCode],
            })
        );
        // TODO: Handle Alt/Ctrl/Shift modifier.
    }

    /**
     * Gets the GBA button(s) attached to the controller button.
     * @param {number} buttonCode - Controller button code.
     * @return {(Button|CButton[]} - GBA (custom) button(s)
     */
    static transcodeGamepadButton(buttonCode: number) {
        // return Gamepad.keyboardMapping.find(km => km.buttonCode === buttonCode)?.gameButton;
        return Gamepad.gamepadMapping.filter(km => km.buttonCode === buttonCode).map(km => km.gameButton);
    }
    /**
     * Gets the GBA button(s) attached to the Phaser keyboard key.
     * @param {number} keyCode - Phaser keyboard key code.
     * @return {(Button|CButton)[]} - GBA custom button(s)
     */
    static transcodeKeyboardKey(keyCode: number) {
        // Use a single array Gamepad.keyboardFastMapping[keyCode] ?
        return Gamepad.keyboardMapping.filter(km => km.keyCode === keyCode).map(km => km.gameButton);
    }

    /**
     * Gets the oppposite button.
     * @param {Button} gameButton - GBA button
     * @return {?Button} - Opposite GBA button
     */
    static getOppositeButton(gameButton: Button) {
        switch (gameButton) {
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
            default:
                return null;
        }
    }

    /** Every game buttons of the emulated gamepad */
    buttons: {[button in Button | CButton]?: GamepadButton} = [];
    /** The stick dead zone */
    stickDeadZone: number;
    /** The trigger dead zone */
    triggerDeadZone: number;
    /** Whether the last button pressed comes from the keybord or the controller */
    lastInputGamepad: boolean;

    /**
     * @param {GoldenSun} data - Master game data object
     */
    constructor(data: GoldenSun) {
        Gamepad.initialize(data, navigator.language === "fr-FR" ? "azerty_inputs" : "default_inputs");
        this.registerHandleEvents(data.game);
        Buttons.forEach(buttonName => {
            this.buttons[Button[buttonName]] = new GamepadButton(this, Button[buttonName]);
        });
        CButtons.filter(bn => bn).forEach(buttonName => {
            this.buttons[CButton[buttonName]] = new GamepadButton(this, CButton[buttonName]);
        });
        const mirrorButton = (button: Button | CButton, to: Button | CButton) => {
            this.buttons[button].onDown.add(() => this.onGamepadDown(to));
            this.buttons[button].onUp.add(() => this.onGamepadUp(to));
        };
        if (data.dbs.init_db.gamepad?.UseTriggerAsButton === true) {
            mirrorButton(CButton.LT, Button.L);
            mirrorButton(CButton.RT, Button.R);
        }
        if (data.dbs.init_db.gamepad?.LeftStickAsDPad === true) {
            mirrorButton(CButton.LLEFT, Button.LEFT);
            mirrorButton(CButton.LRIGHT, Button.RIGHT);
            mirrorButton(CButton.LUP, Button.UP);
            mirrorButton(CButton.LDOWN, Button.DOWN);
        }
        if (data.dbs.init_db.gamepad?.RightStickAsDPad === true) {
            mirrorButton(CButton.RLEFT, Button.LEFT);
            mirrorButton(CButton.RRIGHT, Button.RIGHT);
            mirrorButton(CButton.RUP, Button.UP);
            mirrorButton(CButton.RDOWN, Button.DOWN);
        }
        this.stickDeadZone = data.dbs.init_db.gamepad?.StickDeadZone ?? 0.5;
        this.triggerDeadZone = data.dbs.init_db.gamepad?.TriggerDeadZone ?? 0.6;
        this.lastInputGamepad = false;
    }

    /**
     * Press the game button if it is up then triggers the listeners.
     * @param {Button|CButton} gameButton - The game button to press
     * @param {?KeyboardEvent} event - The keyboard event if any
     */
    _onDown(gameButton: Button | CButton, event?: KeyboardEvent) {
        const btn = this.buttons[gameButton];
        if (btn.isDown) return;
        btn.isDown = true;
        console.log("onDown", Button[gameButton] ?? CButton[gameButton], btn);
        btn.onDown.dispatch(event);
    }

    /**
     * Releases the game button if it is held down then triggers the listeners.
     * @param {Button|CButton} gameButton - The game button to release
     * @param {?KeyboardEvent} event - The keyboard event if any
     */
    _onUp(gameButton: Button | CButton, event?: KeyboardEvent) {
        const btn = this.buttons[gameButton];
        if (btn.isUp) return;
        btn.isUp = true;
        console.log("onUp", Button[gameButton] ?? CButton[gameButton], btn);
        btn.onUp.dispatch(event);
    }

    /**
     * Press any multi-buttons involved if none the button itself.
     * @param {Button|CButton} gameButton - The game button getting pressed
     */
    onGamepadDown(gameButton: Button | CButton) {
        const groupGameButtons = Gamepad.gamepadMapping.filter(
            km =>
                km.gameButton &&
                km.gameButtons?.[km.gameButtons.length - 1] === gameButton &&
                // km.gameButtons?.includes(gameButton) &&
                km.gameButtons.every(gb => gb === gameButton || this.isDown(gb))
            // .filter(gb => gb !== gameButton)
            // .every(gb => this.isDown(gb))
        );
        if (groupGameButtons.length) return groupGameButtons.forEach(km => this._onDown(km.gameButton));
        this._onDown(gameButton);
    }

    /**
     * Releases any multi-buttons involved and the button itself.
     * @param {Button|CButton} gameButton - The game button getting released
     */
    onGamepadUp(gameButton: Button | CButton) {
        const groupGameButtons = Gamepad.gamepadMapping.filter(
            km => km.gameButton && km.gameButtons?.includes(gameButton)
        );
        groupGameButtons.forEach(km => this._onUp(km.gameButton));
        this._onUp(gameButton);
    }

    /**
     * Registers internal listeners on the gamepad and the keyboard to trigger emulated game button.
     * @param {Phaser.Game} game - Phaser game
     */
    registerHandleEvents(game: Phaser.Game) {
        game.input.gamepad.start();
        game.input.gamepad.onDownCallback = (buttonCode: number) => {
            const gameButtons = Gamepad.transcodeGamepadButton(buttonCode);
            console.log(buttonCode, gameButtons);
            gameButtons.forEach(gameButton => this.onGamepadDown(gameButton));
        };
        game.input.gamepad.onUpCallback = (buttonCode: number) => {
            const gameButtons = Gamepad.transcodeGamepadButton(buttonCode);
            console.log(buttonCode, gameButtons);
            gameButtons.forEach(gameButton => this.onGamepadUp(gameButton));
        };
        game.input.gamepad.onAxisCallback = (pad: Phaser.SinglePad, index: number, value: number) => {
            // const gameButtons = {
            //     // [Phaser.Gamepad["XBOX360_STICK_LEFT_X"]]: [Button.LEFT,Button.RIGHT],
            //     // [Phaser.Gamepad["XBOX360_STICK_LEFT_Y"]]: [Button.UP,Button.DOWN],
            //     // [Phaser.Gamepad["XBOX360_STICK_RIGHT_X"]]: [Button.LEFT,Button.RIGHT],
            //     // [Phaser.Gamepad["XBOX360_STICK_RIGHT_Y"]]: [Button.UP,Button.DOWN],
            //     [Phaser.Gamepad["XBOX360_STICK_LEFT_X"]]: [CButton.LLEFT, CButton.LRIGHT],
            //     [Phaser.Gamepad["XBOX360_STICK_LEFT_Y"]]: [CButton.LUP, CButton.LDOWN],
            //     [Phaser.Gamepad["XBOX360_STICK_RIGHT_X"]]: [CButton.RLEFT, CButton.RRIGHT],
            //     [Phaser.Gamepad["XBOX360_STICK_RIGHT_Y"]]: [CButton.RUP, CButton.RDOWN],
            // }[index];

            // const gameButtons = Gamepad.gamepadStickMapping.find(km => km.buttonCode === index)?.gameButtons;

            // if (!gameButtons) return;

            // if (value < -this.stickDeadZone) this.onGamepadDown(gameButtons[0]);
            // else if (value > this.stickDeadZone) this.onGamepadDown(gameButtons[1]);
            // else {
            //     this.onGamepadUp(gameButtons[0]);
            //     this.onGamepadUp(gameButtons[1]);
            // }

            const gameButtons = Gamepad.gamepadStickMapping.filter(km => km.buttonCode === index);
            gameButtons.forEach(km => {
                if (value < -this.stickDeadZone) this.onGamepadDown(km.gameButtons[0]);
                else if (value > this.stickDeadZone) this.onGamepadDown(km.gameButtons[1]);
                else {
                    this.onGamepadUp(km.gameButtons[0]);
                    this.onGamepadUp(km.gameButtons[1]);
                }
            });
        };
        game.input.gamepad.onFloatCallback = (buttonCode: number, value: number) => {
            const gameButtons = Gamepad.transcodeGamepadButton(buttonCode);
            gameButtons.forEach(gameButton =>
                value > this.triggerDeadZone ? this.onGamepadDown(gameButton) : this.onGamepadUp(gameButton)
            );

            // const gameButton = {
            // 	[Phaser.Gamepad["XBOX360_LEFT_TRIGGER"]]: CButton.L2,
            // 	[Phaser.Gamepad["XBOX360_RIGHT_TRIGGER"]]: CButton.R2,
            // }[buttonCode];

            // console.log(buttonCode, value, Button[gameButton]);

            // value ? value > this.triggerDeadZone && this._onDown(gameButton) : this._onUp(gameButton)
            // value ? value > 0.6 && this._onDown(gameButton) : this._onUp(gameButton);
        };

        // game.input.keyboard.onPressCallback = (charCode: string, event: KeyboardEvent) => {
        game.input.keyboard.onDownCallback = (event: KeyboardEvent) => {
            const gameButtons = Gamepad.transcodeKeyboardKey(event.keyCode);
            console.log(event, gameButtons);
            gameButtons.forEach(gameButton => this._onDown(gameButton, event));
            // onKeyboardDown(gameButton)
        };
        game.input.keyboard.onUpCallback = (event: KeyboardEvent) => {
            const gameButtons = Gamepad.transcodeKeyboardKey(event.keyCode);
            console.log(event, gameButtons);
            gameButtons.forEach(gameButton => this._onUp(gameButton, event));
            // onKeyboardUp(gameButton)
        };
    }

    /**
     * Returns a gamepad button state with its signal attached.
     * @param {Button|CButton} button - GBA (custom) button
     * @return {GamepadButton} - GBA button state
     */
    getButton(button: Button | CButton) {
        return this.buttons[button];
    }

    /**
     * Checks if a gamepad button is currently down.
     * @param {Button|CButton} button - GBA (custom) button
     * @return {boolean} - Whether the gamepad button is held down
     */
    isDown(button: Button | CButton) {
        return this.buttons[button].isDown;
    }

    /**
     * Checks if a gamepad button is currently up.
     * @param {Button|CButton} button - GBA (custom) button
     * @return {boolean} - Whether the gamepad button is up
     */
    isUp(button: Button | CButton) {
        return this.buttons[button].isUp;
    }
}

(window as any).XGamepad = Gamepad;
(window as any).XButton = Button;
(window as any).XCButton = CButton;
