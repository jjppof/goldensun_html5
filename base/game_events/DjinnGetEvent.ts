import {GameEvent, event_types} from "./GameEvent";
import * as _ from "lodash";
import {NPC} from "../NPC";
import {Djinn} from "../Djinn";
import {base_actions, directions, elements, element_colors, element_colors_in_battle, hex2rgb} from "../utils";
import {MainChar} from "../MainChar";
import {FieldAbilities} from "../field_abilities/FieldAbilities";
import {degree360} from "../magic_numbers";
import {DialogManager} from "../utils/DialogManager";
import {Button} from "../XGamepad";

export class DjinnGetEvent extends GameEvent {
    private static readonly ELEMENT_HUE = {
        [elements.VENUS]: 1,
        [elements.MERCURY]: 3.1,
        [elements.MARS]: 0,
        [elements.JUPITER]: 5,
    };

    private djinn: Djinn;
    private finish_events: GameEvent[] = [];
    private aux_resolve: () => void;
    private aux_promise: Promise<void>;
    private dialog_manager: DialogManager = null;
    private running: boolean = false;
    private control_enable: boolean = false;
    private control_key: number;

    constructor(game, data, active, djinn_key, finish_events) {
        super(game, data, event_types.DJINN_GET, active);
        this.djinn = this.data.info.djinni_list[djinn_key];

        this.control_key = this.data.control_manager.add_controls(
            [
                {
                    button: Button.A,
                    on_down: () => {
                        if (!this.running || !this.control_enable) return;
                        this.next();
                    },
                },
            ],
            {persist: true}
        );

        finish_events?.forEach(event_info => {
            const event = this.data.game_event_manager.get_event_instance(event_info);
            this.finish_events.push(event);
        });
    }

    next() {
        this.dialog_manager.next(async finished => {
            this.control_enable = true;
            if (finished) {
                this.finish();
            }
        });
    }

    finish() {
        this.control_enable = false;
        this.running = false;
        this.data.control_manager.detach_bindings(this.control_key);
        MainChar.add_djinn_to_party(this.data.info.party_data, this.djinn);
        this.data.hero.play(base_actions.IDLE);
        this.data.game_event_manager.force_idle_action = true;
        this.game.physics.p2.resume();
        --this.data.game_event_manager.events_running_count;
        this.finish_events.forEach(event => event.fire(this.origin_npc));
    }

    async wait(time) {
        let this_resolve;
        const promise = new Promise(resolve => (this_resolve = resolve));
        this.game.time.events.add(time, this_resolve);
        await promise;
    }

