import * as _ from "lodash";
import {Audio} from "../Audio";
import {Gamepad as XGamepad, Button, CButton} from "../XGamepad";

const DEFAULT_LOOP_TIME = Phaser.Timer.QUARTER >> 1;

type Control = {
    button: Button | CButton;
    on_down?: Function;
    on_up?: Function;
    params?: {
        /** Whether to reset the binding set upon press */
        reset_controls?: boolean;
        /** Time between each trigger on button held */
        loop_time?: number;
    };
    sfx?: {up?: string; down?: string};
};

type ControlParams = {
    loop_config?: {
        vertical?: boolean;
        vertical_time?: number;
        horizontal?: boolean;
        horizontal_time?: number;
        shoulder?: boolean;
        shoulder_time?: number;
    };
    /** Whether the binding set must persist */
    persist?: boolean;
    /** Whether to reset the current controls first */
    no_initial_reset?: boolean;
};

type SimpleControlParams = {
    /** Whether to reset the binding set upon button pressed */
    reset_on_press?: boolean;
    /** Only add a confirm (A) button, no back (B) button */
    confirm_only?: boolean;
    /** Whether the binding set must persist */
    persist?: boolean;
    /** Whether to reset the current controls first */
    no_initial_reset?: boolean;
};

export class ControlManager {
    game: Phaser.Game;
    gamepad: XGamepad;
    audio: Audio;

    disabled: boolean;

    /** Current binding set, that will be reset upon demand. */
    current_signal_bindings: Phaser.SignalBinding[];
    /** Key of the current binding set. */
    current_set_key?: number;
    /** Every currently listening signals (binding sets). */
    signal_bindings: {[key: number]: Phaser.SignalBinding[]};
    /** Some timer */
    loop_start_timer: Phaser.Timer;
    /** Some timer */
    loop_repeat_timer: Phaser.Timer;

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

    get initialized() {
        return this.current_signal_bindings.length;
    }

    /**
     * Adds a confirm (A) and back (B) controls.
     * @param {Function} callback - The callback to call
     * @param {Object} params - Some parameters for these controls
     */
    add_simple_controls(callback: Function, params?: SimpleControlParams, sfx?: string) {
        const controls: Control[] = [
            {
                button: Button.A,
                on_down: callback,
                params: {reset_controls: params?.reset_on_press},
                sfx: sfx ? {down: sfx} : null,
            },
        ];

        if (params?.confirm_only !== true) {
            controls.push({
                // ... controls[0]
                button: Button.B,
                on_down: callback,
                params: {reset_controls: params?.reset_on_press},
                sfx: sfx ? {down: sfx} : null,
            });
        }

        return params
            ? this.add_controls(controls, {persist: params?.persist, no_initial_reset: params?.no_initial_reset})
            : this.add_controls(controls);
    }

    /**
     * Adds a list of controls to listen to, also adding them to a binding set.
     * @param {Control[]} controls - Some controls to add
     * @param {ControlParams} params - Some parameters for these controls
     */
    add_controls(controls: Control[], params?: ControlParams) {
        const disable_initial_reset = params?.no_initial_reset ?? false;
        if (this.initialized && !disable_initial_reset) this.reset();

        if (params) this.apply_control_params(controls, params);

        return this.enable_controls(
            controls.map(c => c),
            params?.persist
        );
    }

    /**
     * Handles the `loop_config` param
     * @param {Control[]} controls - Controls getting added
     * @param {ControlParams} params - Parameters to apply to these controls
     */
    apply_control_params(controls: Control[], params: any) {
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
            const c = controls.find(c => c.button === edit.button);
            c.params ??= {};
            c.params.loop_time = edit.loop_time ?? DEFAULT_LOOP_TIME;
        });
    }

    /**
     * Add a listener/event for the controls passed.
     * @param {Control[]} controls - Controls to listen for
     * @param {boolean?} persist - Whether the controls have to persist
     */
    enable_controls(controls: Control[], persist?: boolean) {
        const bindings: Phaser.SignalBinding[] = [];
        const register = (sb: Phaser.SignalBinding) => {
            if (!persist) this.current_signal_bindings.push(sb);
            bindings.push(sb);
        };

        controls.forEach(control => {
            if (control.on_up) {
                const b = this.gamepad.getButton(control.button).onUp.add(() => {
                    if (this.disabled) return;

                    if (control.sfx?.up) this.audio.play_se(control.sfx.up);
                    control.on_up();
                });
                register(b);
            }

            if (control.on_down) {
                const loop_time = control.params?.loop_time;
                const trigger_reset = control.params?.reset_controls;

                const gamepad_button = this.gamepad.getButton(control.button);

                if (loop_time) {
                    const b1 = gamepad_button.onDown.add(event => {
                        if (this.disabled) return;

                        const opposite_button = XGamepad.getOppositeButton(control.button as Button);

                        if (this.gamepad.isDown(opposite_button)) {
                            this.gamepad.getButton(opposite_button).isUp = true;
                            this.stop_timers();
                        }

                        // Done in XGamepad._onDown
                        // gamepad_button.isDown = true;
                        this.start_loop_timers(control.on_down, loop_time, control.sfx?.down);
                    });
                    const b2 = gamepad_button.onUp.add(event => {
                        if (this.disabled) return;

                        // Done in XGamepad._onUp
                        // gamepad_button.isUp = true;
                        this.stop_timers();
                    });
                    register(b1);
                    register(b2);
                } else {
                    const b = gamepad_button.onDown.add(event => {
                        if (this.disabled) return;

                        if (trigger_reset) this.reset();
                        if (control.sfx?.down) this.audio.play_se(control.sfx.down);
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
    start_loop_timers(callback: Function, loop_time: number, sfx: string) {
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
    make_key() {
        let finished = false;
        let i = 0;

        do {
            if (this.signal_bindings[i]) {
                i++;
                continue;
            } else {
                finished = true;
                break;
            }
        } while (!finished);

        this.signal_bindings[i] = [];

        return i;
    }

    /**
     * Stops the loop timers.
     */
    stop_timers() {
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
