import {fighter_types} from "../Player";
import {BattleStage} from "./BattleStage";
import {BattleLog} from "./BattleLog";
import {PlayerAbility} from "../main_menus/MainBattleMenu";
import {Ability} from "../Ability";
import {BattleAnimationManager} from "./BattleAnimationManager";
import {GoldenSun} from "../GoldenSun";
import * as _ from "lodash";
import {promised_wait} from "../utils";
import {BattleBase, PlayerInfo} from "./BattleBase";

export class BattleAnimationTester extends BattleBase {
    public initialized: boolean;
    public playing_animation: boolean;

    public action: PlayerAbility;

    constructor(game: Phaser.Game, data: GoldenSun, background_key: string, enemy_party_key: string) {
        super(game, data, background_key, enemy_party_key);
        this.initialized = false;
        this.playing_animation = false;
    }

    async start_battle() {
        if (this.initialized) {
            return;
        }
        await this.battle_phase_none();
        this.initialized = true;
    }

    async fire_animation(ability_key: string, hit_all_enemies: boolean = false) {
        if (this.playing_animation) {
            return;
        }
        this.playing_animation = true;
        await this.battle_phase_round_start(ability_key, hit_all_enemies);
        await this.battle_phase_combat();
        this.playing_animation = false;
    }

    initialize_battle_objs() {
        this.battle_stage = new BattleStage(
            this.game,
            this.data,
            this.background_key,
            this.allies_info,
            this.enemies_info
        );
        this.battle_log = new BattleLog(this.game);
        this.animation_manager = new BattleAnimationManager(this.game, this.data);
    }

    async battle_phase_none() {
        this.data.hero.stop_char(true);
        this.game.physics.p2.pause();

        await this.battle_fadein();

        this.initialize_battle_objs();

        this.data.battle_instance = this;
        this.data.in_battle = true;

        this.previous_map_state = this.data.map.pause();

        this.advance_log_control_key = this.data.control_manager.add_simple_controls(
            () => {
                if (this.advance_log_resolve) {
                    this.advance_log_resolve();
                    this.advance_log_resolve = null;
                }
            },
            {persist: true}
        );

        this.battle_log.add(this.enemies_party_name + " appeared!");
        this.battle_stage.initialize_stage(() => {
            this.allies_map_sprite = _.mapValues(
                _.keyBy(this.allies_info, "instance.key_name"),
                (info: PlayerInfo) => info.sprite
            );
            this.enemies_map_sprite = _.mapValues(
                _.keyBy(this.enemies_info, "battle_key"),
                (info: PlayerInfo) => info.sprite
            );

            this.data.control_manager.add_simple_controls(() => {
                this.battle_log.clear();
            });
        });
    }

    async battle_phase_round_start(ability_key: string, hit_all_enemies: boolean = false) {
        const this_char = this.data.info.party_data.members[0];

        const enemies = hit_all_enemies ? this.enemies_info : [this.enemies_info[this.enemies_info.length - 1]];
        this.action = {
            key_name: ability_key,
            caster: this_char,
            caster_battle_key: this_char.key_name,
            targets: enemies.map(enem => ({
                magnitude: 1,
                target: {
                    sprite_key: enem.sprite_key,
                    instance: enem.instance,
                    battle_key: enem.battle_key,
                    sprite: enem.sprite,
                },
            })),
        };

        const ability = this.data.info.abilities_list[this.action.key_name];
        await this.set_action_animation_settings(this.action, ability);

        await promised_wait(this.game, 500);
    }

    async set_action_animation_settings(action: PlayerAbility, ability: Ability) {
        if (!(action.key_name in this.data.info.abilities_list)) {
            return;
        }
        //check whether the player of this action has a variation for this battle animation
        let battle_animation_key = this.data.info.abilities_list[action.key_name].battle_animation_key;
        if (ability.has_animation_variation && action.key_name in action.caster.battle_animations_variations) {
            battle_animation_key = action.caster.battle_animations_variations[action.key_name];
        }
        action.battle_animation_key = battle_animation_key;

        const mirrored_animation = ability.can_be_mirrored && action.caster.fighter_type === fighter_types.ENEMY;

        //loads battle animation assets for this ability
        const battle_animation = await this.animation_manager.load_animation(
            battle_animation_key,
            action.caster_battle_key,
            mirrored_animation
        );
        action.cast_animation_type = battle_animation?.cast_type;
    }

    async battle_phase_combat() {
        //gets the ability of this phase
        let ability = this.data.info.abilities_list[this.action.key_name];

        //check whether this ability exists
        if (ability === undefined) {
            await this.battle_log.add(`${this.action.key_name} ability key not registered.`);
            await this.wait_for_key();
            return;
        }

        //logs ability to be casted
        const djinn_name = this.action.djinn_key_name
            ? this.data.info.djinni_list[this.action.djinn_key_name].name
            : undefined;
        await this.battle_log.add(
            this.battle_log.add_ability(
                this.action.caster,
                ability,
                null,
                djinn_name,
                this.action.item_slot !== undefined
            )
        );

        //executes the animation of the current ability
        await this.play_battle_animation(this.action, ability);

        //resets stage and chars position to default
        this.battle_stage.pause_players_update = false;
        this.battle_stage.set_update_factor(1);
        this.battle_stage.set_bg_default_position();
        await Promise.all([this.battle_stage.reset_chars_position(), this.battle_stage.set_stage_default_position()]);
    }

    unset_battle() {
        this.battle_finishing = true;
        this.data.map.resume(this.previous_map_state);
        this.battle_stage.unset_stage(
            () => {
                this.data.control_manager.reset();
                this.data.control_manager.detach_bindings(this.advance_log_control_key);

                this.battle_log.destroy();
                this.animation_manager.destroy();

                return null;
            },
            () => {
                this.data.battle_instance = null;
                this.data.in_battle = false;
                this.game.physics.p2.resume();
            }
        );
    }
}
