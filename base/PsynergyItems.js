import { SpriteBase } from "./SpriteBase.js";

export class PsynergyItems_Sprite extends SpriteBase {
    constructor (key_name, actions) {
        super(key_name, actions);
    }
}

export class PsynergyItems {
    constructor(key_name, x, y) {
        this.key_name = key_name;
        this.x = x;
        this.y = y;
    }

    set_sprite(sprite) {
        this.psynergy_item_sprite = sprite;
    }
}