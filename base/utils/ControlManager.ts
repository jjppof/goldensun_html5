import * as _ from "lodash";
import {Audio} from "../Audio";
import {Gamepad as XGamepad, Button, CButton} from "../XGamepad";

const DEFAULT_LOOP_TIME = Phaser.Timer.QUARTER >> 1;

type Control = {
    button: Button | CButton;
    onDown?: Function;
    onUp?: Function;
    params?: {resetControls?: boolean; loopTime?: number};
    sfx?: {up?: string; down?: string};
};

type ControlParams = {
    loopConfig?: {
        vertical?: boolean;
        verticalTime?: number;
        horizontal?: boolean;
        horizontalTime?: number;
        shoulder?: boolean;
        shoulderTime?: number;
    };
    persist?: boolean;
    noReset?: boolean;
};

type SimpleControlParams = {
    /** Whether to reset the binding set upon button pressed */
    resetOnPress?: boolean;
    /** Only add a confirm (A) button, no back (B) button */
    confirmOnly?: boolean;
    /** Whether the binding set must persist */
    persist?: boolean;
    /** Whether to reset the current controls first */
    noInitialReset?: boolean;
};

export class ControlManager {
    game: Phaser.Game;
    gamepad: XGamepad;
    audio: Audio;

    disabled: boolean;

    /** Current binding set, that will be reset upon demand. */
    currentSignalBindings: Phaser.SignalBinding[];
    /** Key of the current binding set. */
    currentKeySet?: number;
    /** Every currently listening signals (binding sets). */
    signalBindings: {[key: number]: Phaser.SignalBinding[]};
    /** Some timer */
    loopStartTimer: Phaser.Timer;
    /** Some timer */
    loopRepeatTimer: Phaser.Timer;

    constructor(game: Phaser.Game, gamepad: XGamepad, audio: Audio) {
        this.game = game;
        this.gamepad = gamepad;
        this.audio = audio;

        this.disabled = false;

        this.currentSignalBindings = [];
        this.currentKeySet = null;
        this.signalBindings = {};

        this.loopStartTimer = this.game.time.create(false);
        this.loopRepeatTimer = this.game.time.create(false);
    }

    get initialized() {
        return this.currentSignalBindings.length;
    }

    /**
     * Adds a confirm (A) and back (B) controls.
     * @param {Function} callback - The callback to call
     * @param {Object} params - Some parameters for these controls
     */
    addSimpleControls(callback: Function, params?: SimpleControlParams, sfx?: string) {
        const controls: Control[] = [
            {
                button: Button.A,
                onDown: callback,
                params: {resetControls: params?.resetOnPress},
                sfx: sfx ? {down: sfx} : null,
            },
        ];

        if (params?.confirmOnly !== true) {
            controls.push({
                // ... controls[0]
                button: Button.B,
                onDown: callback,
                params: {resetControls: params?.resetOnPress},
                sfx: sfx ? {down: sfx} : null,
            });
        }

        return params
            ? this.addControls(controls, {persist: params?.persist, noReset: params?.noInitialReset})
            : this.addControls(controls);
    }

    /**
     * Adds a list of controls to listen to, also adding them to a binding set.
     * @param {Control[]} controls - Some controls to add
     * @param {ControlParams} params - Some parameters for these controls
     */
    addControls(controls: Control[], params?: ControlParams) {
        const disableReset = params?.noReset ?? false;
        if (this.initialized && !disableReset) this.reset();

        if (params) this.setControlParams(controls, params);

        return this.enableControls(
            controls.map(c => c),
            params?.persist
        );
    }

    /**
     * Handles the `loopConfig` param
     * @param {Control[]} controls - Controls getting added
     * @param {ControlParams} params - Parameters to apply to these controls
     */
    setControlParams(controls: Control[], params: any) {
        const edits = [],
            options = params?.loopConfig;
        if (options?.vertical || options?.verticalTime) {
            edits.push({button: Button.UP, loopTime: options?.verticalTime});
            edits.push({button: Button.DOWN, loopTime: options?.verticalTime});
        }
        if (options?.horizontal || options?.horizontalTime) {
            edits.push({button: Button.LEFT, loopTime: options?.horizontalTime});
            edits.push({button: Button.RIGHT, loopTime: options?.horizontalTime});
        }
        if (options?.shoulder || options?.shoulderTime) {
            edits.push({button: Button.L, loopTime: options?.shoulderTime});
            edits.push({button: Button.R, loopTime: options?.shoulderTime});
        }
        edits.forEach(edit => {
            const c = controls.find(c => c.button === edit.button);
            if (!c.params) c.params = {};
            c.params.loopTime = edit.loopTime ?? DEFAULT_LOOP_TIME;
        });
    }

