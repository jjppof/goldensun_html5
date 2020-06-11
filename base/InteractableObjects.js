import { SpriteBase } from "./SpriteBase.js";
import { maps } from '../initializers/maps.js';
import { TileEvent } from "./TileEvent.js";

export const interactable_object_types = {
    MOVE: "move",
    FROST: "frost",
};

export const interactable_object_event_types = {
    JUMP: "jump",
    JUMP_AROUND: "jump_around",
};

export class InteractableObjects_Sprite extends SpriteBase {
    constructor (key_name, actions) {
        super(key_name, actions);
    }
}

export class InteractableObjects {
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
        this.custom_data = {};
    }

    set_sprite(sprite) {
        this.interactable_object_sprite = sprite;
    }

    position_allowed(data, x, y) {
        if (maps[data.map_name].interactable_objects.filter(item => {
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
        const x = parseInt(this.interactable_object_sprite.x/maps[data.map_name].sprite.tileWidth);
        const y = parseInt(this.interactable_object_sprite.y/maps[data.map_name].sprite.tileHeight);
        return { x: x, y: y };
    }

    insert_event(id) {
        this.events.add(id);
    }

    get_events() {
        return [...this.events].map(id => TileEvent.get_event(id));
    }

    remove_event(id) {
        this.events.delete(id);
    }
}