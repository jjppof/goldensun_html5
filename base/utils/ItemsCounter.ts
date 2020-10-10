const GRID_COLOR = 0x000000;
const INACTIVE_BAR_COLOR = 0x989898;
const ACTIVE_BAR_COLOR = 0xF8B070;
const MAX_ITEMS = 30;
const GRID_WIDTH = MAX_ITEMS * 2 + 1;
const GRID_HEIGHT = 8;
const FORWARD = 1;
const BACKWARD = -1;

export class ItemCounter {
    public game: Phaser.Game;
    public group: Phaser.Group;
    public available_items_count: number;
    public x: number;
    public y: number;
    public on_change: Function;
    public current_quantity: number;
    public internal_group: Phaser.Group;
    public graphics: Phaser.Graphics;
    public active_bar_graphics: Phaser.Graphics;
    public inactive_bar_graphics: Phaser.Graphics;
    public active: boolean;
    public choose_timer_repeat: Phaser.Timer;
    public choose_timer_start: Phaser.Timer;
    public index_change_time: number;
    public right_pressed: boolean;
    public left_pressed: boolean;

    constructor(game, group, x, y, on_change) {
        this.game = game;
        this.group = group;
        this.available_items_count = 0;
        this.x = x;
        this.y = y;
        this.on_change = on_change === undefined ? () => {} : on_change;
        this.current_quantity = 1;
        this.internal_group = this.game.add.group();
        this.internal_group.x = this.x;
        this.internal_group.y = this.y;
        this.graphics = this.game.add.graphics(0, 0);
        this.active_bar_graphics = this.game.add.graphics(0, 0);
        this.inactive_bar_graphics = this.game.add.graphics(0, 0);
        this.internal_group.add(this.graphics);
        this.internal_group.add(this.active_bar_graphics);
        this.internal_group.add(this.inactive_bar_graphics);
        this.group.add(this.internal_group);
        this.active = false;
        this.choose_timer_repeat = this.game.time.create(false);
        this.choose_timer_start = this.game.time.create(false);
        this.index_change_time = Phaser.Timer.QUARTER/2;
        this.right_pressed = false;
        this.left_pressed = false;
        this.set_controls();
        this.create_grid();
    }

    set_controls() {
        this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT).onDown.add(() => {
            if (!this.active) return;
            if (this.left_pressed) {
                this.left_pressed = false;
                this.stop_timers();
            }
            this.right_pressed = true;
            this.set_change_timers(FORWARD);
        });
        this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT).onUp.add(() => {
            if (!this.active || !this.right_pressed) return;
            this.right_pressed = false;
            this.stop_timers();
        });
        this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT).onDown.add(() => {
            if (!this.active) return;
            if (this.right_pressed) {
                this.right_pressed = false;
                this.stop_timers();
            }
            this.left_pressed = true;
            this.set_change_timers(BACKWARD);
        });
        this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT).onUp.add(() => {
            if (!this.active || !this.left_pressed) return;
            this.left_pressed = false;
            this.stop_timers();
        });
    }

    set_change_timers(step) {
        this.advance_step(step);
        this.choose_timer_start.add(Phaser.Timer.QUARTER, () => {
            this.choose_timer_repeat.loop(this.index_change_time, this.advance_step.bind(this, step));
            this.choose_timer_repeat.start();
        });
        this.choose_timer_start.start();
    }

    stop_timers() {
        this.choose_timer_start.stop();
        this.choose_timer_repeat.stop();
    }

    advance_step(step) {
        this.current_quantity += step;
        if (this.current_quantity > this.available_items_count) {
            this.current_quantity = 1
        } else if (this.current_quantity === 0) {
            this.current_quantity = this.available_items_count;
        }
        this.active_bar_graphics.clear();
        for (let i = 0; i < this.current_quantity; ++i) {
            this.active_bar_graphics.lineStyle(1, ACTIVE_BAR_COLOR);
            const x = i * 2 + 1;
            this.active_bar_graphics.moveTo(x, 0);
            this.active_bar_graphics.lineTo(x, GRID_HEIGHT - 2);
        }
        this.on_change(this.current_quantity);
    }

    create_grid() {
        this.graphics.lineStyle(1, GRID_COLOR);
        this.graphics.moveTo(0, 0);
        this.graphics.lineTo(GRID_WIDTH, 0);

        this.graphics.lineStyle(1, GRID_COLOR);
        this.graphics.moveTo(GRID_WIDTH - 1, 0);
        this.graphics.lineTo(GRID_WIDTH - 1, GRID_HEIGHT - 1);

        this.graphics.lineStyle(1, GRID_COLOR);
        this.graphics.moveTo(GRID_WIDTH - 1, GRID_HEIGHT - 1);
        this.graphics.lineTo(0, GRID_HEIGHT - 1);

        this.graphics.lineStyle(1, GRID_COLOR);
        this.graphics.moveTo(0, GRID_HEIGHT - 1);
        this.graphics.lineTo(0, 0);

        for (let i = 0; i < MAX_ITEMS - 1; ++i) {
            this.graphics.lineStyle(1, GRID_COLOR);
            const x = 2 + (i * 2);
            this.graphics.moveTo(x, 0);
            this.graphics.lineTo(x, GRID_HEIGHT - 2);
        }
    }

    create_inactive_bar() {
        for (let i = MAX_ITEMS; i > this.available_items_count; --i) {
            this.inactive_bar_graphics.lineStyle(1, INACTIVE_BAR_COLOR);
            const x = (i * 2) - 1;
            this.inactive_bar_graphics.moveTo(x, 0);
            this.inactive_bar_graphics.lineTo(x, GRID_HEIGHT - 2);
        }
    } 

    config(available_items_count, initial_quantity) {
        this.clear();
        this.current_quantity = initial_quantity;
        this.available_items_count = available_items_count;
        this.active = true;
        this.create_inactive_bar();
        this.advance_step(0);
    }

    clear() {
        this.active_bar_graphics.clear();
        this.inactive_bar_graphics.clear();
    }

    activate() {
        this.active = true;
    }

    deactivate() {
        this.active = false;
    }
}