import {Item} from "../Item";
import {MainChar} from "../MainChar";
import {NPC} from "../NPC";
import {base_actions, directions} from "../utils";
import {DialogManager} from "../utils/DialogManager";
import {GameEvent, event_types} from "./GameEvent";
import {Button} from "../XGamepad";

const INIT_TEXT = (name: string) => `${name} checked the chest...`;
const ITEM_TEXT = (hero_name: string, item_name: string) => `${hero_name} got ${item_name}.`;

export class ChestEvent extends GameEvent {
    private item: Item;
    private quantity: number;
    private running: boolean = false;
    private control_enable: boolean = true;
    private resolve: Function;
    private promise: Promise<any>;
    private dialog_manager: DialogManager;
    private finish_events: GameEvent[] = [];
    private custom_init_text: string;
    private no_chest: boolean;
    private hide_on_finish: boolean;
    private control_key: number;

    constructor(
        game,
        data,
        active,
        key_name,
        item_key_name,
        quantity,
        finish_events,
        custom_init_text,
        no_chest,
        hide_on_finish
    ) {
        super(game, data, event_types.CHEST, active, key_name);
        this.item = this.data.info.items_list[item_key_name];
        this.quantity = quantity ?? 1;
        this.no_chest = no_chest ?? false;
        this.custom_init_text = custom_init_text;
        this.hide_on_finish = hide_on_finish ?? false;

        this.control_key = this.data.control_manager.add_controls(
            [
                {
                    buttons: Button.A,
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
        this.control_enable = false;
        this.dialog_manager.next(finished => {
            this.control_enable = true;
            if (finished) {
                this.resolve();
            }
        });
    }

    async _fire(origin_npc?: NPC) {
        if (!this.active) return;
        this.origin_npc = origin_npc;
        ++this.data.game_event_manager.events_running_count;
        this.control_enable = false;
        this.running = true;

        const hero_name = this.data.info.party_data.members[0].name;
        this.dialog_manager = new DialogManager(this.game, this.data);
        this.dialog_manager.set_dialog(this.custom_init_text ?? INIT_TEXT(hero_name));
        this.promise = new Promise(resolve => (this.resolve = resolve));
        this.next();
        await this.promise;

        const item_sprite = this.game.add.sprite(0, 0, "items_icons", this.item.key_name);
        item_sprite.visible = false;
        item_sprite.anchor.setTo(0.5, 0.5);
        item_sprite.x = this.origin_npc.sprite.x;
        item_sprite.y = this.origin_npc.sprite.y;

        const item_sprite_pos_above_chest = item_sprite.y - 13;
        const emitter = this.game.add.emitter(item_sprite.x, item_sprite_pos_above_chest, 15);
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

        item_sprite.scale.setTo(0, 0);

        if (!this.no_chest) {
            const animation_key = this.origin_npc.sprite_info.getAnimationKey("chest", "opening");
            const animation = this.origin_npc.sprite.animations.getAnimation(animation_key);
            animation.play();
            this.data.audio.play_se("misc/chest_open");
            this.promise = new Promise(resolve => (this.resolve = resolve));
            animation.onComplete.addOnce(() => {
                const animation_key = this.origin_npc.sprite_info.getAnimationKey("chest", "shining");
                const animation = this.origin_npc.sprite.animations.getAnimation(animation_key);
                animation.play();
                this.resolve();
            });
            await this.promise;
        }

        this.promise = new Promise(resolve => (this.resolve = resolve));
        const tween_time = 100;
        item_sprite.visible = true;
        this.game.add
            .tween(item_sprite)
            .to({y: item_sprite_pos_above_chest}, tween_time, Phaser.Easing.Linear.None, true);
        this.game.add
            .tween(item_sprite.scale)
            .to({x: 1, y: 1}, tween_time, Phaser.Easing.Linear.None, true)
            .onComplete.addOnce(() => {
                emitter.start(false, 300, 250, 0);
                const anim_key = psynergy_particle_base.getAnimationKey("psynergy_particle", "vanish");
                emitter.forEach((particle: Phaser.Sprite) => {
                    particle.animations.play(anim_key, 10);
                    particle.animations.currentAnim.setFrame((Math.random() * particle.animations.frameTotal) | 0);
                });
                this.game.time.events.add(300, this.resolve);
            });
        await this.promise;

        await this.data.hero.face_direction(directions.down);
        this.data.game_event_manager.force_idle_action = false;
        this.data.hero.play(base_actions.GRANT);
        this.data.audio.pause_bgm();
        this.data.audio.play_se("misc/item_get", () => {
            this.data.audio.resume_bgm();
        });
        const delta_x = item_sprite.x - this.data.hero.sprite.x;
        const delta_y = item_sprite.y - (this.data.hero.sprite.y - this.data.hero.sprite.height);
        item_sprite.x -= delta_x;
        item_sprite.y -= delta_y;
        emitter.x -= delta_x;
        emitter.y -= delta_y;
        if (!this.no_chest) {
            const animation_key = this.origin_npc.sprite_info.getAnimationKey("chest", "empty");
            const animation = this.origin_npc.sprite.animations.getAnimation(animation_key);
            animation.play();
        }

        const item_name = this.item.name;
        this.dialog_manager = new DialogManager(this.game, this.data);
        this.dialog_manager.set_dialog(ITEM_TEXT(hero_name, item_name));
        this.promise = new Promise(resolve => (this.resolve = resolve));
        this.next();
        await this.promise;

        if (this.hide_on_finish) {
            this.origin_npc.visible = false;
        }
        item_sprite.destroy();
        emitter.destroy();
        this.data.hero.play(base_actions.IDLE);
        MainChar.add_item_to_party(this.data.info.party_data, this.item, this.quantity);
        this.running = false;
        this.control_enable = false;
        this.data.control_manager.detach_bindings(this.control_key);
        this.data.game_event_manager.force_idle_action = true;
        --this.data.game_event_manager.events_running_count;
        this.finish_events.forEach(event => event.fire(this.origin_npc));
    }

    destroy() {
        this.finish_events.forEach(event => event.destroy());
        this.origin_npc = null;
        this.dialog_manager?.destroy();
        this.data.control_manager.detach_bindings(this.control_key);
        this.active = false;
    }
}
