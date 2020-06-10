import { SpriteBase } from "./SpriteBase.js";
import { maps } from '../maps/maps.js';

export class PsynergyItems_Sprite extends SpriteBase {
    constructor (key_name, actions) {
        super(key_name, actions);
    }
}

export class PsynergyItems {
    constructor(key_name, x, y, allowed_tiles, base_collider_layer) {
        this.key_name = key_name;
        this.x = x;
        this.y = y;
        this.allowed_tiles = allowed_tiles;
        this.base_collider_layer = base_collider_layer;
        this.events = new Set();
        this.events_info = {};
        this.current_x = x;
        this.current_y = y;
    }

    set_sprite(sprite) {
        this.psynergy_item_sprite = sprite;
    }

    position_allowed(data, x, y) {
        if (maps[data.map_name].psynergy_items.filter(item => {
            return item.current_x === x && item.current_y === y;
        }).length) {
            return false;
        }
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

    insert_event(event_key) {
        this.events.add(event_key);
    }

    get_events() {
        return [...this.events];
    }

    update_event(old_key, new_key) {
        this.events.delete(old_key);
        this.events.add(new_key);
    }
}