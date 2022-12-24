import {permanent_status, temporary_status, on_catch_status_msg, fighter_types, Player, main_stats} from "../Player";
import {BattleStage} from "./BattleStage";
import {BattleLog} from "./BattleLog";
import {MainBattleMenu, PlayerAbilities, PlayerAbility} from "../main_menus/MainBattleMenu";
import {Enemy, get_enemy_instance} from "../Enemy";
import {ability_types, Ability, ability_categories} from "../Ability";
import {ChoosingTargetWindow} from "../windows/battle/ChoosingTargetWindow";
import {EnemyAI} from "./EnemyAI";
import {BattleFormulas, EVASION_CHANCE, DELUSION_MISS_CHANCE} from "./BattleFormulas";
import {effect_types, Effect, effect_usages, effect_names} from "../Effect";
import {ordered_elements, element_names, base_actions} from "../utils";
import {djinn_status, Djinn} from "../Djinn";
import {ItemSlot, MainChar} from "../MainChar";
import {animation_availability, BattleAnimationManager} from "./BattleAnimationManager";
import {GoldenSun} from "../GoldenSun";
import * as _ from "lodash";
import {Target} from "../battle/BattleStage";
import {Item, use_types} from "../Item";
import {battle_actions, PlayerSprite} from "./PlayerSprite";
import {Map} from "../Map";
import {GAME_WIDTH} from "../magic_numbers";
import {SpriteBase} from "../SpriteBase";

/* ACTIONS:
- Attack
- Psynergy
- Djinni Use
- Djinni Recovery
- Item
- Enemy Action
- Defend
- Total Defense (yes, this is defined differently from Defend for some reason)
- Counterattack
- Daedalus
- Retreat
*/

enum battle_phases {
    NONE, // (not in a battle)
    START, // Start (camera pan, shows enemies, move to menu)
    MENU, // (includes submenus, this phase doesn't end until the player has entered their final command)
    ROUND_START, // Start (turn order is determined, enemies may commit to certain actions)
    COMBAT, // (all actions are queued and take place here, you could further break up combat actions into subactions, which should be governed by a separate sub-state variable)
    ROUND_END, // End (djinn recovery, status/buff/debuff timers decrement)
    FLEE,
    END, // End (the last enemy has fallen, exp/gold/drops are awarded)
}

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

export class Battle {
    public static readonly MAX_CHARS_IN_BATTLE = 4;

    public game: Phaser.Game;
    public data: GoldenSun;

    public allies_info: PlayerInfo[];
    public enemies_party_name: string;
    public enemies_info: PlayerInfo[];
    public this_enemies_list: {[battle_key: string]: Enemy};

    public battle_stage: BattleStage;
    public battle_log: BattleLog;
    public battle_menu: MainBattleMenu;

    public target_window: ChoosingTargetWindow;
    public animation_manager: BattleAnimationManager;

    public battle_phase: number;
    public on_going_effects: Effect[];
    public allies_defeated: boolean;
    public enemies_defeated: boolean;
    public battle_finishing: boolean;
    public can_escape: boolean;
    public party_fled: boolean;

    public advance_log_resolve: Function;
    public advance_log_control_key: number;
    public allies_abilities: PlayerAbilities;
    public enemies_abilities: PlayerAbilities;
    public turns_actions: PlayerAbility[];
    public round_end_effects: {
        action: PlayerAbility;
        ability: Ability;
        effect: any;
    }[];

    public allies_map_sprite: {[player_key: string]: PlayerSprite};
    public enemies_map_sprite: {[player_key: string]: PlayerSprite};

    public previous_map_state: ReturnType<Map["pause"]>;
    public before_fade_finish_callback: (victory: boolean, party_fled: boolean) => Promise<void>;
    public finish_callback: (victory: boolean, party_fled?: boolean) => void;
    public background_key: string;

    constructor(
        game: Phaser.Game,
        data: GoldenSun,
        background_key: string,
        enemy_party_key: string,
        before_fade_finish_callback?: Battle["before_fade_finish_callback"],
        finish_callback?: Battle["finish_callback"]
    ) {
        this.game = game;
        this.data = data;
        this.before_fade_finish_callback = before_fade_finish_callback;
        this.finish_callback = finish_callback;
        this.background_key = background_key;

        this.allies_info = this.data.info.party_data.members.slice(0, Battle.MAX_CHARS_IN_BATTLE).map(char => {
            char.init_effect_turns_count();
            return {
                sprite_key: char.sprite_base.getSpriteKey(base_actions.BATTLE),
                instance: char,
                entered_in_battle: true,
            } as PlayerInfo;
        });

        const enemies_party_data = this.data.dbs.enemies_parties_db[enemy_party_key];
        this.can_escape = enemies_party_data.can_escape;
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
                    this.data.info.enemies_list[member_info.key].data,
                    name_suffix
                );
                this.enemies_info[counter].battle_key = this.enemies_info[counter].sprite_key + battle_key_suffix;
                this.this_enemies_list[this.enemies_info[counter].battle_key] = this.enemies_info[counter]
                    .instance as Enemy;

