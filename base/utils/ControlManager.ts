import * as _ from "lodash";
import {Audio} from "../Audio";
import {Gamepad as XGamepad, Button, GamepadButton} from "../XGamepad";

const DEFAULT_LOOP_TIME = Phaser.Timer.QUARTER >> 1;

export type Control = {
    /** The button that will fire the callbacks. If it's an array, the buttons will be tested if pressed in order. */
    buttons: Button | Button[];
    on_down?: Function;
    on_up?: Function;
    /** Stop propagation of the event, blocking the dispatch to next listener on the queue. Does not work for loops. */
    halt?: boolean;
    params?: {
        /**
         * Will reset all controls that were set together upon this button press.
         * Double check it usage when "no_initial_reset" was set to true in further controls.
         * Only works if "persist" is false.
         */
        reset_controls?: boolean;
        /** Time between each trigger on button held */
        loop_time?: number;
    };
    sfx?: {up?: string; down?: string};
};

export type ControlParams = {
    loop_config?: {
        vertical?: boolean;
        vertical_time?: number;
        horizontal?: boolean;
        horizontal_time?: number;
        shoulder?: boolean;
        shoulder_time?: number;
    };
    /**
     * Whether the bindings set must persist even if ControlManager.reset is called.
     * If true, ControlManager.detach_bindings need to be called to disable these controls.
     * */
    persist?: boolean;
    /**
     * Whether to reset the current controls before attaching new ones.
     * Only works for controls set with "persist" false.
     * When setting this to true, use it wiselly.
     * */
    no_initial_reset?: boolean;
};

export type SimpleControlParams = {
    /**
     * Will reset all controls that were set together upon this button press.
     * Double check it usage when "no_initial_reset" was set to true in further controls.
     * Only works if "persist" is false.
     */
    reset_on_press?: boolean;
    /** If true, only button A will receive the callback. Otherwise button B also receives. */
    confirm_only?: boolean;
    /**
     * Whether the bindings set must persist even if ControlManager.reset is called.
     * If true, ControlManager.detach_bindings need to be called to disable these controls.
     * */
    persist?: boolean;
    /**
     * Whether to reset the current controls before attaching new ones.
     * Only works for controls set with "persist" false.
     * When setting this to true, use it wiselly.
     * */
    no_initial_reset?: boolean;
    /** The sfx to be played upon button pressed. */
    sfx?: string;
};

/**
 * This class allows to bind callbacks to gamepad buttons.
 * For permanent bindins, set "persist" to true when adding controls.
 * Permanent bindings are kepts even if you call ControlManager.reset.
 * Otherwise, set "persist" to false, then these controls will be disabled
 * after ControlManager.reset being called.
 */
export class ControlManager {
    private game: Phaser.Game;
    private gamepad: XGamepad;
    private audio: Audio;

    private disabled: boolean;

    /** Current binding set, that will be reset upon demand. */
    private current_signal_bindings: Phaser.SignalBinding[];
    /** Key of the current binding set. */
    private current_set_key?: number;
    /** Every currently listening signals (binding sets). */
    private signal_bindings: {[key: number]: Phaser.SignalBinding[]};
    /** Some timer */
    private loop_start_timer: Phaser.Timer;
    /** Some timer */
    private loop_repeat_timer: Phaser.Timer;

    constructor(game: Phaser.Game, gamepad: XGamepad, audio: Audio) {
        this.game = game;
        this.gamepad = gamepad;
        this.audio = audio;

        this.disabled = false;

        this.current_signal_bindings = [];
        this.current_set_key = null;
        this.signal_bindings = {};

        this.loop_start_timer = this.game.time.create(false);
        this.loop_repeat_timer = this.game.time.create(false);
    }

    private get initialized() {
        return this.current_signal_bindings.length;
    }

