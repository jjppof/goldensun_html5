const GRID_COLOR = 0x000000;
const INACTIVE_BAR_COLOR = 0x989898;
const DISABLED_BAR_COLOR = 0xFF0000;
const ACTIVE_BAR_COLOR = 0xF8B070;
const MAX_ITEMS = 30;
const GRID_WIDTH = MAX_ITEMS * 2 + 1;
const GRID_HEIGHT = 8;

export class ItemCounter {
    public game:Phaser.Game;
    public group:Phaser.Group;
    public x:number;
    public y:number;
    public on_change:Function;

    public available_items_count:number;
    public disabled_count:number;
    public current_quantity:number;
    public active:boolean;

    public internal_group:Phaser.Group;
    public graphics:Phaser.Graphics;
    public active_bar_graphics:Phaser.Graphics;
    public inactive_bar_graphics:Phaser.Graphics;
    public disabled_bar_graphics:Phaser.Graphics;

    constructor(game:Phaser.Game, group:Phaser.Group, x:number, y:number, on_change:Function) {
        this.game = game;
        this.group = group;
        this.available_items_count = 0;
        this.disabled_count = 0;
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
        this.disabled_bar_graphics = this.game.add.graphics(0, 0);

        this.internal_group.add(this.graphics);
        this.internal_group.add(this.active_bar_graphics);
        this.internal_group.add(this.inactive_bar_graphics);
        this.internal_group.add(this.disabled_bar_graphics);
        this.group.add(this.internal_group);
        this.active = false;

        this.create_grid();
    }

    advance_step(step:number) {
        this.current_quantity += step;
        if (this.current_quantity > this.available_items_count) {
            this.current_quantity = 1
        } else if (this.current_quantity === 0) {
            this.current_quantity = this.available_items_count;
        }
        this.active_bar_graphics.clear();
        for (let i = this.disabled_count; i < this.disabled_count+this.current_quantity; ++i) {
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
        for (let i = 0; i < this.disabled_count; ++i) {
            this.disabled_bar_graphics.lineStyle(1, DISABLED_BAR_COLOR);
            const x = i * 2 + 1;
            this.disabled_bar_graphics.moveTo(x, 0);
            this.disabled_bar_graphics.lineTo(x, GRID_HEIGHT - 2);
        }

        for (let i = MAX_ITEMS; i > (this.available_items_count + this.disabled_count); --i) {
            this.inactive_bar_graphics.lineStyle(1, INACTIVE_BAR_COLOR);
            const x = (i * 2) - 1;
            this.inactive_bar_graphics.moveTo(x, 0);
            this.inactive_bar_graphics.lineTo(x, GRID_HEIGHT - 2);
        }
    } 

    config(available_items_count:number, initial_quantity:number, disabled_count:number=0) {
        this.clear();
        this.current_quantity = initial_quantity;
        this.available_items_count = available_items_count;
        this.disabled_count = disabled_count
        this.active = true;
        this.create_inactive_bar();
        this.advance_step(0);
    }

    clear() {
        this.active_bar_graphics.clear();
        this.inactive_bar_graphics.clear();
        this.disabled_bar_graphics.clear();
        
        this.current_quantity = 1;
        this.available_items_count = 0;
        this.disabled_count = 0;
    }

    activate() {
        this.active = true;
    }

    deactivate() {
        this.active = false;
    }
}