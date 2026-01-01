import {base_actions} from "../utils";
import {GoldenSun} from "../GoldenSun";
import {SpriteBase} from "../SpriteBase";
import {Enemy, get_enemy_instance} from "../Enemy";
import {MainChar} from "../MainChar";
import {PlayerSprite} from "./PlayerSprite";
import * as _ from "lodash";
import {FPS_MULT, GAME_WIDTH} from "../magic_numbers";
import {Ability} from "../Ability";
import {PlayerAbility} from "../main_menus/MainBattleMenu";
import {BattleAnimationManager, animation_availability} from "./BattleAnimationManager";
import {fighter_types} from "../Player";
import {BattleStage} from "./BattleStage";
import {BattleLog} from "./BattleLog";
import {Map} from "../Map";

export type PlayerInfo = {
    sprite_key?: string;
    instance?: Enemy | MainChar;
    entered_in_battle?: boolean;
    battle_key?: string;
    sprite?: PlayerSprite;
    hue_angle?: number;
};

export type EnemyPartyMember = {
    key: string;
    min: number;
    max: number;
    hue_angle: number;
};

export abstract class BattleBase {
    public static readonly MAX_CHARS_IN_BATTLE = 4;

    public game: Phaser.Game;
    public data: GoldenSun;
    public background_key: string;
    public battle_finishing: boolean;
    public allies_info: PlayerInfo[];
    public enemies_info: PlayerInfo[];
    public enemies_party_name: string;
    public this_enemies_list: {[battle_key: string]: Enemy};
    public advance_log_resolve: () => void;
    public advance_log_control_key: number;
    public animation_manager: BattleAnimationManager;
    public battle_stage: BattleStage;
    public battle_log: BattleLog;
    public allies_map_sprite: {[player_key: string]: PlayerSprite};
    public enemies_map_sprite: {[player_key: string]: PlayerSprite};
    public previous_map_state: ReturnType<Map["pause"]>;

    constructor(game: Phaser.Game, data: GoldenSun, background_key: string, enemy_party_key: string) {
        this.game = game;
        this.data = data;
        this.background_key = background_key;
        this.battle_finishing = false;

        this.allies_info = this.data.info.party_data.members.slice(0, BattleBase.MAX_CHARS_IN_BATTLE).map(char => {
            char.init_effect_turns_count();
            return {
                sprite_key: char.sprite_base.getSpriteKey(base_actions.BATTLE),
                instance: char,
                entered_in_battle: true,
            } as PlayerInfo;
        });

        const enemies_party_data = this.data.dbs.enemies_parties_db[enemy_party_key];
        this.enemies_party_name = enemies_party_data.name;
        this.enemies_info = [];
        this.this_enemies_list = {};

        let battle_keys_count = {};
        let counter = 0;

        enemies_party_data.members.forEach((member_info: EnemyPartyMember) => {
            const qtd = _.random(member_info.min, member_info.max);
            for (let i = 0; i < qtd; ++i) {
                this.enemies_info.push({
                    sprite_key: member_info.key + SpriteBase.ACTION_ANIM_SEPARATOR + base_actions.BATTLE,
                    hue_angle: member_info.hue_angle ?? 0,
                });

                if (this.enemies_info[counter].sprite_key in battle_keys_count) {
                    battle_keys_count[this.enemies_info[counter].sprite_key] += 1;
                } else {
                    battle_keys_count[this.enemies_info[counter].sprite_key] = 1;
                }

                let battle_key_suffix = "",
                    name_suffix = "";
                if (battle_keys_count[this.enemies_info[counter].sprite_key] > 1) {
                    battle_key_suffix =
                        SpriteBase.ACTION_ANIM_SEPARATOR +
                        battle_keys_count[this.enemies_info[counter].sprite_key].toString();
                    name_suffix = " " + battle_keys_count[this.enemies_info[counter].sprite_key].toString();
                }

                this.enemies_info[counter].instance = get_enemy_instance(
                    this.data,
                    this.data.info.enemies_list[member_info.key].data,
                    name_suffix
                );
                this.enemies_info[counter].battle_key = this.enemies_info[counter].sprite_key + battle_key_suffix;
                this.this_enemies_list[this.enemies_info[counter].battle_key] = this.enemies_info[counter]
                    .instance as Enemy;

                ++counter;
            }
        });
    }

    abstract start_battle(): void;

    abstract initialize_battle_objs(): void;

    abstract battle_phase_none(): void;

    abstract battle_phase_round_start(ability_key?: string, hit_all_enemies?: boolean): void;

    abstract set_action_animation_settings(action: PlayerAbility, ability: Ability): void;

    abstract battle_phase_combat(): void;

    abstract unset_battle(): void;