                ++counter;
            }
        });

        this.battle_phase = battle_phases.NONE;
        this.on_going_effects = [];
        this.round_end_effects = [];
        this.allies_defeated = false;
        this.enemies_defeated = false;
        this.battle_finishing = false;
        this.party_fled = false;
    }

    start_battle() {
        this.check_phases();
    }

    on_abilities_choose(abilities: PlayerAbilities) {
        this.allies_abilities = abilities;

        this.battle_menu.close_menu();
        this.battle_stage.reset_positions();

        this.battle_stage.choosing_actions = false;
        this.battle_phase = battle_phases.ROUND_START;

        this.check_phases();
    }

    choose_targets(ability_key: string, action: string, callback: Function, caster: Player, item_obj?: ItemSlot) {
        const this_ability = this.data.info.abilities_list[ability_key];

        let quantities: number[];
        if (action === "psynergy") {
            quantities = [this_ability.pp_cost];
        }
        if (action !== "defend") {
            this.target_window.open(action, this_ability.name, this_ability.element, ability_key, quantities, item_obj);
        }

        const status_to_be_healed: (permanent_status | temporary_status)[] = [];
        this_ability.effects.forEach(effect => {
            if (effect.type === effect_types.TEMPORARY_STATUS || effect.type === effect_types.PERMANENT_STATUS) {
                if (!effect.add_status) {
                    status_to_be_healed.push(effect.status_key_name);
                }
            }
        });

        this.battle_stage.cursor_manager.choose_targets(
            this_ability.range,
            this_ability.battle_target,
            caster,
            (targets: Target[]) => {
                if (this.target_window.window_open) {
                    this.target_window.close();
                }
                callback(targets);
            },
            this_ability.affects_downed,
            status_to_be_healed
        );
    }

    check_parties() {
        this.allies_defeated = this.allies_info.every(player =>
            player.instance.has_permanent_status(permanent_status.DOWNED)
        );
        this.enemies_defeated = this.enemies_info.every(player =>
            player.instance.has_permanent_status(permanent_status.DOWNED)
        );

        if (this.allies_defeated || this.enemies_defeated) {
            this.battle_phase = battle_phases.END;
        }
    }

    check_phases() {
        this.check_parties();
        switch (this.battle_phase) {
            case battle_phases.NONE:
                this.battle_phase_none();
                break;
            case battle_phases.START:
            case battle_phases.MENU:
                this.battle_phase_menu();
                break;
            case battle_phases.ROUND_START:
                this.battle_phase_round_start();
                break;
            case battle_phases.COMBAT:
                this.battle_phase_combat();
                break;
            case battle_phases.ROUND_END:
                this.battle_phase_round_end();
                break;
            case battle_phases.FLEE:
                this.battle_phase_flee();
                break;
            case battle_phases.END:
                this.battle_phase_end();
                break;
        }
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
        this.battle_menu = new MainBattleMenu(this.game, this.data, this);

        this.target_window = new ChoosingTargetWindow(this.game, this.data);
        this.animation_manager = new BattleAnimationManager(this.game, this.data);
    }

    async battle_fadein() {
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

    async flee(flee_succeed: boolean) {
        this.battle_menu.close_menu();
        this.battle_stage.reset_positions();
        this.battle_stage.update_stage();
        this.battle_stage.choosing_actions = false;
        await this.battle_log.add(`${this.data.info.party_data.members[0].name} and friends run!`);
        await this.wait_for_key();
        if (flee_succeed) {
            this.battle_phase = battle_phases.FLEE;
            this.battle_stage.pause_players_update = true;
            const animation_recipe = this.data.info.misc_battle_animations_recipes["flee"];
            const flee_animation = BattleAnimationManager.get_animation_instance(
                this.game,
                this.data,
                animation_recipe,
                false
            );
            const caster_sprite = this.allies_map_sprite[this.data.info.party_data.members[0].key_name];
            const target_sprites = this.data.info.party_data.members
                .filter(member => {
                    return !member.has_permanent_status(permanent_status.DOWNED);
                })
                .map(member => this.allies_map_sprite[member.key_name]);
            await this.animation_manager.play_animation(
                flee_animation,
                caster_sprite,
                target_sprites,
                [],
                this.battle_stage.group_allies,
                this.battle_stage.group_allies,
                this.battle_stage
            );
            this.battle_stage.pause_players_update = false;
        } else {
            await this.battle_log.add(`But there's no escape!`);
            await this.wait_for_key();
            this.allies_abilities = {};
            this.battle_phase = battle_phases.ROUND_START;
        }
        this.check_phases();
    }

    async battle_phase_none() {
        this.data.hero.stop_char(true);
        this.game.physics.p2.pause();
        this.data.audio.stop_bgm();

        await this.battle_fadein();

        this.initialize_battle_objs();
        this.previous_map_state = this.data.map.pause();

        this.battle_phase = battle_phases.START;
        this.data.in_battle = true;
        this.data.battle_instance = this;

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
            this.allies_map_sprite = _.mapValues(_.keyBy(this.allies_info, "instance.key_name"), info => info.sprite);
            this.enemies_map_sprite = _.mapValues(_.keyBy(this.enemies_info, "battle_key"), info => info.sprite);

            this.data.control_manager.add_simple_controls(() => {
                this.battle_log.clear();
                this.battle_phase = battle_phases.MENU;
                this.check_phases();
            });
        });
    }

    battle_phase_menu() {
        this.battle_stage.set_choosing_action_position();
        this.battle_menu.open_menu();
    }

    /*
    At round start, is calculated the players and enemies speeds.
    If a certain player speed is the same of a enemy, player goes first.
    If another tie, the most left char has priority.
    At a specific enemy turn start, I roll an action for that turn.
    The only thing needed to check about enemies actions at round start is:
        - Roll their actions for each turn and see if an ability with priority move is rolled.
        - If yes, this ability is fixed for that corresponding turn.
    For the other turns, an action is re-roll in the turn start to be used on it.
    */
    async battle_phase_round_start() {
        const enemy_members = this.enemies_info.map(info => {
            return {
                instance: info.instance as Enemy,
                battle_key: info.battle_key,
            };
        });
        this.enemies_abilities = Object.fromEntries(
            enemy_members.map((enemy, index) => {
                let abilities = new Array(enemy.instance.turns);
                for (let i = 0; i < enemy.instance.turns; ++i) {
                    abilities[i] = EnemyAI.roll_action(
                        this.data,
                        {
                            instance: enemy.instance as Enemy,
                            battle_key: enemy.battle_key,
                        },
                        enemy_members,
                        this.data.info.party_data.members.map(member => ({
                            instance: member,
                            battle_key: member.key_name,
                        }))
                    );
                }
                return [this.enemies_info[index].battle_key, abilities];
            })
        );

        for (let char_key in this.allies_abilities) {
            const this_char = this.data.info.main_char_list[char_key];
            for (let i = 0; i < this.allies_abilities[char_key].length; ++i) {
                const this_ability = this.data.info.abilities_list[this.allies_abilities[char_key][i].key_name];
                const priority_move = this_ability !== undefined ? this_ability.priority_move : false;

                this.allies_abilities[char_key][i].speed = BattleFormulas.player_turn_speed(
                    this_char.agi,
                    priority_move,
                    i > 0
                );
                this.allies_abilities[char_key][i].caster = this_char;
                this.allies_abilities[char_key][i].caster_battle_key = char_key;
            }
        }

        for (let battle_key in this.enemies_abilities) {
            const this_enemy = this.this_enemies_list[battle_key];
            for (let i = 0; i < this.enemies_abilities[battle_key].length; ++i) {
                const this_ability = this.data.info.abilities_list[this.enemies_abilities[battle_key][i].key_name];
                const priority_move = this_ability !== undefined ? this_ability.priority_move : false;

                this.enemies_abilities[battle_key][i].speed = BattleFormulas.enemy_turn_speed(
                    this_enemy.agi,
                    i + 1,
                    this_enemy.turns,
                    priority_move
                );
                this.enemies_abilities[battle_key][i].caster = this_enemy;
                this.enemies_abilities[battle_key][i].caster_battle_key = battle_key;
            }
        }

        //sort actions by players speed
        this.turns_actions = _.sortBy(
            Object.values(this.allies_abilities).flat().concat(Object.values(this.enemies_abilities).flat()),
            action => {
                return action.speed; //still need to add left most and player preference criterias
            }
        );

        for (let i = 0; i < this.turns_actions.length; ++i) {
            const action = this.turns_actions[i];
            const ability = this.data.info.abilities_list[action.key_name];

            await this.set_action_animation_settings(action, ability);
        }
        this.battle_phase = battle_phases.COMBAT;
        this.check_phases();
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

    async check_downed(target: Enemy | MainChar) {
        if (target.current_hp === 0) {
            await this.down_a_char(target);
            await this.battle_log.add(on_catch_status_msg[permanent_status.DOWNED](target));
            await this.wait_for_key();
        }
    }

    async down_a_char(target: Enemy | MainChar) {
        this.on_going_effects = this.on_going_effects.filter(effect => {
            if (effect.char === target) {
                target.remove_effect(effect);
                target.update_all();
                return false;
            }
            return true;
        });
        target.add_permanent_status(permanent_status.DOWNED);
        const player_sprite = _.find(this.battle_stage.sprites, {player_instance: target});
        player_sprite.set_action(battle_actions.DOWNED);
        if (target.fighter_type === fighter_types.ENEMY) {
            await player_sprite.unmount_by_dissolving();
        }
    }

    /*
    Standard attack:
    1. Unleash check (followed by another check for unleash type if weapon has multiple unleashes)
    2. Miss check
    3. Crit check 1  (using brn % 32)
    4. Crit check 2 (using total crit chance from equipment, ((equipment_chance/2)*rand(0,65535) >> 16)
    5. Status effect check
    6. Added 0-3 damage
    If any of checks 1-4 succeed, it skips to 5
    */
    async battle_phase_combat() {
        if (!this.turns_actions.length) {
            this.battle_phase = battle_phases.ROUND_END;
            this.check_phases();
            return;
        }

        const action = this.turns_actions.pop();

        //check whether this char is downed
        if (action.caster.has_permanent_status(permanent_status.DOWNED)) {
            this.check_phases();
            return;
        }

        //check whether this char is paralyzed
        if (await this.check_if_char_is_paralyzed(action)) {
            await this.wait_for_key();

            //check for poison damage
            await this.check_poison_damage(action);

            this.check_phases();
            return;
        }

        //check whether the char will skip this turn due to cursed item
        if (await this.check_if_curse_will_take_effect(action)) {
            await this.wait_for_key();

            //check for poison damage
            await this.check_poison_damage(action);

            this.check_phases();
            return;
        }

        //gets the ability of this phase
        let ability = await this.get_phase_ability(action);
        if (!ability) {
            await this.wait_for_key();

            //check for poison damage
            await this.check_poison_damage(action);

            this.check_phases();
            return;
        }

        //check whether all targets are downed and change ability to "defend" in the case it's true
        if (!ability.affects_downed) this.check_if_all_targets_are_downed(action);

        //gets item's name in the case this ability is related to an item
        let item_name = action.item_slot ? this.data.info.items_list[action.item_slot.key_name].name : "";

        //change the current ability to unleash ability from weapon
        const unleash_info = await this.check_if_ability_will_unleash(action, ability, item_name);
        ability = unleash_info.ability;
        item_name = unleash_info.item_name;

        //check whether this ability exists
        if (ability === undefined) {
            await this.battle_log.add(`${action.key_name} ability key not registered.`);
            await this.wait_for_key();

            //check for poison damage
            await this.check_poison_damage(action);

            this.check_phases();
            return;
        }

        //logs ability to be casted
        const djinn_name = action.djinn_key_name ? this.data.info.djinni_list[action.djinn_key_name].name : undefined;
        await this.battle_log.add_ability(
            action.caster,
            ability,
            item_name,
            djinn_name,
            action.item_slot !== undefined
        );

        //check if is possible to cast ability due to seal
        if (
            action.caster.has_temporary_status(temporary_status.SEAL) &&
            ability.ability_category === ability_categories.PSYNERGY
        ) {
            await this.battle_log.add(`But the Psynergy was blocked!`);
            await this.wait_for_key();

            //check for poison damage
            await this.check_poison_damage(action);

            this.check_phases();
            return;
        }

        //check if char has enough pp to cast ability
        if (ability.pp_cost > action.caster.current_pp) {
            await this.battle_log.add(`... But doesn't have enough PP!`);
            await this.wait_for_key();

            //check for poison damage
            await this.check_poison_damage(action);

            this.check_phases();
            return;
        } else {
            action.caster.current_pp -= ability.pp_cost;
        }

        //deals with abilities related to djinn and summons
        if (await this.manage_djinn_or_summon_ability(action, ability)) {
            await this.wait_for_key();

            //check for poison damage
            await this.check_poison_damage(action);

            this.check_phases();
            return;
        }

        //check if item is broken
        if (action.item_slot) {
            if (action.item_slot.broken) {
                await this.battle_log.add(`But ${item_name} is broken...`);
                await this.wait_for_key();

                //check for poison damage
                await this.check_poison_damage(action);

                this.check_phases();
                return;
            }
        }

        //updates chars status window
        this.battle_menu.chars_status_window.update_chars_info();
        if (ability.type === ability_types.UTILITY) {
            await this.wait_for_key();
        }

        //checks if target will dodge attack and plays dodge animation
        this.check_for_attack_dodge(action, ability);

        //executes the animation of the current ability
        await this.play_battle_animation(action, ability);

        //apply ability damage
        if (![ability_types.UTILITY, ability_types.EFFECT_ONLY].includes(ability.type)) {
            await this.apply_damage(action, ability);
        }

        //apply ability effects
        let end_turn_effect = false;
        for (let i = 0; i < ability.effects.length; ++i) {
            const effect = ability.effects[i];
            if (effect.usage === effect_usages.ON_USE) {
                end_turn_effect = await this.apply_effects(action, ability, effect);
            } else if (effect.usage === effect_usages.BATTLE_ROUND_END) {
                this.round_end_effects.push({
                    action: action,
                    ability: ability,
                    effect: effect,
                });
            }
        }

        this.battle_stage.pause_players_update = false;
        this.battle_stage.set_update_factor(1);
        await Promise.all([this.battle_stage.reset_chars_position(), this.battle_stage.set_stage_default_position()]);

        //summon's power buff after cast
        await this.apply_summon_power_buff(action, ability);

        //some checks related to items
        await this.apply_item_ability_side_effects(action);

        //check for poison damage
        await this.check_poison_damage(action);

        //check for death curse end
        await this.check_death_curse(action);

        if (end_turn_effect) {
            this.battle_phase = battle_phases.ROUND_END;
        }

        this.check_phases();
    }

    check_for_attack_dodge(action: PlayerAbility, ability: Ability) {
        for (let i = 0; i < action.targets.length; ++i) {
            const target_info = action.targets[i];
            if (target_info.magnitude === null) continue;
            const target_instance = target_info.target.instance;

            if (target_instance.has_permanent_status(permanent_status.DOWNED)) continue;
            if (ability.can_be_evaded) {
                //check whether the target is going to evade the caster attack
                if (
                    Math.random() < EVASION_CHANCE ||
                    (action.caster.temporary_status.has(temporary_status.DELUSION) &&
                        Math.random() < DELUSION_MISS_CHANCE)
                ) {
                    target_info.dodged = true;
                    const target_sprites =
                        action.caster.fighter_type === fighter_types.ALLY
                            ? this.enemies_map_sprite
                            : this.allies_map_sprite;
                    const target_sprite = target_sprites[target_info.target.battle_key];

                    const animation_recipe = this.data.info.misc_battle_animations_recipes["dodge"];
                    const dodge_animation = BattleAnimationManager.get_animation_instance(
                        this.game,
                        this.data,
                        animation_recipe,
                        false
                    );
                    const caster_sprite = target_sprite;
                    //should not wait for this anim
                    this.animation_manager.play_animation(
                        dodge_animation,
                        caster_sprite,
                        [],
                        [],
                        this.battle_stage.group_allies,
                        this.battle_stage.group_allies,
                        this.battle_stage,
                        undefined
                    );
                }
            }
        }
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

    async apply_damage(action: PlayerAbility, ability: Ability) {
        let increased_crit: number;

        if (ability.has_critical) {
            //check for effects that increases critical chance
            increased_crit = action.caster.effects
                .filter(effect => effect.type === effect_types.CRITICALS)
                .reduce((acc, effect) => {
                    return Effect.apply_operator(acc, effect.quantity, effect.operator);
                }, 0);
        }

        for (let i = 0; i < action.targets.length; ++i) {
            const target_info = action.targets[i];
            if (target_info.magnitude === null) continue;
            const target_instance = target_info.target.instance;

            if (target_instance.has_permanent_status(permanent_status.DOWNED)) continue;
            if (ability.can_be_evaded) {
                //check whether the target is going to evade the caster attack
                if (target_info.dodged) {
                    target_info.dodged = false; //reset
                    await this.battle_log.add(`${target_instance.name} nimbly dodges the blow!`);
                    return this.wait_for_key();
                }
            }

            let djinn_used;
            if (ability.type === ability_types.SUMMON) {
                djinn_used = _.sum(_.values(this.data.info.summons_list[ability.key_name].requirements));
            }
            let damage = BattleFormulas.get_damage(
                ability,
                action.caster,
                target_instance,
                target_info.magnitude,
                djinn_used,
                increased_crit
            );

            if (damage >= 0) {
                target_instance.effects.forEach(effect => {
                    if (effect.type === effect_types.DAMAGE_MODIFIER) {
                        damage = effect.apply_effect(damage).after;
                    }
                });
            }

            await this.battle_log.add_damage(damage, target_instance, ability.affects_pp);

            const current_property = ability.affects_pp ? main_stats.CURRENT_PP : main_stats.CURRENT_HP;
            const max_property = ability.affects_pp ? main_stats.MAX_PP : main_stats.MAX_HP;
            target_instance[current_property] = _.clamp(
                target_instance[current_property] - damage,
                0,
                target_instance[max_property]
            );

            this.battle_menu.chars_status_window.update_chars_info();

            await this.wait_for_key();
            await this.check_downed(target_instance);

            for (let j = 0; j < ability.effects.length; ++j) {
                const effect_obj = ability.effects[j];
                if (effect_obj.type === effect_types.DAMAGE_INPUT) {
                    //apply effects of this ability that depends on the issued damage value
                    const player = effect_obj.on_caster ? action.caster : target_instance;
                    const damage_input_effect = player.add_effect(effect_obj, ability).effect;
                    const effect_result = damage_input_effect.apply_effect(damage);

                    if (
                        [effect_types.CURRENT_HP, effect_types.CURRENT_PP].includes(damage_input_effect.sub_effect.type)
                    ) {
                        const effect_damage = effect_result.before - effect_result.after;

                        if (effect_damage !== 0) {
                            if (damage_input_effect.custom_msg) {
                                const parsed_msg = Effect.parse_effect_custom_msg(
                                    damage_input_effect.custom_msg,
                                    target_instance.name,
                                    action.caster.name
                                );
                                await this.battle_log.add(parsed_msg);
                            } else {
                                await this.battle_log.add_damage(
                                    effect_damage,
                                    player,
                                    damage_input_effect.sub_effect.type === effect_types.CURRENT_PP
                                );
                            }

                            this.battle_menu.chars_status_window.update_chars_info();
                            await this.wait_for_key();
                        }
                        await this.check_downed(player);
                    }
                    player.remove_effect(damage_input_effect);
                }
            }
        }
    }

    async check_if_char_is_paralyzed(action: PlayerAbility) {
        if (action.caster.is_paralyzed()) {
            if (action.caster.temporary_status.has(temporary_status.SLEEP)) {
                await this.battle_log.add(`${action.caster.name} is asleep!`);
            } else if (action.caster.temporary_status.has(temporary_status.STUN)) {
                await this.battle_log.add(`${action.caster.name} is paralyzed and cannot move!`);
            } else if (action.caster.paralyzed_by_effect) {
                await this.battle_log.add(`${action.caster.name} is paralyzed and cannot move!`);
                action.caster.paralyzed_by_effect = false;
            }
            return true;
        }
        return false;
    }

    async check_if_curse_will_take_effect(action: PlayerAbility) {
        //Curse check: 1/4 chance of not being able to move
        if (action.caster.has_permanent_status(permanent_status.EQUIP_CURSE) && Math.random() < 0.25) {
            await this.battle_log.add(`${action.caster.name} is bound and cannot move!`);
            return true;
        }
        return false;
    }

    check_if_all_targets_are_downed(action: PlayerAbility) {
        for (let i = 0; i < action.targets.length; ++i) {
            const target = action.targets[i];
            if (target.magnitude && target.target?.instance.has_permanent_status(permanent_status.DOWNED)) {
                target.magnitude = null;
            }
        }
        if (action.targets.every(target => target.magnitude === null)) {
            action.key_name = "defend";
            action.djinn_key_name = "";
            action.item_slot = undefined;
            action.battle_animation_key = "no_animation";
        }
    }

    async get_phase_ability(action: PlayerAbility) {
        let ability = this.data.info.abilities_list[action.key_name];

        //rerolls enemy ability
        if (
            action.caster.fighter_type === fighter_types.ENEMY &&
            !this.data.info.abilities_list[action.key_name].priority_move
        ) {
            Object.assign(
                action,
                EnemyAI.roll_action(
                    this.data,
                    {
                        instance: action.caster as Enemy,
                        battle_key: action.caster_battle_key,
                    },
                    this.enemies_info.map(info => {
                        return {
                            instance: info.instance as Enemy,
                            battle_key: info.battle_key,
                        };
                    }),
                    this.data.info.party_data.members.map(member => ({
                        instance: member,
                        battle_key: member.key_name,
                    }))
                )
            );
            ability = this.data.info.abilities_list[action.key_name];
            await this.set_action_animation_settings(action, ability);
        }

        return ability;
    }

    async check_if_ability_will_unleash(action: PlayerAbility, ability: Ability, item_name: string) {
        if (
            action.caster.fighter_type === fighter_types.ALLY &&
            ability !== undefined &&
            ability.can_switch_to_unleash
        ) {
            const caster = action.caster as MainChar;
            if (
                caster.equip_slots.weapon &&
                this.data.info.items_list[caster.equip_slots.weapon.key_name].unleash_ability
            ) {
                const weapon = this.data.info.items_list[caster.equip_slots.weapon.key_name];

                if (Math.random() < weapon.unleash_rate) {
                    item_name = weapon.name;
                    action.key_name = weapon.unleash_ability;
                    ability = this.data.info.abilities_list[weapon.unleash_ability];

                    await this.set_action_animation_settings(action, ability);
                }
            }
        }
        return {
            ability: ability,
            item_name: item_name,
        };
    }

    async manage_djinn_or_summon_ability(action: PlayerAbility, ability: Ability) {
        if (ability.ability_category === ability_categories.DJINN) {
            //change djinn status
            if (ability.effects.some(effect => effect.type === effect_types.SET_DJINN)) {
                this.data.info.djinni_list[action.djinn_key_name].set_status(djinn_status.SET);
            } else {
                this.data.info.djinni_list[action.key_name].set_status(djinn_status.STANDBY);
            }
        } else if (ability.ability_category === ability_categories.SUMMON) {
            //deal with summon ability type
            const requirements = this.data.info.summons_list[ability.key_name].requirements;
            const standby_djinni = Djinn.get_standby_djinni(
                this.data.info.djinni_list,
                MainChar.get_active_players(this.data.info.party_data, Battle.MAX_CHARS_IN_BATTLE)
            );

            const has_available_djinni = _.every(requirements, (requirement, element) => {
                return standby_djinni[element] >= requirement;
            });

            //check if is possible to cast a summon
            if (!has_available_djinni) {
                await this.battle_log.add(`${action.caster.name} summons ${ability.name} but`);
                await this.battle_log.add(`doesn't have enough standby Djinn!`);
                return true;
            } else {
                //set djinni used in this summon to recovery mode
                Djinn.set_to_recovery(
                    this.data.info.djinni_list,
                    MainChar.get_active_players(this.data.info.party_data, Battle.MAX_CHARS_IN_BATTLE),
                    requirements
                );
            }
        }
        return false;
    }

    async apply_summon_power_buff(action: PlayerAbility, ability: Ability) {
        if (ability.ability_category === ability_categories.SUMMON) {
            const requirements = this.data.info.summons_list[ability.key_name].requirements;
            for (let i = 0; i < ordered_elements.length; ++i) {
                const element = ordered_elements[i];
                const power = BattleFormulas.summon_power(requirements[element]);
                if (power > 0) {
                    action.caster.add_effect(
                        {
                            type: "power",
                            quantity: power,
                            operator: "plus",
                            element: element,
                        },
                        ability,
                        true
                    );

                    await this.battle_log.add(
                        `${action.caster.name}'s ${element_names[element]} Power rises by ${power}!`
                    );
                    await this.wait_for_key();
                }
            }
        }
    }

    async apply_item_ability_side_effects(action: PlayerAbility) {
        if (action.item_slot) {
            const item: Item = this.data.info.items_list[action.item_slot.key_name];
            if (item.use_type === use_types.SINGLE_USE) {
                //consume item on usage
                if (action.caster.fighter_type === fighter_types.ALLY) {
                    (action.caster as MainChar).remove_item(action.item_slot, 1);
                } else {
                    --action.item_slot.quantity;
                }
            } else if (item.use_type === use_types.BREAKS_WHEN_USE) {
                //check if item is going to break
                if (Math.random() < Item.BREAKS_CHANCE) {
                    action.item_slot.broken = true;
                    await this.battle_log.add(`${item.name} broke...`);
                    await this.wait_for_key();
                }
            }
        }
    }

    async check_poison_damage(action: PlayerAbility) {
        const poison_status = action.caster.is_poisoned();
        if (poison_status) {
            let damage = BattleFormulas.battle_poison_damage(action.caster, poison_status);
            if (damage > action.caster.current_hp) {
                damage = action.caster.current_hp;
            }

            action.caster.current_hp = _.clamp(action.caster.current_hp - damage, 0, action.caster.max_hp);
            const poison_name = poison_status === permanent_status.POISON ? "poison" : "venom";

            let player_sprite: PlayerSprite;
            if (action.caster.fighter_type === fighter_types.ALLY) {
                player_sprite = this.allies_info.find(ally => ally.instance.key_name === action.caster.key_name).sprite;
            } else {
                player_sprite = this.enemies_info.find(enemy => enemy.battle_key === action.caster_battle_key).sprite;
            }
            const previous_action = player_sprite.action;
            player_sprite.set_action(battle_actions.DAMAGE);
            await this.battle_log.add(`The ${poison_name} does ${damage.toString()} damage to ${action.caster.name}!`);
            this.battle_menu.chars_status_window.update_chars_info();

            await this.wait_for_key();
            player_sprite.set_action(previous_action);
            await this.check_downed(action.caster);
        }
    }

    async check_death_curse(action: PlayerAbility) {
        if (action.caster.has_temporary_status(temporary_status.DEATH_CURSE)) {
            const this_effect = _.find(action.caster.effects, {
                status_key_name: temporary_status.DEATH_CURSE,
            });

            if (action.caster.get_effect_turns_count(this_effect) === 1) {
                action.caster.current_hp = 0;
                await this.down_a_char(action.caster);
                await this.battle_log.add(`The Grim Reaper calls out to ${action.caster.name}`);
                await this.wait_for_key();
            }
        }
    }

    /*
If a sleep is cast over a target that is already sleeping,
it will recalculate the chance, and if it lands it will "top up" (read: replace) the effect's duration.
So if a character is sleeping, the remaining duration is 6 rounds, and you cast Sleep on them again and it lands, it'll get bumped up to 7 rounds.
When Sleep normally gets inflicted with a max duration of 7 anyway.

Buffs and debuffs can stack values, but durations get overwritten every time and do not stack.

Poison/Venom can't land again, although Venom can replace Poison (but not the other way around).
And Candle Curse (countdown to death) can be "advanced".
So, if a character will die after 5 turns and you land another Curse on them, it will drop the remaining count to 4.
*/

    async apply_effects(action: PlayerAbility, ability: Ability, effect_obj: any) {
        let effect_result: ReturnType<Player["add_effect"]>;

        if (effect_obj.type === effect_types.END_THE_ROUND) {
            await this.battle_log.add(`Everybody is resting!`);
            await this.wait_for_key();
            return true;
        } else if (effect_obj.type === effect_types.FLEE) {
            return false;
        }

        for (let j = 0; j < action.targets.length; ++j) {
            const target_info = action.targets[j];
            if (target_info.magnitude === null) {
                continue;
            }

            const target_instance = target_info.target.instance;
            if (!ability.affects_downed && target_instance.has_permanent_status(permanent_status.DOWNED)) {
                continue;
            }

            switch (effect_obj.type) {
                case effect_types.PERMANENT_STATUS:
                    if (effect_obj.add_status) {
                        if (target_instance.has_permanent_status(effect_obj.status_key_name as permanent_status)) break;
                        if (
                            effect_obj.status_key_name === permanent_status.POISON &&
                            target_instance.has_permanent_status(permanent_status.VENOM)
                        )
                            break;
                    }

                case effect_types.TEMPORARY_STATUS:
                    if (effect_obj.add_status) {
                        const added_effect = Effect.add_status_to_player(
                            effect_obj,
                            action.caster,
                            target_instance,
                            ability,
                            target_info.magnitude
                        );
                        if (added_effect) {
                            if (
                                !target_instance.has_temporary_status(added_effect.status_key_name as temporary_status)
                            ) {
                                this.on_going_effects.push(added_effect);
                            }
                            if (
                                [permanent_status.DOWNED, temporary_status.STUN].includes(added_effect.status_key_name)
                            ) {
                                const player_sprite = _.find(this.battle_stage.sprites, {
                                    player_instance: added_effect.char,
                                });
                                player_sprite.set_action(battle_actions.DOWNED);
                            }
                            await this.battle_log.add(on_catch_status_msg[effect_obj.status_key_name](target_instance));
                        } else {
                            await this.battle_log.add(`But it has no effect on ${target_instance.name}!`);
                        }
                        await this.wait_for_key();
                    } else {
                        const removed_items = Effect.remove_status_from_player(effect_obj, target_instance);
                        for (let i = 0; i < removed_items.removed_effects.length; ++i) {
                            const removed_effect = removed_items.removed_effects[i];
                            if (
                                [permanent_status.DOWNED, temporary_status.STUN].includes(
                                    removed_effect.status_key_name
                                )
                            ) {
                                const player_sprite = _.find(this.battle_stage.sprites, {
                                    player_instance: removed_effect.char,
                                });
                                player_sprite.set_action(battle_actions.IDLE);
                            }
                            if (removed_effect.type === effect_types.TEMPORARY_STATUS) {
                                this.on_going_effects = this.on_going_effects.filter(effect => {
                                    return effect !== effect;
                                });
                            }
                            this.battle_log.add_recover_effect(removed_effect);
                            await this.wait_for_key();
                        }
                        for (let i = 0; i < removed_items.status_removed.length; ++i) {
                            const removed_status = removed_items.status_removed[i];
                            if ([permanent_status.DOWNED, temporary_status.STUN].includes(removed_status)) {
                                const player_sprite = _.find(this.battle_stage.sprites, {
                                    player_instance: target_instance,
                                });
                                player_sprite.set_action(battle_actions.IDLE);
                            }
                            this.battle_log.add_recover_effect(effect_obj, target_instance);
                            await this.wait_for_key();
                        }
                    }
                    break;

                case effect_types.CURRENT_HP:
                    effect_result = target_instance.add_effect(effect_obj, ability, true);
                    if (effect_result.effect.show_msg) {
                        const damage = effect_result.changes.before - effect_result.changes.after;
                        await this.battle_log.add_damage(damage, target_instance);

                        this.battle_menu.chars_status_window.update_chars_info();
                        await this.wait_for_key();
                    }

                    await this.check_downed(target_instance);

                    if (effect_result.effect.turns_quantity !== -1) {
                        this.on_going_effects.push(effect_result.effect);
                    } else {
                        target_instance.remove_effect(effect_result.effect);
                    }

                    break;

                case effect_types.CURRENT_PP:
                    effect_result = target_instance.add_effect(effect_obj, ability, true);
                    if (effect_result.effect.show_msg) {
                        const damage = effect_result.changes.before - effect_result.changes.after;
                        await this.battle_log.add_damage(damage, target_instance, true);

                        this.battle_menu.chars_status_window.update_chars_info();
                        await this.wait_for_key();
                    }

                    if (effect_result.effect.turns_quantity !== -1) {
                        this.on_going_effects.push(effect_result.effect);
                    } else {
                        target_instance.remove_effect(effect_result.effect);
                    }

                    break;

                case effect_types.MAX_HP:
                case effect_types.MAX_PP:
                case effect_types.ATTACK:
                case effect_types.DEFENSE:
                case effect_types.AGILITY:
                case effect_types.LUCK:
                case effect_types.POWER:
                case effect_types.RESIST:
                    effect_result = target_instance.add_effect(effect_obj, ability, true);
                    if (effect_obj.remove_buff) {
                        this.on_going_effects = this.on_going_effects.filter(
                            effect => !effect_result.changes.removed_effects.includes(effect)
                        );
                        if (effect_result.effect.show_msg) {
                            await this.battle_log.add(`${target_instance.name}'s strength return to normal!`);
                            await this.wait_for_key();
                        }
                        break;
                    } else {
                        this.on_going_effects.push(effect_result.effect);
                        target_instance.set_effect_turns_count(
                            effect_result.effect,
                            effect_result.effect.turn_count,
                            false
                        );

                        if (effect_result.effect.show_msg) {
                            const diff = effect_result.changes.after - effect_result.changes.before;
                            const text = diff >= 0 ? "rises" : "drops";
                            let element_info = "";

                            if ([effect_types.POWER, effect_types.RESIST].includes(effect_obj.type)) {
                                element_info = element_names[effect_result.effect.element] + " ";
                            }

                            await this.battle_log.add(
                                `${target_instance.name}'s ${element_info}${
                                    effect_names[effect_obj.type]
                                } ${text} by ${Math.abs(diff)}!`
                            );
                            this.battle_menu.chars_status_window.update_chars_info();
                            await this.wait_for_key();
                        }
                        break;
                    }

                case effect_types.PARALYZE:
                    target_instance.add_effect(effect_obj, ability, true);
                    if (target_instance.paralyzed_by_effect) {
                        await this.battle_log.add(`${target_instance.name} has become unable to move!`);
                    } else {
                        await this.battle_log.add(`But it has no effect on ${target_instance.name}!`);
                    }
                    await this.wait_for_key();
                    break;

                case effect_types.TURNS:
                    await this.battle_log.add(`${action.caster.name} readies for action!`);
                    await this.wait_for_key();

                    this.on_going_effects.push(target_instance.add_effect(effect_obj, ability, true).effect);
                    break;

                case effect_types.DAMAGE_MODIFIER:
                    if (effect_obj.custom_msg) {
                        const parsed_msg = Effect.parse_effect_custom_msg(
                            effect_obj.custom_msg,
                            target_instance.name,
                            action.caster.name
                        );
                        await this.battle_log.add(parsed_msg);
                    }
                    await this.wait_for_key();

                    this.on_going_effects.push(target_instance.add_effect(effect_obj, ability, true).effect);
                    break;

                case effect_types.COUNTER_STRIKE:
                    break;

                default:
                    this.on_going_effects.push(target_instance.add_effect(effect_obj, ability, true).effect);
            }
        }
        return false;
    }

    async battle_phase_round_end() {
        for (let i = 0; i < this.round_end_effects.length; ++i) {
            const effect_info = this.round_end_effects[i];
            await this.apply_effects(effect_info.action, effect_info.ability, effect_info.effect);
        }
        this.round_end_effects = [];

        const effects_to_remove = [];
        const effect_groups = {};

        for (let i = 0; i < this.on_going_effects.length; ++i) {
            const effect = this.on_going_effects[i];
            if (effect.char.has_permanent_status(permanent_status.DOWNED)) {
                //clear this effect if the owner char is downed
                effect.char.remove_effect(effect);
                effect.char.update_all();
                effects_to_remove.push(i);
                continue;
            }
            let avoid_msg = false;
            if (effect.turn_count !== -1) {
                //deal with effects that depends on turn counting
                if (effect.char.get_effect_turns_count(effect) !== null) {
                    if (
                        !(effect.char.key_name in effect_groups) ||
                        !(effect.char.get_effect_turns_key(effect) in effect_groups[effect.char.key_name])
                    ) {
                        effect.char.set_effect_turns_count(effect);
                    }

                    effect.turn_count = effect.char.get_effect_turns_count(effect);
                    if (!effect_groups[effect.char.key_name]) {
                        effect_groups[effect.char.key_name] = {
                            [effect.char.get_effect_turns_key(effect)]: effect,
                        };
                    } else {
                        effect_groups[effect.char.key_name][effect.char.get_effect_turns_key(effect)] = effect;
                    }
                    avoid_msg = true;
                } else {
                    --effect.turn_count;
                }

                if (effect.turn_count === 0) {
                    effect.char.remove_effect(effect);
                    effect.char.update_all();
                    effects_to_remove.push(i);
                    if (!avoid_msg) {
                        this.battle_log.add_recover_effect(effect);
                        await this.wait_for_key();
                    }
                }
            }
        }
        for (let char_key_name in effect_groups) {
            for (let effect_turn_key in effect_groups[char_key_name]) {
                const effect = effect_groups[char_key_name][effect_turn_key];
                if (effect.turn_count === 0) {
                    this.battle_log.add_recover_effect(effect);
                    await this.wait_for_key();
                }
            }
        }

        this.on_going_effects = this.on_going_effects.filter((effect, index) => {
            return !effects_to_remove.includes(index);
        });

        for (let i = 0; i < Battle.MAX_CHARS_IN_BATTLE; ++i) {
            //deal with djinn that are with recovery status
            const player = this.data.info.party_data.members[i];
            if (player === undefined) continue;

            const player_djinni = player.djinni;
            for (let j = 0; j < player_djinni.length; ++j) {
                const djinn_key = player_djinni[j];
                const djinn = this.data.info.djinni_list[djinn_key];
                if (djinn.status === djinn_status.RECOVERY) {
                    if (djinn.recovery_turn === 0) {
                        djinn.set_status(djinn_status.SET);
                        await this.battle_log.add(`${djinn.name} is set to ${player.name}!`);
                        await this.wait_for_key();
                    } else {
                        --djinn.recovery_turn;
                    }
                }
            }
        }

        //Check if allies can recover HP or PP at the turn's end and show it in the log
        await this.apply_battle_recovery(this.allies_info, true);
        await this.apply_battle_recovery(this.allies_info, false);
        //Check if enemies can recover HP or PP at the turn's end and show it in the log
        await this.apply_battle_recovery(this.enemies_info, true);
        await this.apply_battle_recovery(this.enemies_info, false);

        this.battle_log.clear();
        this.battle_phase = battle_phases.MENU;
        this.check_phases();
    }

    async apply_battle_recovery(party: PlayerInfo[], is_hp_recovery: boolean) {
        let recovery = "";
        for (let i = 0; i < party.length; i++) {
            const player = party[i];
            const recovery_stat = is_hp_recovery ? player.instance.hp_recovery : player.instance.pp_recovery;
            let current_stat = is_hp_recovery ? player.instance.current_hp : player.instance.current_pp;
            const max_stat = is_hp_recovery ? player.instance.max_hp : player.instance.max_pp;
            const print_stat = is_hp_recovery ? "HP" : "PP";
            if (recovery_stat !== 0) {
                current_stat = _.clamp(current_stat + recovery_stat, 0, max_stat);
                if (recovery_stat > 0) {
                    recovery = "recovers";
                } else {
                    recovery = "loses";
                }
                this.battle_log.add(`${player.instance.name} ${recovery} ${Math.abs(recovery_stat)} ${print_stat}!`);
                await this.wait_for_key();
            }
        }
    }

    async battle_phase_flee() {
        for (let i = 0; i < this.on_going_effects.length; ++i) {
            //remove all effects acquired in battle
            const effect = this.on_going_effects[i];
            if (effect.type !== effect_types.PERMANENT_STATUS) {
                effect.char.remove_effect(effect);
                effect.char.update_all();
            }
        }
        this.party_fled = true;
        this.unset_battle();
    }

    // Everyone gets equal experience with no division, but:
    // - Characters who do not participate get half;
    // - Downed characters get none.
    async battle_phase_end() {
        for (let i = 0; i < this.on_going_effects.length; ++i) {
            //remove all effects acquired in battle
            const effect = this.on_going_effects[i];
            if (effect.type !== effect_types.PERMANENT_STATUS) {
                effect.char.remove_effect(effect);
                effect.char.update_all();
            }
        }

        if (this.allies_defeated) {
            this.battle_log.add(this.allies_info[0].instance.name + "' party has been defeated!");
        } else {
            this.battle_log.add(this.enemies_party_name + " has been defeated!");
            await this.wait_for_key();

            const total_exp = this.enemies_info
                .map(info => {
                    //calculates total exp gained
                    return (info.instance as Enemy).exp_reward;
                })
                .reduce((a, b) => a + b, 0);
            this.battle_log.add(`You got ${total_exp.toString()} experience points.`);
            await this.wait_for_key();

            for (let i = 0; i < this.allies_info.length; ++i) {
                const info = this.allies_info[i];
                const char = info.instance as MainChar;
                if (!char.has_permanent_status(permanent_status.DOWNED)) {
                    //downed chars don't receive exp
                    //chars that not entered in battle, receive only hald exp
                    const change = char.add_exp(info.entered_in_battle ? total_exp : total_exp >> 1);

                    //check whether this char evolved
                    if (change.before.level !== change.after.level) {
                        this.battle_log.add(`${char.name} is now a level ${char.level} ${char.class.name}!`);
                        await this.wait_for_key();

                        const gained_abilities = _.difference(change.after.abilities, change.before.abilities);
                        for (let j = 0; j < gained_abilities.length; ++j) {
                            const ability = this.data.info.abilities_list[gained_abilities[j]];
                            this.battle_log.add(`Mastered the ${char.class.name}'s ${ability.name}!`);
                            await this.wait_for_key();
                        }

                        for (let j = 0; j < change.before.stats.length; ++j) {
                            const stat = Object.keys(change.before.stats[j])[0];
                            const diff = change.after.stats[j][stat] - change.before.stats[j][stat];
                            if (diff !== 0) {
                                let stat_text;
                                switch (stat) {
                                    case main_stats.MAX_HP:
                                        stat_text = "Maximum HP";
                                        break;
                                    case main_stats.MAX_PP:
                                        stat_text = "Maximum PP";
                                        break;
                                    case main_stats.ATTACK:
                                        stat_text = "Attack";
                                        break;
                                    case main_stats.DEFENSE:
                                        stat_text = "Defense";
                                        break;
                                    case main_stats.AGILITY:
                                        stat_text = "Agility";
                                        break;
                                    case main_stats.LUCK:
                                        stat_text = "Luck";
                                        break;
                                }
                                this.battle_log.add(`${stat_text} rises by ${diff.toString()}!`);
                                await this.wait_for_key();
                            }
                        }
                    }
                }
            }

            const total_coins = this.enemies_info
                .map(info => {
                    //calculate total coins received
                    return (info.instance as Enemy).coins_reward;
                })
                .reduce((a, b) => a + b, 0);
            this.data.info.party_data.coins += total_coins;
            this.battle_log.add(`You got ${total_coins.toString()} coins.`);
            await this.wait_for_key();

            for (let i = 0; i < this.enemies_info.length; ++i) {
                //receiving items as reward
                const enemy = this.enemies_info[i].instance as Enemy;
                if (enemy.item_reward && Math.random() < enemy.item_reward_chance) {
                    const item = this.data.info.items_list[enemy.item_reward];
                    if (item !== undefined) {
                        if (MainChar.add_item_to_party(this.data.info.party_data, item, 1)) {
                            this.battle_log.add(`You got a ${item.name}.`);
                            await this.wait_for_key();
                        }
                    } else {
                        //debug purposes only
                        this.battle_log.add(`${enemy.item_reward} not registered...`);
                        await this.wait_for_key();
                    }
                }
            }
        }
        this.unset_battle();
    }

    unset_battle() {
        this.battle_finishing = true;
        this.data.map.resume(this.previous_map_state);
        this.battle_stage.unset_stage(
            () => {
                this.data.control_manager.reset();
                this.data.control_manager.detach_bindings(this.advance_log_control_key);

                this.battle_log.destroy();
                this.battle_menu.destroy_menu();
                this.target_window.destroy();
                this.animation_manager.destroy();

                if (this.allies_defeated) {
                    const hero = this.data.info.main_char_list[this.data.hero.key_name];
                    hero.current_hp = 1;
                    hero.remove_permanent_status(permanent_status.DOWNED);
                }

                if (this.before_fade_finish_callback) {
                    return this.before_fade_finish_callback(!this.allies_defeated, this.party_fled);
                }
                return null;
            },
            () => {
                this.data.in_battle = false;
                this.data.battle_instance = undefined;
                this.game.physics.p2.resume();
                this.data.audio.play_bgm();
                if (this.finish_callback) {
                    this.finish_callback(!this.allies_defeated, this.party_fled);
                }
            }
        );
    }

    update() {
        if (this.battle_finishing) return;
        this.battle_stage.update_stage();
        this.animation_manager.render();
    }
}
