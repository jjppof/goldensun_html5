import {base_actions, directions, reverse_directions} from "../utils";
import {event_types, TileEvent} from "./TileEvent";

export class SliderEvent extends TileEvent {
    private static readonly TIME_PER_TILE = 60;
    private static readonly DUST_COUNT = 6;
    private static readonly DUST_KEY = "dust";

    private x_target: number;
    private y_target: number;
    private dest_collision_layer: number;
    private show_dust: boolean;

    constructor(
        game,
        data,
        x,
        y,
        activation_directions,
        activation_collision_layers,
        active,
        active_storage_key,
        affected_by_reveal,
        key_name: string,
        x_target,
        y_target,
        dest_collision_layer,
        show_dust
    ) {
        super(
            game,
            data,
            event_types.SLIDER,
            x,
            y,
            activation_directions,
            activation_collision_layers,
            active,
            active_storage_key,
            null,
            affected_by_reveal,
            key_name
        );
        this.x_target = x_target;
        this.y_target = y_target;
        this.dest_collision_layer = dest_collision_layer ?? 0;
        this.show_dust = show_dust ?? true;
    }

    fire() {
        if (!this.data.hero.stop_by_colliding || !this.check_position() || !this.data.hero_movement_allowed(false)) {
            return;
        }
        this.data.tile_event_manager.on_event = true;
        this.data.hero.sliding = true;
        this.game.physics.p2.pause();

        const initial_x = this.data.map.tile_width * (this.x + 0.5);
        const initial_y = this.data.map.tile_height * (this.y + 0.6);
        const jump_y = this.data.map.tile_height * this.y;
        this.data.hero.play(base_actions.JUMP, reverse_directions[directions.down], false);
        this.game.time.events.add(200, () => {
            this.data.hero.shadow.visible = false;
            this.data.hero.change_action(base_actions.IDLE);
            this.data.hero.play(base_actions.IDLE, reverse_directions[directions.down], false);
            this.game.add
                .tween(this.data.hero.sprite.body)
                .to({x: initial_x, y: [jump_y, initial_y]}, 150, Phaser.Easing.Linear.None, true)
                .onComplete.addOnce(() => {
                    this.data.audio.play_se("actions/slide");
                    if (this.show_dust) {
                        this.dust_animation();
                    }
                    const little_step = initial_y + this.data.map.tile_height * 1.2;
                    this.game.add
                        .tween(this.data.hero.sprite.body)
                        .to({y: little_step}, 70, Phaser.Easing.Quadratic.Out, true)
                        .onComplete.addOnce(() => {
                            this.data.hero.set_frame(directions.down_right);
                            this.game.time.events.add(40, () => {
                                this.data.hero.set_frame(directions.down_left);
                                this.game.time.events.add(40, () => {
                                    this.data.hero.set_frame(directions.down);
                                });
                            });
                            const target_x = this.data.map.tile_width * (this.x_target + 0.5);
                            const target_y = this.data.map.tile_height * (this.y_target + 0.5);
                            const slide_time = Math.abs(this.y_target - this.y) * SliderEvent.TIME_PER_TILE;
                            this.game.add
                                .tween(this.data.hero.sprite.body)
                                .to({x: target_x, y: target_y}, slide_time, Phaser.Easing.Linear.None, true)
                                .onComplete.addOnce(() => {
                                    this.data.hero.play();
                                    this.data.hero.update_shadow();
                                    this.data.hero.shadow.visible = true;
                                    if (this.dest_collision_layer !== this.data.map.collision_layer) {
                                        this.data.collision.change_map_body(this.dest_collision_layer);
                                    }
                                    this.game.time.events.add(80, () => {
                                        this.data.hero.sliding = false;
                                        this.game.physics.p2.resume();
                                        this.data.tile_event_manager.on_event = false;
                                    });
                                });
                        });
                });
        });
    }

    private dust_animation() {
        const dust_sprite_base = this.data.info.misc_sprite_base_list[SliderEvent.DUST_KEY];
        const dust_key = dust_sprite_base.getSpriteKey(SliderEvent.DUST_KEY);
        const initial_x = this.data.map.tile_width * (this.x + 0.5);
        for (let i = 0; i < SliderEvent.DUST_COUNT; ++i) {
            this.game.time.events.add(40 * i, () => {
                const start_x =
                    this.data.hero.sprite.body.x -
                    Math.random() * this.data.map.tile_width +
                    (this.data.map.tile_width >> 1);
                const start_y =
                    this.data.hero.sprite.body.y -
                    Math.random() * this.data.map.tile_height +
                    (this.data.map.tile_height >> 1);
                const dust_sprite: Phaser.Sprite = this.data.npc_group.create(start_x, start_y, dust_key);
                dust_sprite.base_collision_layer = this.dest_collision_layer;
                dust_sprite.anchor.setTo(0.5, 0.5);
                this.game.add.tween(dust_sprite).to(
                    {
                        x: start_x + (start_x < initial_x ? -1 : 1) * (this.data.map.tile_height / 3),
                        y: start_y - (this.data.map.tile_height >> 1),
                    },
                    400,
                    Phaser.Easing.Linear.None,
                    true
                );
                this.data.npc_group.setChildIndex(
                    dust_sprite,
                    this.data.npc_group.getChildIndex(this.data.hero.sprite)
                );
                dust_sprite_base.setAnimation(dust_sprite, SliderEvent.DUST_KEY);
                const animation_key = dust_sprite_base.getAnimationKey(SliderEvent.DUST_KEY, "spread");
                dust_sprite.animations.getAnimation(animation_key).onComplete.addOnce(() => {
                    dust_sprite.destroy();
                });
                dust_sprite.animations.play(animation_key);
            });
        }
    }

    destroy() {
        this._origin_interactable_object = null;
        this.deactivate();
    }
}