    /**
     * Binds a callback for button A that will be unbound on use.
     * @param {Function} callback - The callback to call.
     * @param {Object} params - Some parameters for these controls.
     */
    add_simple_controls(callback: Function, params?: SimpleControlParams) {
        const controls: Control[] = [
            {
                buttons: Button.A,
                on_down: callback,
                params: {reset_controls: params?.reset_on_press},
                sfx: params?.sfx ? {down: params?.sfx} : null,
            },
        ];

        if (params?.confirm_only !== true) {
            controls.push({
                buttons: Button.B,
                on_down: callback,
                params: {reset_controls: params?.reset_on_press},
                sfx: params?.sfx ? {down: params?.sfx} : null,
            });
        }

        return params
            ? this.add_controls(controls, {persist: params?.persist, no_initial_reset: params?.no_initial_reset})
            : this.add_controls(controls);
    }

    /**
     * Adds a list of controls to listen to, also adding them to a binding set.
     * @param {Control[]} controls - Some controls to add.
     * @param {ControlParams} params - Some parameters for these controls.
     */
    add_controls(controls: Control[], params?: ControlParams) {
        const disable_initial_reset = params?.no_initial_reset ?? false;
        if (this.initialized && !disable_initial_reset) this.reset();

        if (params) this.apply_control_params(controls, params);

        return this.enable_controls(controls.slice(), params?.persist);
    }

    /**
     * Handles the `loop_config` param
     * @param {Control[]} controls - Controls getting added
     * @param {ControlParams} params - Parameters to apply to these controls
     */
    private apply_control_params(controls: Control[], params: any) {
        const edits = [],
            options = params?.loop_config;
        if (options?.vertical || options?.vertical_time) {
            edits.push({button: Button.UP, loop_time: options?.vertical_time});
            edits.push({button: Button.DOWN, loop_time: options?.vertical_time});
        }
        if (options?.horizontal || options?.horizontal_time) {
            edits.push({button: Button.LEFT, loop_time: options?.horizontal_time});
            edits.push({button: Button.RIGHT, loop_time: options?.horizontal_time});
        }
        if (options?.shoulder || options?.shoulder_time) {
            edits.push({button: Button.L, loop_time: options?.shoulder_time});
            edits.push({button: Button.R, loop_time: options?.shoulder_time});
        }
        edits.forEach(edit => {
            const c = controls.find(c => c.buttons === edit.button);
            if (!c) return;
            c.params ??= {};
            c.params.loop_time = edit.loop_time ?? DEFAULT_LOOP_TIME;
        });
    }

    /**
     * Add a listener/event for the controls passed.
     * @param {Control[]} controls - Controls to listen for
     * @param {boolean?} persist - Whether the controls have to persist
     */
    private enable_controls(controls: Control[], persist?: boolean) {
        const bindings: Phaser.SignalBinding[] = [];
        const register = (sb: Phaser.SignalBinding) => {
            if (!persist) this.current_signal_bindings.push(sb);
            bindings.push(sb);
        };

        controls.forEach(control => {
            const trigger_reset = control.params?.reset_controls;

            if (control.on_up) {
                const gamepad_button = this.gamepad.get_button(control.buttons);
                const last_gamepad_bt = Array.isArray(gamepad_button)
                    ? gamepad_button[gamepad_button.length - 1]
                    : gamepad_button;

                const b = last_gamepad_bt.on_up.add(() => {
                    if (this.disabled) return;
                    if (Array.isArray(control.buttons)) {
                        if (!this.check_bt_sequence_is_down(control.buttons as Button[])) return;
                    }

                    if (trigger_reset) this.reset();
                    if (control.sfx?.up) this.audio.play_se(control.sfx.up);
                    if (control.halt) {
                        if (Array.isArray(gamepad_button)) {
                            gamepad_button.forEach(bt => bt.on_up.halt());
                        } else {
                            last_gamepad_bt.on_up.halt();
                        }
                    }
                    control.on_up();
                });
                register(b);
            }

            if (control.on_down) {
                const loop_time = control.params?.loop_time;

                const last_bt = control.buttons[(control.buttons as Button[]).length - 1];
                const gamepad_button = this.gamepad.get_button(control.buttons);
                const last_gamepad_bt = Array.isArray(gamepad_button)
                    ? gamepad_button[gamepad_button.length - 1]
                    : gamepad_button;

                if (loop_time) {
                    const b1 = last_gamepad_bt.on_down.add(event => {
                        if (this.disabled) return;
                        if (Array.isArray(control.buttons)) {
                            if (!this.check_bt_sequence_is_down(control.buttons as Button[])) return;
                        }

                        const opposite_button = XGamepad.get_opposite_button(last_bt);

                        if (opposite_button && this.gamepad.is_down(opposite_button)) {
                            const opposite_gamepad_bt = this.gamepad.get_button(opposite_button) as GamepadButton;
                            opposite_gamepad_bt.is_up = true;
                            this.stop_timers();
                        }

                        // Done in XGamepad._on_down
                        // last_gamepad_bt.is_down = true;
                        this.start_loop_timers(control.on_down, loop_time, control.sfx?.down);
                    });
                    const b2 = last_gamepad_bt.on_up.add(event => {
                        if (this.disabled) return;
                        if (Array.isArray(control.buttons)) {
                            if (!this.check_bt_sequence_is_down(control.buttons as Button[])) return;
                        }

                        // Done in XGamepad._on_up
                        // last_gamepad_bt.is_up = true;
                        this.stop_timers();
                    });
                    register(b1);
                    register(b2);
                } else {
                    const b = last_gamepad_bt.on_down.add(event => {
                        if (this.disabled) return;
                        if (Array.isArray(control.buttons)) {
                            if (!this.check_bt_sequence_is_down(control.buttons as Button[])) return;
                        }

                        if (trigger_reset) this.reset();
                        if (control.sfx?.down) this.audio.play_se(control.sfx.down);
                        if (control.halt) {
                            if (Array.isArray(gamepad_button)) {
                                gamepad_button.forEach(bt => bt.on_down.halt());
                            } else {
                                last_gamepad_bt.on_down.halt();
                            }
                        }
                        control.on_down();
                    });
                    register(b);
                }
            }
        });

        this.reset(false);
        const key = this.make_key();
        this.signal_bindings[key] = bindings;
        if (!persist) this.current_set_key = key;

        return key;
    }

