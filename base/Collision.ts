import {GoldenSun} from "./GoldenSun";
import {Map} from "./Map";

export class Collision {
    public game: Phaser.Game;
    public data: GoldenSun;
    public hero_collision_group: Phaser.Physics.P2.CollisionGroup;
    public dynamic_events_collision_group: Phaser.Physics.P2.CollisionGroup;
    public map_collision_group: Phaser.Physics.P2.CollisionGroup;
    public npc_collision_groups: {[layer_index: number]: Phaser.Physics.P2.CollisionGroup};
    public interactable_objs_collision_groups: {[layer_index: number]: Phaser.Physics.P2.CollisionGroup};
    public max_layers_created: number;
    public dynamic_jump_events_bodies: Phaser.Physics.P2.Body[];

    constructor(game: Phaser.Game, data: GoldenSun) {
        this.game = game;
        this.data = data;
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

    config_collision_groups(map: Map) {
        //p2 has a limit number of collision groups that can be created. Then, NPCs and I. Objs. groups will be created on demand.
        for (let layer_index = this.max_layers_created; layer_index < map.collision_layers_number; ++layer_index) {
            this.npc_collision_groups[layer_index] = this.game.physics.p2.createCollisionGroup();
            this.interactable_objs_collision_groups[layer_index] = this.game.physics.p2.createCollisionGroup();
        }
        this.max_layers_created = Math.max(this.max_layers_created, map.collision_layers_number);
    }

    disable_npc_collision() {
        for (let collide_index in this.npc_collision_groups) {
            this.data.hero.sprite.body.removeCollisionGroup(this.npc_collision_groups[collide_index], true);
        }
    }

    enable_npc_collision(collision_layer: number) {
        if (collision_layer in this.npc_collision_groups) {
            this.data.hero.sprite.body.collides(this.npc_collision_groups[collision_layer]);
        }
    }

    config_collisions(collision_layer: number) {
        this.data.hero.sprite.body.collides(this.map_collision_group);
        this.data.map.collision_sprite.body.collides(this.hero_collision_group);

        this.disable_npc_collision();
        this.enable_npc_collision(collision_layer);

        for (let collide_index in this.interactable_objs_collision_groups) {
            this.data.hero.sprite.body.removeCollisionGroup(
                this.interactable_objs_collision_groups[collide_index],
                true
            );
        }
        if (collision_layer in this.interactable_objs_collision_groups) {
            this.data.hero.sprite.body.collides(this.interactable_objs_collision_groups[collision_layer]);
        }

        for (let i = 0; i < this.data.npc_group.children.length; ++i) {
            const sprite = this.data.npc_group.children[i] as Phaser.Sprite;
            if (!sprite.is_npc && !sprite.is_interactable_object) continue;
            if (!sprite.body) continue;
            sprite.body.collides(this.hero_collision_group);
        }
        this.data.hero.sprite.body.collides(this.dynamic_events_collision_group);
    }

    change_map_body(new_collision_layer_index: number) {
        if (this.data.map.collision_layer === new_collision_layer_index) return;
        this.data.map.collision_layer = new_collision_layer_index;
        this.data.hero.shadow.base_collision_layer = this.data.map.collision_layer;
        this.data.hero.sprite.base_collision_layer = this.data.map.collision_layer;
        this.data.map.config_body(new_collision_layer_index);
        this.config_collision_groups(this.data.map);
        this.config_collisions(this.data.map.collision_layer);
        this.data.map.reorganize_layers();
    }
}
