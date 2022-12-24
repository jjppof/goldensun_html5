import {ability_ranges, ability_target_types} from "../Ability";
import {GoldenSun} from "../GoldenSun";
import {fighter_types, permanent_status, Player, temporary_status} from "../Player";
import {PlayerInfo} from "./Battle";
import {Button} from "../XGamepad";
import {Target, CHOOSE_TARGET_ALLY_SHIFT, CHOOSE_TARGET_ENEMY_SHIFT, BattleStage} from "./BattleStage";
import * as _ from "lodash";
import {Window} from "../Window";
import {GAME_WIDTH, RED_FONT_COLOR} from "../magic_numbers";

export class BattleCursorManager {
    public static readonly CHOOSE_TARGET_RIGHT = 1;
    public static readonly CHOOSE_TARGET_LEFT = -1;

    public static readonly RANGES = [11, 9, 7, 5, 3, 1, 3, 5, 7, 9, 11];
    public static readonly BATTLE_CURSOR_SCALES = [0.1, 0.2, 0.3, 0.4, 0.6, 1, 0.6, 0.4, 0.3, 0.2, 0.1];

    public static readonly CHOOSING_TARGET_SCREEN_SHIFT_TIME = 150;

    private game: Phaser.Game;
    private data: GoldenSun;
    private stage: BattleStage;
    private target_type: string;
    private ability_caster: Player;
    private choosing_targets_callback: Function;
    private range_cursor_position: number;
    private ability_range: ability_ranges;
    private bindings_key: number;
    private include_downed: boolean;
    private status_to_be_healed: (permanent_status | temporary_status)[];
    private status_to_be_healed_window: Window;

    private cursors_tweens: Phaser.Tween[];
    private cursors: Phaser.Sprite[];

    constructor(game: Phaser.Game, data: GoldenSun, stage: BattleStage) {
        this.game = game;
        this.data = data;
        this.stage = stage;
        this.include_downed = false;
        this.status_to_be_healed = [];
        this.status_to_be_healed_window = null;
    }

    private set_targets() {
        let party_count: number, party_info: PlayerInfo[];

        switch (this.target_type) {
            case ability_target_types.ALLY:
                party_count = this.stage.allies_count;
                party_info = this.stage.allies_info;
                break;

            case ability_target_types.ENEMY:
                party_count = this.stage.enemies_count;
                party_info = this.stage.enemies_info;
                break;

            case ability_target_types.USER:
                party_count =
                    this.ability_caster.fighter_type === fighter_types.ALLY
                        ? this.stage.allies_count
                        : this.stage.enemies_count;
                party_info =
                    this.ability_caster.fighter_type === fighter_types.ALLY
                        ? this.stage.allies_info
                        : this.stage.enemies_info;
                break;
        }

        const targets = _.zipWith(
            BattleCursorManager.RANGES.slice(
                this.range_cursor_position - (party_count >> 1),
                this.range_cursor_position + (party_count >> 1) + (party_count & 1)
            ).reverse(),
            party_info,
            (magnitude, target) => {
                let t: Target = {
                    dodged: false,
                    magnitude:
                        magnitude >
                        (this.ability_range === ability_ranges.ALL ? BattleCursorManager.RANGES[0] : this.ability_range)
                            ? null
                            : magnitude,
                    target: target,
                };
                return t;
            }
        );

        if (this.target_type === ability_target_types.USER) {
            this.choosing_targets_callback(targets);
        } else {
            this.choosing_targets_finished(targets);
        }
    }

    private next_target() {
        this.change_target(BattleCursorManager.CHOOSE_TARGET_LEFT);
    }

    private previous_target() {
        this.change_target(BattleCursorManager.CHOOSE_TARGET_RIGHT);
    }

