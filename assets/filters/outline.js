Phaser.Filter.Outline = function (game) {
    Phaser.Filter.call(this, game);

    this.uniforms.texture_width = {type: "1f", value: 0.0};
    this.uniforms.texture_height = {type: "1f", value: 0.0};
    this.uniforms.r = {type: "1f", value: 1.0};
    this.uniforms.g = {type: "1f", value: 1.0};
    this.uniforms.b = {type: "1f", value: 1.0};
    this.uniforms.keep_transparent = {type: "1f", value: 0.0};

    this.fragmentSrc = `
precision mediump float;
varying vec2 vTextureCoord;

uniform sampler2D uSampler;

precision highp float;

uniform highp float texture_width;
uniform highp float texture_height;
uniform highp float r;
uniform highp float g;
uniform highp float b;
uniform highp float keep_transparent;
void main(void) {
    gl_FragColor = texture2D(uSampler, vTextureCoord);
    if (gl_FragColor.a == 0.0) {
        vec2 one_pixel = vec2(1.0, 1.0) / vec2(texture_width, texture_height);
        float up_alpha = texture2D(uSampler, vTextureCoord + vec2(0.0, one_pixel.y)).a;
        float left_alpha = texture2D(uSampler, vTextureCoord + vec2(-one_pixel.x, 0.0)).a;
        float down_alpha = texture2D(uSampler, vTextureCoord + vec2(0.0, -one_pixel.y)).a;
        float right_alpha = texture2D(uSampler, vTextureCoord + vec2(one_pixel.x, 0.0)).a;
        if (up_alpha > 0.0 || left_alpha > 0.0 || down_alpha > 0.0 || right_alpha > 0.0) {
            gl_FragColor.rgba = vec4(r, g, b, 1.0);
        }
    } else if (keep_transparent > 0.0) {
        gl_FragColor.rgba = vec4(0.0, 0.0, 0.0, 0.0);
    }
}
    `
};

Phaser.Filter.Outline.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.Outline.prototype.constructor = Phaser.Filter.Outline;
Phaser.Filter.Outline.prototype.key = "outline";

Object.defineProperty(Phaser.Filter.Outline.prototype, 'texture_width', {
    get: function() {
        return this.uniforms.texture_width.value;
    },
    set: function(value) {
        this.uniforms.texture_width.value = value;
    }
});

Object.defineProperty(Phaser.Filter.Outline.prototype, 'texture_height', {
    get: function() {
        return this.uniforms.texture_height.value;
    },
    set: function(value) {
        this.uniforms.texture_height.value = value;
    }
});

Object.defineProperty(Phaser.Filter.Outline.prototype, 'r', {
    get: function() {
        return this.uniforms.r.value;
    },
    set: function(value) {
        this.uniforms.r.value = value;
    }
});

Object.defineProperty(Phaser.Filter.Outline.prototype, 'g', {
    get: function() {
        return this.uniforms.g.value;
    },
    set: function(value) {
        this.uniforms.g.value = value;
    }
});

Object.defineProperty(Phaser.Filter.Outline.prototype, 'b', {
    get: function() {
        return this.uniforms.b.value;
    },
    set: function(value) {
        this.uniforms.b.value = value;
    }
});

Object.defineProperty(Phaser.Filter.Outline.prototype, 'keep_transparent', {
    get: function() {
        return this.uniforms.keep_transparent.value;
    },
    set: function(value) {
        this.uniforms.keep_transparent.value = +value;
    }
});
