import {ability_ranges, ability_target_types} from "../Ability";
import {GoldenSun} from "../GoldenSun";
import {fighter_types, permanent_status, Player} from "../Player";
import {PlayerInfo} from "./Battle";
import {Button} from "../XGamepad";
import {Target, CHOOSE_TARGET_ALLY_SHIFT, CHOOSE_TARGET_ENEMY_SHIFT, BattleStage} from "./BattleStage";
import * as _ from "lodash";

const CHOOSE_TARGET_RIGHT = 1;
const CHOOSE_TARGET_LEFT = -1;

const RANGES = [11, 9, 7, 5, 3, 1, 3, 5, 7, 9, 11];
const BATTLE_CURSOR_SCALES = [0.1, 0.2, 0.3, 0.4, 0.6, 1, 0.6, 0.4, 0.3, 0.2, 0.1];

const CHOOSING_TARGET_SCREEN_SHIFT_TIME = 150;

export class BattleCursorManager {
    private game: Phaser.Game;
    private data: GoldenSun;
    private stage: BattleStage;
    private target_type: string;
    private ability_caster: Player;
    private choosing_targets_callback: Function;
    private range_cursor_position: number;
    private ability_range: ability_ranges;
    private bindings_key: number;

    private cursors_tweens: Phaser.Tween[];
    private cursors: Phaser.Sprite[];

    constructor(game: Phaser.Game, data: GoldenSun, stage: BattleStage) {
        this.game = game;
        this.data = data;
        this.stage = stage;
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
                    this.ability_caster.fighter_type === fighter_types.ENEMY
                        ? this.stage.allies_info
                        : this.stage.enemies_info;
                break;
        }

        const targets = _.zipWith(
            RANGES.slice(
                this.range_cursor_position - (party_count >> 1),
                this.range_cursor_position + (party_count >> 1) + (party_count & 1)
            ).reverse(),
            party_info,
            (magnitude, target) => {
                let t: Target = {
                    magnitude:
                        magnitude > (this.ability_range === ability_ranges.ALL ? RANGES[0] : this.ability_range)
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
        this.change_target(CHOOSE_TARGET_LEFT);
    }

    private previous_target() {
        this.change_target(CHOOSE_TARGET_RIGHT);
    }

    private change_target(step: number, tween_to_pos: boolean = true) {
        if (this.target_type === ability_target_types.ENEMY) {
            step *= -1;
        }

        const group_info =
            this.target_type === ability_target_types.ALLY ? this.stage.allies_info : this.stage.enemies_info;
        const group_length = group_info.length;
        const group_half_length = group_length % 2 ? group_length >> 1 : (group_length >> 1) - 1;

        let target_sprite_index: number;

        do {
            this.range_cursor_position += step;
            if (step === 0) step = CHOOSE_TARGET_LEFT;

            const center_shift = this.range_cursor_position - (RANGES.length >> 1);
            target_sprite_index = group_half_length + center_shift;

            if (target_sprite_index >= group_length) {
                this.range_cursor_position = (RANGES.length >> 1) - group_half_length;
                target_sprite_index = 0;
            } else if (target_sprite_index < 0) {
                this.range_cursor_position = (RANGES.length >> 1) + group_half_length + +!(group_length % 2);
                target_sprite_index = group_length - 1;
            }
        } while (group_info[target_sprite_index].instance.has_permanent_status(permanent_status.DOWNED));

        this.set_battle_cursors_position(tween_to_pos);
    }

    private set_battle_cursors_position(tween_to_pos: boolean = true) {
        const group_info =
            this.target_type === ability_target_types.ALLY ? this.stage.allies_info : this.stage.enemies_info;
        const group_half_length = group_info.length % 2 ? group_info.length >> 1 : (group_info.length >> 1) - 1;
        const center_shift = this.range_cursor_position - (RANGES.length >> 1);

        this.cursors.forEach((cursor_sprite, i) => {
            let target_index = i - ((this.cursors.length >> 1) - group_half_length) + center_shift;
            const target_info = group_info[target_index];

            if (target_info && !target_info.instance.has_permanent_status(permanent_status.DOWNED)) {
                const target_sprite = target_info.sprite;
                let this_scale;
                if (this.ability_range === ability_ranges.ALL) {
                    this_scale = 1.0;
                } else {
                    this_scale =
                        BATTLE_CURSOR_SCALES[
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

    choose_targets(range: ability_ranges, target_type: string, ability_caster: Player, callback: Function) {
        this.choosing_targets_callback = callback;
        this.range_cursor_position = RANGES.length >> 1;

        this.ability_range = range;
        this.ability_caster = ability_caster;

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
                    CHOOSING_TARGET_SCREEN_SHIFT_TIME,
                    Phaser.Easing.Linear.None,
                    true
                )
                .onComplete.addOnce(() => {
                    const cursor_count = this.ability_range === ability_ranges.ALL ? RANGES[0] : this.ability_range;

                    this.cursors = new Array<Phaser.Sprite>(cursor_count as number);
                    this.cursors_tweens = new Array<Phaser.Tween>(cursor_count as number).fill(null);

                    for (let i = 0; i < cursor_count; ++i) {
                        this.cursors[i] = this.stage.battle_group.create(0, 0, "battle_cursor");
                        this.cursors[i].animations.add("anim");
                        this.cursors[i].animations.play("anim", 40, true);
                    }

                    this.change_target(0, false);

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
            CHOOSING_TARGET_SCREEN_SHIFT_TIME,
            Phaser.Easing.Linear.None,
            true
        );

        this.unset_battle_cursors();
        this.choosing_targets_callback(targets);
    }

    private unset_battle_cursors() {
        this.cursors.forEach((sprite, i) => {
            sprite.destroy();
            if (this.cursors_tweens[i]) {
                this.cursors_tweens[i].stop();
            }
        });
        this.data.control_manager.detach_bindings(this.bindings_key);
    }
}
