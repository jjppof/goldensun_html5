import {GoldenSun} from "../GoldenSun";
import {FONT_SIZE, GAME_WIDTH} from "../magic_numbers";
import {SnapshotData} from "../Snapshot";
import {HorizontalMenu} from "../support_menus/HorizontalMenu";
import {FONT_NAME, get_text_width} from "../utils";
import {Button} from "../XGamepad";

export class StartMenu {
    private static readonly START_BGM = "page_one";
    private static readonly BUTTONS = ["new_quest", "continue"];

    private game: Phaser.Game;
    private data: GoldenSun;
    private start_screen: Phaser.Image;
    private horizontal_menu: HorizontalMenu;
    private choose_callback: (snapshot: SnapshotData) => void;
    private text_sprite_shadow: Phaser.BitmapText;
    private text_sprite: Phaser.BitmapText;
    private text_tween: Phaser.Tween;
    private text_shadow_tween: Phaser.Tween;
    private input: HTMLInputElement;

    constructor(game: Phaser.Game, data: GoldenSun) {
        this.game = game;
        this.data = data;

        this.start_screen = this.game.add.image(0, 0, "start_screen");
        this.start_screen.alpha = 0;

        this.horizontal_menu = new HorizontalMenu(this.game, this.data, StartMenu.BUTTONS, ["New Game", "Continue"], {
            on_press: this.on_horizontal_menu_chose.bind(this),
        });

        this.setup_input();
    }

    private set_press_start_text() {
        const text = "PRESS START";
        const text_width = get_text_width(this.game, text, false);
        const x_pos = (GAME_WIDTH - text_width) >> 1;
        const y_pos = 124;
        this.text_sprite_shadow = this.game.add.bitmapText(x_pos + 1, y_pos + 1, FONT_NAME, text, FONT_SIZE);
        this.text_sprite_shadow.tint = 0x0;
        this.text_sprite = this.game.add.bitmapText(x_pos, y_pos, FONT_NAME, text, FONT_SIZE);
        this.set_press_start_tween();
    }

    private set_press_start_tween() {
        const blink_time = 1000;
        this.text_tween = this.game.tweens.create(this.text_sprite).to(
            {
                alpha: 0.1,
            },
            blink_time,
            Phaser.Easing.Quadratic.InOut,
            true,
            0,
            -1
        );
        this.text_shadow_tween = this.game.tweens.create(this.text_sprite_shadow).to(
            {
                alpha: 0.1,
            },
            blink_time,
            Phaser.Easing.Quadratic.InOut,
            true,
            0,
            -1
        );
    }

    private kill_press_start() {
        this.text_tween.stop();
        this.text_shadow_tween.stop();
        this.game.add
            .tween(this.text_sprite)
            .to(
                {
                    alpha: 0,
                },
                250,
                Phaser.Easing.Linear.None,
                true
            )
            .onComplete.addOnce(() => this.text_sprite.destroy());
        this.game.add
            .tween(this.text_sprite_shadow)
            .to(
                {
                    alpha: 0,
                },
                250,
                Phaser.Easing.Linear.None,
                true
            )
            .onComplete.addOnce(() => this.text_sprite_shadow.destroy());
    }

    private on_horizontal_menu_chose() {
        if (this.horizontal_menu.selected_button_index === 1) {
            this.input.click();
        } else {
            this.horizontal_menu.close(() => {
                this.choose_callback(null);
            });
        }
    }

    private setup_input() {
        this.input = document.createElement("input");
        this.input.style.display = "none";
        this.input.type = "file";
        this.input.accept = ".json";
        this.input.onchange = async e => {
            const file = (<HTMLInputElement>e.target).files[0];
            try {
                let snapshot;
                if (this.data.electron_app) {
                    //Blob.text() is only available on chrome 76 onwards
                    const reader = new FileReader();
                    let promise_resolve;
                    const promise = new Promise(resolve => (promise_resolve = resolve));
                    reader.addEventListener("load", e => {
                        snapshot = JSON.parse(e.target.result as string);
                        promise_resolve();
                    });
                    reader.readAsBinaryString(file);
                    await promise;
                } else {
                    snapshot = JSON.parse(await file.text());
                }
                this.horizontal_menu.close(() => {
                    this.choose_callback(snapshot);
                });
            } catch {
                this.data.logger.log_message("Input snapshot is not a valid JSON.");
            }
        };
    }

    async open(choose_callback: StartMenu["choose_callback"]) {
        this.choose_callback = choose_callback;
        this.data.audio.set_bgm(StartMenu.START_BGM, true);
        this.game.add
            .tween(this.start_screen)
            .to(
                {
                    alpha: 1,
                },
                500,
                Phaser.Easing.Linear.None,
                true
            )
            .onComplete.addOnce(() => {
                this.set_press_start_text();
                const on_start = () => {
                    this.kill_press_start();
                    this.game.add
                        .tween(this.start_screen)
                        .to(
                            {
                                alpha: 0,
                            },
                            250,
                            Phaser.Easing.Linear.None,
                            true
                        )
                        .onComplete.addOnce(() => {
                            this.start_screen.destroy();
                        });
                    this.horizontal_menu.open(undefined, 0);
                };
                this.data.control_manager.add_controls(
                    [
                        {
                            buttons: Button.START,
                            on_down: on_start,
                            params: {reset_controls: true},
                            sfx: {down: "menu/positive"},
                        },
                        {
                            buttons: Button.A,
                            on_down: on_start,
                            params: {reset_controls: true},
                            sfx: {down: "menu/positive"},
                        },
                    ],
                    {persist: false}
                );
            });
    }
}
