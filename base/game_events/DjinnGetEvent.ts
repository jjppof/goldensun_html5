import {GameEvent, event_types, game_event_misc_origin} from "./GameEvent";
import * as _ from "lodash";
import {Djinn, djinn_status} from "../Djinn";
import {
    base_actions,
    directions,
    elements,
    element_colors,
    element_colors_in_battle,
    hex2rgb,
    promised_wait,
} from "../utils";
import {MainChar} from "../MainChar";
import {FieldAbilities} from "../field_abilities/FieldAbilities";
import {degree360, GAME_HEIGHT, GAME_WIDTH} from "../magic_numbers";
import {DialogManager} from "../utils/DialogManager";
import {Button} from "../XGamepad";
import {BattleEvent} from "./BattleEvent";
import {interaction_patterns} from "./GameEventManager";

export class DjinnGetEvent extends GameEvent {
    private static readonly ELEMENT_HUE = {
        [elements.VENUS]: 1,
        [elements.MERCURY]: 3.1,
        [elements.MARS]: 0,
        [elements.JUPITER]: 5,
    };

    private djinn: Djinn;
    private finish_events: GameEvent[] = [];
    private on_battle_defeat_events: GameEvent[] = [];
    private aux_resolve: () => void;
    private aux_promise: Promise<void>;
    private dialog_manager: DialogManager = null;
    private running: boolean = false;
    private control_enable: boolean = false;
    private control_key: number;
    private has_fight: number;
    private enemy_party_key: string;
    private custom_battle_bg: string;
    private djinn_defeated: boolean;
    private on_event_finish: () => void;
    private no_animation: boolean;
    private add_djinn: boolean; //only works with no_animation set to true.

    constructor(
        game,
        data,
        active,
        key_name,
        keep_reveal,
        keep_custom_psynergy,
        djinn_key,
        has_fight,
        enemy_party_key,
        custom_battle_bg,
        finish_events,
        on_battle_defeat_events,
        no_animation,
        add_djinn
    ) {
        super(game, data, event_types.DJINN_GET, active, key_name, keep_reveal, keep_custom_psynergy);
        this.djinn = this.data.info.djinni_list[djinn_key];
        this.has_fight = has_fight ?? false;
        this.enemy_party_key = enemy_party_key;
        this.custom_battle_bg = custom_battle_bg;
        this.djinn_defeated = false;
        this.no_animation = no_animation ?? false;
        this.add_djinn = add_djinn ?? true;

        finish_events?.forEach(event_info => {
            const event = this.data.game_event_manager.get_event_instance(event_info, this.type, this.origin_npc);
            this.finish_events.push(event);
        });
        on_battle_defeat_events?.forEach(event_info => {
            const event = this.data.game_event_manager.get_event_instance(event_info, this.type, this.origin_npc);
            this.on_battle_defeat_events.push(event);
        });
    }

    next(previous_force_idle_action_in_event: boolean) {
        this.dialog_manager.next(finished => {
            this.control_enable = true;
            if (finished) {
                this.finish(previous_force_idle_action_in_event);
            }
        });
    }

    set_on_event_finish(on_event_finish: () => void) {
        this.on_event_finish = on_event_finish;
    }

    finish(previous_force_idle_action_in_event: boolean) {
        this.control_enable = false;
        this.running = false;
        this.data.control_manager.detach_bindings(this.control_key);
        MainChar.add_djinn_to_party(this.data.info.party_data, this.djinn);
        this.djinn.set_status(djinn_status.STANDBY);
        this.data.hero.play(base_actions.IDLE);
        this.data.hero.force_idle_action_in_event = previous_force_idle_action_in_event;
        this.data.hero.toggle_collision(true);
        --this.data.game_event_manager.events_running_count;
        this.finish_events.forEach(event => event.fire(this.origin_npc));
        if (this.on_event_finish) {
            this.on_event_finish();
        }
    }

    finish_on_defeat(previous_force_idle_action_in_event: boolean) {
        this.control_enable = false;
        this.running = false;
        this.data.control_manager.detach_bindings(this.control_key);
        this.data.hero.play(base_actions.IDLE);
        this.data.hero.force_idle_action_in_event = previous_force_idle_action_in_event;
        this.data.hero.toggle_collision(true);
        --this.data.game_event_manager.events_running_count;
        this.on_battle_defeat_events.forEach(event => event.fire(this.origin_npc));
    }

