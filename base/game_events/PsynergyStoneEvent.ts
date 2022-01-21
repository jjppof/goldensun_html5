import {NPC} from "../NPC";
import {base_actions, directions} from "../utils";
import {DialogManager} from "../utils/DialogManager";
import {GameEvent, event_types} from "./GameEvent";
import {Button} from "../XGamepad";
import * as _ from "lodash";

const INIT_TEXT = (hero_name: string) => `${hero_name} checked on the ground...`;
const GET_TEXT = (hero_name: string) => `${hero_name} got a Psynergy Stone.`;
const RECOVERY_TEXT = (hero_name: string) => `${hero_name}'s PP are maxed out!`;
const DISAPPEAR_TEXT = `The Psynergy Stone disappeared...`;

export class PsynergyStoneEvent extends GameEvent {
    private control_enable: boolean = true;
    private running: boolean = false;
    private promise: Promise<void>;
    private aux_resolve: () => void;
    private dialog_manager: DialogManager;
    private finish_events: GameEvent[] = [];
    private control_key: number;

    constructor(game, data, active, key_name, finish_events) {
        super(game, data, event_types.PSYNERGY_STONE, active, key_name);

        this.control_key = this.data.control_manager.add_controls(
            [
                {
                    buttons: Button.A,
                    on_down: () => {
                        if (!this.active || !this.running || !this.control_enable) return;
                        this.control_enable = false;
                        this.dialog_manager.kill_dialog(this.aux_resolve, false, true);
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

    async _fire(origin_npc?: NPC) {
        if (!this.active) return;
        this.origin_npc = origin_npc;
        ++this.data.game_event_manager.events_running_count;
        this.control_enable = false;
        this.running = true;

        //Initial Text
        const hero_name = this.data.info.main_char_list[this.data.hero.key_name].name;
        this.dialog_manager = new DialogManager(this.game, this.data);
        await this.set_text(INIT_TEXT(hero_name));

        await this.data.hero.face_direction(directions.down);
        this.data.game_event_manager.force_idle_action = false;
        this.data.hero.play(base_actions.GRANT);
        this.data.audio.pause_bgm();
        this.data.audio.play_se("misc/item_get", () => {
            this.data.audio.resume_bgm();
        });

        //Stone final position
        const stone_sprite_x = this.data.hero.sprite.centerX;
        const stone_sprite_y = this.data.hero.sprite.centerY - 24;

        //Particle emitter
        const emitter = this.game.add.emitter(stone_sprite_x, stone_sprite_y, 15);
        const psynergy_particle_base = this.data.info.misc_sprite_base_list["psynergy_particle"];
        const sprite_key = psynergy_particle_base.getSpriteKey("psynergy_particle");
        emitter.makeParticles(sprite_key);
        emitter.minParticleSpeed.setTo(-1, -1);
        emitter.maxParticleSpeed.setTo(1, 1);
        emitter.gravity = 100;
        emitter.width = emitter.height = 20;
        emitter.forEach((particle: Phaser.Sprite) => {
            psynergy_particle_base.setAnimation(particle, "psynergy_particle");
        });

        emitter.start(false, 300, 250, 0);
        const anim_key = psynergy_particle_base.getAnimationKey("psynergy_particle", "vanish");
        emitter.forEach((particle: Phaser.Sprite) => {
            particle.animations.play(anim_key, 10);
            particle.animations.currentAnim.setFrame((Math.random() * particle.animations.frameTotal) | 0);
        });

        this.game.physics.p2.pause();
        this.origin_npc.sprite.send_to_front = true;
        this.data.map.sort_sprites();
        this.game.add
            .tween(this.origin_npc.sprite.body)
            .to({x: stone_sprite_x, y: stone_sprite_y}, 300, Phaser.Easing.Linear.None, true);
        await this.set_text(GET_TEXT(hero_name));

        //Recover PP and show status window
        this.data.main_menu.chars_status_window.show();
        this.stone_pp_recovery();
        this.data.main_menu.chars_status_window.update_chars_info();
        this.data.main_menu.chars_status_window.update_position();
        this.data.audio.play_se("battle/heal_1");
        await this.set_text(RECOVERY_TEXT(hero_name));

        emitter.destroy();
        this.data.main_menu.chars_status_window.close();

        this.data.audio.play_se("misc/psynergy_stone_shatter");
        const animation_key_shatter = this.origin_npc.sprite_info.getAnimationKey("stone", "shatter");
        const animation_shatter = this.origin_npc.sprite.animations.getAnimation(animation_key_shatter);
        animation_shatter.play().onComplete.addOnce(() => {
            this.finish();
        });
    }

    //Hide Stone sprite and return control to character
    async finish() {
        this.origin_npc.toggle_active(false);
        await this.set_text(DISAPPEAR_TEXT, false);

        this.data.hero.play(base_actions.IDLE);
        this.running = false;
        this.control_enable = false;
        this.data.control_manager.detach_bindings(this.control_key);
        this.data.game_event_manager.force_idle_action = true;
        this.game.physics.p2.resume();
        --this.data.game_event_manager.events_running_count;
        this.finish_events.forEach(event => event.fire(this.origin_npc));
    }

    stone_pp_recovery() {
        this.data.info.party_data.members.forEach(member => {
            member.current_pp = member.max_pp;
        });
    }

    //Write text
    async set_text(text: string, show_crystal = true) {
        this.promise = new Promise<void>(resolve => (this.aux_resolve = resolve));
        this.dialog_manager.next_dialog(
            text,
            () => {
                this.control_enable = true;
            },
            {show_crystal: show_crystal}
        );
        await this.promise;
    }

    destroy() {
        this.finish_events.forEach(event => event.destroy());
        this.origin_npc = null;
        this.dialog_manager?.destroy();
        this.data.control_manager.detach_bindings(this.control_key);
        this.active = false;
    }
}
