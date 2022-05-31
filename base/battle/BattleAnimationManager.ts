import {GoldenSun} from "../GoldenSun";
import {elements} from "../utils";
import {BattleAnimation} from "./BattleAnimation";
import {BattleStage} from "./BattleStage";
import {PlayerSprite} from "./PlayerSprite";

export enum animation_availability {
    AVAILABLE,
    NOT_AVAILABLE,
    NO_ANIMATION,
}

const ANIMATIONS_BASE_PATH = "assets/images/abilities_animations/";
const ANIMATIONS_DB_PATH = "assets/dbs/abilities_animations/";
const ANIMATION_SUFFIX = "_battle_animation";
const RECIPE_SUFFIX = "_battle_recipe";

export class BattleAnimationManager {
    public game: Phaser.Game;
    public data: GoldenSun;
    private animations: {[key: string]: BattleAnimation};
    private not_available: Set<string>;
    private render_functions: Function[];

    constructor(game, data) {
        this.game = game;
        this.data = data;
        this.animations = {};
        this.not_available = new Set();
        this.render_functions = [];
    }

    static get_animation_instance(
        game: Phaser.Game,
        data: GoldenSun,
        animation_recipe: any,
        mirrored_animation: boolean,
        element?: elements
    ) {
        return new BattleAnimation(
            game,
            data,
            animation_recipe.key_name,
            animation_recipe.sprites,
            animation_recipe.x_sequence,
            animation_recipe.y_sequence,
            animation_recipe.x_ellipse_axis_factor_sequence,
            animation_recipe.y_ellipse_axis_factor_sequence,
            animation_recipe.x_scale_sequence,
            animation_recipe.y_scale_sequence,
            animation_recipe.x_anchor_sequence,
            animation_recipe.y_anchor_sequence,
            animation_recipe.alpha_sequence,
            animation_recipe.rotation_sequence,
            animation_recipe.stage_angle_sequence,
            animation_recipe.hue_angle_sequence,
            animation_recipe.tint_sequence,
            animation_recipe.grayscale_sequence,
            animation_recipe.colorize_sequence,
            animation_recipe.play_sequence,
            animation_recipe.set_frame_sequence,
            animation_recipe.blend_mode_sequence,
            animation_recipe.levels_filter_sequence,
            animation_recipe.color_blend_filter_sequence,
            animation_recipe.flame_filter_sequence,
            animation_recipe.particles_sequence,
            animation_recipe.cast_type,
            animation_recipe.wait_for_cast_animation,
            animation_recipe.follow_caster,
            mirrored_animation,
            element
        );
    }

    async load_animation(battle_anim_key, caster_battle_key, mirrored_animation) {
        if (this.not_available.has(battle_anim_key) || battle_anim_key === "no_animation") {
            return null;
        }
        const sprite_key = battle_anim_key + ANIMATION_SUFFIX;
        const recipe_key = battle_anim_key + RECIPE_SUFFIX;
        this.game.load.atlasJSONHash(
            sprite_key,
            `${ANIMATIONS_BASE_PATH}${battle_anim_key}.png`,
            `${ANIMATIONS_BASE_PATH}${battle_anim_key}.json`
        );
        this.game.load.json(recipe_key, `${ANIMATIONS_DB_PATH}${battle_anim_key}_db.json`);

        let load_complete_promise_resolve;
        const load_complete_promise = new Promise(resolve => (load_complete_promise_resolve = resolve));
        this.game.load.onLoadComplete.addOnce(load_complete_promise_resolve);
        this.game.load.start();
        await load_complete_promise;
        const animation_recipe = this.game.cache.getJSON(recipe_key);
        if (animation_recipe) {
            const key = `${battle_anim_key}/${caster_battle_key}`;
            this.animations[key] = BattleAnimationManager.get_animation_instance(
                this.game,
                this.data,
                animation_recipe,
                mirrored_animation
            );
            return this.animations[key];
        } else {
            this.not_available.add(battle_anim_key);
            return null;
        }
    }

    animation_available(battle_anim_key, caster_battle_key) {
        const key = `${battle_anim_key}/${caster_battle_key}`;
        if (key in this.animations) return animation_availability.AVAILABLE;
        else if (battle_anim_key === "no_animation") return animation_availability.NO_ANIMATION;
        else return animation_availability.NOT_AVAILABLE;
    }

    get_animation(battle_anim_key, caster_battle_key) {
        const key = `${battle_anim_key}/${caster_battle_key}`;
        if (key in this.animations) return this.animations[key];
        return null;
    }

    async play(
        battle_anim_key: string,
        caster_battle_key: string,
        caster_sprite: PlayerSprite,
        targets_sprites: PlayerSprite[],
        group_caster: Phaser.Group,
        group_taker: Phaser.Group,
        battle_stage: BattleStage
    ) {
        const key = `${battle_anim_key}/${caster_battle_key}`;
        if (!(key in this.animations)) return;
        const sprite_key = battle_anim_key + ANIMATION_SUFFIX;
        await this.play_animation(
            this.animations[key],
            caster_sprite,
            targets_sprites,
            group_caster,
            group_taker,
            battle_stage,
            sprite_key
        );
        delete this.animations[key];
    }

    async play_animation(
        animation: BattleAnimation,
        caster_sprite: PlayerSprite,
        targets_sprites: PlayerSprite[],
        group_caster: Phaser.Group,
        group_taker: Phaser.Group,
        battle_stage: BattleStage,
        sprite_key?: string
    ) {
        animation.initialize(
            caster_sprite,
            targets_sprites,
            group_caster,
            group_taker,
            battle_stage.battle_group,
            battle_stage,
            [battle_stage.battle_bg, battle_stage.battle_bg2],
            sprite_key
        );
        let play_promise_resolve;
        const play_promise = new Promise(resolve => {
            play_promise_resolve = resolve;
        });
        const render_function = animation.render.bind(animation);
        this.render_functions.push(render_function);
        animation.play(play_promise_resolve);
        await play_promise;
        this.render_functions = this.render_functions.filter(f => f !== render_function);
    }

    render() {
        if (this.render_functions.length) {
            this.render_functions.forEach(f => f());
        }
    }

    destroy() {
        for (let key in this.animations) {
            const battle_anim_key = key.split("/")[0];
            this.game.cache.removeTextureAtlas(battle_anim_key + ANIMATION_SUFFIX);
            this.game.cache.removeJSON(battle_anim_key + RECIPE_SUFFIX);
        }
    }
}
