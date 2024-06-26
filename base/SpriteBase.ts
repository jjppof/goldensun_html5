import {GoldenSun} from "GoldenSun";
import {msg_types} from "./Logger";

/**
 * This class holds all the info related to spritesheet data, animations, actions
 * and the appropriate methods to generate this info.
 */
export class SpriteBase {
    public static readonly ACTION_ANIM_SEPARATOR = "/";

    private data: GoldenSun;
    public key_name: string;
    private actions: {
        [action: string]: {
            animations?: string[];
            frame_counts?: any;
            frame_rate?: {[animation: string]: any};
            loop?: boolean | boolean[];
            spritesheet?: {image: string; json: string};
            frame_names?: {[animation: string]: string[]};
        };
    };
    private action_aliases: {
        [alias: string]: string;
    };

    constructor(data, key_name, actions) {
        this.data = data;
        this.key_name = key_name;
        this.actions = {};
        this.action_aliases = {};
        for (let i = 0; i < actions.length; ++i) {
            this.actions[actions[i]] = {};
        }
    }

    get all_actions() {
        return Object.keys(this.actions).sort();
    }

    setActionAnimations(action, animations, frame_counts) {
        if (!this.actions.hasOwnProperty(action)) {
            this.data.logger.log_message(`Sprite '${this.key_name}' has no action '${action}'.`, msg_types.ERROR);
            return;
        }
        this.actions[action].animations = new Array(animations.length);
        this.actions[action].frame_counts = new Array(animations.length);
        this.actions[action].frame_names = {};
        const frame_count_is_array = Array.isArray(frame_counts);
        if (frame_count_is_array && frame_counts.length !== animations.length) {
            this.data.logger.log_message(
                `Frames count and animations size must match. Issue on sprite '${this.key_name}' for action action '${action}'.`,
                msg_types.ERROR
            );
            return;
        }
        for (let i = 0; i < animations.length; ++i) {
            const frame_count = frame_count_is_array ? frame_counts[i] : frame_counts;
            this.actions[action].animations[i] = animations[i];
            this.actions[action].frame_counts[i] = frame_count;
        }
    }

    setActionFrameRate(action, frame_rate) {
        if (!this.actions.hasOwnProperty(action)) {
            this.data.logger.log_message(`Sprite '${this.key_name}' has no action '${action}'.`, msg_types.ERROR);
            return;
        }
        if (!Array.isArray(frame_rate) && !(typeof frame_rate === "number")) {
            this.data.logger.log_message(
                `Invalid frame rate set for action '${action}' for sprite '${this.key_name}'.`,
                msg_types.ERROR
            );
            return;
        }
        this.actions[action].frame_rate = {};
        for (let i = 0; i < this.actions[action].animations.length; ++i) {
            const animation = this.actions[action].animations[i];
            let this_frame_rate;
            if (Array.isArray(frame_rate)) {
                if (frame_rate.length === 1) {
                    this_frame_rate = frame_rate[0];
                } else {
                    this_frame_rate = frame_rate[i];
                }
            } else {
                this_frame_rate = frame_rate;
            }
            if (this_frame_rate === undefined) {
                this.data.logger.log_message(
                    `Invalid frame rate set for action '${action}' for sprite '${this.key_name}'.`,
                    msg_types.ERROR
                );
                continue;
            }
            this.actions[action].frame_rate[animation] = this_frame_rate;
        }
    }

    setActionLoop(action, loop) {
        this.actions[action].loop = loop;
    }

    setActionSpritesheet(action, spritesheet_image_url, spritesheet_json_url) {
        this.actions[action].spritesheet = {
            image: spritesheet_image_url,
            json: spritesheet_json_url,
        };
    }

    setActionAlias(game: Phaser.Game, alias, reference_action) {
        if (reference_action in this.actions) {
            this.actions[alias] = this.actions[reference_action];
            game.cache.setCacheAlias(this.getSpriteKey(alias), this.getSpriteKey(reference_action), Phaser.Cache.IMAGE);
            this.action_aliases[alias] = reference_action;
        }
    }

    getActionRefFromAlias(alias) {
        if (alias in this.action_aliases) {
            return this.action_aliases[alias];
        }
        return null;
    }

    hasAction(action: string) {
        return action in this.actions;
    }

    hasAnimation(action: string, animation: string) {
        return this.actions[action].animations.includes(animation);
    }

