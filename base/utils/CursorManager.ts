export enum WiggleVariants {
    NORMAL,
}

export enum PointVariants {
    SHORT,
    NORMAL,
    LONG,
}

export type TweenConfig = {
    type: string;
    variant?: WiggleVariants | PointVariants;
    time?: number;
};

export class CursorManager {
    public static readonly CursorTweens = {
        WIGGLE: "wiggle",
        POINT: "point",
    };
    private static readonly WIGGLE = {
        KEY: CursorManager.CursorTweens.WIGGLE,
        X1: -4,
        Y1: 4,
        X2: -8,
        Y2: 0,
        DEFAULT_TIME: Phaser.Timer.QUARTER >> 1,
    };
    private static readonly POINT = {
        KEY: CursorManager.CursorTweens.POINT,
        0: {
            X: -1,
            Y: 1,
        },
        1: {
            X: -4,
            Y: 4,
        },
        2: {
            X: -6,
            Y: 6,
        },
        DEFAULT_TIME: Phaser.Timer.QUARTER >> 1,
    };

    private static readonly DEFAULT_MOVE_TIME = Phaser.Timer.QUARTER >> 1;
    private static readonly X_SHIFT = 8;

    private game: Phaser.Game;
    private group: Phaser.Group;
    private cursor: Phaser.Sprite;

    private active_tween: Phaser.Tween;

    private cursor_default_pos: {x: number; y: number};
    public cursor_flipped: boolean;

    public constructor(game: Phaser.Game) {
        this.game = game;

        this.group = this.game.add.group();
        this.group.visible = false;

        this.group.x = 0;
        this.group.y = 0;

        this.cursor = this.group.create(0, 0, "cursor");
        this.cursor.anchor.x = 0.5;

        this.active_tween = null;

        this.cursor_default_pos = {x: 0, y: 0};
        this.cursor_flipped = false;
    }

    public init_tween(config: TweenConfig) {
        this.clear_tweens();
        if (!this.group.visible) this.show();

        switch (config.type) {
            case CursorManager.WIGGLE.KEY:
                let wiggle_x1 = CursorManager.WIGGLE.X1;
                let wiggle_x2 = CursorManager.WIGGLE.X2;
                let wiggle_y1 = CursorManager.WIGGLE.Y1;
                let wiggle_y2 = CursorManager.WIGGLE.Y2;
                let wiggle_time = config.time ? config.time : CursorManager.WIGGLE.DEFAULT_TIME;

                this.active_tween = this.game.add
                    .tween(this.cursor)
                    .to(
                        {x: this.cursor.x + wiggle_x1, y: this.cursor.y + wiggle_y1},
                        wiggle_time,
                        Phaser.Easing.Linear.None
                    )
                    .to(
                        {x: this.cursor.x + wiggle_x2, y: this.cursor.y + wiggle_y2},
                        wiggle_time,
                        Phaser.Easing.Linear.None
                    )
                    .to(
                        {x: this.cursor.x + wiggle_x1, y: this.cursor.y + wiggle_y1},
                        wiggle_time,
                        Phaser.Easing.Linear.None
                    )
                    .to({x: this.cursor.x, y: this.cursor.y}, wiggle_time, Phaser.Easing.Linear.None)
                    .loop();
                break;
            case CursorManager.POINT.KEY:
                if (!config.variant) config.variant = PointVariants.NORMAL;
                let point_x = CursorManager.POINT[config.variant].X;
                let point_y = CursorManager.POINT[config.variant].Y;
                let point_time = config.time ? config.time : CursorManager.POINT.DEFAULT_TIME;

                if (this.cursor_flipped) point_x *= -1;

                this.active_tween = this.game.add
                    .tween(this.cursor)
                    .to({x: this.cursor.x + point_x, y: this.cursor.y + point_y}, point_time, Phaser.Easing.Linear.None)
                    .to({x: this.cursor.x, y: this.cursor.y}, point_time, Phaser.Easing.Linear.None)
                    .loop();
        }

        this.bring_to_top();
        if (this.active_tween) this.active_tween.start();
    }

    public move_to(
        pos: {x: number; y: number},
        params?: {animate?: boolean; flip?: boolean; move_time?: number; tween_config?: TweenConfig},
        on_complete?: Function
    ) {
        if (!this.group.visible) this.show();
        this.bring_to_top();

        if (params) {
            if (params.flip === undefined) params.flip = false;
            if (params.flip !== this.cursor_flipped) this.flip_cursor();
        }

        pos.x += CursorManager.X_SHIFT;

        this.cursor_default_pos = {x: pos.x + this.game.camera.x, y: pos.y + this.game.camera.y};

        if (!params) {
            this.cursor.x = pos.x + this.game.camera.x;
            this.cursor.y = pos.y + this.game.camera.y;
            if (on_complete) on_complete();
        } else {
            if (params.animate === undefined) params.animate = true;

            let move_time = params.move_time ? params.move_time : CursorManager.DEFAULT_MOVE_TIME;

            if (params.animate) {
                let t = this.game.add
                    .tween(this.cursor)
                    .to(
                        {x: pos.x + this.game.camera.x, y: pos.y + this.game.camera.y},
                        move_time,
                        Phaser.Easing.Linear.None,
                        true
                    );
                if (params.tween_config) {
                    t.onComplete.addOnce(() => {
                        this.init_tween(params.tween_config);
                        if (on_complete) on_complete();
                    }, this);
                }
            } else {
                this.cursor.x = pos.x + this.game.camera.x;
                this.cursor.y = pos.y + this.game.camera.y;

                if (params.tween_config) this.init_tween(params.tween_config);
                if (on_complete) on_complete();
            }
        }
    }

    public clear_tweens() {
        if (this.active_tween) this.game.tweens.remove(this.active_tween);
        this.active_tween = null;

        this.cursor.x = this.cursor_default_pos.x;
        this.cursor.y = this.cursor_default_pos.y;
    }

    public flip_cursor() {
        this.clear_tweens();

        this.cursor.scale.x *= -1;
        this.cursor_flipped = this.cursor_flipped ? false : true;
    }

    public bring_to_top() {
        this.game.world.bringToTop(this.group);
    }

    public hide() {
        this.clear_tweens();
        this.group.visible = false;
    }

    public show() {
        this.group.visible = true;
    }

    public destroy() {
        this.group.remove(this.cursor, true);
        this.group = null;
        this.cursor = null;
        this.active_tween = null;
    }
}
