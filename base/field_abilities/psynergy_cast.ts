export function init_cast_aura(game: Phaser.Game, sprite: Phaser.Sprite, group: Phaser.Group, filter, after_init, after_destroy, before_destroy) {
    const ring_up_time = 750;
    const ring_up_time_half = ring_up_time >> 1;
    const step_time = (ring_up_time / 3) | 0;
    sprite.filters = [filter];
    const auras_number = 2;
    let tweens = [];
    let stop_asked = false;
    let promises = [];
    for (let j = 0; j < auras_number; ++j) {
        let back_aura = group.create(0, 0, "psynergy_aura");
        let front_aura = group.create(0, 0, "psynergy_aura");
        back_aura.base_collider_layer = sprite.base_collider_layer;
        front_aura.base_collider_layer = sprite.base_collider_layer;
        back_aura.sort_function = () => {
            group.setChildIndex(back_aura, group.getChildIndex(sprite));
        };
        back_aura.sort_function();
        front_aura.sort_function = () => {
            group.setChildIndex(front_aura, group.getChildIndex(sprite) + 1);
        };
        front_aura.sort_function();
        const height = sprite.height + front_aura.height - 8;
        const step_height = (height / 3) | 0;
        front_aura.anchor.setTo(0.5, 0);
        front_aura.centerX = sprite.centerX;
        front_aura.centerY = sprite.centerY + (sprite.height >> 1) + (front_aura.height >> 1);
        const initial_front_y = front_aura.y;
        front_aura.scale.setTo(0, 0);
        back_aura.anchor.setTo(0.5, 0);
        back_aura.centerX = sprite.centerX;
        back_aura.centerY = sprite.centerY + (sprite.height >> 1) + (back_aura.height >> 1);
        const initial_back_y = back_aura.y;
        back_aura.scale.setTo(0, 0);
        let auras = [
            {aura: front_aura, initial_y: initial_front_y, scale_factor: 1},
            {aura: back_aura, initial_y: initial_back_y, scale_factor: -1},
        ];
        tweens.push([]);
        for (let i = 0; i < auras.length; ++i) {
            let aura = auras[i].aura;
            let initial_y = auras[i].initial_y;
            let scale_factor = auras[i].scale_factor;
            let tween_a = game.add.tween(aura).to(
                { y: initial_y - step_height },
                step_time,
                Phaser.Easing.Linear.None
            );
            let tween_b = game.add.tween(aura).to(
                { y: initial_y - 2 * step_height },
                step_time,
                Phaser.Easing.Linear.None
            );
            let tween_c = game.add.tween(aura).to(
                { y: initial_y - 3 * step_height },
                step_time,
                Phaser.Easing.Linear.None
            );
            let promise_resolve;
            promises.push(new Promise(resolve => { promise_resolve = resolve; }));
            tween_c.onComplete.add(() => {
                aura.y = initial_y;
                if (!stop_asked) {
                    tween_a.start();
                    tween_aa.start();
                } else {
                    promise_resolve();
                }
            });
            let tween_aa = game.add.tween(aura.scale).to(
                { x: scale_factor, y: scale_factor },
                ring_up_time_half,
                Phaser.Easing.Quadratic.Out
            );
            let tween_cc = game.add.tween(aura.scale).to(
                { x: 0, y: 0 },
                ring_up_time_half,
                Phaser.Easing.Quadratic.Out
            );
            tweens[j].push({
                aura: aura,
                tween_a: tween_a,
                tween_aa: tween_aa,
                tween_b: tween_b,
                tween_c: tween_c,
                tween_cc: tween_cc
            });
            tween_a.chain(tween_b);
            tween_b.chain(tween_c);
            tween_aa.chain(tween_cc);
            if (j > 0) {
                tween_aa.onComplete.addOnce(() => {
                    tweens[0][i].aura.y = initial_y;
                    tweens[0][i].tween_a.start();
                    tweens[0][i].tween_aa.start();
                });
                tween_a.start();
                tween_aa.start();
            }
        }
    }
    let blink_counter = 16;
    let blink_timer = game.time.create(false);
    let hue_timer = game.time.create(false);
    blink_timer.loop(50, () => {
        if (blink_counter%2 === 0) {
            filter.tint = [1,1,1];
        } else {
            filter.tint = [-1,-1,-1];
        }
        --blink_counter;
        if (blink_counter === 0) {
            filter.gray = 0.4;
            blink_timer.stop();
            if (after_init !== undefined) {
                after_init();
            }
            hue_timer.start();
        }
    });
    hue_timer.loop(100, () => {
        filter.hue_adjust = Math.random() * 2 * Math.PI;
    });
    blink_timer.start();
    return async () => {
        if (before_destroy !== undefined) {
            before_destroy();
        }
        stop_asked = true;
        hue_timer.stop();
        blink_timer.stop();
        filter.tint = [-1,-1,-1];
        filter.gray = 0;
        filter.hue_adjust = 0;
        sprite.filters = undefined;
        await Promise.all(promises);
        for (let i = 0; i < tweens.length; ++i) {
            for (let j = 0; j < tweens[i].length; ++j) {
                tweens[i][j].tween_a.stop();
                tweens[i][j].tween_aa.stop();
                tweens[i][j].tween_b.stop();
                tweens[i][j].tween_c.stop();
                tweens[i][j].tween_cc.stop();
                group.remove(tweens[i][j].aura, true);
            }
        }
        if (after_destroy !== undefined) {
            after_destroy();
        }
    };
}

export function tint_map_layers(game, map, filter, after_destroy?) {
    filter.colorize_intensity = 0;
    filter.gray = 0;
    filter.colorize = Math.random();
    for (let i = 0; i < map.layers.length; ++i) {
        map.layers[i].sprite.filters = [filter];
    }
    game.add.tween(filter).to(
        { colorize_intensity: 0.4, gray: 1 },
        Phaser.Timer.QUARTER,
        Phaser.Easing.Linear.None,
        true
    );
    return () => {
        game.add.tween(filter).to(
            { colorize_intensity: 0, gray: 0 },
            Phaser.Timer.QUARTER,
            Phaser.Easing.Linear.None,
            true
        ).onComplete.addOnce(() => {
            filter.colorize = -1;
            for (let i = 0; i < map.layers.length; ++i) {
                map.layers[i].sprite.filters = undefined;
            }
            if (after_destroy !== undefined) {
                after_destroy();
            }
        });
    };
}