    async battle_fadein() {
        this.data.audio.play_se("monster_defeat/monster_2");
        const graphic = this.game.add.graphics(this.data.hero.sprite.x, this.data.hero.sprite.y);
        graphic.clear();
        graphic.beginFill(0xfffffff);
        const circle = graphic.drawCircle(0, 0, 3 * (GAME_WIDTH >> 1));
        circle.scale.setTo(0, 0);
        let resolve_promise;
        const promise = new Promise(resolve => (resolve_promise = resolve));
        const tween = this.game.add.tween(circle.scale).to({x: 1, y: 1}, 400, Phaser.Easing.Linear.None, true);
        let scale_tween_delta_acc = 0;
        tween.onUpdateCallback(() => {
            scale_tween_delta_acc += this.game.time.delta;
            if (scale_tween_delta_acc < FPS_MULT) {
                return;
            }
            scale_tween_delta_acc = 0;
            circle.visible = !circle.visible;
        });
        tween.onComplete.addOnce(() => {
            circle.visible = true;
            const color_obj = {
                r: 0xff,
                g: 0xff,
                b: 0xff,
            };
            const color_tween = this.game.add.tween(color_obj).to(
                {
                    r: 0x0,
                    g: 0x0,
                    b: 0x0,
                },
                300,
                Phaser.Easing.Linear.None,
                true
            );
            scale_tween_delta_acc = 0;
            color_tween.onUpdateCallback(() => {
                scale_tween_delta_acc += this.game.time.delta;
                if (scale_tween_delta_acc < FPS_MULT) {
                    return;
                }
                scale_tween_delta_acc = 0;
                circle.tint = (color_obj.r << 16) + (color_obj.g << 8) + color_obj.b;
            });
            color_tween.onComplete.addOnce(() => {
                this.data.game.camera.fade(0x0, 0, true);
                this.data.game.camera.fx.alpha = 1;
                circle.destroy();
                graphic.destroy();
                resolve_promise();
            });
        });
        await promise;
    }

    wait_for_key() {
        return new Promise<void>(resolve => {
            this.advance_log_resolve = resolve;
        });
    }

    async play_battle_animation(action: PlayerAbility, ability: Ability) {
        const anim_availability = this.animation_manager.animation_available(
            action.battle_animation_key,
            action.caster_battle_key
        );
        if (anim_availability === animation_availability.AVAILABLE) {
            const caster_targets_sprites = {
                caster:
                    action.caster.fighter_type === fighter_types.ALLY
                        ? this.allies_map_sprite
                        : this.enemies_map_sprite,
                targets:
                    action.caster.fighter_type === fighter_types.ALLY
                        ? this.enemies_map_sprite
                        : this.allies_map_sprite,
                allies:
                    action.caster.fighter_type === fighter_types.ALLY
                        ? this.allies_map_sprite
                        : this.enemies_map_sprite,
            };
            const caster_sprite = caster_targets_sprites.caster[action.caster_battle_key];
            const target_sprites = action.targets.flatMap(info => {
                return info.magnitude ? [caster_targets_sprites.targets[info.target.battle_key]] : [];
            });
            const allies_sprites = Object.values(caster_targets_sprites.allies).filter(
                ally => ally.battle_key !== action.caster_battle_key
            );
            const group_caster =
                action.caster.fighter_type === fighter_types.ALLY
                    ? this.battle_stage.group_allies
                    : this.battle_stage.group_enemies;
            const group_taker =
                action.caster.fighter_type === fighter_types.ALLY
                    ? this.battle_stage.group_enemies
                    : this.battle_stage.group_allies;
            this.battle_stage.pause_players_update = true;
            if (action.cast_animation_type && action.caster_battle_key) {
                const animation_recipe = this.data.info.abilities_cast_recipes[action.cast_animation_type];
                const cast_animation = BattleAnimationManager.get_animation_instance(
                    this.game,
                    this.data,
                    animation_recipe,
                    action.caster.fighter_type !== fighter_types.ALLY,
                    ability.element
                );
                const main_animation = this.animation_manager.get_animation(
                    action.battle_animation_key,
                    action.caster_battle_key
                );
                const cast_promise = this.animation_manager.play_animation(
                    cast_animation,
                    caster_sprite,
                    target_sprites,
                    allies_sprites,
                    group_caster,
                    group_taker,
                    this.battle_stage
                );
                if (main_animation.wait_for_cast_animation) {
                    await cast_promise;
                }
            }
            const target_dodged = action.targets.some(target_info => target_info.dodged);
            await this.animation_manager.play(
                action.battle_animation_key,
                action.caster_battle_key,
                caster_sprite,
                target_sprites,
                allies_sprites,
                group_caster,
                group_taker,
                this.battle_stage,
                target_dodged
            );
            this.battle_stage.prevent_camera_angle_overflow();
        } else if (anim_availability === animation_availability.NOT_AVAILABLE) {
            await this.battle_log.add(`Animation for ${ability.name} not available...`);
            await this.wait_for_key();
        }
    }

    update() {
        if (this.battle_finishing) return;
        this.battle_stage.update_stage();
        this.animation_manager.render();
    }
}
