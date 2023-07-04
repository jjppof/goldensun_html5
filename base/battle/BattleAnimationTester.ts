import {fighter_types} from "../Player";
import {BattleStage} from "./BattleStage";
import {BattleLog} from "./BattleLog";
import {PlayerAbility} from "../main_menus/MainBattleMenu";
import {Enemy, get_enemy_instance} from "../Enemy";
import {Ability} from "../Ability";
import {animation_availability, BattleAnimationManager} from "./BattleAnimationManager";
import {GoldenSun} from "../GoldenSun";
import * as _ from "lodash";
import {Map} from "../Map";
import {GAME_WIDTH} from "../magic_numbers";
import {SpriteBase} from "../SpriteBase";
import {Battle, EnemyPartyMember, PlayerInfo} from "./Battle";
import {base_actions, promised_wait} from "../utils";
import {PlayerSprite} from "./PlayerSprite";

export class BattleAnimationTester {
    public game: Phaser.Game;
    public data: GoldenSun;

    public allies_info: PlayerInfo[];
    public enemies_party_name: string;
    public enemies_info: PlayerInfo[];
    public this_enemies_list: {[battle_key: string]: Enemy};

    public battle_stage: BattleStage;
    public battle_log: BattleLog;

    public animation_manager: BattleAnimationManager;

    public advance_log_resolve: Function;
    public advance_log_control_key: number;

    public allies_map_sprite: {[player_key: string]: PlayerSprite};
    public enemies_map_sprite: {[player_key: string]: PlayerSprite};

    public previous_map_state: ReturnType<Map["pause"]>;
    public background_key: string;

    public initialized: boolean;
    public battle_finishing: boolean;
    public playing_animation: boolean;

    public action: PlayerAbility;

    constructor(game: Phaser.Game, data: GoldenSun, background_key: string, enemy_party_key: string) {
        this.game = game;
        this.data = data;
        this.background_key = background_key;
        this.initialized = false;
        this.battle_finishing = false;
        this.playing_animation = false;

        this.allies_info = this.data.info.party_data.members.slice(0, Battle.MAX_CHARS_IN_BATTLE).map(char => {
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

    async start_battle() {
        if (this.initialized) {
            return;
        }
        await this.battle_phase_none();
        this.initialized = true;
    }

    async fire_animation(ability_key: string) {
        if (this.playing_animation) {
            return;
        }
        this.playing_animation = true;
        await this.battle_phase_round_start(ability_key);
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
        tween.onUpdateCallback(() => {
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
            color_tween.onUpdateCallback(() => {
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

    async battle_phase_round_start(ability_key: string) {
        const this_char = this.data.info.party_data.members[0];

        const enem_index = this.enemies_info.length - 1;
        this.action = {
            key_name: ability_key,
            caster: this_char,
            caster_battle_key: this_char.key_name,
            targets: [
                {
                    magnitude: 1,
                    target: {
                        sprite_key: this.enemies_info[enem_index].sprite_key,
                        instance: this.enemies_info[enem_index].instance,
                        battle_key: this.enemies_info[enem_index].battle_key,
                        sprite: this.enemies_info[enem_index].sprite,
                    },
                },
            ],
        };

        const ability = this.data.info.abilities_list[this.action.key_name];
        await this.set_action_animation_settings(this.action, ability);

        await promised_wait(this.game, 500);
    }

    async set_action_animation_settings(action: PlayerAbility, ability: Ability) {
        if (action.caster.is_paralyzed(true)) {
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

    wait_for_key() {
        return new Promise<void>(resolve => {
            this.advance_log_resolve = resolve;
        });
    }

    async battle_phase_combat() {
        //gets the ability of this phase
        let ability = this.data.info.abilities_list[this.action.key_name];
        if (!ability) {
            await this.wait_for_key();

            return;
        }

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
        await this.battle_log.add_ability(
            this.action.caster,
            ability,
            null,
            djinn_name,
            this.action.item_slot !== undefined
        );

        //executes the animation of the current ability
        await this.play_battle_animation(this.action, ability);

        //resets stage and chars position to default
        this.battle_stage.pause_players_update = false;
        this.battle_stage.set_update_factor(1);
        await Promise.all([this.battle_stage.reset_chars_position(), this.battle_stage.set_stage_default_position()]);
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

    update() {
        if (this.battle_finishing) return;
        this.battle_stage.update_stage();
        this.animation_manager.render();
    }
}
