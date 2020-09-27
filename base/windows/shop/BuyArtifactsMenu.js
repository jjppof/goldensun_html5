import { party_data } from '../../../initializers/main_chars.js';
import { CharsMenu } from '../../menus/CharsMenu.js';
import { Window } from '../../Window.js';
import { InventoryWindow } from './InventoryWindow.js';

const MAX_PER_PAGE = 7

const CURSOR_BASE_X = -4;
const CURSOR_BASE_Y = 116;

export class BuyArtifactsMenu{
    constructor(game, data, esc_propagation_priority, enter_propagation_priority){
        this.game = game;
        this.data = data;
        this.esc_propagation_priority = esc_propagation_priority + 1;
        this.enter_propagation_priority = enter_propagation_priority + 1;
        
        this.description_window = new Window();
        this.coin_window = new Window();
        this.item_info_window = new Window();
        this.chars_window = new CharsMenu();
        this.inventory_window = new InventoryWindow();

        this.cursor_control = new CursorControl(this.game, true, true, this.get_page_number.bind(this), this.get_elem_per_page.bind(this), this.group,
            this.page_change.bind(this), this.element_change.bind(this), this.get_page_index.bind(this), this.set_page_index.bind(this),
            this.get_element_index.bind(this), this.set_element_index.bind(this), this.is_open.bind(this), this.is_activated.bind(this),
            this.get_cursor_x.bind(this), this.get_cursor_y.bind(this)
        );
    }

    get_page_number(){

    }

    get_elem_per_page(){

    }

    page_change(){

    }

    element_change(){

    }

    get_page_index(){

    }

    set_page_index(){

    }

    get_element_index(){

    }

    set_element_index(){

    }

    is_open(){

    }

    is_activated(){

    }

    get_cursor_x(){

    }

    get_cursor_y(){

    }
}