    async venus_djinn() {
        this.aux_promise = new Promise(resolve => (this.aux_resolve = resolve));
        const reset_map = FieldAbilities.colorize_map_layers(this.game, this.data.map, {
            color: 0.65,
            intensity: 1,
            after_colorize: this.aux_resolve,
        });
        await this.aux_promise;

        /* initial djinn jumps */
        this.data.audio.play_se("actions/jump");
        await this.origin_npc.jump({
            time_on_finish: 70,
        });
        this.data.audio.play_se("actions/jump");
        await this.origin_npc.jump({
            time_on_finish: 500,
            duration: 65,
        });
        this.data.audio.play_se("actions/jump_2");
        this.data.audio.play_se("misc/venus_djinn_get");
        this.origin_npc.set_rotation(true);
        await this.origin_npc.jump({
            jump_height: 40,
            duration: 140,
        });

        /* rotation and penetration into the ground */
        this.data.camera.enable_shake();
        this.aux_promise = new Promise(resolve => (this.aux_resolve = resolve));
        this.game.add
            .tween(this.origin_npc.sprite.scale)
            .to(
                {
                    x: 0,
                    y: 0,
                },
                2060,
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
        const hue_filter = this.game.add.filter("Hue") as Phaser.Filter.Hue;
        hue_filter.angle = DjinnGetEvent.ELEMENT_HUE[this.djinn.element];
        emitter.onEmit = new Phaser.Signal();
        emitter.onEmit.add((emitter: Phaser.ParticleStorm.Emitter, particle: Phaser.ParticleStorm.Particle) => {
            particle.sprite.filters = [hue_filter];
        });
        emitter.addToWorld();
        emitter.emit("out_of_ground", this.data.hero.sprite.x, this.data.hero.sprite.y + 10, {
            total: 4,
            repeat: 25,
            frequency: 100,
            zone: zone,
            random: true,
        });

        await promised_wait(this.game, 3500);

        this.data.particle_manager.removeEmitter(emitter);
        emitter.destroy();
        this.data.particle_manager.clearData("out_of_ground");
        emitter.onEmit.dispose();
        this.data.camera.disable_shake();

        /* particles circle over the hero */
        const particles_circle_number = 25;
        const delta_theta = degree360 / particles_circle_number;
        const rho = {value: 20};
        const down_time = 2500;
        const phase_speed = 0.07;
        let phase = 0;
        const particles_group = this.game.add.group();
        particles_group.x = this.data.hero.sprite.x;
        particles_group.y = this.game.camera.y - rho.value;
        for (let i = 0; i < particles_circle_number; ++i) {
            const particle = this.game.add.sprite(0, 0, "djinn_ball");
            particle.anchor.setTo(0.5, 0.5);
            particle.alpha = 0.9;
            particle.filters = [hue_filter];
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
        (finish_emitter.renderer as unknown as Phaser.ParticleStorm.Renderer.Pixel).pixelSize = 3;
        (finish_emitter.renderer as unknown as Phaser.ParticleStorm.Renderer.Pixel).useRect = true;

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

        await promised_wait(this.game, 200);

        this.data.particle_manager.removeEmitter(finish_emitter);
        finish_emitter.destroy();
        this.data.particle_manager.clearData("finish_data");
        finish_particles_group.destroy(true);

        reset_map();
    }

    async mercury_djinn() {
        this.aux_promise = new Promise(resolve => (this.aux_resolve = resolve));
        const reset_map = FieldAbilities.colorize_map_layers(this.game, this.data.map, {
            color: 0.95,
            intensity: 1,
            after_colorize: this.aux_resolve,
        });
        await this.aux_promise;

        await promised_wait(this.game, 200);

        await this.origin_npc.shake({
            repeats_number: 2,
            repeat_period: 65,
            side_shake: true,
            max_scale_mult: 0.75,
        });
        this.data.audio.play_se("menu/djinn_unset");
        await promised_wait(this.game, 500);

        this.data.audio.play_se("actions/jump");
        await this.origin_npc.jump({
            duration: 70,
            time_on_finish: 80,
        });
        this.data.audio.play_se("actions/jump");
        await this.origin_npc.jump({
            jump_height: 35,
            duration: 80,
            bounce: true,
            time_on_finish: 80,
        });
        this.data.audio.play_se("actions/jump_2");
        await this.origin_npc.jump({
            jump_height: 60,
            duration: 150,
            bounce: true,
            time_on_finish: 100,
        });

        /* final jump with trails */
        const trail_bitmap_data = this.game.add.bitmapData(GAME_WIDTH, GAME_HEIGHT);
        trail_bitmap_data.smoothed = false;
        trail_bitmap_data.fill(0, 0, 0, 1);
        const trail_image = this.game.add.image(this.game.camera.x, this.game.camera.y, trail_bitmap_data);
        trail_image.blendMode = Phaser.blendModes.SCREEN;
        this.origin_npc.shadow.visible = false;
        const obj_to_tween = this.origin_npc.sprite.body ?? this.origin_npc.sprite;
        const final_jump_tween = this.game.add.tween(obj_to_tween).to(
            {
                y: this.game.camera.y - 20,
            },
            250,
            Phaser.Easing.Linear.None,
            true
        );
        this.data.audio.play_se("actions/jump_2");
        this.aux_promise = new Promise(resolve => (this.aux_resolve = resolve));
        final_jump_tween.onComplete.addOnce(() => {
            this.origin_npc.toggle_active(false);
            trail_bitmap_data.destroy();
            trail_image.destroy();
            this.aux_resolve();
        });
        const shift_x = (this.origin_npc.sprite.width * this.origin_npc.sprite.anchor.x) >> 1;
        const shift_y = (this.origin_npc.sprite.height * this.origin_npc.sprite.anchor.y) >> 1;
        final_jump_tween.onUpdateCallback(() => {
            trail_bitmap_data.fill(0, 0, 0, 0.2);
            const x = this.origin_npc.sprite.x - this.game.camera.x + shift_x;
            const y = this.origin_npc.sprite.y - this.game.camera.y + shift_y;
            trail_bitmap_data.draw(this.origin_npc.sprite, x, y);
        });
        await this.aux_promise;

        await this.data.hero.face_direction(directions.down);
        this.data.hero.play(base_actions.GRANT);
        await promised_wait(this.game, 350);

        /* particles getting into the hero */
        const num_droplet_repeats = 40;
        const x1_s = -8;
        const x2_s = 8;
        const y1_s = -(this.data.hero.sprite.y - this.game.camera.y) - 20;
        const y2_s = y1_s;
        const zone_source = this.data.particle_manager.createLineZone(x1_s, y1_s, x2_s, y2_s);
        const x1_t = this.data.hero.sprite.x - 8;
        const x2_t = this.data.hero.sprite.x + 8;
        const y1_t = this.data.hero.sprite.y - 17;
        const y2_t = y1_t;
        const zone_target = this.data.particle_manager.createLineZone(x1_t, y1_t, x2_t, y2_t);
        const in_data = {
            image: "water_drop",
            alpha: 0.9,
            lifespan: 350,
            target: {
                zone: zone_target,
            },
        };
        this.data.particle_manager.addData("into_hero", in_data);
        const into_emitter = this.data.particle_manager.createEmitter(Phaser.ParticleStorm.SPRITE);
        this.data.audio.play_se("misc/mercury_djinn_get");
        into_emitter.addToWorld();
        into_emitter.emit("into_hero", this.data.hero.sprite.x, this.data.hero.sprite.y, {
            total: 3,
            repeat: num_droplet_repeats,
            frequency: 60,
            random: true,
            zone: zone_source,
        });

        await promised_wait(this.game, 250);

        /* water particles that get out from hero's head */
        const water_hit = {
            image: "water_drop",
            alpha: 0.9,
            lifespan: 200,
            ay: 0.01,
            scale: 0.5,
            velocity: {
                initial: {min: 0.8, max: 1.2},
                radial: {arcStart: -130, arcEnd: 130},
            },
        };
        this.data.particle_manager.addData("water_hit", water_hit);
        const water_hit_emitter = this.data.particle_manager.createEmitter(Phaser.ParticleStorm.SPRITE);
        water_hit_emitter.addToWorld();
        water_hit_emitter.emit("water_hit", this.data.hero.sprite.x, this.data.hero.sprite.y - 20, {
            total: 2,
            repeat: num_droplet_repeats,
            frequency: 60,
            random: true,
        });

        await promised_wait(this.game, 2700);

        this.data.particle_manager.removeEmitter(into_emitter);
        into_emitter.destroy();
        this.data.particle_manager.clearData("into_hero");

        this.data.particle_manager.removeEmitter(water_hit_emitter);
        water_hit_emitter.destroy();
        this.data.particle_manager.clearData("water_hit");

        reset_map();
    }

    async mars_djinn() {
        this.aux_promise = new Promise(resolve => (this.aux_resolve = resolve));
        const reset_map = FieldAbilities.colorize_map_layers(this.game, this.data.map, {
            color: 0.35,
            intensity: 1,
            after_colorize: this.aux_resolve,
        });
        await this.aux_promise;

        await this.origin_npc.face_direction(directions.down);
        this.origin_npc.stop_animation();
        await this.origin_npc.shake({
            repeats_number: 3,
            repeat_period: 50,
        });
        this.data.audio.play_se("misc/djinn_excite");

        await promised_wait(this.game, 520);
        this.data.audio.play_se("misc/mars_djinn_get");
        this.origin_npc.set_rotation(true, 10);
        await promised_wait(this.game, 800);
        this.origin_npc.set_rotation(true);
        await promised_wait(this.game, 500);

        this.game.add
            .tween(this.origin_npc.sprite.scale)
            .to(
                {
                    x: 0.2,
                    y: 0,
                },
                1800,
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
            repeat: 30,
            frequency: 60,
            random: true,
        });

        await promised_wait(this.game, 800);
        await this.data.hero.face_direction(directions.down);
        this.data.hero.play(base_actions.GRANT);

        await promised_wait(this.game, 1400);

        this.data.particle_manager.removeEmitter(out_emitter);
        out_emitter.destroy();
        this.data.particle_manager.clearData("out_of_djinn");
        await promised_wait(this.game, 700);
        /* particles getting into the hero */
        const x1 = -50;
        const x2 = 50;
        const y1 = -(this.data.hero.sprite.y - this.game.camera.y) - 20;
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
            repeat: 33,
            frequency: 60,
            random: true,
            zone: zone,
        });

