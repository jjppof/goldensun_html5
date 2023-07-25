Phaser.Filter.PixelShift = function (game) {
    Phaser.Filter.call(this, game);

    this.uniforms.x_shift = { type: '1f', value: 0.0 };
    this.uniforms.y_shift = { type: '1f', value: 0.0 };
    this.uniforms.frame_width = { type: '1f', value: 0.0 };
    this.uniforms.frame_height = { type: '1f', value: 0.0 };
    this.uniforms.repeat_texture = { type: '1f', value: 1.0 };

    this.setResolution(game.config.width, game.config.height);

    this.fragmentSrc = `
        precision mediump float;

        varying vec2       vTextureCoord;
        uniform sampler2D  uSampler;
        uniform float      x_shift;
        uniform float      y_shift;
        uniform float      frame_width;
        uniform float      frame_height;
        uniform float      repeat_texture;
        uniform vec2       resolution;

        void main(void) {
            vec2 uv = vTextureCoord.xy;
            vec2 uv_px = uv * resolution;
            vec2 frame_size = floor(vec2(frame_width, frame_height));
            vec2 shift = vec2(x_shift, y_shift);

            if (repeat_texture == 1.0) {
                uv = mod(uv_px + shift, frame_size) / resolution;
            } else {
                uv = (uv_px + shift) / resolution;
            }

            gl_FragColor = texture2D(uSampler, uv);
        }
    `;
};

Phaser.Filter.PixelShift.prototype = Object.create(Phaser.Filter.prototype);
Phaser.Filter.PixelShift.prototype.constructor = Phaser.Filter.PixelShift;
Phaser.Filter.PixelShift.prototype.key = "pixel_shift";

Object.defineProperty(Phaser.Filter.PixelShift.prototype, 'x_shift', {
    get: function() {
        return this.uniforms.x_shift.value;
    },
    set: function(value) {
        this.uniforms.x_shift.value = value;
    }
});

Object.defineProperty(Phaser.Filter.PixelShift.prototype, 'y_shift', {
    get: function() {
        return this.uniforms.y_shift.value;
    },
    set: function(value) {
        this.uniforms.y_shift.value = value;
    }
});

Object.defineProperty(Phaser.Filter.PixelShift.prototype, 'frame_width', {
    get: function() {
        return this.uniforms.frame_width.value;
    },
    set: function(value) {
        this.uniforms.frame_width.value = value;
    }
});

Object.defineProperty(Phaser.Filter.PixelShift.prototype, 'frame_height', {
    get: function() {
        return this.uniforms.frame_height.value;
    },
    set: function(value) {
        this.uniforms.frame_height.value = value;
    }
});

Object.defineProperty(Phaser.Filter.PixelShift.prototype, 'repeat_texture', {
    get: function() {
        return Boolean(this.uniforms.repeat_texture.value);
    },
    set: function(value) {
        this.uniforms.repeat_texture.value = value ? 1.0 : 0.0;
    }
});