    /**
     * Add a listener/event for the controls passed.
     * @param {Control[]} controls - Controls to listen for
     * @param {boolean?} persist - Whether the controls have to persist
     */
    enableControls(controls: Control[], persist?: boolean) {
        const bindings: Phaser.SignalBinding[] = [];
        const register = (sb: Phaser.SignalBinding) => {
            if (!persist) this.currentSignalBindings.push(sb);
            bindings.push(sb);
        };

        controls.forEach(control => {
            control.onDown;

            if (control.onUp) {
                const b = this.gamepad.getButton(control.button).onUp.add(() => {
                    if (this.disabled) return;

                    if (control.sfx?.up) this.audio.play_se(control.sfx.up);
                    control.onUp();
                });
                register(b);
            }

            if (control.onDown) {
                const loopTime = control.params?.loopTime;
                const triggerReset = control.params?.resetControls;

                const gamepadButton = this.gamepad.getButton(control.button);

                // TODO Move checkSecondKeys to XGamepad
                // const withAlt = control.params?.withAlt;
                // const withCtrl = control.params?.withCtrl;
                // const withShift = control.params?.withShift;
                // function checkSecondKeys(event?: Phaser.Key): boolean {
                //     let check_pass: boolean = true;
                //     if (withAlt != undefined) check_pass = check_pass && withAlt === event.altKey;
                //     if (withCtrl != undefined) check_pass = check_pass && withCtrl === event.ctrlKey;
                //     if (withShift != undefined) check_pass = check_pass && withShift === event.shiftKey;
                //     return !event || check_pass;
                // }

                if (loopTime) {
                    const b1 = gamepadButton.onDown.add(event => {
                        if (this.disabled) return;
                        // if (!checkSecondKeys(event)) return;

                        const oppositeButton = XGamepad.getOppositeButton(control.button as Button);

                        if (this.gamepad.isDown(oppositeButton)) {
                            this.gamepad.getButton(oppositeButton).isUp = true;
                            this.stopTimers();
                        }

                        // Done in XGamepad._onDown
                        // gamepadButton.isDown = true;
                        this.startLoopTimers(control.onDown, loopTime, control.sfx?.down);
                    });
                    const b2 = gamepadButton.onUp.add(event => {
                        if (this.disabled) return;

                        // Done in XGamepad._onUp
                        // gamepadButton.isUp = true;
                        this.stopTimers();
                    });
                    register(b1);
                    register(b2);
                } else {
                    const b = gamepadButton.onDown.add(event => {
                        if (this.disabled) return;
                        // if (!checkSecondKeys(event)) return;

                        if (triggerReset) this.reset();
                        if (control.sfx?.down) this.audio.play_se(control.sfx.down);
                        control.onDown();
                    });
                    register(b);
                }
            }
        });

        this.reset(false);
        const key = this.makeKey();
        this.signalBindings[key] = bindings;
        if (!persist) this.currentKeySet = key;

        return key;
    }

    /**
     * Registers a new loop timer.
     * @param {Function} callback - Callback to call at each tick
     * @param {number} loopTime - Ticks length
     * @param {string} sfx - Sfx to play at each tick
     */
    startLoopTimers(callback: Function, loopTime: number, sfx: string) {
        if (sfx) this.audio.play_se(sfx);
        callback();

        this.loopStartTimer.add(Phaser.Timer.QUARTER, () => {
            this.loopRepeatTimer.loop(loopTime, () => {
                if (sfx) this.audio.play_se(sfx);
                callback();
            });
            this.loopRepeatTimer.start();
        });
        this.loopStartTimer.start();
    }

    /**
     * Finds the next usable index of the persisting bindings.
     *   we could also simply use .length
     * @return {number} - A free usable index
     */
    makeKey() {
        let finished = false;
        let i = 0;

        do {
            if (this.signalBindings[i]) {
                i++;
                continue;
            } else {
                finished = true;
                break;
            }
        } while (!finished);

        this.signalBindings[i] = [
            /*new Phaser.SignalBinding(new Phaser.Signal(), () => {}, false)*/
        ];

        return i;
    }

    /**
     * Stops the loop timers.
     */
    stopTimers() {
        this.loopStartTimer.stop();
        this.loopRepeatTimer.stop();
    }

    /**
     * Detachs a binding set based on a key.
     * @param {number} key - A set index
     */
    detachBindings(key: number) {
        this.signalBindings[key]?.forEach(bind => bind.detach());
        delete this.signalBindings[key];
    }

    /**
     * Stops the loop timers and removes the current listeners.
     * @param {boolean=true} detach - Whether to removes the current listeners
     */
    reset(detach: boolean = true) {
        this.stopTimers();

        if (detach) {
            this.currentSignalBindings.forEach(bind => bind.detach());
            this.currentSignalBindings = [];

            if (this.currentKeySet) this.detachBindings(this.currentKeySet);
            this.currentKeySet = null;
        }
    }
}