    loadSpritesheets(game: Phaser.Game, force_load: boolean, on_load_complete?: () => void) {
        for (let action in this.actions) {
            const spritesheet = this.actions[action].spritesheet;
            const action_key = this.getSpriteKey(action);
            if (game.cache.checkImageKey(action_key)) {
                this.data.logger.log_message(
                    `Sprite key '<key_name>/<action>' '${action_key}' is already registered in the engine. Please consider renaming it.`,
                    msg_types.ERROR
                );
            }
            const loader = game.load.atlasJSONHash(action_key, spritesheet.image, spritesheet.json);
            if (force_load) {
                loader.onLoadComplete.addOnce(on_load_complete, this);
                game.load.start();
            }
        }
    }

    private generateFrameNames(action, animation, start, stop, suffix, zeroPad) {
        this.actions[action].frame_names[animation] = Phaser.Animation.generateFrameNames(
            `${action}/${animation}/`,
            start,
            stop,
            suffix,
            zeroPad
        );
    }

    setAnimation(sprite: Phaser.Sprite, action) {
        if (action in this.actions) {
            const animations = this.actions[action].animations;
            const loop = this.actions[action].loop ?? true;
            for (let i = 0; i < animations.length; ++i) {
                const animation = animations[i];
                const frame_rate = this.actions[action].frame_rate[animation];
                let anim_key = this.getAnimationKey(action, animation);
                sprite.animations.add(
                    anim_key,
                    this.actions[action].frame_names[animation],
                    frame_rate,
                    Array.isArray(loop) ? loop[i] : loop,
                    false
                );
                const ref_action = this.getActionRefFromAlias(action);
                if (ref_action) {
                    anim_key = this.getAnimationKey(ref_action, animation);
                }
                if (!sprite.animations.frameData.getFrameByName(`${anim_key}${SpriteBase.ACTION_ANIM_SEPARATOR}00`)) {
                    this.data.logger.log_message(
                        `Animation '${anim_key}' is not valid for action '${action}' for sprite '${this.key_name}'.`,
                        msg_types.ERROR
                    );
                }
            }
        } else {
            this.data.logger.log_message(`Action '${action}' not available for '${this.key_name}'.`);
        }
    }

    generateAllFrames() {
        for (let action in this.actions) {
            const animations = this.actions[action].animations;
            const frame_counts = this.actions[action].frame_counts;
            for (let i = 0; i < animations.length; ++i) {
                const animation = animations[i];
                this.generateFrameNames(action, animation, 0, frame_counts[i] - 1, "", 2);
            }
        }
    }

    getFrameName(action, animation, index = 0) {
        const formatted_index = index.toLocaleString("en-US", {minimumIntegerDigits: 2, useGrouping: false});
        return `${action}/${animation}/${formatted_index}`;
    }

    getFrameRate(action, animation) {
        if (action in this.actions) {
            if (animation in this.actions[action].frame_rate) {
                return this.actions[action].frame_rate[animation];
            } else {
                this.data.logger.log_message(`Animation '${animation}' not available for '${this.key_name}'.`);
            }
        } else {
            this.data.logger.log_message(`Action '${action}' not available for '${this.key_name}'.`);
        }
        return null;
    }

    getFrameNumber(action, animation) {
        if (action in this.actions) {
            if (animation in this.actions[action].frame_names) {
                return this.actions[action].frame_names[animation].length;
            } else {
                this.data.logger.log_message(`Animation '${animation}' not available for '${this.key_name}'.`);
            }
        } else {
            this.data.logger.log_message(`Action '${action}' not available for '${this.key_name}'.`);
        }
        return null;
    }

    getSpriteKey(action) {
        return `${this.key_name}${SpriteBase.ACTION_ANIM_SEPARATOR}${action}`;
    }

    getAnimationKey(action, animation) {
        return `${action}${SpriteBase.ACTION_ANIM_SEPARATOR}${animation}`;
    }

    static getSpriteAction(sprite) {
        const key = sprite.key as string;
        return key.substring(key.lastIndexOf(SpriteBase.ACTION_ANIM_SEPARATOR) + 1, key.length);
    }

    static getKeyName(sprite) {
        const key = sprite.key as string;
        return key.substring(0, key.indexOf(SpriteBase.ACTION_ANIM_SEPARATOR));
    }
}
