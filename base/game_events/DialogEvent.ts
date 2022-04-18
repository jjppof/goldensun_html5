import {NPC} from "../NPC";
import {DialogManager} from "../utils/DialogManager";
import {GameEvent, event_types} from "./GameEvent";
import {Button} from "../XGamepad";
import {YesNoMenu} from "../windows/YesNoMenu";
import {GAME_HEIGHT} from "../magic_numbers";

type DialogInfo = {
    text: string;
    avatar: string;
    voice_key: string;
    consider_hero_direction: boolean;
    custom_pos: {
        x: number;
        y: number;
    };
    custom_avatar_pos: {
        x: number;
        y: number;
    };
};

export class DialogEvent extends GameEvent {
    private dialog_manager: DialogManager;
    private running: boolean;
    private control_enable: boolean;
    private npc_hero_reciprocal_look: boolean;
    private reset_reciprocal_look: boolean;
    private finish_events: GameEvent[];
    private previous_npc_direction: number;
    private control_key: number;
    private dialog_info: DialogInfo[];
    private dialog_index: number;
    private end_with_yes_no: boolean;
    private yes_no_menu: YesNoMenu;
    private yes_no_events: {
        yes: GameEvent[];
        no: GameEvent[];
    };
    private current_info: DialogInfo;

    constructor(
        game,
        data,
        active,
        key_name,
        dialog_info,
        npc_hero_reciprocal_look,
        reset_reciprocal_look,
        end_with_yes_no,
        yes_no_events,
        finish_events
    ) {
        super(game, data, event_types.DIALOG, active, key_name);
        this.dialog_info = Array.isArray(dialog_info) ? dialog_info : [dialog_info];
        this.npc_hero_reciprocal_look = npc_hero_reciprocal_look ?? false;
        this.reset_reciprocal_look = reset_reciprocal_look ?? true;
        this.control_key = null;
        this.dialog_index = 0;
        this.end_with_yes_no = end_with_yes_no ?? false;
        this.yes_no_menu = null;
        this.finish_events = [];
        this.running = false;
        this.control_enable = true;
        this.dialog_manager = null;
        this.yes_no_events = {
            yes: [],
            no: [],
        };
        this.current_info = null;

        if (finish_events !== undefined && !this.end_with_yes_no) {
            finish_events.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info);
                this.finish_events.push(event);
            });
        } else if (this.end_with_yes_no) {
            yes_no_events.yes?.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info);
                this.yes_no_events.yes.push(event);
            });
            yes_no_events.no?.forEach(event_info => {
                const event = this.data.game_event_manager.get_event_instance(event_info);
                this.yes_no_events.no.push(event);
            });
        }
    }

    set_control() {
        this.reset_control();
        this.control_key = this.data.control_manager.add_controls(
            [
                {
                    buttons: Button.A,
                    on_down: () => {
                        if (!this.active || !this.running || !this.control_enable) return;
                        this.next();
                    },
                },
            ],
            {persist: true}
        );
    }

    reset_control() {
        if (this.control_key !== null) {
            this.data.control_manager.detach_bindings(this.control_key);
            this.control_key = null;
        }
    }

    async finish() {
        if (this.origin_npc && this.npc_hero_reciprocal_look && this.reset_reciprocal_look) {
            await this.origin_npc.face_direction(this.previous_npc_direction);
        }
        this.running = false;
        this.dialog_index = 0;
        this.reset_control();
        this.yes_no_menu?.destroy();
        this.yes_no_menu = null;
        this.current_info = null;
        --this.data.game_event_manager.events_running_count;
        if (!this.end_with_yes_no) {
            this.finish_events.forEach(event => event.fire(this.origin_npc));
        }
    }

    next(finish_callback?: () => void) {
        this.control_enable = false;
        this.dialog_manager.next(
            async finished => {
                if (finished) {
                    if (this.dialog_index === this.dialog_info.length) {
                        await this.finish();
                        if (finish_callback) {
                            finish_callback();
                        }
                    } else {
                        this.start_dialog();
                    }
                } else if (
                    this.end_with_yes_no &&
                    this.dialog_index === this.dialog_info.length &&
                    this.dialog_manager.step === this.dialog_manager.size
                ) {
                    this.yes_no_menu = new YesNoMenu(this.game, this.data);
                    const y_pos = this.dialog_manager.window_y > GAME_HEIGHT >> 1 ? 5 : null;
                    this.yes_no_menu.open(
                        {
                            yes: () =>
                                this.next(() => this.yes_no_events.yes.forEach(event => event.fire(this.origin_npc))),
                            no: () =>
                                this.next(() => this.yes_no_events.no.forEach(event => event.fire(this.origin_npc))),
                        },
                        {
                            ...(y_pos !== null && {y: y_pos}),
                        }
                    );
                } else {
                    this.control_enable = true;
                }
            },
            this.current_info.custom_pos,
            this.current_info.custom_avatar_pos
        );
    }

    start_dialog() {
        this.current_info = this.dialog_info[this.dialog_index];
        ++this.dialog_index;
        this.set_control();
        this.dialog_manager = new DialogManager(this.game, this.data);
        this.dialog_manager.set_dialog(this.current_info.text, {
            avatar: this.current_info.avatar ?? this.origin_npc.avatar,
            voice_key: this.current_info.voice_key ?? this.origin_npc.voice_key,
            hero_direction: this.current_info.consider_hero_direction ? this.data.hero.current_direction : null,
        });
        this.next();
    }

    async _fire(origin_npc?: NPC) {
        if (!this.active) return;
        ++this.data.game_event_manager.events_running_count;
        this.control_enable = false;
        this.running = true;
        this.origin_npc = origin_npc;
        if (this.origin_npc && this.npc_hero_reciprocal_look) {
            this.previous_npc_direction = this.origin_npc.current_direction;
            await this.data.game_event_manager.set_npc_and_hero_directions(this.origin_npc);
        }
        this.dialog_index = 0;
        this.start_dialog();
    }

    destroy() {
        this.finish_events.forEach(event => event.destroy());
        this.yes_no_events.yes.forEach(event => event.destroy());
        this.yes_no_events.no.forEach(event => event.destroy());
        this.dialog_index = 0;
        this.origin_npc = null;
        this.yes_no_menu?.destroy();
        this.yes_no_menu = null;
        this.current_info = null;
        this.dialog_manager?.destroy();
        this.dialog_manager = null;
        this.reset_control();
        this.active = false;
    }
}
