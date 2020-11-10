import {Hero} from "./Hero";

export class Collision {
    public game: Phaser.Game;
    public hero: Hero;
    public hero_collision_group: Phaser.Physics.P2.CollisionGroup;
    public dynamic_events_collision_group: Phaser.Physics.P2.CollisionGroup;
    public map_collision_group: Phaser.Physics.P2.CollisionGroup;
    public npc_collision_groups: {[layer_index: number]: Phaser.Physics.P2.CollisionGroup};
    public interactable_objs_collision_groups: {[layer_index: number]: Phaser.Physics.P2.CollisionGroup};
    public max_layers_created: number;
    public dynamic_jump_events_bodies: Phaser.Physics.P2.Body[];

    constructor(game, hero) {
        this.game = game;
        this.hero = hero;
        this.config_world();
        this.hero_collision_group = this.game.physics.p2.createCollisionGroup();
        this.dynamic_events_collision_group = this.game.physics.p2.createCollisionGroup();
        this.map_collision_group = game.physics.p2.createCollisionGroup();
        this.npc_collision_groups = {};
        this.interactable_objs_collision_groups = {};
        this.max_layers_created = 0;
        this.dynamic_jump_events_bodies = [];
    }

    config_world() {
        this.game.physics.startSystem(Phaser.Physics.P2JS);
        this.game.physics.p2.setImpactEvents(true);
        this.game.physics.p2.world.defaultContactMaterial.restitution = 0;
        this.game.physics.p2.world.defaultContactMaterial.relaxation = 8;
        this.game.physics.p2.world.defaultContactMaterial.friction = 0;
        this.game.physics.p2.world.defaultContactMaterial.contactSkinSize = 1e-3;
        this.game.physics.p2.world.setGlobalStiffness(1e5);
        this.game.physics.p2.restitution = 0;
    }

    config_collision_groups(map) {
        //p2 has a limit number of collision groups that can be created. Then, NPCs and I. Objs. groups will be created on demand.
        for (let layer_index = this.max_layers_created; layer_index < map.collision_layers_number; ++layer_index) {
            this.npc_collision_groups[layer_index] = this.game.physics.p2.createCollisionGroup();
            this.interactable_objs_collision_groups[layer_index] = this.game.physics.p2.createCollisionGroup();
        }
        this.max_layers_created = Math.max(this.max_layers_created, map.collision_layers_number);
    }

    config_collisions(map, collision_layer, npc_group) {
        this.hero.sprite.body.collides(this.map_collision_group);
        map.collision_sprite.body.collides(this.hero_collision_group);

        for (let collide_index in this.npc_collision_groups) {
            this.hero.sprite.body.removeCollisionGroup(this.npc_collision_groups[collide_index], true);
        }
        if (collision_layer in this.npc_collision_groups) {
            this.hero.sprite.body.collides(this.npc_collision_groups[collision_layer]);
        }

        for (let collide_index in this.interactable_objs_collision_groups) {
            this.hero.sprite.body.removeCollisionGroup(this.interactable_objs_collision_groups[collide_index], true);
        }
        if (collision_layer in this.interactable_objs_collision_groups) {
            this.hero.sprite.body.collides(this.interactable_objs_collision_groups[collision_layer]);
        }

        for (let i = 0; i < npc_group.children.length; ++i) {
            const sprite = npc_group.children[i];
            if (!sprite.is_npc && !sprite.is_interactable_object) continue;
            if (!sprite.body) continue;
            sprite.body.collides(this.hero_collision_group);
        }
        this.hero.sprite.body.collides(this.dynamic_events_collision_group);
    }

    change_map_body(data, new_collider_layer_index) {
        if (data.map.collision_layer === new_collider_layer_index) return;
        data.map.collision_layer = new_collider_layer_index;
        this.hero.shadow.base_collision_layer = data.map.collision_layer;
        this.hero.sprite.base_collision_layer = data.map.collision_layer;
        data.map.config_body(this, new_collider_layer_index);
        this.config_collision_groups(data.map);
        this.config_collisions(data.map, data.map.collision_layer, data.npc_group);
        let layers = data.map.layers;
        for (let i = 0; i < layers.length; ++i) {
            let layer = layers[i];
            if (layer.properties.over !== undefined) {
                const is_over_prop = layer.properties.over
                    .toString()
                    .split(",")
                    .map(over => parseInt(over));
                if (is_over_prop.length <= data.map.collision_layer) continue;
                const is_over = Boolean(is_over_prop[data.map.collision_layer]);
                if (is_over) {
                    data.underlayer_group.remove(layer.sprite, false, true);
                    let index = 0;
                    for (index = 0; index < data.overlayer_group.children.length; ++index) {
                        let child = data.overlayer_group.children[index];
                        if (child.layer_z > (layer.z === undefined ? i : layer.z)) {
                            data.overlayer_group.addAt(layer.sprite, index, true);
                            break;
                        }
                    }
                    if (index === data.overlayer_group.children.length) {
                        data.overlayer_group.add(layer.sprite, true);
                    }
                } else {
                    data.overlayer_group.remove(layer.sprite, false, true);
                    let index = 0;
                    for (index = 0; index < data.underlayer_group.children.length; ++index) {
                        let child = data.underlayer_group.children[index];
                        if (child.layer_z > layer.z) {
                            data.underlayer_group.addAt(layer.sprite, index, true);
                            break;
                        }
                    }
                    if (index === data.underlayer_group.children.length) {
                        data.underlayer_group.add(layer.sprite, true);
                    }
                }
            }
        }
    }
}