    private change_target(step: number, tween_to_pos: boolean = true, prioritize_downed: boolean = false) {
        if (this.target_type === ability_target_types.ENEMY) {
            step *= -1;
        }

        const group_info =
            this.target_type === ability_target_types.ALLY ? this.stage.allies_info : this.stage.enemies_info;
        const group_length = group_info.length;
        const group_half_length = group_length % 2 ? group_length >> 1 : (group_length >> 1) - 1;

        var target_sprite_index = 0;
        let num_targets_checked = 0;
        if (prioritize_downed) {
            // move the cursor onto a downed character if one exists
            do {
                var [target_sprite_index, step] = this.update_target_sprite_index(
                    target_sprite_index,
                    step,
                    group_length,
                    group_half_length
                );
                num_targets_checked++;
                var is_target_down = group_info[target_sprite_index].instance.has_permanent_status(
                    permanent_status.DOWNED
                );
            } while (num_targets_checked < group_length && !is_target_down);
            if (is_target_down) {
                this.set_battle_cursors_position(tween_to_pos);
                return;
            }
        }
        do {
            var [target_sprite_index, step] = this.update_target_sprite_index(
                target_sprite_index,
                step,
                group_length,
                group_half_length
            );
        } while (
            !this.include_downed &&
            group_info[target_sprite_index].instance.has_permanent_status(permanent_status.DOWNED)
        );

        this.set_battle_cursors_position(tween_to_pos);
    }

    private update_target_sprite_index(
        target_sprite_index: number,
        step: number,
        group_length: number,
        group_half_length
    ) {
        this.range_cursor_position += step;
        if (step === 0) step = BattleCursorManager.CHOOSE_TARGET_LEFT;

        const center_shift = this.range_cursor_position - (BattleCursorManager.RANGES.length >> 1);
        target_sprite_index = group_half_length + center_shift;

        if (target_sprite_index >= group_length) {
            this.range_cursor_position = (BattleCursorManager.RANGES.length >> 1) - group_half_length;
            target_sprite_index = 0;
        } else if (target_sprite_index < 0) {
            this.range_cursor_position =
                (BattleCursorManager.RANGES.length >> 1) + group_half_length + +!(group_length % 2);
            target_sprite_index = group_length - 1;
        }
        return [target_sprite_index, step];
    }

    private reset_status_info_window() {
        if (
            this.target_type === ability_target_types.ENEMY ||
            this.ability_range !== ability_ranges.ONE ||
            this.status_to_be_healed.length === 0 ||
            this.status_to_be_healed_window === null
        ) {
            return;
        }
        this.status_to_be_healed_window.destroy(false);
        this.status_to_be_healed_window = null;
    }

