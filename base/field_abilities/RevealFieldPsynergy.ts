import {FieldAbilities} from "./FieldAbilities";
import * as numbers from "../magic_numbers";

export class RevealFieldPsynergy extends FieldAbilities {
    private static readonly ABILITY_KEY_NAME = "reveal";
    private static readonly ACTION_KEY_NAME = "cast";
    private reveal_wave: Phaser.Image;
    private reveal_wave_filter: any;
    private end_timer: Phaser.Timer;
    private waving_tween: Phaser.Tween;
    private casting_point: {
        x: number;
        y: number;
    };

    constructor(game, data) {
        super(game, data, RevealFieldPsynergy.ABILITY_KEY_NAME, RevealFieldPsynergy.ACTION_KEY_NAME, false, false);
        this.set_bootstrap_method(this.show_wave.bind(this));
    }

    update() {
        if (this.controllable_char?.on_reveal) {
            const this_point = {
                x: this.controllable_char.sprite.x,
                y: this.controllable_char.sprite.y,
            };
            const this_x_diff = this_point.x - this.casting_point.x;
            const this_y_diff = this_point.y - this.casting_point.y;
            const angle = Math.atan2(this_y_diff, this_x_diff);
            const limit_point = {
                x: this.casting_point.x + 90 * Math.cos(angle),
                y: this.casting_point.y + 66 * Math.sin(angle),
            };
            const this_sqr_dist = Math.pow(this_x_diff, 2) + Math.pow(this_y_diff, 2);
            const limit_sqr_dist =
                Math.pow(limit_point.x - this.casting_point.x, 2) + Math.pow(limit_point.y - this.casting_point.y, 2);
            if (this_sqr_dist >= limit_sqr_dist) {
                this.finish();
            }
        }
    }

    toggle_reveal() {
        this.data.map.layers.forEach(layer => {
            if (layer.properties?.reveal_layer) {
                layer.sprite.visible = !layer.sprite.visible;
            }
        });
        this.data.map.collision_sprite.body.data.shapes.forEach(shape => {
            if (shape.properties?.affected_by_reveal) {
                shape.sensor = !shape.sensor;
            }
        });
        this.data.map.npcs.forEach(npc => {
            if (npc.affected_by_reveal) {
                npc.sprite.visible = !npc.sprite.visible;
            }
        });
        for (let key in this.data.map.events) {
            const events = this.data.map.events[key];
            events.forEach(event => {
                event.affected_by_reveal.forEach((affect, i) => {
                    if (affect) {
                        event.active[i] = !event.active[i];
                    }
                });
            });
        }
    }

    finish(force: boolean = false, stop_char: boolean = true, finish_callback?: Function) {
        this.controllable_char.on_reveal = false;
        this.controllable_char.casting_psynergy = true;
        this.toggle_reveal();
        this.data.map.color_filter.gray = 0;
        this.end_timer.destroy();
        if (!force) {
            this.game.camera.flash(0x0, 750, true);
        }
        this.data.super_group.mask.destroy();
        this.data.super_group.mask = null;
        this.reveal_wave.destroy();
        this.reveal_wave_filter.destroy();
        this.waving_tween.stop();
        if (stop_char) {
            this.controllable_char.stop_char(true);
        }
        this.data.audio.play_se("psynergy/11");
        const reset_states = () => {
            this.controllable_char.casting_psynergy = false;
            if (finish_callback) {
                finish_callback();
            }
        };
        if (force) {
            reset_states();
        } else {
            this.game.time.events.add(350, reset_states);
        }
    }

    show_wave() {
        this.field_psynergy_window.close();

        if (this.controllable_char.on_reveal) {
            this.finish(true);
        }
        this.casting_point = {
            x: this.controllable_char.sprite.x,
            y: this.controllable_char.sprite.y,
        };
        this.controllable_char.on_reveal = true;

        this.reveal_wave = this.game.add.image(0, 0);
        this.data.overlayer_group.addChild(this.reveal_wave);
        this.data.overlayer_group.bringToTop(this.reveal_wave);
        this.reveal_wave.width = numbers.GAME_WIDTH;
        this.reveal_wave.height = numbers.GAME_HEIGHT;
        this.reveal_wave.centerX = this.controllable_char.sprite.x;
        this.reveal_wave.centerY = this.controllable_char.sprite.y;
        this.reveal_wave.avoidFilterCapping = true;

        this.reveal_wave_filter = this.game.add.filter("Reveal");
        this.reveal_wave_filter.a = this.reveal_wave_filter.b = 0;
        this.reveal_wave_filter.phase = 2 * Math.PI;
        this.reveal_wave.filters = [this.reveal_wave_filter];

        this.data.super_group.mask = this.game.add.graphics(this.reveal_wave.x, this.reveal_wave.y);
        this.data.super_group.mask.beginFill(0xffffff, 1);
        this.data.super_group.mask.drawRect(0, 0, numbers.GAME_WIDTH, numbers.GAME_HEIGHT);
        this.data.super_group.mask.endFill();

        this.data.map.color_filter.gray = 1;

        this.toggle_reveal();

        this.waving_tween = this.game.add.tween(this.reveal_wave_filter).to(
            {
                phase: 0,
            },
            500,
            Phaser.Easing.Linear.None,
            true,
            0,
            -1
        );
        this.game.add
            .tween(this.reveal_wave_filter)
            .to(
                {
                    a: 0.2,
                    b: 0.16,
                },
                350,
                Phaser.Easing.Linear.None,
                true
            )
            .onComplete.addOnce(() => {
                this.unset_hero_cast_anim();
                this.stop_casting();
            });

        this.data.audio.play_se("psynergy/10");

        this.end_timer = this.game.time.create(true);
        this.end_timer.add(10000, this.finish.bind(this));
        this.end_timer.start();
    }
}
