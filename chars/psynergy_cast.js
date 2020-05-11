export function init_cast_aura(game, sprite, group, destroy_callback) {
    const ring_up_time = 750;
    const ring_up_time_half = ring_up_time >> 1;
    const step_time = parseInt(ring_up_time/3);
    const auras_number = 2;
    let tweens = [];
    let fronts = [];
    let backs = [];
    for (let j = 0; j < auras_number; ++j) {
        let back_aura = group.create(0, 0, "psynergy_aura");
        let front_aura = group.create(0, 0, "psynergy_aura");
        backs.push(back_aura);
        fronts.push(front_aura);
        const height = sprite.height + front_aura.height - 8;
        const step_height = parseInt(height/3);
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
        if (fronts.length > 1) {
            group.swapChildren(back_aura, fronts[0]);
        }
        group.swapChildren(back_aura, sprite);
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
            tween_c.onComplete.add(() => {
                aura.y = initial_y;
                tween_a.start();
                tween_aa.start();
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
    return () => {
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
        if (destroy_callback !== undefined) {
            destroy_callback();
        }
    }
}
