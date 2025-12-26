Phaser.Filter.Glow = function (game) {
    Phaser.Filter.call(this, game);

    this.uniforms.r = { type: '1f', value: 1.0 };
    this.uniforms.g = { type: '1f', value: 1.0 };
    this.uniforms.b = { type: '1f', value: 1.0 };
    this.uniforms.inner_strength = { type: '1f', value: 0.0 };
    this.uniforms.outer_strength = { type: '1f', value: 3 };
    this.uniforms.texture_width = {type: "1f", value: 0.0};
    this.uniforms.texture_height = {type: "1f", value: 0.0};
};

Phaser.Filter.Glow.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.Glow.prototype.constructor = Phaser.Filter.Glow;
Phaser.Filter.Glow.prototype.key = "glow";

Phaser.Filter.Glow.prototype.init = function(distance, quality) {
    this.distance = distance ? distance : 5.0;
    this.quality_dist = 1 / (quality ? quality : 0.5) / this.distance;

    this.fragmentSrc = `
        precision mediump float;

        varying vec2 vTextureCoord;
        uniform sampler2D uSampler;

        uniform float outer_strength;
        uniform float inner_strength;
        uniform float r;
        uniform float g;
        uniform float b;
        uniform float texture_width;
        uniform float texture_height;

        void main(void) {
            vec2 px = vec2(1.0 / texture_width, 1.0 / texture_height);
            vec4 ownColor = texture2D(uSampler, vTextureCoord);
            vec4 curColor;
            vec4 glowColor = vec4(r, g, b, 1.0);
            float totalAlpha = 0.0;
            float maxTotalAlpha = 0.0;
            float cosAngle;
            float sinAngle;
            vec2 displaced;
            for (float angle = 0.0; angle <= 6.2832; angle += ${this.quality_dist.toFixed(4)}) {
                cosAngle = cos(angle);
                sinAngle = sin(angle);
                for (float curDistance = 1.0; curDistance <= ${this.distance.toFixed(4)}; curDistance++) {
                    displaced.x = vTextureCoord.x + cosAngle * curDistance * px.x;
                    displaced.y = vTextureCoord.y + sinAngle * curDistance * px.y;
                    curColor = texture2D(uSampler, displaced);
                    totalAlpha += (${this.distance.toFixed(4)} - curDistance) * curColor.a;
                    maxTotalAlpha += (${this.distance.toFixed(4)} - curDistance);
                }
            }
            maxTotalAlpha = max(maxTotalAlpha, 0.0001);

            ownColor.a = max(ownColor.a, 0.0001);
            ownColor.rgb = ownColor.rgb / ownColor.a;
            float outerGlowAlpha = (totalAlpha / maxTotalAlpha) * outer_strength * (1. - ownColor.a);
            float innerGlowAlpha = ((maxTotalAlpha - totalAlpha) / maxTotalAlpha) * inner_strength * ownColor.a;
            float resultAlpha = (ownColor.a + outerGlowAlpha);
            gl_FragColor = vec4(mix(mix(ownColor.rgb, glowColor.rgb, innerGlowAlpha / ownColor.a), glowColor.rgb, outerGlowAlpha / resultAlpha) * resultAlpha, resultAlpha);
        }
    `;
};

Object.defineProperty(Phaser.Filter.Glow.prototype, 'r', {
    get: function() {
        return this.uniforms.r.value;
    },
    set: function(value) {
        this.uniforms.r.value = value;
    }
});
Object.defineProperty(Phaser.Filter.Glow.prototype, 'g', {
    get: function() {
        return this.uniforms.g.value;
    },
    set: function(value) {
        this.uniforms.g.value = value;
    }
});
Object.defineProperty(Phaser.Filter.Glow.prototype, 'b', {
    get: function() {
        return this.uniforms.b.value;
    },
    set: function(value) {
        this.uniforms.b.value = value;
    }
});
Object.defineProperty(Phaser.Filter.Glow.prototype, 'inner_strength', {
    get: function() {
        return this.uniforms.inner_strength.value;
    },
    set: function(value) {
        this.uniforms.inner_strength.value = value;
    }
});
Object.defineProperty(Phaser.Filter.Glow.prototype, 'outer_strength', {
    get: function() {
        return this.uniforms.outer_strength.value;
    },
    set: function(value) {
        this.uniforms.outer_strength.value = value;
    }
});
Object.defineProperty(Phaser.Filter.Glow.prototype, 'quality', {
    get: function() {
        return 1 / (this.quality_dist * this.distance);
    }
});
Object.defineProperty(Phaser.Filter.Glow.prototype, 'texture_width', {
    get: function() {
        return this.uniforms.texture_width.value;
    },
    set: function(value) {
        this.uniforms.texture_width.value = value;
    }
});
Object.defineProperty(Phaser.Filter.Glow.prototype, 'texture_height', {
    get: function() {
        return this.uniforms.texture_height.value;
    },
    set: function(value) {
        this.uniforms.texture_height.value = value;
    }
});