    async venus_djinn() {
        this.aux_promise = new Promise(resolve => (this.aux_resolve = resolve));
        const reset_map = FieldAbilities.tint_map_layers(this.game, this.data.map, {
            color: 0.65,
            intensity: 1,
            after_colorize: this.aux_resolve,
        });
        await this.aux_promise;

        /* initial djinn jumps */
        await this.origin_npc.jump(70);
        await this.origin_npc.jump(500);
        this.origin_npc.set_rotation(true);
        await this.origin_npc.jump(0, 40, 140);

        /* rotation and penetration into the ground */
        this.data.camera_shake_enable = true;
        this.aux_promise = new Promise(resolve => (this.aux_resolve = resolve));
        this.game.add
            .tween(this.origin_npc.sprite.scale)
            .to(
                {
                    x: 0,
                    y: 0,
                },
                800,
                Phaser.Easing.Linear.None,
                true
            )
            .onComplete.addOnce(this.aux_resolve);
        await this.aux_promise;
        this.origin_npc.toggle_active(false);

        await this.data.hero.face_direction(directions.down);
        this.data.hero.play(base_actions.GRANT);

        /* particles getting out of the ground */
        const zone = this.data.particle_manager.createCircleZone(16);
        const data = {
            image: "djinn_ball",
            alpha: 0.9,
            lifespan: 1000,
            scaleX: 0.5,
            scaleY: 2.5,
            vy: -7,
        };
        this.data.particle_manager.addData("out_of_ground", data);
        const emitter = this.data.particle_manager.createEmitter(Phaser.ParticleStorm.SPRITE);
        const color_filter: any = this.game.add.filter("ColorFilters");
        color_filter.hue_adjust = DjinnGetEvent.ELEMENT_HUE[this.djinn.element];
        emitter.onEmit = new Phaser.Signal();
        emitter.onEmit.add((emitter: Phaser.ParticleStorm.Emitter, particle: Phaser.ParticleStorm.Particle) => {
            particle.sprite.filters = [color_filter];
        });
        emitter.addToWorld();
        emitter.emit("out_of_ground", this.data.hero.sprite.x, this.data.hero.sprite.y + 10, {
            total: 4,
            repeat: 15,
            frequency: 100,
            zone: zone,
            random: true,
        });

        await this.wait(2000);

        this.data.particle_manager.removeEmitter(emitter);
        emitter.destroy();
        this.data.particle_manager.clearData("out_of_ground");
        emitter.onEmit.dispose();
        this.data.camera_shake_enable = false;

        /* particles circle over the hero */
        const particles_circle_number = 25;
        const delta_theta = degree360 / particles_circle_number;
        const rho = {value: 20};
        const down_time = 1200;
        const phase_speed = 0.07;
        let phase = 0;
        const particles_group = this.game.add.group();
        particles_group.x = this.data.hero.sprite.x;
        particles_group.y = this.game.camera.y - rho.value;
        for (let i = 0; i < particles_circle_number; ++i) {
            const particle = this.game.add.sprite(0, 0, "djinn_ball");
            particle.anchor.setTo(0.5, 0.5);
            particle.alpha = 0.9;
            particle.filters = [color_filter];
            particles_group.addChild(particle);
        }
        this.game.add.tween(rho).to(
            {
                value: 0,
            },
            down_time,
            Phaser.Easing.Linear.None,
            true
        );
        const tween = this.game.add.tween(particles_group).to(
            {
                y: this.data.hero.sprite.y - 20,
            },
            down_time,
            Phaser.Easing.Linear.None,
            true
        );
        tween.onUpdateCallback(() => {
            let theta = 0;
            particles_group.children.forEach((particle: Phaser.Sprite) => {
                particle.x = rho.value * Math.cos(theta + phase);
                particle.y = rho.value * Math.sin(theta + phase);
                theta += delta_theta;
            });
            phase += phase_speed;
        });
        this.aux_promise = new Promise(resolve => (this.aux_resolve = resolve));
        tween.onComplete.addOnce(() => {
            particles_group.destroy(true);
            this.aux_resolve();
        });
        await this.aux_promise;

        /* particles over hero head finish */
        const rgb = hex2rgb(element_colors_in_battle[this.djinn.element]);
        const finish_data = {
            red: rgb.r,
            green: rgb.g,
            blue: rgb.b,
            alpha: 0.6,
            lifespan: 200,
            ay: 0.2,
            velocity: {
                initial: {min: 2.0, max: 3.0},
                radial: {arcStart: -30, arcEnd: 30},
            },
        };
        this.data.particle_manager.addData("finish_data", finish_data);
        const finish_emitter = this.data.particle_manager.createEmitter(Phaser.ParticleStorm.PIXEL);
        (finish_emitter.renderer as Phaser.ParticleStorm.Renderer.Pixel).pixelSize = 3;
        (finish_emitter.renderer as Phaser.ParticleStorm.Renderer.Pixel).useRect = true;

        const finish_particles_group = this.game.add.group();
        finish_particles_group.x = this.game.camera.x;
        finish_particles_group.y = this.game.camera.y;
        finish_emitter.addToWorld(finish_particles_group);

        const finish_emitter_x = this.data.hero.sprite.x - this.game.camera.x;
        const finish_emitter_y = this.data.hero.sprite.y - 20 - this.game.camera.y;

        finish_emitter.emit("finish_data", finish_emitter_x, finish_emitter_y, {
            total: 8,
            repeat: 0,
        });

        await this.wait(200);

        this.data.particle_manager.removeEmitter(finish_emitter);
        finish_emitter.destroy();
        this.data.particle_manager.clearData("finish_data");
        finish_particles_group.destroy(true);

        reset_map();
    }

