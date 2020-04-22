import { SpriteBase } from "./SpriteBase.js";
import { maps } from '../maps/maps.js';

export class PsynergyItems_Sprite extends SpriteBase {
    constructor (key_name, actions) {
        super(key_name, actions);
    }
}

export class PsynergyItems {
    constructor(key_name, x, y, allowed_tiles) {
        this.key_name = key_name;
        this.x = x;
        this.y = y;
        this.allowed_tiles = allowed_tiles;
    }

    set_sprite(sprite) {
        this.psynergy_item_sprite = sprite;
    }

    position_allowed(x, y) {
        for (let i = 0; i < this.allowed_tiles.length; ++i) {
            const tile = this.allowed_tiles[i];
            if (tile.x === x && tile.y === y) return true;
        }
        return false;
    }

    get_current_position(data) {
        const x = parseInt(this.psynergy_item_sprite.x/maps[data.map_name].sprite.tileWidth);
        const y = parseInt(this.psynergy_item_sprite.y/maps[data.map_name].sprite.tileHeight);
        return { x: x, y: y };
    }
}