    private set_status_info_window(player_info: PlayerInfo) {
        if (
            this.target_type === ability_target_types.ENEMY ||
            this.ability_range !== ability_ranges.ONE ||
            this.status_to_be_healed.length === 0
        ) {
            return;
        }
        const player = player_info.instance;
        let color_in_red = false;
        const texts: string[] = [];
        if (
            player.has_permanent_status(permanent_status.DOWNED) &&
            this.status_to_be_healed.includes(permanent_status.DOWNED)
        ) {
            texts.push("Revive downed");
        }
        if (
            player.has_permanent_status(permanent_status.POISON) &&
            this.status_to_be_healed.includes(permanent_status.POISON)
        ) {
            texts.push("Cure poison");
        }
        if (
            player.has_permanent_status(permanent_status.VENOM) &&
            this.status_to_be_healed.includes(permanent_status.VENOM)
        ) {
            texts.push("Cure venon");
        }
        if (
            player.has_temporary_status(temporary_status.DELUSION) &&
            this.status_to_be_healed.includes(temporary_status.DELUSION)
        ) {
            texts.push("Remove delusion");
        }
        if (
            player.has_temporary_status(temporary_status.STUN) &&
            this.status_to_be_healed.includes(temporary_status.STUN)
        ) {
            texts.push("Remove stun");
        }
        if (
            player.has_temporary_status(temporary_status.SLEEP) &&
            this.status_to_be_healed.includes(temporary_status.SLEEP)
        ) {
            texts.push("Wake from sleep");
        }
        if (
            player.has_temporary_status(temporary_status.SEAL) &&
            this.status_to_be_healed.includes(temporary_status.SEAL)
        ) {
            texts.push("Break Psynergy seal");
        }
        if (
            player.has_temporary_status(temporary_status.DEATH_CURSE) &&
            this.status_to_be_healed.includes(temporary_status.DEATH_CURSE)
        ) {
            texts.push("Dispel Grim Reaper");
        }
        if (texts.length === 0) {
            texts.push("No effect");
            color_in_red = true;
        }
        this.status_to_be_healed_window = new Window(this.game, 0, 0, 0, 0);
        this.status_to_be_healed_window.set_lines_of_text(texts, {
            update_size: true,
            space_between_lines: 1,
            color: color_in_red ? RED_FONT_COLOR : undefined,
        });
        let x = (player_info.sprite.x | 0) - (this.status_to_be_healed_window.width >> 1);
        if (this.game.camera.x + x + this.status_to_be_healed_window.width > this.game.camera.x + GAME_WIDTH) {
            const shift = +x + this.status_to_be_healed_window.width - GAME_WIDTH + 4;
            x -= shift;
        }
        const y =
            (player_info.sprite.y | 0) - (player_info.sprite.height | 0) - this.status_to_be_healed_window.height - 4;
        this.status_to_be_healed_window.update_position({x: x, y: y});
        this.status_to_be_healed_window.show(undefined, false);
    }

    private set_battle_cursors_position(tween_to_pos: boolean = true) {
        const group_info =
            this.target_type === ability_target_types.ALLY ? this.stage.allies_info : this.stage.enemies_info;
        const group_half_length = group_info.length % 2 ? group_info.length >> 1 : (group_info.length >> 1) - 1;
        const center_shift = this.range_cursor_position - (BattleCursorManager.RANGES.length >> 1);

        this.reset_status_info_window();

        this.cursors.forEach((cursor_sprite, i) => {
            let target_index = i - ((this.cursors.length >> 1) - group_half_length) + center_shift;
            const target_info = group_info[target_index];

            if (
                target_info &&
                (this.include_downed || !target_info.instance.has_permanent_status(permanent_status.DOWNED))
            ) {
                const target_sprite = target_info.sprite;
                let this_scale;
                if (this.ability_range === ability_ranges.ALL) {
                    this_scale = 1.0;
                } else {
                    this_scale =
                        BattleCursorManager.BATTLE_CURSOR_SCALES[
                            this.range_cursor_position - center_shift - (this.cursors.length >> 1) + i
                        ];
                }

                cursor_sprite.scale.setTo(this_scale, this_scale);
                cursor_sprite.visible = true;

                if (this.cursors_tweens[i]) {
                    this.cursors_tweens[i].stop();
                }

                const dest_x = target_sprite.x;
                const dest_y = target_sprite.y - target_sprite.height;

                if (tween_to_pos) {
                    this.game.add
                        .tween(cursor_sprite)
                        .to(
                            {
                                centerX: dest_x,
                                y: dest_y,
                            },
                            85,
                            Phaser.Easing.Linear.None,
                            true
                        )
                        .onComplete.addOnce(() => {
                            this.set_status_info_window(target_info);
                            this.cursors_tweens[i] = this.game.add.tween(cursor_sprite).to(
                                {
                                    y: cursor_sprite.y - 4,
                                },
                                100,
                                Phaser.Easing.Linear.None,
                                true,
                                0,
                                -1,
                                true
                            );
                        });
                } else {
                    cursor_sprite.centerX = dest_x;
                    cursor_sprite.y = dest_y;

                    this.set_status_info_window(target_info);

                    this.cursors_tweens[i] = this.game.add.tween(cursor_sprite).to(
                        {
                            y: cursor_sprite.y - 4,
                        },
                        100,
                        Phaser.Easing.Linear.None,
                        true,
                        0,
                        -1,
                        true
                    );
                }
            } else {
                cursor_sprite.visible = false;
                target_index = target_index < 0 ? 0 : group_info.length - 1;

                const target_sprite = group_info[target_index].sprite;
                cursor_sprite.centerX = target_sprite.x;
                cursor_sprite.y = target_sprite.y - target_sprite.height;
            }
        });
    }

