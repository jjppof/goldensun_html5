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
    private open_finish_events: GameEvent[] = [];

    constructor(game, data, active, item_key_name, quantity, open_finish_events) {
        super(game, data, event_types.CHEST, active);
        this.item = this.data.info.items_list[item_key_name];
        this.quantity = quantity ?? 1;

        this.data.control_manager.add_controls(
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

        open_finish_events?.forEach(event_info => {
            const event = this.data.game_event_manager.get_event_instance(event_info);
            this.open_finish_events.push(event);
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

    async fire(origin_npc?: NPC) {
        if (!this.active) return;
        this.origin_npc = origin_npc;
        ++this.data.game_event_manager.events_running_count;
        this.control_enable = false;
        this.running = true;

        const hero_name = this.data.info.party_data.members[0].name;
        this.dialog_manager = new DialogManager(this.game, this.data);
        this.dialog_manager.set_dialog(INIT_TEXT(hero_name));
        this.promise = new Promise(resolve => (this.resolve = resolve));
        this.next();
        await this.promise;

        const item_sprite = this.game.add.sprite(0, 0, "items_icons", this.item.key_name);
        item_sprite.visible = false;
        item_sprite.anchor.setTo(0.5, 0.5);
        item_sprite.x = this.origin_npc.sprite.x;
        item_sprite.y = this.origin_npc.sprite.y;

        const item_sprite_pos_above_chest = item_sprite.y - 13;
        const emitter = this.game.add.emitter(item_sprite.x, item_sprite_pos_above_chest, 3);
        emitter.makeParticles("psynergy_particle");
        emitter.minParticleSpeed.setTo(-1, -1);
        emitter.maxParticleSpeed.setTo(1, 1);
        emitter.gravity = 100;
        emitter.width = item_sprite.width;
        emitter.height = item_sprite.height;
        emitter.forEach((particle: Phaser.Sprite) => {
            particle.animations.add("vanish", null, 8, true, false);
        });
        (window as any).em = emitter;

        item_sprite.scale.setTo(0, 0);
        let animation_key = this.origin_npc.sprite_info.getAnimationKey("chest", "opening");
        let animation = this.origin_npc.sprite.animations.getAnimation(animation_key);
        animation.play();
        this.data.audio.play_se("misc/chest_open");
        this.promise = new Promise(resolve => (this.resolve = resolve));
        animation.onComplete.addOnce(() => {
            const animation_key = this.origin_npc.sprite_info.getAnimationKey("chest", "shining");
            const animation = this.origin_npc.sprite.animations.getAnimation(animation_key);
            animation.play();
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
                    emitter.forEach(particle => {
                        particle.animations.play("vanish");
                        particle.animations.currentAnim.setFrame((Math.random() * particle.animations.frameTotal) | 0);
                    });
                    this.game.time.events.add(300, this.resolve);
                });
        });
        await this.promise;

        await this.data.hero.go_to_direction(directions.down);
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
        animation_key = this.origin_npc.sprite_info.getAnimationKey("chest", "empty");
        animation = this.origin_npc.sprite.animations.getAnimation(animation_key);
        animation.play();

        const item_name = this.item.name;
        this.dialog_manager = new DialogManager(this.game, this.data);
        this.dialog_manager.set_dialog(ITEM_TEXT(hero_name, item_name));
        this.promise = new Promise(resolve => (this.resolve = resolve));
        this.next();
        await this.promise;

        item_sprite.destroy();
        emitter.destroy();
        this.data.hero.play(base_actions.IDLE);
        MainChar.add_item_to_party(this.data.info.party_data, this.item, this.quantity);
        this.running = false;
        this.control_enable = false;
        this.data.game_event_manager.force_idle_action = true;
        --this.data.game_event_manager.events_running_count;
        this.open_finish_events.forEach(event => event.fire(this.origin_npc));
    }
}