    async mars_djinn() {
        this.aux_promise = new Promise(resolve => (this.aux_resolve = resolve));
        const reset_map = FieldAbilities.tint_map_layers(this.game, this.data.map, {
            color: 0.35,
            intensity: 1,
            after_colorize: this.aux_resolve,
        });
        await this.aux_promise;

        await this.origin_npc.face_direction(directions.down);
        this.origin_npc.stop_animation();
        await this.origin_npc.shake(3, 50);

        await this.wait(500);
        this.origin_npc.set_rotation(true, 10);
        await this.wait(800);
        this.origin_npc.set_rotation(true);
        await this.wait(500);

        this.game.add
            .tween(this.origin_npc.sprite.scale)
            .to(
                {
                    x: 0.2,
                    y: 0,
                },
                1200,
                Phaser.Easing.Linear.None,
                true
            )
            .onComplete.addOnce(() => {
                this.origin_npc.toggle_active(false);
            });

        /* particles getting out of the djinn */
        const out_data = {
            image: "djinn_ball",
            alpha: 0.9,
            lifespan: 500,
            velocity: {
                initial: {min: 4, max: 6},
                radial: {arcStart: -18, arcEnd: 18},
            },
        };
        this.data.particle_manager.addData("out_of_djinn", out_data);
        const out_emitter = this.data.particle_manager.createEmitter(Phaser.ParticleStorm.SPRITE);
        out_emitter.addToWorld();
        out_emitter.emit("out_of_djinn", this.origin_npc.sprite.x, this.origin_npc.sprite.y, {
            total: 3,
            repeat: 23,
            frequency: 60,
            random: true,
        });

        await this.wait(800);
        await this.data.hero.face_direction(directions.down);
        this.data.hero.play(base_actions.GRANT);

        await this.wait(1500);

        this.data.particle_manager.removeEmitter(out_emitter);
        out_emitter.destroy();
        this.data.particle_manager.clearData("out_of_djinn");

        /* particles getting into the hero */
        const x1 = -50;
        const x2 = 50;
        const y1 = -this.game.camera.y - 20;
        const y2 = y1;
        const zone = this.data.particle_manager.createLineZone(x1, y1, x2, y2);
        const in_data = {
            image: "djinn_ball",
            alpha: 0.9,
            lifespan: 400,
            target: {
                x: this.data.hero.sprite.x,
                y: this.data.hero.sprite.y - 17,
            },
        };
        this.data.particle_manager.addData("into_hero", in_data);
        const into_emitter = this.data.particle_manager.createEmitter(Phaser.ParticleStorm.SPRITE);
        into_emitter.addToWorld();
        into_emitter.emit("into_hero", this.data.hero.sprite.x, this.data.hero.sprite.y, {
            total: 3,
            repeat: 26,
            frequency: 60,
            random: true,
            zone: zone,
        });

        await this.wait(400);
        this.data.hero.shake(11);

        await this.wait(1800);
        this.data.particle_manager.removeEmitter(into_emitter);
        into_emitter.destroy();
        this.data.particle_manager.clearData("into_hero");
        reset_map();
    }

    async _fire(oringin_npc: NPC) {
        if (!this.active) return;
        ++this.data.game_event_manager.events_running_count;
        this.origin_npc = oringin_npc;
        this.data.game_event_manager.force_idle_action = false;
        this.running = true;
        this.game.physics.p2.pause();

        await this.data.game_event_manager.handle_npc_interaction_start(this.origin_npc, false);

        switch (this.djinn.element) {
            case elements.VENUS:
                await this.venus_djinn();
                break;
            case elements.MARS:
                await this.mars_djinn();
                break;
        }

        this.dialog_manager = new DialogManager(this.game, this.data);
        const text = `${this.data.info.main_char_list[this.data.hero.key_name].name} found the ${_.capitalize(
            this.djinn.element
        )} Djinn \${COLOR:${element_colors[this.djinn.element].toString(16)}}${this.djinn.name}\${COLOR:/}!`;
        this.dialog_manager.set_dialog(text, {
            avatar: Djinn.sprite_base_key(this.djinn.element),
            avatar_inside_window: true,
            custom_max_dialog_width: 165,
        });
        this.data.audio.pause_bgm();
        this.data.audio.play_se("misc/party_join", () => {
            this.data.audio.resume_bgm();
        });
        this.next();
    }

    destroy() {
        this.finish_events.forEach(event => event.destroy());
        this.origin_npc = null;
        this.dialog_manager?.destroy();
        this.data.control_manager.detach_bindings(this.control_key);
    }
}
