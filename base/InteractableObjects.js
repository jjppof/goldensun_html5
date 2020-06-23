import { SpriteBase } from "./SpriteBase.js";
import { maps } from '../initializers/maps.js';
import { TileEvent } from "./TileEvent.js";
import * as numbers from '../magic_numbers.js';

export const interactable_object_types = {
    MOVE: "move",
    FROST: "frost",
    GROWTH: "growth"
};

export const interactable_object_event_types = {
    JUMP: "jump",
    JUMP_AROUND: "jump_around",
    STAIR: "stair"
};

export class InteractableObjects_Sprite extends SpriteBase {
    constructor (key_name, actions) {
        super(key_name, actions);
    }
}

export class InteractableObjects {
    constructor(game, key_name, x, y, allowed_tiles, base_collider_layer, collider_layer_shift, not_allowed_tiles, object_drop_tiles, intermediate_collider_layer_shift) {
        this.game = game;
        this.key_name = key_name;
        this.x = x;
        this.y = y;
        this.allowed_tiles = allowed_tiles;
        this.base_collider_layer = base_collider_layer;
        this.collider_layer_shift = collider_layer_shift;
        this.intermediate_collider_layer_shift = intermediate_collider_layer_shift === undefined ? 0 : intermediate_collider_layer_shift;
        this.not_allowed_tiles = not_allowed_tiles === undefined ? [] : not_allowed_tiles;
        this.object_drop_tiles = object_drop_tiles === undefined ? [] : object_drop_tiles;
        this.events = new Set();
        this.events_info = {};
        this.current_x = x;
        this.current_y = y;
        this.custom_data = {
            collision_tiles_bodies: []
        };
        this.collision_change_functions = [];
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
            if (tile.x === x && tile.y === y && tile.collision_layer === data.map_collider_layer) return true;
        }
        return false;
    }

    get_current_position(data) {
        const x = parseInt(this.interactable_object_sprite.x/maps[data.map_name].sprite.tileWidth);
        const y = parseInt(this.interactable_object_sprite.y/maps[data.map_name].sprite.tileHeight);
        return { x: x, y: y };
    }

    change_collider_layer(data, destination_collider_layer) {
        this.interactable_object_sprite.body.removeCollisionGroup(data.interactableObjectCollisionGroups[this.base_collider_layer]);
        this.interactable_object_sprite.body.setCollisionGroup(data.interactableObjectCollisionGroups[destination_collider_layer]);
        this.base_collider_layer = destination_collider_layer;
        this.interactable_object_sprite.base_collider_layer = destination_collider_layer;
        this.collision_change_functions.forEach(f => { f(); });
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

    creating_blocking_stair_block(data) {
        const target_layer = this.base_collider_layer + this.custom_data.block_stair_collider_layer_shift;
        const x_pos = (this.current_x + .5) * maps[data.map_name].sprite.tileWidth;
        const y_pos = (this.current_y + 1.5) * maps[data.map_name].sprite.tileHeight - 4;
        let body = this.game.physics.p2.createBody(x_pos, y_pos, 0, true);
        body.clearShapes();
        const width = data.interactable_objects_db[this.key_name].body_radius * 2;
        body.setRectangle(width, width, 0, 0);
        if (!(target_layer in data.interactableObjectCollisionGroups)) {
            data.interactableObjectCollisionGroups[target_layer] = this.game.physics.p2.createCollisionGroup();
        }
        body.setCollisionGroup(data.interactableObjectCollisionGroups[target_layer]);
        body.damping = numbers.MAP_DAMPING;
        body.angularDamping = numbers.MAP_DAMPING;
        body.setZeroRotation();
        body.fixedRotation = true;
        body.dynamic = false;
        body.static = true;
        body.debug = data.hero.body.debug;
        body.collides(data.heroCollisionGroup);
        this.custom_data.blocking_stair_block = body;
    }
}