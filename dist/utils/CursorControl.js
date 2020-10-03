const BACKWARD = -1;
const FORWARD = 1;
const CURSOR_DELTA = 4;
const INDEX_CHANGE_TIME = Phaser.Timer.QUARTER >> 1;
const CURSOR_TWEEN_TIME = Phaser.Timer.QUARTER >> 1;

export class CursorControl {
    constructor(
        game,
        is_right_left,
        is_up_down,
        max_right_left_getter,
        max_up_down_getter,
        base_group,
        on_right_left_change,
        on_up_down_change,
        right_left_index_getter,
        right_left_index_setter,
        up_down_index_getter,
        up_down_index_setter,
        open_checker,
        active_checker,
        cursor_base_x_getter,
        cursor_base_y_getter
    ) {
        this.game = game;
        this.is_right_left = is_right_left;
        this.is_up_down = is_up_down;
        this.max_right_left_getter = max_right_left_getter;
        this.max_up_down_getter = max_up_down_getter;
        this.base_group = base_group;
        this.on_right_left_change = on_right_left_change === undefined ? () => {} : on_right_left_change;
        this.on_up_down_change = on_up_down_change === undefined ? () => {} : on_up_down_change;
        this.right_left_index_getter = right_left_index_getter;
        this.right_left_index_setter = right_left_index_setter;
        this.up_down_index_getter = up_down_index_getter;
        this.up_down_index_setter = up_down_index_setter;
        this.open_checker = open_checker;
        this.active_checker = active_checker;
        this.cursor_base_x_getter = cursor_base_x_getter;
        this.cursor_base_y_getter = cursor_base_y_getter;
        this.right_pressed = false;
        this.left_pressed = false;
        this.up_pressed = false;
        this.down_pressed = false;
        this.choose_timer_repeat = this.game.time.create(false);
        this.choose_timer_start = this.game.time.create(false);
        this.init_cursor();
        this.init_cursor_tween();
        this.signal_bindings = this.set_control();
    }

    set_control() {
        return [
            this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT).onDown.add(() => {
                if (!this.open_checker() || !this.active_checker() || !this.is_right_left) return;
                if (this.left_pressed) {
                    this.left_pressed = false;
                    this.stop_timers();
                }
                this.right_pressed = true;
                this.set_change_timers(FORWARD, true);
            }),
            this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT).onUp.add(() => {
                if (!this.open_checker() || !this.active_checker() || !this.right_pressed || !this.is_right_left) return;
                this.right_pressed = false;
                this.stop_timers();
            }),
            this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT).onDown.add(() => {
                if (!this.open_checker() || !this.active_checker() || !this.is_right_left) return;
                if (this.right_pressed) {
                    this.right_pressed = false;
                    this.stop_timers();
                }
                this.left_pressed = true;
                this.set_change_timers(BACKWARD, true);
            }),
            this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT).onUp.add(() => {
                if (!this.open_checker() || !this.active_checker() || !this.left_pressed || !this.is_right_left) return;
                this.left_pressed = false;
                this.stop_timers();
            }),
            this.game.input.keyboard.addKey(Phaser.Keyboard.UP).onDown.add(() => {
                if (!this.open_checker() || !this.active_checker() || !this.is_up_down) return;
                if (this.down_pressed) {
                    this.down_pressed = false;
                    this.stop_timers();
                }
                this.up_pressed = true;
                this.set_change_timers(BACKWARD, false);
            }),
            this.game.input.keyboard.addKey(Phaser.Keyboard.UP).onUp.add(() => {
                if (!this.open_checker() || !this.active_checker() || !this.up_pressed || !this.is_up_down) return;
                this.up_pressed = false;
                this.stop_timers();
            }),
            this.game.input.keyboard.addKey(Phaser.Keyboard.DOWN).onDown.add(() => {
                if (!this.open_checker() || !this.active_checker() || !this.is_up_down) return;
                if (this.up_pressed) {
                    this.up_pressed = false;
                    this.stop_timers();
                }
                this.down_pressed = true;
                this.set_change_timers(FORWARD, false);
            }),
            this.game.input.keyboard.addKey(Phaser.Keyboard.DOWN).onUp.add(() => {
                if (!this.open_checker() || !this.active_checker() || !this.down_pressed || !this.is_up_down) return;
                this.down_pressed = false;
                this.stop_timers();
            })
        ];
    }

    set_change_timers(step, right_left) {
        this.change_index(step, right_left);
        this.choose_timer_start.add(Phaser.Timer.QUARTER, () => {
            this.choose_timer_repeat.loop(INDEX_CHANGE_TIME, this.change_index.bind(this, step, right_left));
            this.choose_timer_repeat.start();
        });
        this.choose_timer_start.start();
    }

    change_index(step, right_left) {
        const getter = right_left ? this.right_left_index_getter : this.up_down_index_getter;
        const setter = right_left ? this.right_left_index_setter : this.up_down_index_setter;
        const on_change = right_left ? this.on_right_left_change : this.on_up_down_change;
        const max = right_left ? this.max_right_left_getter : this.max_up_down_getter;
        const before_index = getter();
        setter((getter() + step) % max());
        if (getter() < 0) {
            setter(max() - 1);
        }
        this.set_cursor_position();
        on_change(before_index, getter());
    }

    stop_timers() {
        this.choose_timer_start.stop();
        this.choose_timer_repeat.stop();
    }

    init_cursor() {
        this.cursor_base_x = -5;
        this.cursor_group = this.game.add.group();
        this.cursor = this.cursor_group.create(0, 0, "cursor");
        this.cursor_group.alpha = 0;
        this.base_group.add(this.cursor_group);
        this.cursor_group.x = this.cursor_base_x_getter();
        this.cursor_group.y = this.cursor_base_y_getter();
        this.cursor_tween = this.game.tweens.create(this.cursor);
    }

    init_cursor_tween() {
        this.cursor_tween.to(
            {
                x: this.cursor.x - CURSOR_DELTA,
                y: this.cursor.y + CURSOR_DELTA
            },
            CURSOR_TWEEN_TIME,
            Phaser.Easing.Linear.None,
            false,
            0,
            -1,
            true
        );
    }

    set_cursor_position() {
        if (this.cursor_tween.isRunning && this.cursor_tween.isPaused) {
            this.cursor_tween.resume();
        } else if (!this.cursor_tween.isRunning) {
            this.cursor_tween.start();
            if (this.cursor_tween.isPaused) {
                this.cursor_tween.resume();
            }
        }
        this.cursor_group.x = this.cursor_base_x_getter();
        this.cursor_group.y = this.cursor_base_y_getter();
    }

    activate() {
        this.up_pressed = false;
        this.down_pressed = false;
        this.cursor_group.alpha = 1;
        this.set_cursor_position();
    }

    deactivate() {
        this.stop_timers();
        this.cursor_group.alpha = 0;
        this.cursor_tween.pause();
    }

    destroy() {
        this.choose_timer_repeat.destroy();
        this.choose_timer_start.destroy();
        this.signal_bindings.forEach(signal_binding => {
            signal_binding.detach();
        });
        this.cursor_tween.stop();
        this.cursor_group.destroy();
    }
}