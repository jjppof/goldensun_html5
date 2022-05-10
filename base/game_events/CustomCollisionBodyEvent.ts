import {GameEvent, event_types} from "./GameEvent";

export class CustomCollisionBodyEvent extends GameEvent {
    private label: string;
    private create: boolean;
    private x: number;
    private y: number;
    private body_type: "box" | "circle" | "polygon";
    private properties: {
        width?: number;
        height?: number;
        radius?: number;
        points?: number[][];
        collision_layer?: number;
    };

    constructor(game, data, active, key_name, label, create, x, y, body_type, properties) {
        super(game, data, event_types.CUSTOM_COLLISION_BODY, active, key_name);
        this.label = label;
        this.create = create;
        this.x = x;
        this.y = y;
        this.body_type = body_type;
        this.properties = properties;
    }

    async _fire() {
        if (this.create) {
            this.data.collision.create_custom_body(this.label, this.x, this.y, this.body_type, this.properties);
        } else {
            this.data.collision.destroy_custom_body(this.label);
        }
    }

    _destroy() {}
}
