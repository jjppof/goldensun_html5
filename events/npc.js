import { DialogManager, set_dialog } from '../base/Window.js';
import { NPC } from '../base/NPC.js';

export function set_npc_event (data) {
    if (!data.waiting_for_enter_press) {
        if (!data.in_dialog && data.active_npc.npc_type === NPC.types.NORMAL) {
            let parts = set_dialog(game, data.active_npc.message);
            data.dialog_manager = new DialogManager(game, parts, data.actual_direction);
            data.in_dialog = true;
            data.dialog_manager.next(() => {
                data.waiting_for_enter_press = true;
            });
        }
    }
}