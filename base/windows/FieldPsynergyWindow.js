import { Window } from '../Window.js';
import { capitalize, get_text_width } from "../../utils.js";
import * as numbers from '../../magic_numbers.js';

const BASE_WIDTH = numbers.WINDOW_PADDING_H*2 + 8;
const BASE_HEIGHT = 20;
const POS_X = numbers.GAME_WIDTH/2 - BASE_WIDTH/2;
const POS_Y = numbers.GAME_HEIGHT/2 + numbers.HERO_BODY_RADIUS + 6;
const DIFF_THRESHOLD = 90;
const DIFF_CORRECTION = 56;

/*The window showing cast psynergy's name on the field

Input: game [Phaser:Game] - Reference to the running game object
       data [GoldenSun] - Reference to the main JS Class instance*/
export class FieldPsynergyWindow {
    constructor(game, data) {
        this.game = game;
        this.data = data;
        this.window = new Window(this.game, POS_X, POS_Y, BASE_WIDTH, BASE_HEIGHT);
        this.text = this.window.set_single_line_text("");
    }

    /*Calculates a vertical offset so the window doesn't cover the hero

    Output: [number] - The vertical offset to apply*/
    vertical_adjust(){
        let diff = this.data.hero.sprite.y - this.game.camera.y;
        return diff > DIFF_THRESHOLD ? -DIFF_CORRECTION+(diff-DIFF_THRESHOLD) : 0;
    }

    /*Opens the window with the psynergy name

    Input: text [string] - The psynergy name to show
           callback [function] - Callback function (Optional)*/
    open(text, callback) {
        let text_size = get_text_width(this.game,text);
        this.window.update_size({width: BASE_WIDTH+text_size, height: BASE_HEIGHT});
        this.window.update_position({x: POS_X-text_size/2, y:POS_Y+this.vertical_adjust()});
        this.window.update_text(capitalize(text),this.text);

        this.window.show(() => {
            if (callback !== undefined) {
                callback();
            }
        }, false);
    }

    /*Closes the window

    Input: callback [function] - Callback function (Optional)*/
    close(callback) {
        this.window.close(() => {
            if (callback !== undefined) {
                callback();
            }
        }, false);
    }
}