        await promised_wait(this.game, 400);
        this.data.hero.shake({repeats_number: 14});

        await promised_wait(this.game, 2000);
        this.data.particle_manager.removeEmitter(into_emitter);
        into_emitter.destroy();
        this.data.particle_manager.clearData("into_hero");
        reset_map();
    }

    async jupiter_djinn() {
        this.aux_promise = new Promise(resolve => (this.aux_resolve = resolve));
        const reset_map = FieldAbilities.colorize_map_layers(this.game, this.data.map, {
            color: 0.1,
            intensity: 0.7,
            after_colorize: this.aux_resolve,
        });
        await this.aux_promise;

        await promised_wait(this.game, 200);

        await this.origin_npc.shake({
            repeats_number: 2,
            repeat_period: 65,
            side_shake: true,
            max_scale_mult: 0.75,
        });
        this.data.audio.play_se("misc/djinn_excite");
        await promised_wait(this.game, 520);

        this.origin_npc.set_rotation(true);
        this.data.audio.play_se("misc/jupiter_djinn_get");
        await promised_wait(this.game, 1000);

        this.origin_npc.shadow.visible = false;
        const obj_to_tween = this.origin_npc.sprite.body ?? this.origin_npc.sprite;
        const final_djinn_position = {
            x: obj_to_tween.x,
            y: this.data.hero.sprite.y - this.data.hero.sprite.height - 10,
        };
        const jump_tween = this.game.add.tween(obj_to_tween).to(
            {
                y: [this.game.camera.y + 7, final_djinn_position.y],
            },
            350,
            Phaser.Easing.Linear.None,
            true
        );
        this.aux_promise = new Promise(resolve => (this.aux_resolve = resolve));
        jump_tween.onComplete.addOnce(() => {
            this.origin_npc.toggle_active(false);
            this.aux_resolve();
        });
        this.data.audio.play_se("actions/jump_2");
        await this.aux_promise;

        //spiral init vars
        const hue_filters: Phaser.Filter.Hue[] = [
            this.game.add.filter("Hue") as Phaser.Filter.Hue,
            this.game.add.filter("Hue") as Phaser.Filter.Hue,
            this.game.add.filter("Hue") as Phaser.Filter.Hue,
            this.game.add.filter("Hue") as Phaser.Filter.Hue,
        ];
        hue_filters[0].angle = 0.6;
        hue_filters[1].angle = 2.6;
        hue_filters[2].angle = 4.5;
        hue_filters[3].angle = 5;
        const spiral_particles_number = 25;
        const spiral_particles_number_half = spiral_particles_number >> 1;
        const get_scale = i => {
            return (
                0.8 + Math.abs(Math.abs((i - spiral_particles_number_half) / spiral_particles_number_half) - 1) * 0.2
            );
        };
        const particles_group = this.game.add.group();
        for (let i = 0; i < spiral_particles_number; ++i) {
            const particle = this.game.add.sprite(0, 0, "djinn_ball");
            particle.anchor.setTo(0.5, 0.5);
            const scale = get_scale(i);
            particle.scale.setTo(scale, scale);
            particle.visible = false;
            particle.filters = [_.sample(hue_filters)];
            particles_group.addChild(particle);
        }
        const spiral_time = {
            time: 0,
        };
        const spiral_equation = (t: number, final_t: number, x0: number, y0: number, is_circle: boolean) => {
            const width = 70;
            const v = is_circle ? width * final_t : width * t;
            const w = 17;
            return {
                x: x0 + v * Math.cos(w * t),
                y: y0 + v * Math.sin(w * t),
            };
        };
        const delta_particle_time = 0.012;
        const final_spiral_time = Math.PI / 3.78;
        const final_spiral_all_time = final_spiral_time + spiral_particles_number * delta_particle_time;

        //spiral getting out of djinn
        const spiral_open_tween = this.game.add.tween(spiral_time).to(
            {
                time: final_spiral_all_time,
            },
            2000,
            Phaser.Easing.Linear.None,
            true
        );
        spiral_open_tween.onUpdateCallback(() => {
            particles_group.children.forEach((particle, i) => {
                const t = spiral_time.time - i * delta_particle_time;
                if (t >= 0) {
                    particle.visible = true;
                } else {
                    return;
                }
                const is_circle = t >= final_spiral_time ? true : false;
                const pos = spiral_equation(
                    t,
                    final_spiral_time,
                    final_djinn_position.x,
                    final_djinn_position.y,
                    is_circle
                );
                particle.x = pos.x;
                particle.y = pos.y;
            });
        });
        this.aux_promise = new Promise(resolve => (this.aux_resolve = resolve));
        spiral_open_tween.onComplete.addOnce(() => {
            this.aux_resolve();
        });
        await this.aux_promise;

        //circle translation from djinn to hero
        const final_position = {
            x: this.data.hero.sprite.x,
            y: this.data.hero.sprite.y - this.data.hero.sprite.height + this.data.hero.sprite.anchor.y * 10,
        };
        const final_circle_time = 1.388 * final_spiral_all_time;
        const translate_tween = this.game.add.tween(spiral_time).to(
            {
                time: final_circle_time,
            },
            1000,
            Phaser.Easing.Linear.None,
            true
        );
        const delta_time = final_circle_time - final_spiral_all_time;
        translate_tween.onUpdateCallback(() => {
            const distance_factor = (spiral_time.time - final_spiral_all_time) / delta_time;
            const x0 = (1 - distance_factor) * final_djinn_position.x + distance_factor * final_position.x;
            const y0 = (1 - distance_factor) * final_djinn_position.y + distance_factor * final_position.y;
            particles_group.children.forEach((particle, i) => {
                const t = spiral_time.time - i * delta_particle_time;
                const pos = spiral_equation(t, final_spiral_time, x0, y0, true);
                particle.x = pos.x;
                particle.y = pos.y;
            });
        });
        this.aux_promise = new Promise(resolve => (this.aux_resolve = resolve));
        translate_tween.onComplete.addOnce(() => {
            this.aux_resolve();
        });
        await this.aux_promise;

        //final spiral closing at hero
        spiral_time.time = -final_spiral_time;
        const spiral_close_tween = this.game.add.tween(spiral_time).to(
            {
                time: spiral_particles_number * delta_particle_time,
            },
            2000,
            Phaser.Easing.Linear.None,
            true
        );
        spiral_close_tween.onUpdateCallback(() => {
            particles_group.children.forEach((particle, i) => {
                const t = spiral_time.time - i * delta_particle_time;
                if (t >= 0) {
                    particle.visible = false;
                    return;
                }
                const is_circle = t <= -final_spiral_time ? true : false;
                const pos = spiral_equation(t, -final_spiral_time, final_position.x, final_position.y, is_circle);
                particle.x = pos.x;
                particle.y = pos.y;
            });
        });
        this.aux_promise = new Promise(resolve => (this.aux_resolve = resolve));
        spiral_close_tween.onComplete.addOnce(() => {
            this.aux_resolve();
        });

        await this.data.hero.face_direction(directions.down);
        this.data.hero.play(base_actions.GRANT);

        await promised_wait(this.game, 1200);
        this.data.hero.shake({repeats_number: 7});

        await this.aux_promise;
        particles_group.destroy(true);

        reset_map();
    }

    async start_a_fight() {
        this.data.audio.play_se("menu/positive_4");
        await this.origin_npc.shake({
            repeats_number: 2,
            repeat_period: 65,
            side_shake: true,
            max_scale_mult: 0.75,
        });

        await promised_wait(this.game, 500);

        await this.origin_npc.show_emoticon("annoyed", {
            location: {
                y: this.origin_npc.y - this.origin_npc.height + 10,
            },
        });

        const previous_npc_pos = {
            x: this.origin_npc.x,
            y: this.origin_npc.y,
        };
        const previous_npc_dir = this.origin_npc.current_direction;
        this.origin_npc.set_rotation(true);

        const bounce_height = this.data.hero.y - ((this.data.hero.height * 3) >> 2);
        const bounce_height_2 = this.data.hero.y - this.data.hero.height;

        const jump_height = bounce_height - this.data.hero.height;
        const jump_height_2 = bounce_height_2 - this.data.hero.height;
        const jump_height_3 = jump_height_2 - (this.data.hero.height >> 1);
        const jump_height_4 = this.game.camera.y - 10;

        const jump_softness = -0.07;
        const easing = k => 4 * Math.pow(k - 0.5, 3) + 0.5 + jump_softness * Math.sin(2 * Math.PI * k);
        const tween_target = this.origin_npc.sprite.body ?? this.origin_npc.sprite;
        let tween = this.game.add.tween(tween_target).to({y: [jump_height, bounce_height]}, 500, easing, true);
        this.aux_promise = new Promise(resolve => (this.aux_resolve = resolve));
        tween.onComplete.addOnce(this.aux_resolve);
        this.data.audio.play_se("actions/jump");
        await this.aux_promise;

        tween = this.game.add.tween(tween_target).to({y: [jump_height_2, bounce_height_2]}, 500, easing, true);
        this.aux_promise = new Promise(resolve => (this.aux_resolve = resolve));
        tween.onComplete.addOnce(this.aux_resolve);
        this.data.audio.play_se("actions/jump");
        await this.aux_promise;

        tween = this.game.add.tween(tween_target).to({y: [jump_height_3, bounce_height_2]}, 500, easing, true);
        this.aux_promise = new Promise(resolve => (this.aux_resolve = resolve));
        tween.onComplete.addOnce(this.aux_resolve);
        this.data.audio.play_se("actions/jump");
        await this.aux_promise;

        this.origin_npc.set_rotation(false);
        this.origin_npc.set_direction(previous_npc_dir, true);

        const trail_bitmap_data = this.game.add.bitmapData(GAME_WIDTH, GAME_HEIGHT);
        trail_bitmap_data.smoothed = false;
        trail_bitmap_data.fill(0, 0, 0, 1);
        const trail_image = this.game.add.image(this.game.camera.x, this.game.camera.y, trail_bitmap_data);
        trail_image.blendMode = Phaser.blendModes.SCREEN;

        tween = this.game.add.tween(tween_target).to(
            {
                x: this.data.hero.x,
                y: [jump_height_4, bounce_height],
            },
            600,
            easing,
            true
        );
        if (this.origin_npc.shadow) {
            tween = this.game.add.tween(this.origin_npc.shadow).to(
                {
                    x: this.data.hero.x,
                },
                600,
                Phaser.Easing.Linear.None,
                true
            );
        }
        const shift_x = (this.origin_npc.sprite.width * this.origin_npc.sprite.anchor.x) >> 1;
        const shift_y = (this.origin_npc.sprite.height * this.origin_npc.sprite.anchor.y) >> 1;
        tween.onUpdateCallback(() => {
            trail_bitmap_data.fill(0, 0, 0, 0.05);
            const x = this.origin_npc.sprite.x - this.game.camera.x + shift_x;
            const y = this.origin_npc.sprite.y - this.game.camera.y + shift_y;
            trail_bitmap_data.draw(this.origin_npc.sprite, x, y);
        });
        this.aux_promise = new Promise(resolve => (this.aux_resolve = resolve));
        tween.onComplete.addOnce(() => {
            trail_bitmap_data.destroy();
            trail_image.destroy();
            this.aux_resolve();
        });
        this.data.audio.play_se("actions/jump_2");
        await this.aux_promise;

        this.aux_promise = new Promise(resolve => (this.aux_resolve = resolve));
        const party = this.enemy_party_key;
        const bgm =
            this.data.info.party_data.members[0].key_name in this.data.info.battle_bgms
                ? this.data.info.battle_bgms[this.data.info.party_data.members[0].key_name]
                : this.data.info.battle_bgms.default;
        const event = this.data.game_event_manager.get_event_instance(
            {
                type: event_types.BATTLE,
                background_key: this.custom_battle_bg ?? this.data.map.background_key,
                enemy_party_key: party,
                bgm: bgm,
                reset_previous_bgm: true,
            },
            game_event_misc_origin.MISC,
            this.origin_npc
        ) as BattleEvent;
        event.assign_before_fade_finish_callback(() => {
            this.origin_npc.set_position({
                x: previous_npc_pos.x,
                y: previous_npc_pos.y,
            });
        });
        event.assign_finish_callback(victory => {
            this.djinn_defeated = victory;
            this.aux_resolve();
        });
        event.fire();
        await this.aux_promise;
    }

    async _fire() {
        if (this.no_animation) {
            if (this.add_djinn) {
                MainChar.add_djinn_to_party(this.data.info.party_data, this.djinn);
                this.djinn.set_status(djinn_status.STANDBY);
            } else {
                const char = this.djinn.owner;
                if (char) {
                    char.remove_djinn(this.djinn.key_name);
                    MainChar.distribute_djinn(this.data.info.party_data);
                }
            }
            return;
        }
        ++this.data.game_event_manager.events_running_count;
        const previous_force_idle_action_in_event = this.data.hero.force_idle_action_in_event;
        this.data.hero.force_idle_action_in_event = false;
        this.running = true;

        this.control_key = this.data.control_manager.add_controls(
            [
                {
                    buttons: Button.A,
                    on_down: () => {
                        if (!this.running || !this.control_enable) return;
                        this.next(previous_force_idle_action_in_event);
                    },
                },
            ],
            {persist: true}
        );

        this.data.hero.toggle_collision(false);
        this.origin_npc.toggle_collision(false);

        if (this.origin_npc.interaction_pattern !== interaction_patterns.SIMPLE) {
            await this.data.game_event_manager.set_npc_and_hero_directions(this.origin_npc);
        }

        if (this.has_fight) {
            await this.start_a_fight();
            if (!this.djinn_defeated) {
                this.finish_on_defeat(previous_force_idle_action_in_event);
                return;
            }
        }

        switch (this.djinn.element) {
            case elements.VENUS:
                await this.venus_djinn();
                break;
            case elements.MERCURY:
                await this.mercury_djinn();
                break;
            case elements.MARS:
                await this.mars_djinn();
                break;
            case elements.JUPITER:
                await this.jupiter_djinn();
                break;
        }

        this.dialog_manager = new DialogManager(this.game, this.data);
        const hero_name = this.data.info.main_char_list[this.data.hero.key_name].name;
        const djinn_text_color = element_colors[this.djinn.element].toString(16);
        const djinn_element_name = _.capitalize(this.djinn.element);
        const djinn_name = this.djinn.name;
        const text = `${hero_name} found the ${djinn_element_name} Djinn \${COLOR:${djinn_text_color}}${djinn_name}\${COLOR:/}!`;
        this.dialog_manager.set_dialog(text, {
            avatar: Djinn.sprite_base_key(this.djinn.element),
            avatar_inside_window: true,
            custom_max_dialog_width: 165,
        });
        this.data.audio.pause_bgm();
        this.data.audio.play_se("misc/party_join", () => {
            this.data.audio.resume_bgm();
        });
        this.next(previous_force_idle_action_in_event);
    }

    _destroy() {
        this.djinn = null;
        this.finish_events.forEach(event => event?.destroy());
        this.on_battle_defeat_events.forEach(event => event?.destroy());
        this.dialog_manager?.destroy();
        this.dialog_manager = null;
        this.data.control_manager.detach_bindings(this.control_key);
    }
}