    /**
     * Registers a new loop timer.
     * @param {Function} callback - Callback to call at each tick
     * @param {number} loop_time - Ticks length
     * @param {string} sfx - Sfx to play at each tick
     */
    private start_loop_timers(callback: Function, loop_time: number, sfx: string) {
        if (sfx) this.audio.play_se(sfx);
        callback();

        this.loop_start_timer.add(Phaser.Timer.QUARTER, () => {
            this.loop_repeat_timer.loop(loop_time, () => {
                if (sfx) this.audio.play_se(sfx);
                callback();
            });
            this.loop_repeat_timer.start();
        });
        this.loop_start_timer.start();
    }

    /**
     * Finds the next usable index of the persisting bindings.
     *   we could also simply use .length
     * @return {number} - A free usable index
     */
    private make_key() {
        let i = 0;

        do {
            if (this.signal_bindings[i]) {
                i++;
                continue;
            } else {
                break;
            }
        } while (true);

        this.signal_bindings[i] = [];

        return i;
    }

    /**
     * Checks if a sequence of given buttons is down till the one before the last of the given list.
     * @param buttons the sequence of buttons.
     * @returns returns whether the sequence of buttons till the one before the last is down.
     */
    private check_bt_sequence_is_down(buttons: Button[]) {
        for (let i = 0; i < buttons.length - 1; ++i) {
            const button = buttons[i];
            if (!this.gamepad.is_down(button)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Stops the loop timers.
     */
    private stop_timers() {
        this.loop_start_timer.stop();
        this.loop_repeat_timer.stop();
    }

    /**
     * Detachs a binding set based on a key.
     * @param {number} key - A set index
     */
    detach_bindings(key: number) {
        this.signal_bindings[key]?.forEach(bind => bind.detach());
        delete this.signal_bindings[key];
    }

    /**
     * Stops the loop timers and removes the current listeners.
     * @param {boolean=true} detach - Whether to removes the current listeners
     */
    reset(detach: boolean = true) {
        this.stop_timers();

        if (detach) {
            this.current_signal_bindings.forEach(bind => bind.detach());
            this.current_signal_bindings = [];

            if (this.current_set_key) this.detach_bindings(this.current_set_key);
            this.current_set_key = null;
        }
    }
}
