import { BattleAnimation } from "./BattleAnimation.js";

const ANIMATIONS_BASE_PATH = "assets/images/psynergy_animations/";
const ANIMATIONS_DB_PATH = "assets/dbs/psynergy_animations/";

export class BattleAnimationManager {
    constructor(game, data) {
        this.game = game;
        this.data = data;
        this.animations = {};
        this.not_available = new Set();
    }

    async load_animation(ability_key) {
        if ((ability_key in this.animations) || this.not_available.has(ability_key)) return;
        const sprite_loader = this.game.load.atlasJSONHash(ability_key + "_battle_animation", `${ANIMATIONS_BASE_PATH}${ability_key}.png`, `${ANIMATIONS_BASE_PATH}${ability_key}.json`);
        const recipe_loader = this.game.load.json(ability_key + "_battle_recipe", `${ANIMATIONS_DB_PATH}${ability_key}_db.json`);

        let all_succeed = true;
        let sprite_loader_promise_resolve;
        const sprite_loader_promise = new Promise(resolve => { sprite_loader_promise_resolve = resolve });
        sprite_loader.onLoadComplete.addOnce((progress, filekey, success) => {
            all_succeed = all_succeed && success;
            sprite_loader_promise_resolve();
        });
        let recipe_loader_promise_resolve;
        const recipe_loader_promise = new Promise(resolve => { recipe_loader_promise_resolve = resolve });
        recipe_loader.onLoadComplete.addOnce((progress, filekey, success) => {
            all_succeed = all_succeed && success;
            recipe_loader_promise_resolve();
        });

        this.game.load.start();
        await Promise.all([sprite_loader_promise, recipe_loader_promise]);
        if (all_succeed) {
            const animation_recipe = this.game.cache.getJSON(ability_key + "_battle_recipe");
            this.animations[ability_key] = new BattleAnimation(
                this.game,
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
                animation_recipe.custom_filter_sequence,
                animation_recipe.play_sequence,
                animation_recipe.set_frame_sequence,
                animation_recipe.blend_mode_sequence,
                animation_recipe.is_party_animation
            );
        } else {
            this.not_available.add(ability_key);
        }
    }

    animation_available(ability_key) {
        return ability_key in this.animations;
    }

    async play(ability_key, caster_sprite, targets_sprites, group_caster, group_taker, battle_stage) {
        if (!(ability_key in this.animations)) return;
        this.animations[ability_key].initialize(
            caster_sprite,
            targets_sprites,
            group_caster,
            group_taker,
            battle_stage.battle_group,
            battle_stage.camera_angle,
            [battle_stage.battle_bg, battle_stage.battle_bg2]
        );
        let play_promise_resolve;
        const play_promise = new Promise(resolve => { play_promise_resolve = resolve });
        this.animations[ability_key].play(play_promise_resolve);
        await play_promise;
    }

    destroy() {
        for (let ability_key in this.animations) {
            this.game.cache.removeTextureAtlas(ability_key + "_battle_animation");
            this.game.cache.removeJSON(ability_key + "_battle_recipe");
        }
    }
}