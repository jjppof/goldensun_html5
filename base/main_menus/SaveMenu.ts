import {GoldenSun} from "../GoldenSun";
import {Window} from "../Window";
import {Button} from "../XGamepad";

export class SaveMenu {
    private static readonly DEFAULT_SCALE = 1.1;
    private static readonly MAX_SCALE = 1.25;

    private game: Phaser.Game;
    private data: GoldenSun;
    private window: Window;
    private button_tween: Phaser.Tween;
    private button: Phaser.Sprite;

    constructor(game: Phaser.Game, data: GoldenSun) {
        this.game = game;
        this.data = data;
        this.window = new Window(this.game, 40, 40, 156, 28);

        this.button = this.window.create_at_group(30, 16, "buttons", {frame: "save_game"});
        this.button.anchor.setTo(0.5, 0.5);

        this.window.set_text_in_position("Save your quest", 48, 10, {italic: true});
    }

    set_controls() {
        const controls = [
            {buttons: Button.A, on_down: this.download_snapshot.bind(this), sfx: {down: "menu/positive"}},
            {buttons: Button.B, on_down: this.close_menu.bind(this), sfx: {down: "menu/negative"}},
        ];

        this.data.control_manager.add_controls(controls, {loop_config: {horizontal: true}});
    }

    download_snapshot() {
        this.data.snapshot_manager.generate_snapshot();
    }

    set_button_tween() {
        this.button.scale.setTo(SaveMenu.DEFAULT_SCALE, SaveMenu.DEFAULT_SCALE);
        this.button_tween = this.game.add
            .tween(this.button.scale)
            .to({x: SaveMenu.MAX_SCALE, y: SaveMenu.MAX_SCALE}, 125, Phaser.Easing.Linear.None, true, 0, -1, true);
    }

    close_menu() {
        this.data.cursor_manager.hide();
        this.data.control_manager.reset();
        this.button_tween.stop();
        this.button_tween = null;
        this.window.close(() => {
            this.data.save_open = false;
        });
    }

    open_menu() {
        this.window.show(() => {
            this.data.cursor_manager.move_to({x: 38, y: 55}, {animate: false});
            this.data.cursor_manager.show();
            this.set_button_tween();
            this.set_controls();
        });
    }
}

export function initialize_save_menu(game: Phaser.Game, data: GoldenSun) {
    let trigger_menu = () => {
        if (
            data.hero.in_action() ||
            data.in_battle ||
            !data.assets_loaded ||
            data.shop_open ||
            data.healer_open ||
            data.menu_open ||
            data.game_event_manager.on_event ||
            data.tile_event_manager.timers_running ||
            data.tile_event_manager.on_event
        ) {
            return;
        }
        if (!data.save_open) {
            data.save_open = true;
            data.hero.stop_char();
            data.hero.update_shadow();
            data.audio.play_se("menu/move");
            data.save_menu.open_menu();
        }
    };

    const controls = [{buttons: Button.START, on_down: trigger_menu}];

    data.control_manager.add_controls(controls, {persist: true});

    return new SaveMenu(game, data);
}