    choose_targets(
        range: ability_ranges,
        target_type: string,
        ability_caster: Player,
        callback: Function,
        affects_downed: boolean = false,
        status_to_be_healed?: BattleCursorManager["status_to_be_healed"]
    ) {
        this.choosing_targets_callback = callback;
        this.range_cursor_position = BattleCursorManager.RANGES.length >> 1;

        this.ability_range = range;
        this.ability_caster = ability_caster;

        this.include_downed = affects_downed;

        this.status_to_be_healed = status_to_be_healed ?? [];

        this.target_type = target_type;
        if (this.target_type === ability_target_types.USER) {
            this.set_targets();
        } else {
            this.game.add
                .tween(this.stage.battle_group)
                .to(
                    {
                        y:
                            this.stage.battle_group.y +
                            (this.target_type === ability_target_types.ALLY
                                ? CHOOSE_TARGET_ALLY_SHIFT
                                : CHOOSE_TARGET_ENEMY_SHIFT),
                    },
                    BattleCursorManager.CHOOSING_TARGET_SCREEN_SHIFT_TIME,
                    Phaser.Easing.Linear.None,
                    true
                )
                .onComplete.addOnce(() => {
                    const cursor_count =
                        this.ability_range === ability_ranges.ALL ? BattleCursorManager.RANGES[0] : this.ability_range;

                    this.cursors = new Array<Phaser.Sprite>(cursor_count as number);
                    this.cursors_tweens = new Array<Phaser.Tween>(cursor_count as number).fill(null);

                    for (let i = 0; i < cursor_count; ++i) {
                        this.cursors[i] = this.stage.battle_group.create(0, 0, "battle_cursor");
                        this.cursors[i].animations.add("anim");
                        this.cursors[i].animations.play("anim", 40, true);
                    }

                    this.change_target(0, false, affects_downed);

                    // Sound for A key unavailable, using Menu Positive instead
                    const controls = [
                        {buttons: Button.LEFT, on_down: this.next_target.bind(this), sfx: {down: "menu/move"}},
                        {buttons: Button.RIGHT, on_down: this.previous_target.bind(this), sfx: {down: "menu/move"}},
                        {buttons: Button.A, on_down: this.set_targets.bind(this), sfx: {down: "menu/positive"}},
                        {
                            buttons: Button.B,
                            on_down: this.choosing_targets_finished.bind(this, null),
                            sfx: {down: "menu/negative"},
                        },
                    ];
                    this.bindings_key = this.data.control_manager.add_controls(controls, {
                        loop_config: {horizontal: true},
                    });
                });
        }
    }

    private choosing_targets_finished(targets: Target[]) {
        this.game.add.tween(this.stage.battle_group).to(
            {
                y:
                    this.stage.battle_group.y -
                    (this.target_type === ability_target_types.ALLY
                        ? CHOOSE_TARGET_ALLY_SHIFT
                        : CHOOSE_TARGET_ENEMY_SHIFT),
            },
            BattleCursorManager.CHOOSING_TARGET_SCREEN_SHIFT_TIME,
            Phaser.Easing.Linear.None,
            true
        );

        this.unset_battle_cursors();
        this.choosing_targets_callback(targets);
    }

    private unset_battle_cursors() {
        this.reset_status_info_window();
        this.cursors.forEach((sprite, i) => {
            sprite.destroy();
            if (this.cursors_tweens[i]) {
                this.cursors_tweens[i].stop();
            }
        });
        this.data.control_manager.detach_bindings(this.bindings_key);
    }
}
