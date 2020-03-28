import { u } from "../utils.js";

export class SpriteBase {
    constructor (
        key_name,
        actions
    ) {
        this.key_name = key_name;
        this.actions = {};
        for (let i = 0; i < actions.length; ++i) {
            this.actions[actions[i]] = {};
        }
        this.animations = {};
    }
    
    setActionDirections(action, directions, frame_counts) {
        this.actions[action].directions = [];
        this.actions[action].frame_counts = [];
        for (let i = 0; i < directions.length; ++i) {
            this.actions[action].directions.push(directions[i]);
            this.actions[action].frame_counts.push(frame_counts[i]);
        }
    }

    setActionFrameRate(action, frame_rate) {
        this.actions[action].frame_rate = frame_rate;
    }

    setActionSpritesheet(action, spritesheet_image_url, spritesheet_json_url) {
        this.actions[action].spritesheet = {
            spritesheet_image_url : spritesheet_image_url,
            spritesheet_json_url : spritesheet_json_url
        };
    }

    loadSpritesheets(game, force_load, on_load_complete) {
        for(let action in this.actions){
            const spritesheet = this.actions[action].spritesheet;
            let loader = game.load.atlasJSONHash(
                u([this.key_name, action]),
                spritesheet.spritesheet_image_url,
                spritesheet.spritesheet_json_url
            );
            if (force_load) {
                loader.onLoadComplete.addOnce(on_load_complete, this);
                game.load.start();
            }
        }
    }

    addAnimation(action, direction, start, stop, suffix, zeroPad) {
        if (!(action in this.animations))
            this.animations[action] = {};
        this.animations[action][direction] = Phaser.Animation.generateFrameNames(
            action+"/"+direction+"/",
            start,
            stop,
            suffix,
            zeroPad
        );
    }

    setAnimation(sprite, action) {
        const directions = this.actions[action].directions;
        const frame_rate = this.actions[action].frame_rate;
        for (let key in directions) {
            const direction = directions[key];
            sprite.animations.add(
                u([action, direction]), 
                this.animations[action][direction], 
                frame_rate, 
                true, 
                false
            );
        }
    }
    
    addAnimations() {
        for (let action in this.actions) {
            const directions = this.actions[action].directions;
            const frame_counts = this.actions[action].frame_counts;
            for (let key in directions) {
                const direction = directions[key];
                this.addAnimation(action, direction, 0, frame_counts[key], '', 2);
            }
        }
    }
}